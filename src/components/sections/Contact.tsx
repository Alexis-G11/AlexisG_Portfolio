import { useRef, useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  Loader2,
  Mail,
  MessageCircle,
  Send,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { site } from '@/data/site';

type Notice = { kind: 'success' | 'error' | 'info'; text: string } | null;

const DELIVERY_MODE = import.meta.env.VITE_CONTACT_DELIVERY_MODE ?? 'click-to-chat';
const MAX_MESSAGE_LENGTH = 600;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
  const [sending, setSending] = useState(false);
  const submittingRef = useRef(false);
  const [notice, setNotice] = useState<Notice>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || sending) return;

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();

    if (!cleanName || !cleanEmail || !cleanMessage) {
      setNotice({ kind: 'error', text: 'Please complete your name, email address, and message.' });
      return;
    }
    if (cleanName.length > 80 || cleanEmail.length > 254 || cleanMessage.length > MAX_MESSAGE_LENGTH) {
      setNotice({ kind: 'error', text: `Please keep your name under 80 characters, email under 254, and message under ${MAX_MESSAGE_LENGTH} characters.` });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setNotice({ kind: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    // Honeypot: silently discard automated submissions.
    if (website.trim()) return;

    if (DELIVERY_MODE !== 'api') {
      const text = `Hello Alexis,\n\nMy name is ${cleanName}.\nEmail: ${cleanEmail}\n\n${cleanMessage}`;
      const url = `${site.whatsappHref}?text=${encodeURIComponent(text)}`;
      const popup = window.open(url, '_blank');
      if (!popup) {
        setNotice({ kind: 'error', text: 'Your browser blocked the WhatsApp window. Allow pop-ups for this site and try again, or use the Message on WhatsApp button.' });
      } else {
        // Prevent the opened tab from accessing this page through window.opener.
        popup.opener = null;
        setNotice({ kind: 'info', text: 'WhatsApp opened with your message prepared. Please review it and press Send in WhatsApp. Your message has not been sent yet.' });
      }
      return;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setNotice({ kind: 'error', text: 'The contact service is not configured. Please use the WhatsApp button or email instead.' });
      return;
    }

    submittingRef.current = true;
    setSending(true);
    setNotice(null);
    try {
      const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/whatsapp-contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          message: cleanMessage,
          website,
          submissionId,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) {
        setNotice({
          kind: 'error',
          text: typeof result.message === 'string'
            ? result.message
            : 'We could not send your message. Your details are still here so you can try again.',
        });
        return;
      }
      if (result.status === 'accepted') {
        setNotice({ kind: 'success', text: 'WhatsApp accepted your message for processing. This confirms API acceptance, not delivery to the phone.' });
        setName('');
        setEmail('');
        setMessage('');
        setSubmissionId(crypto.randomUUID());
      } else {
        setNotice({ kind: 'error', text: 'We could not confirm that WhatsApp accepted your message. Your details have been kept.' });
      }
    } catch {
      setNotice({ kind: 'error', text: 'The contact service could not be reached. Your details are still here so you can try again.' });
    } finally {
      submittingRef.current = false;
      setSending(false);
    }
  }

  const noticeStyles = notice?.kind === 'success'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    : notice?.kind === 'error'
      ? 'border-red-500/30 bg-red-500/10 text-red-300'
      : 'border-accent/30 bg-accent/10 text-ink';

  return (
    <Section id="contact">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="Get in touch"
            title="Let's work together."
            description="Have a project in mind, an opportunity, or simply want to connect? Send me a message and I'll be happy to hear from you."
          />
          <div className="mt-8 space-y-4">
            <a href={`mailto:${site.email}`} className="group flex items-center gap-4 rounded-2xl border border-edge bg-surface-raised p-4 transition-colors hover:border-accent/60">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><Mail className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1"><span className="block text-xs text-muted">Email me</span><span className="mt-1 block break-all text-sm font-medium text-ink">{site.email}</span></span>
              <ExternalLink className="h-4 w-4 text-muted transition-colors group-hover:text-accent" />
            </a>
            <a href={site.whatsappHref} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 rounded-2xl border border-edge bg-surface-raised p-4 transition-colors hover:border-accent/60">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><MessageCircle className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1"><span className="block text-xs text-muted">Message on WhatsApp</span><span className="mt-1 block text-sm font-medium text-ink">{site.whatsapp}</span></span>
              <ExternalLink className="h-4 w-4 text-muted transition-colors group-hover:text-accent" />
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-edge bg-surface-raised p-5 sm:p-7" noValidate>
          <h3 className="font-display text-xl font-semibold text-ink">Send a message</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">Fill in the details below and I’ll get back to you.</p>
          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-ink">Your name</label>
              <input id="contact-name" name="name" autoComplete="name" required maxLength={80} value={name} onChange={(e) => { setName(e.target.value); setSubmissionId(crypto.randomUUID()); }} className="w-full rounded-xl border border-edge bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20" placeholder="Enter your name" />
            </div>
            <div>
              <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-ink">Email address</label>
              <input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => { setEmail(e.target.value); setSubmissionId(crypto.randomUUID()); }} className="w-full rounded-xl border border-edge bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20" placeholder="you@example.com" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="contact-message" className="block text-sm font-medium text-ink">Your message</label>
                <span className="text-xs text-muted">{message.length}/{MAX_MESSAGE_LENGTH}</span>
              </div>
              <textarea id="contact-message" name="message" required rows={5} maxLength={MAX_MESSAGE_LENGTH} value={message} onChange={(e) => { setMessage(e.target.value); setSubmissionId(crypto.randomUUID()); }} className="w-full resize-y rounded-xl border border-edge bg-surface px-4 py-3 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20" placeholder="Tell me a little about what you have in mind..." />
            </div>
            <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
              <label htmlFor="contact-website">Leave this field empty</label>
              <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            {notice && (
              <div role={notice.kind === 'error' ? 'alert' : 'status'} aria-live={notice.kind === 'error' ? 'assertive' : 'polite'} className={`flex gap-2 rounded-xl border p-3 text-sm leading-relaxed ${noticeStyles}`}>
                {notice.kind === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : notice.kind === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                <span>{notice.text}</span>
              </div>
            )}
            <button type="submit" disabled={sending} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-surface-sunken transition-all hover:bg-accent-soft hover:shadow-[0_0_30px_-6px_rgb(var(--accent)/0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60">
              {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Send className="h-4 w-4" /> Send Message</>}
            </button>
            {DELIVERY_MODE !== 'api' && <p className="text-center text-xs leading-relaxed text-muted">This opens WhatsApp with your message ready. You must press Send in WhatsApp to deliver it.</p>}
            {DELIVERY_MODE === 'api' && <p className="text-center text-xs leading-relaxed text-muted">Your name, email and message are stored in the contact database and sent to WhatsApp. API acceptance does not confirm delivery.</p>}
          </div>
        </form>
      </div>
    </Section>
  );
}
