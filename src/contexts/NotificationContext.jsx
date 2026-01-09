import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../components/config';

// 1. Crear el Contexto
const NotificationContext = createContext();

// 2. Crear un Hook personalizado para usar el contexto fácilmente
export const useNotifications = () => {
  return useContext(NotificationContext);
};

// 3. Crear el Proveedor del Contexto
export const NotificationProvider = ({ children }) => {
  const [whatsappUnread, setWhatsappUnread] = useState(0);
  const [otherNotifications, setOtherNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🔄 Función para cargar notificaciones de WhatsApp en segundo plano
  const loadWhatsappNotifications = useCallback(async (silent = false) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return; // No hay usuario autenticado

      if (!silent) setIsLoading(true);
      
      const response = await axios.get(`${API_URL}/chat/conversaciones`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50 }
      });

      if (response.data.success) {
        const conversaciones = response.data.data;
        const totalNoLeidos = conversaciones.reduce((sum, conv) => sum + (conv.mensajes_no_leidos || 0), 0);
        
        // Solo actualizar si hay cambios
        if (totalNoLeidos !== whatsappUnread) {
          console.log('🔔 Actualizando notificaciones WhatsApp:', totalNoLeidos);
          setWhatsappUnread(totalNoLeidos);
        }
      }
    } catch (error) {
      // Silenciar errores 401 (token expirado) para evitar spam
      if (!error.response || error.response.status !== 401) {
        console.error('❌ Error cargando notificaciones WhatsApp:', error);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [whatsappUnread]);

    // 🔄 Polling automático en segundo plano con intervalo inteligente
  useEffect(() => {
    let pollingInterval;
    
    const token = localStorage.getItem('token');
    if (token) {
      // Cargar notificaciones inmediatamente
      loadWhatsappNotifications(false);
      
      // 🎯 INTERVALO INTELIGENTE: Verificar si el usuario está en WhatsApp
      const getPollingInterval = () => {
        const currentPath = window.location.pathname;
        const isOnWhatsAppPage = currentPath.includes('/whatsapp') || currentPath.includes('/chat');
        
        // Si está en WhatsApp, usar polling más frecuente pero silencioso
        return isOnWhatsAppPage ? 15000 : 90000; // 15s en WhatsApp, 90s en otras páginas
      };
      
      const startPolling = () => {
        const interval = getPollingInterval();
        console.log(`🔔 Polling de notificaciones iniciado (cada ${interval/1000} segundos)`);
        
        pollingInterval = setInterval(() => {
          const currentPath = window.location.pathname;
          const isOnWhatsAppPage = currentPath.includes('/whatsapp') || currentPath.includes('/chat');
          loadWhatsappNotifications(isOnWhatsAppPage); // Silent si está en WhatsApp
        }, interval);
      };
      
      startPolling();
      
      // Restart polling cuando cambia la página
      const handleLocationChange = () => {
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        setTimeout(startPolling, 1000);
      };
      
      window.addEventListener('popstate', handleLocationChange);
      
      return () => {
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        window.removeEventListener('popstate', handleLocationChange);
        console.log('🛑 Polling de notificaciones detenido');
      };
    }
  }, []); // ✅ Dependencias vacías - el polling se inicia al cargar el componente

  // 🔄 Actualizar cuando la ventana recibe foco
  useEffect(() => {
    const handleFocus = () => {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('👁️ Ventana enfocada - actualizando notificaciones');
        loadWhatsappNotifications(false);
      }
    };

    // 🔄 También escuchar cambios de visibilidad de página
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const token = localStorage.getItem('token');
        if (token) {
          console.log('📱 Página visible - actualizando notificaciones');
          loadWhatsappNotifications(false);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadWhatsappNotifications]);

  // Función para actualizar los no leídos de WhatsApp (para uso manual)
  const updateWhatsappUnread = useCallback((count) => {
    setWhatsappUnread(count);
  }, []);

  // Función para forzar actualización manual
  const refreshNotifications = useCallback(() => {
    console.log('🔄 Actualización manual de notificaciones solicitada');
    loadWhatsappNotifications(false);
  }, [loadWhatsappNotifications]);

  // Función para añadir otras notificaciones (ej. prospecto asignado)
  const addNotification = useCallback((notification) => {
    setOtherNotifications(prev => [notification, ...prev]);
  }, []);

  // Función para limpiar notificaciones
  const clearNotifications = useCallback((type) => {
    if (type === 'whatsapp') {
      setWhatsappUnread(0);
    } else if (type === 'other') {
      setOtherNotifications([]);
    } else {
      setWhatsappUnread(0);
      setOtherNotifications([]);
    }
  }, []);

  const totalUnread = whatsappUnread + otherNotifications.length;

  const value = {
    whatsappUnread,
    otherNotifications,
    totalUnread,
    isLoading,
    updateWhatsappUnread,
    refreshNotifications,
    addNotification,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
