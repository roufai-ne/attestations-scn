'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, Calendar, Hash, GraduationCap, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ArreteViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arreteId: string | null;
}

const statutColors: Record<string, string> = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
  EN_COURS: 'bg-blue-100 text-blue-800',
  INDEXE: 'bg-green-100 text-green-800',
  ERREUR: 'bg-red-100 text-red-800',
};

const statutLabels: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  INDEXE: 'Indexé',
  ERREUR: 'Erreur',
};

export function ArreteViewDialog({ open, onOpenChange, arreteId }: ArreteViewDialogProps) {
  const [arrete, setArrete] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && arreteId) {
      loadArrete();
    }
  }, [open, arreteId]);

  const loadArrete = async () => {
    if (!arreteId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/arretes/${arreteId}`);
      if (response.ok) {
        const data = await response.json();
        setArrete(data);
      }
    } catch (error) {
      console.error('Erreur chargement arrêté:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!arrete) return;
    const filename = arrete.fichierPath.split(/[/\\]/).pop() || 'arrete.pdf';
    const publicPath = `/uploads/arretes/${filename}`;

    const link = document.createElement('a');
    link.href = publicPath;
    link.download = `arrete_${arrete.numero}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Détails de l'arrêté
          </DialogTitle>
          <DialogDescription>
            Informations complètes et contenu OCR de l'arrêté
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : arrete ? (
          <div className="space-y-6 py-4">
            {/* Métadonnées */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Hash className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Numéro</p>
                    <p className="font-medium">{arrete.numero}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Date de l'arrêté</p>
                    <p className="font-medium">
                      {format(new Date(arrete.dateArrete), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <GraduationCap className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Promotion</p>
                    <p className="font-medium">{arrete.promotion}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Statut d'indexation</p>
                  <Badge className={`${statutColors[arrete.statutIndexation]} mt-1`} variant="secondary">
                    {statutLabels[arrete.statutIndexation]}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Année</p>
                  <p className="font-medium">{arrete.annee}</p>
                </div>

                {arrete.dateIndexation && (
                  <div>
                    <p className="text-sm text-gray-500">Indexé le</p>
                    <p className="font-medium">
                      {format(new Date(arrete.dateIndexation), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Message d'erreur si présent */}
            {arrete.messageErreur && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-medium text-red-800">Erreur d'indexation:</p>
                <p className="text-sm text-red-600 mt-1">{arrete.messageErreur}</p>
              </div>
            )}

            {/* Contenu OCR */}
            {arrete.contenuOCR && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">Contenu OCR extrait:</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {arrete.contenuOCR}
                  </pre>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleDownload} variant="outline" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Télécharger le PDF
              </Button>
              <Button onClick={() => onOpenChange(false)} className="flex-1">
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            Arrêté introuvable
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
