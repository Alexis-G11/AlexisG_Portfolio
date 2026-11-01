export interface ProjectSummary {
  slug: string;
  title: string;
  subtitle?: string;
  category: string;
  description: string;
  caseStudyRoute: string;
  /** Live project URL — set once the project is deployed (Vercel/GCP). Empty until then. */
  liveUrl?: string;
}

export const projects: ProjectSummary[] = [
  {
    slug: 'businessiq',
    title: 'BusinessIQ Platform',
    category: 'Full-Stack · Data Science',
    description:
      'A digital accountant, business analyst, and predictive intelligence platform/application for small and medium-sized businesses.',
    caseStudyRoute: '/projects/businessiq',
    liveUrl: '',
  },
  {
    slug: 'diabetes-risk',
    title: 'Diabetes Risk Prediction System',
    category: 'Full-Stack · Machine Learning',
    description:
      'An end-to-end predictive risk-assessment system using machine learning algorithms to identify patient susceptibility to Type 2 diabetes and support early intervention.',
    caseStudyRoute: '/projects/diabetes-risk',
    liveUrl: '',
  },
  {
    slug: 'ecommerce-funnel',
    title: 'E-Commerce Funnel Analysis',
    subtitle: 'Conversion Funnel Optimization',
    category: 'Full-Stack · Data Analytics · SQL',
    description:
      'An analysis of user behavioral data across 5+ checkout stages using SQL to identify structural drop-off points in the sales pipeline.',
    caseStudyRoute: '/projects/ecommerce-funnel',
    liveUrl: '',
  },
];

export function getProjectBySlug(slug: string): ProjectSummary | undefined {
  return projects.find((p) => p.slug === slug);
}
