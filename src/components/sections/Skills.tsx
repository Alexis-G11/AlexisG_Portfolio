import {
  BarChart3,
  Code2,
  Globe,
  MessageSquare,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { skillCategories } from '@/data/skills';

const iconMap: Record<string, LucideIcon> = {
  Code2,
  Globe,
  BarChart3,
  Wrench,
  MessageSquare,
};

export function Skills() {
  return (
    <Section id="skills">
      <SectionHeading
        eyebrow="Skills"
        title="Tools &amp; technologies I work with"
        description="A growing toolkit across programming, the web, and data science — sharpened through coursework, internships, and hands-on projects."
      />

      <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {skillCategories.map((cat) => {
          const Icon = iconMap[cat.icon] ?? Code2;
          return (
            <div
              key={cat.title}
              className="group rounded-2xl border border-edge bg-surface-raised p-5 transition-all duration-300 hover:border-accent/40 hover:bg-surface-raised/80 sm:p-6"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-edge text-accent transition-colors group-hover:border-accent/50">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-display text-lg font-medium text-ink">
                  {cat.title}
                </h3>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                {cat.subGroups.map((sub) => (
                  <div key={sub.label}>
                    <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
                      {sub.label}
                    </p>
                    <ul className="flex flex-wrap gap-2">
                      {sub.skills.map((skill) => (
                        <li
                          key={skill}
                          className="rounded-full border border-edge bg-surface px-3 py-1.5 text-sm text-ink/90 transition-colors hover:border-accent/50 hover:text-accent"
                        >
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
