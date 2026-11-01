import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { ProjectCaseStudy } from '@/pages/ProjectCaseStudy';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { useHashScroll } from '@/hooks/useHashScroll';

function ScrollManager() {
  useHashScroll();
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollManager />
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects/:slug" element={<ProjectCaseStudy />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
