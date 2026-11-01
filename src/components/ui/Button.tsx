import { Link } from 'react-router-dom';
import { ArrowUpRight, Download } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-surface-sunken hover:bg-accent-soft hover:shadow-[0_0_30px_-6px_rgb(var(--accent)/0.6)]',
  secondary:
    'border border-edge bg-surface-raised text-ink hover:border-accent/60 hover:text-accent',
  ghost: 'text-muted hover:text-ink',
};

const sizes: Record<Size, string> = {
  sm: 'text-sm px-4 py-2',
  md: 'text-sm px-5 py-2.5',
  lg: 'text-base px-7 py-3.5',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

type ButtonAsButton = CommonProps & {
  as?: 'button';
} & ButtonHTMLAttributes<HTMLButtonElement>;

type ButtonAsLink = CommonProps & {
  as: 'link';
  to: string;
};

type ButtonAsAnchor = CommonProps & {
  as: 'anchor';
  href: string;
  download?: string;
};

type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsAnchor;

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', children, className = '' } = props;
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (props.as === 'link') {
    return (
      <Link to={props.to} className={classes}>
        {children}
      </Link>
    );
  }

  if (props.as === 'anchor') {
    return (
      <a
        href={props.href}
        download={props.download}
        className={classes}
      >
        {children}
      </a>
    );
  }

  const { variant: _variant, size: _size, className: _className, children: _children, ...rest } =
    props as ButtonAsButton;
  void _variant;
  void _size;
  void _className;
  void _children;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}

export function ArrowLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors hover:text-accent"
    >
      {children}
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}

export function DownloadButton({
  href,
  download,
  className = '',
}: {
  href: string;
  download: string;
  className?: string;
}) {
  return (
    <Button as="anchor" href={href} download={download} variant="secondary" size="lg" className={className}>
      <Download className="h-4 w-4" />
      Download CV
    </Button>
  );
}
