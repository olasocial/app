import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { pwaManager } from './services/pwaManager';

// Initialize Service Worker and PWA lifecycle handlers early
pwaManager.init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
