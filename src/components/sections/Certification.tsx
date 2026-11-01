import { Award } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { certification } from '@/data/site';

export function Certification() {
  return (
    <Section id="certification">
      <SectionHeading eyebrow="Certification" title="Credentials" />

      <div className="mt-10 flex items-start gap-4 rounded-2xl border border-edge bg-surface-raised p-5 transition-colors hover:border-accent/40 sm:gap-5 sm:p-7 lg:p-8">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-edge text-accent">
          <Award className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-lg font-medium text-ink">
            {certification.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            {certification.detail}
          </p>
        </div>
      </div>
    </Section>
  );
}
