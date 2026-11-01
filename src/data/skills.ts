export interface SkillSubGroup {
  label: string;
  skills: string[];
}

export interface SkillCategory {
  title: string;
  icon: string;
  subGroups: SkillSubGroup[];
}

export const skillCategories: SkillCategory[] = [
  {
    title: 'Programming',
    icon: 'Code2',
    subGroups: [
      {
        label: 'Core Languages',
        skills: ['Python'],
      },
      {
        label: 'Concepts & Fundamentals',
        skills: ['Data Structures & Algorithms', 'Object-Oriented Programming (OOP)'],
      },
      {
        label: 'Testing & Scripting',
        skills: ['Bash/Shell Scripting'],
      },
      {
        label: 'Version Control & Logic',
        skills: ['Git', 'Problem Solving', 'Debugging'],
      },
    ],
  },
  {
    title: 'Web Development',
    icon: 'Globe',
    subGroups: [
      {
        label: 'Markup & Styling',
        skills: ['HTML5', 'CSS'],
      },
      {
        label: 'Frontend Libraries & Frameworks',
        skills: ['JavaScript', 'React.js', 'Next.js'],
      },
      {
        label: 'Backend & APIs',
        skills: ['Node.js', 'Django'],
      },
      {
        label: 'Databases',
        skills: ['PostgreSQL', 'MongoDB', 'Supabase'],
      },
      {
        label: 'Tools & Deployment',
        skills: ['Git', 'GitHub', 'Vercel', 'Amazon Web Services'],
      },
    ],
  },
  {
    title: 'Data Science',
    icon: 'BarChart3',
    subGroups: [
      {
        label: 'Core Skills',
        skills: ['Data Analytics', 'Power BI', 'Jupyter Notebook', 'Machine Learning'],
      },
    ],
  },
  {
    title: 'Tools',
    icon: 'Wrench',
    subGroups: [
      {
        label: 'Development & Cloud',
        skills: ['Visual Studio Code','Git', 'GitHub', 'Google Colab', 'AWS', 'Vercel'],
      },
    ],
  },
  {
    title: 'Soft Skills',
    icon: 'MessageSquare',
    subGroups: [
      {
        label: 'Core Skills',
        skills: ['Communication', 'Problem-solving'],
      },
    ],
  },
];
