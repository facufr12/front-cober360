import { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Button, Alert, ProgressBar } from 'react-bootstrap';
import { FaClock, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_URL } from '../config';
import '../../styles/SessionManager.css';

// ✅ IMPORTAR GESTOR GLOBAL DE SESIÓN EXPIRADA
import sessionExpiredManager from '../../utils/sessionExpiredManager';

const SessionManager = ({ children, onSessionExpired }) => {
    const [showWarning, setShowWarning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [logoutReason, setLogoutReason] = useState('');
    const [isInactive, setIsInactive] = useState(false);
    
    const inactivityTimerRef = useRef(null);
    const warningTimerRef = useRef(null);
    const activityListenerRef = useRef(null);
    const checkIntervalRef = useRef(null);
    const sessionExpiredShownRef = useRef(false);
    
    const WARNING_TIME = 5 * 60 * 1000; // 5 minutos en ms
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos en ms
    const CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutos
    const CLEANUP_INTERVAL = 60 * 1000; // 1 minuto para cleanup
    
    // ✅ REGISTRAR CALLBACK CON EL GESTOR GLOBAL
    useEffect(() => {
        sessionExpiredManager.registerCallback('SessionManager', (source) => {
            console.log(`🔄 SessionManager recibió notificación de sesión expirada desde: ${source}`);
            if (onSessionExpired) {
                onSessionExpired();
            }
        });
        
        return () => {
            sessionExpiredManager.unregisterCallback('SessionManager');
        };
    }, [onSessionExpired]);

    // ✅ Función para verificar estado de sesión
    const checkSessionStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('🚪 No hay token - usuario no autenticado');
                return;
            }

            const response = await axios.get(`${API_URL}/auth/session-status`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const { active, timeRemaining, shouldWarn } = response.data;

            if (!active) {
                // ✅ Usar gestor global para evitar múltiples modales
                handleSessionExpired('SessionManager - Status Check');
                return;
            }

            // Mostrar advertencia si quedan 5 minutos o menos
            if (shouldWarn && timeRemaining <= 5) {
                setTimeLeft(timeRemaining);
                setShowWarning(true);
            } else {
                setShowWarning(false);
            }

        } catch (error) {
            console.error('❌ Error verificando estado de sesión:', error);
            
            if (error.response?.status === 401 || error.response?.status === 403) {
                handleSessionExpired('SessionManager - Error 401/403');
            }
        }
    }, []);

    // ✅ Manejar sesión expirada con gestor global
    const handleSessionExpired = useCallback((source = 'SessionManager') => {
        const shouldShow = sessionExpiredManager.handleExpired(source);
        
        if (shouldShow) {
            Swal.fire({
                icon: 'warning',
                title: 'Sesión expirada',
                text: 'Tu sesión ha finalizado. Por favor, inicia sesión nuevamente.',
                confirmButtonText: 'Ir al login',
                allowOutsideClick: false,
                allowEscapeKey: false,
                customClass: {
                    popup: 'session-expired-modal'
                },
                didOpen: () => {
                    console.log(`✅ Modal de sesión expirada abierto (${source})`);
                },
                didClose: () => {
                    console.log(`✅ Modal de sesión expirada cerrado (${source})`);
                }
            }).then(() => {
                if (onSessionExpired) {
                    onSessionExpired();
                }
            });
        }
    }, [onSessionExpired]);

    // ✅ Renovar sesión
    const renewSession = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.post(`${API_URL}/auth/renew-session`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.newToken) {
                localStorage.setItem('token', response.data.newToken);
                setShowWarning(false);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Sesión renovada',
                    text: 'La sesión se renovará por 2 horas más',
                    timer: 2000,
                    showConfirmButton: false
                });
            }

        } catch (error) {
            console.error('❌ Error renovando sesión:', error);
            handleSessionExpired('SessionManager - Renewal Error');
        }
    }, [handleSessionExpired]);

    // ✅ Inicializar verificaciones de sesión
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Verificación inicial con delay
        const initialTimeout = setTimeout(() => {
            checkSessionStatus();
        }, 5000);

        // Verificaciones periódicas cada 10 minutos
        checkIntervalRef.current = setInterval(() => {
            checkSessionStatus();
        }, CHECK_INTERVAL);

        return () => {
            clearTimeout(initialTimeout);
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
        };
    }, [checkSessionStatus]);

    // ✅ Cleanup al desmontar
    useEffect(() => {
        return () => {
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
            if (warningTimerRef.current) {
                clearTimeout(warningTimerRef.current);
            }
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
        };
    }, []);

    return (
        <>
            {children}
            
            {/* Modal de advertencia de sesión */}
            <Modal 
                show={showWarning} 
                backdrop="static" 
                keyboard={false}
                className="session-warning-modal"
                centered
            >
                <Modal.Header className="bg-warning text-dark">
                    <Modal.Title>
                        <FaClock className="me-2" />
                        Sesión por expirar
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    <Alert variant="warning" className="mb-3">
                        <FaExclamationTriangle className="me-2" />
                        Tu sesión expirará en <strong>{timeLeft} minutos</strong>
                    </Alert>
                    
                    <ProgressBar 
                        now={(timeLeft / 5) * 100} 
                        variant={timeLeft <= 2 ? 'danger' : 'warning'}
                        className="mb-3"
                    />
                    
                    <p>¿Deseas renovar tu sesión?</p>
                </Modal.Body>
                <Modal.Footer className="justify-content-center">
                    <Button 
                        variant="success" 
                        onClick={renewSession}
                        className="me-2"
                    >
                        <FaClock className="me-1" />
                        Renovar sesión
                    </Button>
                    <Button 
                        variant="secondary" 
                        onClick={() => handleSessionExpired('SessionManager - Manual Logout')}
                    >
                        Cerrar sesión
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Indicador de desarrollo */}
            {process.env.NODE_ENV === 'development' && (
                <div className="session-dev-indicator">
                    SessionManager: {showWarning ? 'Warning' : 'Active'}
                </div>
            )}
        </>
    );
};

export default SessionManager;
