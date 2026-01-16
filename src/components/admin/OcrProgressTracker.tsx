'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OcrProgressTrackerProps {
  arreteId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

interface JobStatus {
  id: string;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  progress: number;
  failedReason?: string;
  finishedOn?: number;
}

const PROGRESS_STEPS = [
  { value: 0, label: 'Initialisation...', icon: Clock },
  { value: 10, label: 'Préparation du document', icon: FileText },
  { value: 30, label: 'Extraction du texte (OCR)', icon: Loader2 },
  { value: 80, label: 'Nettoyage des données', icon: Loader2 },
  { value: 90, label: 'Mise à jour de la base', icon: Loader2 },
  { value: 100, label: 'Indexation terminée !', icon: CheckCircle },
];

export function OcrProgressTracker({ arreteId, onComplete, onError }: OcrProgressTrackerProps) {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/admin/arretes/${arreteId}/status`);
        if (!response.ok) {
          throw new Error('Erreur lors de la vérification du statut');
        }

        const data = await response.json();
        setStatus(data);

        // Trouver l'étape actuelle basée sur la progression
        const step = PROGRESS_STEPS.findIndex((s, idx) => {
          const nextStep = PROGRESS_STEPS[idx + 1];
          return data.progress >= s.value && (!nextStep || data.progress < nextStep.value);
        });
        setCurrentStep(step >= 0 ? step : 0);

        // Gérer les états terminaux
        if (data.state === 'completed') {
          setIsComplete(true);
          clearInterval(intervalId);
          if (onComplete) {
            setTimeout(() => onComplete(), 1000);
          }
        } else if (data.state === 'failed') {
          setError(data.failedReason || 'Erreur inconnue');
          clearInterval(intervalId);
          if (onError) {
            onError(data.failedReason || 'Erreur inconnue');
          }
        }
      } catch (err) {
        console.error('Erreur lors de la vérification du statut:', err);
        setError('Impossible de vérifier le statut');
        clearInterval(intervalId);
      }
    };

    // Vérifier immédiatement puis toutes les 2 secondes
    checkStatus();
    intervalId = setInterval(checkStatus, 2000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [arreteId, onComplete, onError]);

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Erreur d'indexation</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <p className="text-xs text-red-600 mt-2">
              Vous pouvez réessayer l'indexation depuis la liste des arrêtés.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const progress = status?.progress || 0;
  const currentStepData = PROGRESS_STEPS[currentStep];
  const StepIcon = currentStepData?.icon || Clock;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center gap-3">
          {isComplete ? (
            <>
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Indexation terminée !</h3>
                <p className="text-sm text-green-700">L'arrêté est maintenant disponible pour la recherche</p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 bg-blue-100 rounded-full">
                <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Indexation en cours...</h3>
                <p className="text-sm text-gray-600">
                  {currentStepData?.label || 'Traitement du document'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progression</span>
            <span className="font-medium text-gray-900">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Étapes */}
        <div className="space-y-2">
          {PROGRESS_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isPast = progress > step.value;
            const isCurrent = currentStep === index;
            const isFuture = progress < step.value;

            return (
              <div
                key={step.value}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg transition-all',
                  isCurrent && 'bg-blue-50',
                  isPast && !isCurrent && 'opacity-60'
                )}
              >
                <div
                  className={cn(
                    'p-1.5 rounded-full',
                    isPast && 'bg-green-100',
                    isCurrent && 'bg-blue-100',
                    isFuture && 'bg-gray-100'
                  )}
                >
                  {isPast && step.value < 100 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        isPast && 'text-green-600',
                        isCurrent && 'text-green-600 animate-spin',
                        isFuture && 'text-gray-400'
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm',
                    isPast && 'text-green-700 font-medium',
                    isCurrent && 'text-blue-700 font-semibold',
                    isFuture && 'text-gray-500'
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Info supplémentaire */}
        {status && !isComplete && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              État: <span className="font-medium">{status.state}</span>
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

