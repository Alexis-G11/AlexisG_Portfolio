import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Section } from '@/components/ui/Section';

export function NotFoundPage() {
  return (
    <Section className="flex min-h-[70vh] flex-col items-center justify-center py-32 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
        404 — Not Found
      </p>
      <h1 className="mt-6 font-display text-5xl font-semibold tracking-tightish text-ink sm:text-7xl">
        Page not found
      </h1>
      <p className="mt-5 max-w-md text-base text-muted">
        The page you're looking for doesn't exist or may have moved. Let's get
        you back on track.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-surface-sunken transition-all hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <Home className="h-4 w-4" />
        Back to home
      </Link>
    </Section>
  );
}
