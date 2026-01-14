'use client';

/**
 * Modal d'envoi de notifications
 * Permet de sélectionner le type et les canaux de notification
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Mail, MessageSquare, Phone } from 'lucide-react';
import { TypeNotification } from '@/lib/notifications/templates';
import { CanalNotification } from '@prisma/client';

interface SendNotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demandeId: string;
  appeleName: string;
  numeroEnregistrement: string;
  numeroAttestation?: string;
  contactInfo: {
    email?: string | null;
    telephone?: string | null;
    whatsapp?: string | null;
  };
}

export function SendNotificationModal({
  open,
  onOpenChange,
  demandeId,
  appeleName,
  numeroEnregistrement,
  numeroAttestation,
  contactInfo,
}: SendNotificationModalProps) {
  const [type, setType] = useState<TypeNotification>(TypeNotification.CONFIRMATION_DEPOT);
  const [canaux, setCanaux] = useState<CanalNotification[]>([]);
  const [messagePersonnalise, setMessagePersonnalise] = useState('');
  const [sending, setSending] = useState(false);

  const typeOptions = [
    { value: TypeNotification.CONFIRMATION_DEPOT, label: 'Confirmation de dépôt' },
    { value: TypeNotification.DEMANDE_EN_TRAITEMENT, label: 'Demande en traitement' },
    { value: TypeNotification.PIECES_NON_CONFORMES, label: 'Pièces non conformes' },
    { value: TypeNotification.DEMANDE_REJETEE, label: 'Demande rejetée' },
    { value: TypeNotification.ATTESTATION_PRETE, label: 'Attestation prête' },
    { value: TypeNotification.MESSAGE_PERSONNALISE, label: 'Message personnalisé' },
  ];

  const canauxDisponibles = [
    {
      canal: CanalNotification.EMAIL,
      label: 'Email',
      icon: Mail,
      disponible: !!contactInfo.email,
      contact: contactInfo.email,
    },
    {
      canal: CanalNotification.SMS,
      label: 'SMS',
      icon: Phone,
      disponible: !!contactInfo.telephone,
      contact: contactInfo.telephone,
    },
    {
      canal: CanalNotification.WHATSAPP,
      label: 'WhatsApp',
      icon: MessageSquare,
      disponible: !!contactInfo.whatsapp,
      contact: contactInfo.whatsapp,
    },
  ];

  const toggleCanal = (canal: CanalNotification) => {
    setCanaux((prev) =>
      prev.includes(canal) ? prev.filter((c) => c !== canal) : [...prev, canal]
    );
  };

  const handleSend = async () => {
    if (canaux.length === 0) {
      toast.error('Veuillez sélectionner au moins un canal');
      return;
    }

    if (type === TypeNotification.MESSAGE_PERSONNALISE && !messagePersonnalise) {
      toast.error('Veuillez saisir un message personnalisé');
      return;
    }

    setSending(true);

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demandeId,
          type,
          canaux,
          data: {
            numeroEnregistrement,
            numeroAttestation,
            nom: appeleName.split(' ')[1] || appeleName,
            prenom: appeleName.split(' ')[0] || appeleName,
            dateEnregistrement: new Date().toLocaleDateString('fr-FR'),
            messagePersonnalise,
          },
          immediate: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Échec de l\'envoi');
      }

      toast.success('Notification envoyée avec succès');
      onOpenChange(false);

      // Réinitialiser le formulaire
      setCanaux([]);
      setMessagePersonnalise('');
    } catch (error) {
      console.error('Erreur envoi notification:', error);
      toast.error('Erreur lors de l\'envoi de la notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Envoyer une notification</DialogTitle>
          <DialogDescription>
            Destinataire : <strong>{appeleName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sélection du type */}
          <div className="space-y-2">
            <Label>Type de notification</Label>
            <Select value={type} onValueChange={(value) => setType(value as TypeNotification)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sélection des canaux */}
          <div className="space-y-2">
            <Label>Canaux d'envoi</Label>
            <div className="space-y-2 border rounded-md p-3">
              {canauxDisponibles.map(({ canal, label, icon: Icon, disponible, contact }) => (
                <div key={canal} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={canal}
                      checked={canaux.includes(canal)}
                      onCheckedChange={() => toggleCanal(canal)}
                      disabled={!disponible}
                    />
                    <Label
                      htmlFor={canal}
                      className={`flex items-center space-x-2 cursor-pointer ${
                        !disponible ? 'text-gray-400' : ''
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </Label>
                  </div>
                  {disponible ? (
                    <span className="text-sm text-gray-500">{contact}</span>
                  ) : (
                    <span className="text-xs text-red-500">Non renseigné</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Message personnalisé si sélectionné */}
          {type === TypeNotification.MESSAGE_PERSONNALISE && (
            <div className="space-y-2">
              <Label>Message personnalisé</Label>
              <Textarea
                placeholder="Saisissez votre message..."
                value={messagePersonnalise}
                onChange={(e) => setMessagePersonnalise(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {/* Prévisualisation */}
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs font-semibold text-gray-600 mb-1">Aperçu du message :</p>
            <p className="text-sm text-gray-700">
              {type === TypeNotification.CONFIRMATION_DEPOT &&
                `Votre demande ${numeroEnregistrement} a été enregistrée.`}
              {type === TypeNotification.DEMANDE_EN_TRAITEMENT &&
                `Votre demande ${numeroEnregistrement} est en cours de traitement.`}
              {type === TypeNotification.ATTESTATION_PRETE &&
                `Votre attestation ${numeroAttestation || 'N/A'} est prête.`}
              {type === TypeNotification.MESSAGE_PERSONNALISE && messagePersonnalise}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={sending || canaux.length === 0}>
            {sending ? 'Envoi...' : 'Envoyer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
