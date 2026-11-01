import { Hero } from '@/components/sections/Hero';
import { About } from '@/components/sections/About';
import { Skills } from '@/components/sections/Skills';
import { Projects } from '@/components/sections/Projects';
import { Experience } from '@/components/sections/Experience';
import { Education } from '@/components/sections/Education';
import { Certification } from '@/components/sections/Certification';
import { CVSection } from '@/components/sections/CVSection';
import { Contact } from '@/components/sections/Contact';

export function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Experience />
      <Education />
      <Certification />
      <CVSection />
      <Contact />
    </>
  );
}
