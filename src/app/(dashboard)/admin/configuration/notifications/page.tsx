'use client';

/**
 * Page de configuration des notifications (Admin)
 * Permet de configurer SMTP, SMS et WhatsApp
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, Phone, MessageSquare, CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';

interface ConfigSmtp {
  host: string;
  port: string;
  secure: string;
  user: string;
  pass: string;
}

interface ConfigBrevo {
  apiKey: string;
  senderEmail: string;
  senderName: string;
  smsEnabled: string;
}

interface ConfigSms {
  provider: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  apiUrl: string;
  apiKey: string;
}

interface ConfigWhatsApp {
  phoneNumberId: string;
  accessToken: string;
}

export default function NotificationsConfigPage() {
  const router = useRouter();
  const [emailProvider, setEmailProvider] = useState<'smtp' | 'brevo'>('smtp');
  
  const [smtp, setSmtp] = useState<ConfigSmtp>({
    host: '',
    port: '587',
    secure: 'false',
    user: '',
    pass: '',
  });

  const [brevo, setBrevo] = useState<ConfigBrevo>({
    apiKey: '',
    senderEmail: 'noreply@servicecivique.ne',
    senderName: 'Service Civique National',
    smsEnabled: 'false',
  });

  const [sms, setSms] = useState<ConfigSms>({
    provider: 'twilio',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
    apiUrl: '',
    apiKey: '',
  });

  const [whatsapp, setWhatsapp] = useState<ConfigWhatsApp>({
    phoneNumberId: '',
    accessToken: '',
  });

  const [testing, setTesting] = useState<{
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  }>({
    email: false,
    sms: false,
    whatsapp: false,
  });

  const [saving, setSaving] = useState(false);

  // Charger la configuration actuelle
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/config/notifications');
      if (response.ok) {
        const config = await response.json();
        
        // Provider email
        if (config.emailProvider) {
          setEmailProvider(config.emailProvider);
        }
        
        // Config SMTP
        if (config.smtp) {
          setSmtp({
            host: config.smtp.host || '',
            port: config.smtp.port || '587',
            secure: config.smtp.secure || 'false',
            user: config.smtp.user || '',
            pass: config.smtp.pass || '',
          });
        }
        
        // Config Brevo
        if (config.brevo) {
          setBrevo({
            apiKey: config.brevo.apiKey || '',
            senderEmail: config.brevo.senderEmail || 'noreply@servicecivique.ne',
            senderName: config.brevo.senderName || 'Service Civique National',
            smsEnabled: config.brevo.smsEnabled || 'false',
          });
        }
        
        // Config SMS
        if (config.sms) {
          setSms({
            provider: config.sms.provider || 'twilio',
            twilioAccountSid: config.sms.twilioAccountSid || '',
            twilioAuthToken: config.sms.twilioAuthToken || '',
            twilioPhoneNumber: config.sms.twilioPhoneNumber || '',
            apiUrl: config.sms.apiUrl || '',
            apiKey: config.sms.apiKey || '',
          });
        }
        
        // Config WhatsApp
        if (config.whatsapp) {
          setWhatsapp({
            phoneNumberId: config.whatsapp.phoneNumberId || '',
            accessToken: config.whatsapp.accessToken || '',
          });
        }
      }
    } catch (error) {
      console.error('Erreur chargement config:', error);
    }
  };

  const handleTestEmail = async () => {
    setTesting({ ...testing, email: true });
    try {
      const response = await fetch('/api/notifications/test/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtp),
      });

      if (response.ok) {
        toast.success('✓ Connexion SMTP réussie');
      } else {
        toast.error('✗ Échec de la connexion SMTP');
      }
    } catch (error) {
      toast.error('Erreur lors du test');
    } finally {
      setTesting({ ...testing, email: false });
    }
  };

  const handleTestSms = async () => {
    setTesting({ ...testing, sms: true });
    try {
      const response = await fetch('/api/notifications/test/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sms),
      });

      if (response.ok) {
        toast.success('✓ Connexion SMS réussie');
      } else {
        toast.error('✗ Échec de la connexion SMS');
      }
    } catch (error) {
      toast.error('Erreur lors du test');
    } finally {
      setTesting({ ...testing, sms: false });
    }
  };

  const handleTestWhatsApp = async () => {
    setTesting({ ...testing, whatsapp: true });
    try {
      const response = await fetch('/api/notifications/test/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whatsapp),
      });

      if (response.ok) {
        toast.success('✓ Connexion WhatsApp réussie');
      } else {
        toast.error('✗ Échec de la connexion WhatsApp');
      }
    } catch (error) {
      toast.error('Erreur lors du test');
    } finally {
      setTesting({ ...testing, whatsapp: false });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/config/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emailProvider, 
          smtp, 
          brevo,
          sms, 
          whatsapp 
        }),
      });

      if (response.ok) {
        toast.success('Configuration sauvegardée');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      toast.error('Erreur serveur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuration des Notifications</h1>
          <p className="text-gray-500 mt-2">
            Configurez les paramètres d'envoi pour Email, SMS et WhatsApp
          </p>
        </div>
        <Button onClick={() => router.push('/admin/configuration/notifications/templates')}>
          <FileText className="h-4 w-4 mr-2" />
          Gérer les templates
        </Button>
      </div>

      {/* Configuration Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configuration Email
          </CardTitle>
          <CardDescription>
            Choisissez votre fournisseur d'envoi d'emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Fournisseur Email</Label>
            <Select value={emailProvider} onValueChange={(value: 'smtp' | 'brevo') => setEmailProvider(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brevo">Brevo (Recommandé)</SelectItem>
                <SelectItem value="smtp">SMTP Classique</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              {emailProvider === 'brevo' 
                ? '✓ Brevo offre une meilleure délivrabilité et inclut les SMS (optionnel)'
                : 'Configuration SMTP traditionnelle via votre serveur email'
              }
            </p>
          </div>

          {emailProvider === 'brevo' ? (
            /* Configuration Brevo */
            <>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                <p className="font-semibold text-blue-900 mb-1">📧 Brevo (anciennement Sendinblue)</p>
                <p className="text-blue-700 mb-2">
                  Plateforme d'emailing professionnelle avec haute délivrabilité
                </p>
                <ul className="text-blue-700 space-y-1 list-disc list-inside">
                  <li>Plan gratuit : 300 emails/jour</li>
                  <li>SMS optionnels (payants)</li>
                  <li>Statistiques détaillées</li>
                  <li>Créer un compte : <a href="https://www.brevo.com" target="_blank" rel="noopener" className="underline">brevo.com</a></li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label>Clé API Brevo *</Label>
                <Input
                  type="password"
                  value={brevo.apiKey}
                  onChange={(e) => setBrevo({ ...brevo, apiKey: e.target.value })}
                  placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxxx"
                />
                <p className="text-xs text-gray-500">
                  Obtenir votre clé API : <a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noopener" className="text-blue-600 underline">app.brevo.com/settings/keys/api</a>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email expéditeur *</Label>
                  <Input
                    type="email"
                    value={brevo.senderEmail}
                    onChange={(e) => setBrevo({ ...brevo, senderEmail: e.target.value })}
                    placeholder="noreply@servicecivique.ne"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom expéditeur *</Label>
                  <Input
                    value={brevo.senderName}
                    onChange={(e) => setBrevo({ ...brevo, senderName: e.target.value })}
                    placeholder="Service Civique National"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>SMS Brevo (optionnel)</Label>
                <Select value={brevo.smsEnabled} onValueChange={(value) => setBrevo({ ...brevo, smsEnabled: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Désactivé</SelectItem>
                    <SelectItem value="true">Activé (nécessite crédits SMS)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Les SMS Brevo sont payants. Achetez des crédits sur votre tableau de bord Brevo.
                </p>
              </div>
            </>
          ) : (
            /* Configuration SMTP */
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hôte SMTP</Label>
                  <Input
                    value={smtp.host}
                    onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input
                    type="number"
                    value={smtp.port}
                    onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sécurité</Label>
                <Select value={smtp.secure} onValueChange={(value) => setSmtp({ ...smtp, secure: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">STARTTLS (Port 587)</SelectItem>
                    <SelectItem value="true">SSL/TLS (Port 465)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Utilisateur</Label>
                  <Input
                    value={smtp.user}
                    onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mot de passe</Label>
                  <Input
                    type="password"
                    value={smtp.pass}
                    onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </>
          )}

          <Button onClick={handleTestEmail} disabled={testing.email} variant="outline">
            {testing.email ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              'Tester la connexion'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Configuration SMS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Configuration SMS
          </CardTitle>
          <CardDescription>Paramètres du fournisseur SMS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Fournisseur</Label>
            <Select value={sms.provider} onValueChange={(value) => setSms({ ...sms, provider: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="generic">API Générique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sms.provider === 'twilio' ? (
            <>
              <div className="space-y-2">
                <Label>Account SID</Label>
                <Input
                  value={sms.twilioAccountSid}
                  onChange={(e) => setSms({ ...sms, twilioAccountSid: e.target.value })}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label>Auth Token</Label>
                <Input
                  type="password"
                  value={sms.twilioAuthToken}
                  onChange={(e) => setSms({ ...sms, twilioAuthToken: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label>Numéro Twilio</Label>
                <Input
                  value={sms.twilioPhoneNumber}
                  onChange={(e) => setSms({ ...sms, twilioPhoneNumber: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>URL API</Label>
                <Input
                  value={sms.apiUrl}
                  onChange={(e) => setSms({ ...sms, apiUrl: e.target.value })}
                  placeholder="https://api.example.com/sms"
                />
              </div>
              <div className="space-y-2">
                <Label>Clé API</Label>
                <Input
                  type="password"
                  value={sms.apiKey}
                  onChange={(e) => setSms({ ...sms, apiKey: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </>
          )}

          <Button onClick={handleTestSms} disabled={testing.sms} variant="outline">
            {testing.sms ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              'Tester la connexion'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Configuration WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Configuration WhatsApp Business
          </CardTitle>
          <CardDescription>
            Paramètres de l'API WhatsApp Business Cloud (Meta)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Phone Number ID</Label>
            <Input
              value={whatsapp.phoneNumberId}
              onChange={(e) => setWhatsapp({ ...whatsapp, phoneNumberId: e.target.value })}
              placeholder="1234567890"
            />
          </div>

          <div className="space-y-2">
            <Label>Access Token</Label>
            <Input
              type="password"
              value={whatsapp.accessToken}
              onChange={(e) => setWhatsapp({ ...whatsapp, accessToken: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <div className="bg-blue-50 border border-green-200 rounded p-3 text-sm">
            <p className="font-semibold text-blue-900 mb-1">⚠️ Attention</p>
            <p className="text-blue-700">
              Les templates de messages doivent être créés et approuvés dans le Meta Business Manager
              avant d'être utilisés.
            </p>
          </div>

          <Button onClick={handleTestWhatsApp} disabled={testing.whatsapp} variant="outline">
            {testing.whatsapp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              'Tester la connexion'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Bouton Sauvegarder */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            'Sauvegarder la configuration'
          )}
        </Button>
      </div>
    </div>
  );
}

