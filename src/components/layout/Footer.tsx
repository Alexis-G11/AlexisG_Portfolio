import { Link } from 'react-router-dom';
import { Mail, MessageCircle } from 'lucide-react';
import { navLinks, site } from '@/data/site';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="edge-t mt-8">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-8 sm:gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-lg font-semibold text-ink">
              {site.name}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {site.role}
            </p>
          </div>

          <nav
            className="grid grid-cols-2 gap-x-6 gap-y-2 sm:flex sm:flex-wrap"
            aria-label="Footer"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm text-muted transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={`mailto:${site.email}`}
              aria-label="Email"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-edge text-muted transition-colors hover:border-accent/60 hover:text-accent"
            >
              <Mail className="h-4 w-4" />
            </a>
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-edge text-muted transition-colors hover:border-accent/60 hover:text-accent"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-edge pt-6 text-xs text-muted sm:mt-12 sm:flex-row sm:items-center">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p> Developed  By AP George. </p>
        </div>
      </div>
    </footer>
  );
}
