import { ArrowDown, Download, MessageCircle } from 'lucide-react';
import { Button, ArrowLink } from '@/components/ui/Button';
import { site } from '@/data/site';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient grid + glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid-fade opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgb(var(--ink)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--ink)) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10%] h-[320px] w-[480px] -translate-x-1/2 rounded-full bg-accent/10 blur-[100px] sm:h-[420px] sm:w-[680px] sm:blur-[120px]"
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-20 pt-24 sm:px-6 sm:pb-24 sm:pt-36 lg:pt-44">
        <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
          {/* Left: text */}
          <div className="order-2 lg:order-1">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface-raised px-3 py-1.5 text-xs text-muted sm:px-3.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                Open to entry-level opportunities
              </span>
            </div>

            <h1 className="mt-6 max-w-3xl animate-fade-up font-display text-[1.75rem] font-semibold leading-[1.15] tracking-tightish text-ink text-balance [animation-delay:80ms] sm:mt-8 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
              Data Scientist{' '}
              <span className="text-muted">|</span>{' '}
              <span className="accent-underline text-accent"> Full-Stack Developer</span>
            </h1>

            <p className="mt-6 max-w-xl animate-fade-up text-base leading-relaxed text-muted [animation-delay:160ms] sm:mt-7 sm:text-lg">
              Turning data into decisions and ideas into interfaces — building at the
              intersection of machine learning, analytics, and the web.
            </p>
           
<div className="mt-8 flex animate-fade-up flex-col gap-3 [animation-delay:240ms] sm:mt-10 sm:flex-row sm:items-center">
  <Button as="link" to="/#projects" size="lg" variant="primary">
    View Projects
    <ArrowDown className="h-4 w-4" />
  </Button>

  <Button
    as="link"
    to="/#contact"
    size="lg"
    variant="secondary"
  >
    <MessageCircle className="h-4 w-4" />
    Hire Me
  </Button>

  <Button
    as="anchor"
    href={site.cvPath}
    download={site.cvDownloadName}
    size="lg"
    variant="secondary"
  >
    <Download className="h-4 w-4" />
    Download CV
  </Button>
</div>

            <div className="mt-8 animate-fade-up [animation-delay:320ms] sm:mt-10">
              <ArrowLink to="/#about">Learn more about me</ArrowLink>
            </div>
          </div>

          {/* Right: profile photo — visible on all screen sizes */}
          <div className="order-1 flex animate-fade-in justify-center [animation-delay:200ms] lg:block">
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-2 rounded-full bg-accent/5 blur-2xl sm:-inset-3"
              />
              <div className="relative h-32 w-32 overflow-hidden rounded-full border border-edge bg-surface-raised sm:h-44 sm:w-44 lg:h-56 lg:w-56 xl:h-64 xl:w-64">
                <img
                  src="/assets/apg.jpeg"
                  alt="Alexis Praise George"
                  className="h-full w-full rounded-full object-cover"
                  onError={(e) => console.error("Profile image failed to load:", e.currentTarget.src)}
                  loading="eager"
                  width={256}
                  height={256}
                />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 rounded-full border border-edge bg-surface-raised px-2.5 py-1 text-[10px] font-medium text-ink shadow-lg sm:px-3 sm:py-1.5 sm:text-xs">
                <span className="text-accent">●</span> Available
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
