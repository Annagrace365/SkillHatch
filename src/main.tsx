import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import App from './App.tsx';
import IdeaDetailPage from './pages/IdeaDetailPage.tsx';
import SuccessPage from './pages/SuccessPage.tsx';
import CancelPage from './pages/CancelPage.tsx';
import './index.css';

// Component to handle navigation state
const AppWithState = () => {
  const location = useLocation();
  
  useEffect(() => {
    // If we're navigating to home with showResults state, trigger results view
    if (location.pathname === '/' && location.state?.showResults) {
      // This will be handled by the App component
      const event = new CustomEvent('showResults');
      window.dispatchEvent(event);
    }
  }, [location]);

  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppWithState />} />
        <Route path="/idea/:id" element={<IdeaDetailPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/cancel" element={<CancelPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);