import type { ReactNode } from 'react';

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  id?: string;
  children?: ReactNode;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  children,
}: SectionHeadingProps) {
  return (
    <div id={id} className="max-w-2xl scroll-mt-28">
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-accent" />
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          {eyebrow}
        </span>
      </div>
      <h2 className="mt-4 font-display text-2xl font-semibold tracking-tightish text-ink sm:mt-5 sm:text-3xl lg:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-muted">{description}</p>
      )}
      {children}
    </div>
  );
}

export function Section({
  id,
  children,
  className = '',
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-24 lg:py-28 scroll-mt-20 ${className}`}
    >
      {children}
    </section>
  );
}
