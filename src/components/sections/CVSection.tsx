import { Download, ExternalLink, FileText } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { site } from '@/data/site';

export function CVSection() {
  return (
    <Section id="cv">
      <div className="overflow-hidden rounded-3xl border border-edge bg-surface-raised">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
          <div>
            <SectionHeading
              eyebrow="Resume"
              title="My CV"
              description="A one-page summary of my education, skills, and project experience — available to download or view in your browser."
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <a
              href={site.cvPath}
              download={site.cvDownloadName}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-surface-sunken transition-all hover:bg-accent-soft hover:shadow-[0_0_30px_-6px_rgb(var(--accent)/0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <Download className="h-4 w-4" />
              Download CV
            </a>
            <a
              href={site.cvPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-edge bg-surface px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <FileText className="h-4 w-4" />
              View CV
              <ExternalLink className="h-3.5 w-3.5 text-muted" />
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
