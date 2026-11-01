import { Link } from 'react-router-dom';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/Section';
import { projects } from '@/data/projects';

export function Projects() {
  return (
    <Section id="projects">
      <SectionHeading
        eyebrow="Selected Projects"
        title="Work I'm proud of"
        description="A selection of projects spanning full-stack development, machine learning, and data analytics."
      />

      <div className="mt-10 flex flex-col gap-px overflow-hidden rounded-2xl border border-edge bg-edge sm:mt-12">
        {projects.map((project, i) => (
          <div
            key={project.slug}
            className="group flex flex-col gap-4 bg-surface-raised p-5 transition-colors duration-300 hover:bg-surface-sunken sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-7 lg:p-8"
          >
            <Link to={project.caseStudyRoute} className="flex-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-accent">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
                  {project.category}
                </span>
              </div>

              <h3 className="mt-2 font-display text-lg font-semibold tracking-tightish text-ink transition-colors group-hover:text-accent sm:mt-3 sm:text-xl lg:text-2xl">
                {project.title}
              </h3>

              {project.subtitle && (
                <p className="mt-1 text-sm font-medium text-muted">
                  {project.subtitle}
                </p>
              )}

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                {project.description}
              </p>
            </Link>

            <div className="flex shrink-0 flex-col items-start gap-2 self-start sm:flex-row sm:items-center sm:self-center">
              <Link
                to={project.caseStudyRoute}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
              >
                View case study
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              {project.liveUrl ? (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:border-accent hover:bg-accent/20"
                >
                  Live project
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-surface px-3 py-1.5 text-xs font-medium text-muted">
                  Not yet deployed
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
