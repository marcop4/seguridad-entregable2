import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './index.css';

// Intercept fetch to automatically append our authentication headers for guarded endpoints
const originalFetch = window.fetch;
Object.defineProperty(window, 'fetch', {
  configurable: true,
  enumerable: true,
  writable: true,
  value: async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    if (url.startsWith('/api/')) {
      init = init || {};
      init.headers = {
        ...init.headers,
        'bypass-tunnel-reminder': 'true',
        'ngrok-skip-browser-warning': 'true'
      };
      if (!url.startsWith('/api/auth/')) {
        init.headers = {
          ...init.headers,
          'X-Session-ID': localStorage.getItem('secure_auth_session_id') || ''
        };
      }
    }
    
    return originalFetch(input, init);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "AUN_NO_CONFIGURADO"}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);
