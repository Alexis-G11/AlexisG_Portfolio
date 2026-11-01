import { GraduationCap } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { education } from '@/data/site';

export function Education() {
  return (
    <Section id="education">
      <SectionHeading eyebrow="Education" title="Academic background" />

      <div className="mt-10 flex flex-col gap-px overflow-hidden rounded-2xl border border-edge bg-edge">
        {education.map((item) => (
          <div
            key={item.institution}
            className="flex items-start gap-4 bg-surface-raised p-5 transition-colors hover:bg-surface-sunken sm:gap-5 sm:p-7 lg:p-8"
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-edge text-accent">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-medium text-ink">
                {item.institution}
              </h3>
              <p className="mt-1.5 text-sm text-muted">{item.award}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
