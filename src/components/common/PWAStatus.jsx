import React, { useState, useEffect } from 'react';

/**
 * Componente para mostrar el estado de la PWA (solo en desarrollo)
 * Útil para debugging en dispositivos móviles
 */
const PWAStatus = () => {
  const [swStatus, setSwStatus] = useState('checking');
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // Verificar estado del service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          setSwStatus('active');
          setLastUpdate(new Date().toLocaleTimeString());
        } else {
          setSwStatus('not-registered');
        }
      });

      // Escuchar mensajes del service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SW_ACTIVATED') {
          setSwStatus('active');
          setLastUpdate(new Date().toLocaleTimeString());
        }
      });
    } else {
      setSwStatus('not-supported');
    }

    // Verificar si la PWA está instalada
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Escuchar evento de instalación
    window.addEventListener('beforeinstallprompt', () => {
      setIsInstallable(true);
    });

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
    });

    // Detectar cambios de conectividad
    const updateOnlineStatus = () => {
      setLastUpdate(new Date().toLocaleTimeString());
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // ✅ TEMPORALMENTE DESHABILITADO para diagnosticar recargas automáticas
  // Solo mostrar en desarrollo o cuando hay parámetro debug
  const shouldShow = false; // process.env.NODE_ENV === 'development' || 
                    // new URLSearchParams(window.location.search).has('debug-pwa');

  if (!shouldShow) return null;

  return (
    <div 
      className="position-fixed bottom-0 start-0 m-3 p-2 bg-dark text-white rounded" 
      style={{ 
        fontSize: '0.75rem', 
        zIndex: 9999, 
        maxWidth: '250px',
        opacity: 0.8 
      }}
    >
      <div className="d-flex align-items-center gap-2 mb-1">
        <span className="fw-bold">PWA Status</span>
        <button 
          className="btn btn-sm btn-outline-light p-0 px-1"
          onClick={() => window.location.reload()}
          title="Recargar"
        >
          🔄
        </button>
      </div>
      
      <div className="small">
        <div className="d-flex justify-content-between">
          <span>SW:</span>
          <span className={`badge ${
            swStatus === 'active' ? 'bg-success' : 
            swStatus === 'checking' ? 'bg-warning' : 'bg-danger'
          }`}>
            {swStatus === 'active' ? '✓' : 
             swStatus === 'checking' ? '...' : '✗'}
          </span>
        </div>
        
        <div className="d-flex justify-content-between">
          <span>Conexión:</span>
          <span className={`badge ${navigator.onLine ? 'bg-success' : 'bg-danger'}`}>
            {navigator.onLine ? 'Online' : 'Offline'}
          </span>
        </div>
        
        <div className="d-flex justify-content-between">
          <span>PWA:</span>
          <span className={`badge ${
            isInstalled ? 'bg-success' : 
            isInstallable ? 'bg-warning' : 'bg-secondary'
          }`}>
            {isInstalled ? 'Instalada' : 
             isInstallable ? 'Instalable' : 'Web'}
          </span>
        </div>
        
        {lastUpdate && (
          <div className="text-muted mt-1" style={{ fontSize: '0.65rem' }}>
            Último: {lastUpdate}
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAStatus;
