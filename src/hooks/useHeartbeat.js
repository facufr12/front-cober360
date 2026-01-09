import { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { ENDPOINTS } from '../components/config';

/**
 * Hook personalizado para mantener la actividad del usuario mediante heartbeat automático
 * @param {Object} options - Configuración del heartbeat
 * @param {number} options.interval - Intervalo en milisegundos (por defecto 30 segundos)
 * @param {boolean} options.enabled - Si el heartbeat está habilitado (por defecto true)
 * @param {string} options.currentPage - Página actual del usuario
 */
const useHeartbeat = (options = {}) => {
    const {
        interval = 30000, // 30 segundos
        enabled = true,
        currentPage = window.location.pathname
    } = options;

    const intervalRef = useRef(null);
    const lastHeartbeatRef = useRef(null);

    // Función para enviar heartbeat
    const sendHeartbeat = useCallback(async (page = currentPage, action = 'heartbeat') => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('🔒 No hay token, saltando heartbeat');
                return false;
            }

            const now = Date.now();
            // Evitar heartbeats excesivos (mínimo 25 segundos entre heartbeats)
            if (lastHeartbeatRef.current && (now - lastHeartbeatRef.current) < 25000) {
                return false;
            }

            const response = await axios.post(
                `${ENDPOINTS.ADMIN}/users/heartbeat`,
                {
                    page,
                    action,
                    timestamp: new Date().toISOString()
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000 // 5 segundos de timeout
                }
            );

            if (response.data.success) {
                lastHeartbeatRef.current = now;
                console.log(`💓 Heartbeat enviado exitosamente desde ${page}`, {
                    timestamp: response.data.data?.timestamp,
                    action
                });
                return true;
            }

            return false;
        } catch (error) {
            // Solo loggear errores importantes, no de red temporales
            if (error.response?.status === 401) {
                console.log('🔒 Token inválido en heartbeat, necesita relogin');
                // Opcional: Disparar evento de logout
                localStorage.removeItem('token');
                window.location.href = '/login';
            } else if (error.code !== 'ECONNABORTED' && error.code !== 'NETWORK_ERROR') {
                console.warn('⚠️ Error en heartbeat:', error.message);
            }
            return false;
        }
    }, [currentPage]);

    // Función para iniciar el heartbeat automático
    const startHeartbeat = useCallback(() => {
        if (!enabled) {
            console.log('📴 Heartbeat deshabilitado');
            return;
        }

        // Limpiar intervalo anterior si existe
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        console.log(`💗 Iniciando heartbeat automático cada ${interval/1000} segundos para ${currentPage}`);

        // Enviar heartbeat inicial inmediatamente
        sendHeartbeat(currentPage, 'page_load');

        // Configurar heartbeat periódico
        intervalRef.current = setInterval(() => {
            sendHeartbeat(currentPage, 'automatic');
        }, interval);
    }, [enabled, interval, currentPage, sendHeartbeat]);

    // Función para detener el heartbeat
    const stopHeartbeat = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            console.log('🛑 Heartbeat detenido');
        }
    }, []);

    // Función para heartbeat manual
    const manualHeartbeat = useCallback((action = 'manual') => {
        return sendHeartbeat(currentPage, action);
    }, [currentPage, sendHeartbeat]);

    // Effect para manejar el ciclo de vida del heartbeat
    useEffect(() => {
        const token = localStorage.getItem('token');
        
        if (enabled && token) {
            startHeartbeat();
        }

        // Cleanup al desmontar o cambiar dependencias
        return () => {
            stopHeartbeat();
        };
    }, [enabled, startHeartbeat, stopHeartbeat]);

    // Effect para detectar cambios de página
    useEffect(() => {
        if (enabled) {
            // Reiniciar heartbeat cuando cambie la página
            startHeartbeat();
        }
    }, [currentPage, enabled, startHeartbeat]);

    // Detectar eventos de actividad del usuario
    useEffect(() => {
        if (!enabled) return;

        const activityEvents = ['click', 'keydown', 'scroll', 'mousemove'];
        let activityTimeout = null;

        const handleActivity = () => {
            // Debounce para evitar heartbeats excesivos
            if (activityTimeout) {
                clearTimeout(activityTimeout);
            }

            activityTimeout = setTimeout(() => {
                sendHeartbeat(currentPage, 'user_activity');
            }, 60000); // Enviar heartbeat por actividad máximo cada minuto
        };

        // Agregar listeners de actividad
        activityEvents.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        // Cleanup
        return () => {
            if (activityTimeout) {
                clearTimeout(activityTimeout);
            }
            activityEvents.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
        };
    }, [enabled, currentPage, sendHeartbeat]);

    // Detectar visibilidad de la página
    useEffect(() => {
        if (!enabled) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.log('📱 Página oculta, pausando heartbeat');
                stopHeartbeat();
            } else {
                console.log('📱 Página visible, reanudando heartbeat');
                startHeartbeat();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [enabled, startHeartbeat, stopHeartbeat]);

    return {
        startHeartbeat,
        stopHeartbeat,
        manualHeartbeat,
        isActive: !!intervalRef.current
    };
};

export default useHeartbeat;