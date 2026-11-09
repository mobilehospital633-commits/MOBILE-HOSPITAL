import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker ONLY in production for Offline Desktop App support
// In development & AI Studio preview, unregister to avoid network floods and lagging
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Mobile Hospital Offline SW registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('SW registration bypassed:', err);
        });
    });
  } else {
    // Unregister any active service worker during development/preview to keep dev server fast
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister().catch(() => {});
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

