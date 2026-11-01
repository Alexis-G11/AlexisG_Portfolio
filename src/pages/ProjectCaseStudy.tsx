import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ExternalLink } from 'lucide-react';
import { getProjectBySlug } from '@/data/projects';
import { Button, ArrowLink } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { site } from '@/data/site';

export function ProjectCaseStudy() {
  const { slug } = useParams<{ slug: string }>();
  const project = slug ? getProjectBySlug(slug) : undefined;

  if (!project) {
    return (
      <Section className="py-32 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          404
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-ink">
          Project not found
        </h1>
        <p className="mt-3 text-muted">
          The case study you're looking for doesn't exist.
        </p>
        <div className="mt-8">
          <Button as="link" to="/" variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Button>
        </div>
      </Section>
    );
  }

  return (
    <Section className="py-20 sm:py-28">
      <Link
        to="/#projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      <div className="mt-8 max-w-3xl">
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-accent">
          {project.category}
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tightish text-ink text-balance sm:text-4xl lg:text-5xl">
          {project.title}
        </h1>
        {project.subtitle && (
          <p className="mt-2 text-base text-muted sm:text-lg">{project.subtitle}</p>
        )}
        <p className="mt-5 text-base leading-relaxed text-ink/90 sm:mt-6 sm:text-lg">
          {project.description}
        </p>

        {project.liveUrl ? (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-surface-sunken transition-all hover:bg-accent-soft hover:shadow-[0_0_30px_-6px_rgb(var(--accent)/0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <ExternalLink className="h-4 w-4" />
            View live project
          </a>
        ) : (
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-edge bg-surface-raised px-4 py-2 text-sm text-muted">
            Live link will be added once the project is deployed.
          </p>
        )}
      </div>

      {/* Scaffold — content to be completed in the next stage */}
      <div className="mt-12 rounded-2xl border border-dashed border-edge bg-surface-raised p-6 text-center sm:mt-16 sm:p-10">
        <p className="font-display text-xl font-medium text-ink">
          Case study coming soon
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          The detailed case study for this project is being prepared. The route
          and page structure are ready — full content lands in the next stage.
        </p>
        <div className="mt-6">
          <ArrowLink to="/#contact">Discuss this project</ArrowLink>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button as="link" to="/" variant="secondary" size="sm">
          <ArrowLeft className="h-4 w-4" />
          All projects
        </Button>
        <Button as="anchor" href={`mailto:${site.email}`} variant="ghost" size="sm">
          <ArrowUpRight className="h-4 w-4" />
          Get in touch
        </Button>
      </div>
    </Section>
  );
}
