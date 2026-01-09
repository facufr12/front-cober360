import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import App from './App';

// ✅ IMPORTAR: Estilos principales (antes que otros imports)
import './assets/Style/estilos.scss';
import './assets/Style/responsive-1366.css';

// 🔐 reCAPTCHA v3 Site Key (desde variables de entorno de Vite)
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (!RECAPTCHA_SITE_KEY) {
  console.warn('⚠️ VITE_RECAPTCHA_SITE_KEY no está definido en el .env del frontend');
}

// ✅ PWA: Registrar Service Worker con manejo mejorado
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    console.log('🔧 DEBUG: Iniciando registro de Service Worker...');
    
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ SW registrado:', registration.scope);
        
        // Verificar actualizaciones del SW (sin recarga automática)
        registration.addEventListener('updatefound', () => {
          console.log('🔧 DEBUG: updatefound detectado');
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            console.log('🔧 DEBUG: SW state changed to:', newWorker.state);
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 Nueva versión disponible (se aplicará en la próxima carga)');
              
              // Solo notificar, sin recarga automática
              console.log('ℹ️ La actualización se aplicará automáticamente en la próxima visita');
              
              // Opcional: Mostrar notificación sutil al usuario
              // showUpdateNotification();
            }
          });
        });

        // Manejar mensajes del service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('📩 Mensaje del SW:', event.data);
          
          if (event.data.type === 'SW_ACTIVATED') {
            console.log('🚀 Service Worker activado');
          }
        });
      })
      .catch((error) => {
        console.log('❌ Error registrando SW:', error);
      });

    // Manejar visibilidad de la página (mejorado para móviles)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('� DEBUG: Página visible - verificando estado SW');
        
        // Verificar si el service worker sigue activo (sin forzar actualizaciones)
        if (navigator.serviceWorker.controller) {
          // Solo enviar mensaje informativo
          navigator.serviceWorker.controller.postMessage({
            type: 'PAGE_VISIBLE',
            timestamp: Date.now()
          });
        }
      } else {
        console.log('� DEBUG: Página oculta - pausa de actividad SW');
      }
    });
  });
}

// ✅ PWA: Manejar instalación
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('💾 PWA instalable detectada');
  e.preventDefault();
  deferredPrompt = e;
  
  // Mostrar botón de instalación personalizado si lo tienes
  // showInstallPromotion();
});

// ✅ PWA: Evento de instalación exitosa
window.addEventListener('appinstalled', (evt) => {
  console.log('🎉 PWA instalada exitosamente');
  deferredPrompt = null;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleReCaptchaProvider
      reCaptchaKey={RECAPTCHA_SITE_KEY}
      language="es"
      useRecaptchaNet={false}
      useEnterprise={false}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
      }}
    >
      <App />
    </GoogleReCaptchaProvider>
  </React.StrictMode>,
);
