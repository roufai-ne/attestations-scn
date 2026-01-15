'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Mail, Phone, MessageSquare, Save, FileText } from 'lucide-react';

interface Template {
  type: string;
  label: string;
  emailSubject: string;
  emailBody: string;
  smsMessage: string;
  whatsappTemplate: string;
}

const defaultTemplates: Template[] = [
  {
    type: 'CONFIRMATION_DEPOT',
    label: 'Confirmation de dépôt',
    emailSubject: 'Confirmation de dépôt - Demande d\'attestation {{numeroEnregistrement}}',
    emailBody: `Bonjour {{prenom}} {{nom}},

Votre demande d'attestation de Service Civique National a été enregistrée avec succès.

Numéro d'enregistrement : {{numeroEnregistrement}}
Date d'enregistrement : {{dateEnregistrement}}

Votre dossier sera traité dans les plus brefs délais. Vous recevrez une notification dès que votre attestation sera prête.

Cordialement,
Service Civique National`,
    smsMessage: 'Service Civique: Votre demande {{numeroEnregistrement}} a été enregistrée. Vous serez notifié(e) dès que votre attestation sera prête.',
    whatsappTemplate: 'confirmation_depot'
  },
  {
    type: 'DEMANDE_EN_TRAITEMENT',
    label: 'Demande en traitement',
    emailSubject: 'Demande {{numeroEnregistrement}} en cours de traitement',
    emailBody: `Bonjour {{prenom}} {{nom}},

Votre demande d'attestation {{numeroEnregistrement}} est actuellement en cours de traitement par nos services.

Nous vous tiendrons informé(e) de l'avancement de votre dossier.

Cordialement,
Service Civique National`,
    smsMessage: 'Service Civique: Votre demande {{numeroEnregistrement}} est en cours de traitement.',
    whatsappTemplate: 'demande_en_traitement'
  },
  {
    type: 'PIECES_NON_CONFORMES',
    label: 'Pièces non conformes',
    emailSubject: 'Demande {{numeroEnregistrement}} - Pièces à régulariser',
    emailBody: `Bonjour {{prenom}} {{nom}},

Votre demande d'attestation {{numeroEnregistrement}} nécessite une régularisation.

Certaines pièces de votre dossier ne sont pas conformes. Veuillez vous rapprocher de nos services pour plus d'informations.

Cordialement,
Service Civique National`,
    smsMessage: 'Service Civique: Pièces non conformes pour demande {{numeroEnregistrement}}. Contactez-nous.',
    whatsappTemplate: 'pieces_non_conformes'
  },
  {
    type: 'DEMANDE_REJETEE',
    label: 'Demande rejetée',
    emailSubject: 'Demande d\'attestation {{numeroEnregistrement}} - Information',
    emailBody: `Bonjour {{prenom}} {{nom}},

Nous regrettons de vous informer que votre demande d'attestation {{numeroEnregistrement}} ne peut être traitée.

Motif : {{motifRejet}}

Pour toute information complémentaire, veuillez contacter nos services.

Cordialement,
Service Civique National`,
    smsMessage: 'Service Civique: Votre demande {{numeroEnregistrement}} nécessite une régularisation. Veuillez contacter nos services.',
    whatsappTemplate: 'demande_rejetee'
  },
  {
    type: 'ATTESTATION_PRETE',
    label: 'Attestation prête',
    emailSubject: '✓ Votre attestation est prête - {{numeroAttestation}}',
    emailBody: `Bonjour {{prenom}} {{nom}},

Excellente nouvelle ! Votre attestation de Service Civique National est prête.

Numéro d'attestation : {{numeroAttestation}}
Demande : {{numeroEnregistrement}}

Vous pouvez venir retirer votre attestation à nos bureaux :
- Horaires : Lundi à Vendredi, 8h00 - 16h00
- Munissez-vous de votre pièce d'identité

Cordialement,
Service Civique National`,
    smsMessage: 'Service Civique: Votre attestation {{numeroAttestation}} est prête. Retrait aux bureaux (Lun-Ven, 8h-16h) avec pièce d\'identité.',
    whatsappTemplate: 'attestation_prete'
  }
];

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>(defaultTemplates);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/config/notification-templates');
      if (response.ok) {
        const data = await response.json();
        if (data.templates && data.templates.length > 0) {
          setTemplates(data.templates);
        }
      }
    } catch (error) {
      console.error('Erreur chargement templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/config/notification-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates }),
      });

      if (response.ok) {
        toast.success('Templates sauvegardés avec succès');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      toast.error('Erreur serveur');
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateChange = (index: number, field: keyof Template, value: string) => {
    const newTemplates = [...templates];
    newTemplates[index] = { ...newTemplates[index], [field]: value };
    setTemplates(newTemplates);
  };

  const handleReset = (index: number) => {
    const newTemplates = [...templates];
    const defaultTemplate = defaultTemplates.find(t => t.type === templates[index].type);
    if (defaultTemplate) {
      newTemplates[index] = { ...defaultTemplate };
      setTemplates(newTemplates);
      toast.success('Template réinitialisé');
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates de notifications</h1>
          <p className="text-gray-600">
            Personnalisez les messages envoyés aux appelés. Variables disponibles : {'{'}{'{'} prenom {'}'}{'}'}, {'{'}{'{'} nom {'}'}{'}'}, {'{'}{'{'} numeroEnregistrement {'}'}{'}'}, etc.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder tout'}
        </Button>
      </div>

      <div className="space-y-6">
        {templates.map((template, index) => (
          <Card key={template.type}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {template.label}
                  </CardTitle>
                  <CardDescription>Type : {template.type}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReset(index)}
                >
                  Réinitialiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="email" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="email">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="sms">
                    <Phone className="h-4 w-4 mr-2" />
                    SMS
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    WhatsApp
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="space-y-4 mt-4">
                  <div>
                    <Label>Sujet</Label>
                    <Textarea
                      value={template.emailSubject}
                      onChange={(e) => handleTemplateChange(index, 'emailSubject', e.target.value)}
                      rows={2}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Corps du message</Label>
                    <Textarea
                      value={template.emailBody}
                      onChange={(e) => handleTemplateChange(index, 'emailBody', e.target.value)}
                      rows={10}
                      className="mt-2 font-mono text-sm"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="sms" className="space-y-4 mt-4">
                  <div>
                    <Label>Message SMS (max 160 caractères)</Label>
                    <Textarea
                      value={template.smsMessage}
                      onChange={(e) => handleTemplateChange(index, 'smsMessage', e.target.value)}
                      rows={4}
                      maxLength={160}
                      className="mt-2"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {template.smsMessage.length} / 160 caractères
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="whatsapp" className="space-y-4 mt-4">
                  <div>
                    <Label>Nom du template WhatsApp Business</Label>
                    <Textarea
                      value={template.whatsappTemplate}
                      onChange={(e) => handleTemplateChange(index, 'whatsappTemplate', e.target.value)}
                      rows={2}
                      className="mt-2"
                      placeholder="nom_du_template_approuve"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Le template doit être pré-approuvé dans WhatsApp Business Manager
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
