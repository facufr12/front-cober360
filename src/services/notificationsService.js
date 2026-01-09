import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import axios from 'axios';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let messaging = null;
let notificationCallbacks = {};

/**
 * Inicializar Firebase y solicitar permisos de notificación
 */
export const initializeNotifications = async () => {
  try {
    // Validar que el navegador soporta notificaciones
    if (!('Notification' in window)) {
      console.warn('⚠️ Este navegador no soporta notificaciones');
      return false;
    }

    // Registrar Service Worker primero
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        console.log('✅ Service Worker registrado:', registration);
      } catch (error) {
        console.warn('⚠️ Error registrando Service Worker:', error);
      }
    }

    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    console.log('✅ Firebase Messaging inicializado');

    // Verificar si ya tenemos permiso
    if (Notification.permission === 'granted') {
      console.log('✅ Permiso de notificaciones ya otorgado');
      await registrarTokenFCM();
      return true;
    }

    // Solicitar permiso si aún no se ha pedido
    if (Notification.permission !== 'denied') {
      console.log('🔔 Solicitando permiso de notificaciones...');
      const permission = await Notification.requestPermission();
      console.log('📍 Respuesta de permisos:', permission);
      
      if (permission === 'granted') {
        console.log('✅ Permiso de notificaciones otorgado por el usuario');
        // Pequeño delay para asegurar que el permiso se registre
        await new Promise(resolve => setTimeout(resolve, 500));
        await registrarTokenFCM();
        return true;
      }
    }

    console.warn('⚠️ Permiso de notificaciones denegado');
    return false;
  } catch (error) {
    console.error('❌ Error inicializando notificaciones:', error);
    return false;
  }
};

/**
 * Registrar token FCM en el backend
 */
export const registrarTokenFCM = async () => {
  try {
    if (!messaging) {
      console.warn('⚠️ Firebase messaging no inicializado');
      return null;
    }

    // Obtener VAPID key del .env
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('⚠️ VAPID key no configurada');
      return null;
    }

    // Obtener token FCM
    const token = await getToken(messaging, { vapidKey });

    if (!token) {
      console.warn('⚠️ No se pudo obtener token FCM');
      return null;
    }

    console.log('🔑 Token FCM obtenido:', token.substring(0, 20) + '...');

    // Guardar token en localStorage para recuperarlo si es necesario
    localStorage.setItem('fcm_token', token);

    // Enviar token al backend
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/fcm/register`,
      {
        token,
        deviceInfo: {
          device: navigator.userAgent,
          platform: navigator.platform,
          appVersion: navigator.appVersion
        }
      }
    );

    console.log('✅ Token registrado en backend:', response.data.message);
    return token;
  } catch (error) {
    console.error('❌ Error registrando token FCM:', error);
    return null;
  }
};

/**
 * Desregistrar token FCM (logout)
 */
export const desregistrarTokenFCM = async () => {
  try {
    const token = localStorage.getItem('fcm_token');
    
    if (!token) {
      console.warn('⚠️ No hay token FCM guardado');
      return;
    }

    await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/fcm/unregister`,
      { token }
    );

    localStorage.removeItem('fcm_token');
    console.log('✅ Token FCM desregistrado');
  } catch (error) {
    console.error('❌ Error desregistrando token FCM:', error);
  }
};

/**
 * Configurar listener para notificaciones en foreground
 * @param {function} callback - Función a ejecutar cuando llega notificación
 */
export const setupForegroundNotifications = (callback) => {
  try {
    if (!messaging) {
      console.warn('⚠️ Firebase messaging no inicializado');
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('📬 Notificación recibida en foreground:', payload);

      // Guardar datos de la notificación
      const notification = {
        title: payload.notification?.title,
        body: payload.notification?.body,
        data: payload.data || {},
        timestamp: new Date()
      };

      // Ejecutar callback
      if (callback) {
        callback(notification);
      }

      // Mostrar notificación del navegador si está en foreground
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          tag: notification.data.tipo || 'cober360',
          vibrate: [200, 100, 200]
        });
      }
    });

    console.log('✅ Listener de notificaciones en foreground configurado');
  } catch (error) {
    console.error('❌ Error configurando listener de notificaciones:', error);
  }
};

/**
 * Registrar callback para tipo de notificación específico
 * @param {string} tipo - Tipo de notificación (ej: 'prospecto_asignado', 'mensaje_whatsapp')
 * @param {function} callback
 */
export const onNotificationType = (tipo, callback) => {
  notificationCallbacks[tipo] = callback;
};

/**
 * Obtener tokens activos del usuario
 */
export const obtenerTokensActivos = async () => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/fcm/tokens`
    );
    return response.data.tokens;
  } catch (error) {
    console.error('❌ Error obteniendo tokens:', error);
    return [];
  }
};

/**
 * Enviar notificación de prueba
 */
export const enviarNotificacionPrueba = async () => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/fcm/test`
    );
    return response.data;
  } catch (error) {
    console.error('❌ Error enviando notificación de prueba:', error);
    throw error;
  }
};

export default {
  initializeNotifications,
  registrarTokenFCM,
  desregistrarTokenFCM,
  setupForegroundNotifications,
  onNotificationType,
  obtenerTokensActivos,
  enviarNotificacionPrueba
};
