import { Section, SectionHeading } from '@/components/ui/Section';
import { aboutText, site } from '@/data/site';

const stats = [
  { label: 'Focus', value: 'Data Science' },
  { label: 'Stack', value: 'Python · React · SQL' },
  { label: 'Goal', value: 'Build end-to-end data products' },
];

export function About() {
  return (
    <Section id="about">
      <SectionHeading eyebrow="About" title="A quick introduction" />
      <div className="mt-8 grid gap-8 sm:gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
        <p className="text-base leading-relaxed text-ink/90 sm:text-lg">{aboutText}</p>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-edge bg-edge sm:grid-cols-3 lg:grid-cols-1">
          {stats.map((s) => (
            <div key={s.label} className="bg-surface-raised p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                {s.label}
              </p>
              <p className="mt-2 font-display text-base font-medium text-ink">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-10 text-sm text-muted">
        Based in Kigali, Rwanda. Reachable at{' '}
        <a
          href={`mailto:${site.email}`}
          className="text-accent underline-offset-4 hover:underline"
        >
          {site.email}
        </a>
        .
      </p>
    </Section>
  );
}
