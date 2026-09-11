import React, { useEffect, useState } from 'react';
import { ExternalLink, KeyRound, RefreshCw, ClipboardCopy, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import useAuthStore from '../store/useAuthStore';
import apiClient from '../services/client';

const copyText = async (value) => {
  const text = String(value || '');
  if (!text) return false;
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  return copied;
};

const DeveloperApi = () => {
  const { addToast } = useToast();
  const { user, refreshProfile } = useAuthStore();
  const [rawToken, setRawToken] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [whitelistText, setWhitelistText] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    setWhitelistText((user?.whitelistIps || []).join('\n'));
    setWebhookUrl(user?.webhookUrl || '');
  }, [user?.whitelistIps, user?.webhookUrl]);

  const generateToken = async () => {
    setIsGenerating(true);
    try {
      const result = await apiClient.me.generateApiToken();
      setRawToken(result?.rawToken || result?.data?.rawToken || '');
      addToast('A new API token was generated. Copy it now; it will not be shown again.', 'success');
    } catch (error) {
      addToast(error?.message || 'Unable to generate an API token.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const whitelistIps = whitelistText.split(/\r?\n|,/).map((value) => value.trim()).filter(Boolean);
      await apiClient.me.updateApiSettings({ whitelistIps, webhookUrl });
      await refreshProfile({ force: true });
      addToast('API settings saved.', 'success');
    } catch (error) {
      addToast(error?.message || 'Unable to save API settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 pb-16 sm:px-6 lg:px-8">
      <Card className="rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.3)] bg-[color:rgb(var(--color-card-rgb)/0.92)] p-6 shadow-[var(--shadow-subtle)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-primary)]"><KeyRound className="h-5 w-5" /><span className="font-semibold">B2B API management</span></div>
            <h1 className="mt-3 text-2xl font-bold text-[var(--color-text)]">Manage API access for this account</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">Use this page to generate a token and control allowed source IP addresses. Public integration documentation is available separately.</p>
          </div>
          <Link to="/api-docs" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[color:rgb(var(--color-primary-rgb)/0.35)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)]">
            Open API Documentation <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </Card>

      <Card className="rounded-2xl p-6 shadow-[var(--shadow-subtle)]">
        <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-500" /><h2 className="font-bold text-[var(--color-text)]">API token</h2></div>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">API access is {user?.isApiEnabled ? 'enabled' : 'not enabled'} for this account. Regenerating a token invalidates the previous token.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input readOnly value={rawToken || 'Generate a token to reveal a new value.'} className="min-w-0 flex-1 rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.8)] bg-[color:rgb(var(--color-elevated-rgb)/0.55)] px-4 py-3 font-mono text-sm text-[var(--color-text)]" />
          <Button type="button" variant="outline" disabled={!rawToken} onClick={async () => addToast(await copyText(rawToken) ? 'Token copied.' : 'Unable to copy token.', 'success')}><ClipboardCopy className="h-4 w-4" />Copy</Button>
          <Button type="button" disabled={isGenerating || !user?.isApiEnabled} onClick={generateToken}><RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />Generate token</Button>
        </div>
      </Card>

      <Card className="rounded-2xl p-6 shadow-[var(--shadow-subtle)]">
        <h2 className="font-bold text-[var(--color-text)]">IP and webhook settings</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Leave the IP list empty to allow requests from any address. Enter one IP address per line or separate values with commas.</p>
        <label className="mt-4 block text-sm font-semibold text-[var(--color-text)]">Allowed IP addresses</label>
        <textarea value={whitelistText} onChange={(event) => setWhitelistText(event.target.value)} rows={5} disabled={!user?.isApiEnabled} className="mt-2 w-full rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.8)] bg-[color:rgb(var(--color-elevated-rgb)/0.55)] p-3 text-sm text-[var(--color-text)]" />
        <label className="mt-4 block text-sm font-semibold text-[var(--color-text)]">Webhook URL</label>
        <input value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} disabled={!user?.isApiEnabled} placeholder="https://example.com/webhook" className="mt-2 w-full rounded-xl border border-[color:rgb(var(--color-border-rgb)/0.8)] bg-[color:rgb(var(--color-elevated-rgb)/0.55)] px-3 py-2 text-sm text-[var(--color-text)]" />
        <div className="mt-4"><Button type="button" disabled={isSaving || !user?.isApiEnabled} onClick={saveSettings}>Save API settings</Button></div>
      </Card>
    </div>
  );
};

export default DeveloperApi;
