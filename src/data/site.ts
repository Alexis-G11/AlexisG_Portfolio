export const site = {
  name: 'Alexis Praise George',
  role: 'Data Scientist | Aspiring Full-Stack Developer',
  email: 'alexispraisegeorge@gmail.com',
  whatsapp: '+250 798 978 475',
  whatsappHref: 'https://wa.me/250798978475',
  cvPath: '/assets/apg-resume.pdf',
  cvDownloadName: 'Alexis-Praise-George-CV.pdf',
};

export const aboutText =
  'Computer Science student with a focus on Data Science and a growing foundation in full-stack web development, data analytics, and machine learning. Familiar with Python, React, SQL, HTML, CSS, Power BI, and Jupyter Notebook through academic projects, internship activities, and freelance work. Interested in applying technical and analytical skills to practical problems while continuing to grow through an internship or entry-level software development opportunity.';

export interface EducationItem {
  institution: string;
  award: string;
}

export const education: EducationItem[] = [
  {
    institution: 'Université Libre de Kigali',
    award: "Bachelor's degree in Computer Science, Data Science",
  },
  {
    institution: 'Alexander B. Cummings Model Science and Technology School',
    award: 'High School Diploma, Grade 12 graduate, GPA 3.2',
  },
];

export const certification = {
  title: 'IoTHub Certificate',
  detail: 'Data Analytics, Internet of Things (IoT), and Software Development.',
};

export interface ExperienceItem {
  role: string;
  type: string;
  description: string;
  areas: string[];
}

export const experience: {
  heading: string;
  items: ExperienceItem[];
} = {
  heading: 'Experience',
  items: [
    {
      role: 'Data Analytics Intern',
      type: 'Internship',
      description:
        'Completed an internship focused on data analytics, working with Power BI to build interactive dashboards, transform raw data into actionable insights, and support data-driven decision-making across business scenarios.',
      areas: ['Data Analytics', 'Power BI', 'Data Visualization'],
    },
    {
      role: 'Frontend Developer — Digital Stop-Watch App',
      type: 'Project',
      description:
        'Built a simple Digital Stop-Watch application with a clean frontend UI using React. Implemented some functionalities with responsive design and component-based architecture.',
      areas: ['Web Development', 'React', 'Frontend UI'],
    },
  ],
};

export const navLinks = [
  { label: 'About', href: '/#about' },
  { label: 'Skills', href: '/#skills' },
  { label: 'Projects', href: '/#projects' },
  { label: 'Experience', href: '/#experience' },
  { label: 'Education', href: '/#education' },
  { label: 'Contact', href: '/#contact' },
];
