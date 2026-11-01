import { Briefcase, FolderGit2 } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { experience } from '@/data/site';

const iconForType: Record<string, typeof Briefcase> = {
  Internship: Briefcase,
  Project: FolderGit2,
};

export function Experience() {
  return (
    <Section id="experience">
      <SectionHeading
        eyebrow="Experience"
        title={experience.heading}
        description="Hands-on work from my internship and personal projects — building real applications and working with data."
      />

      <div className="mt-10 flex flex-col gap-4">
        {experience.items.map((item) => {
          const Icon = iconForType[item.type] ?? Briefcase;
          return (
            <div
              key={item.role}
              className="rounded-2xl border border-edge bg-surface-raised p-5 transition-colors hover:border-accent/30 sm:p-7 lg:p-8"
            >
              <div className="flex items-start gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-edge text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="font-display text-lg font-medium text-ink">
                      {item.role}
                    </h3>
                    <span className="rounded-full border border-edge bg-surface px-2.5 py-0.5 text-xs font-medium text-accent">
                      {item.type}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.areas.map((area) => (
                      <span
                        key={area}
                        className="rounded-full border border-edge bg-surface px-3 py-1 text-xs font-medium text-ink/90"
                      >
                        {area}
                      </span>
                    ))}
                  </div>

                  <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
