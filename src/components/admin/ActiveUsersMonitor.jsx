import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Badge, Table, Button, Spinner, Alert, Row, Col, Form } from 'react-bootstrap';
import { 
  FaUsers, FaEye, FaWifi, FaSync, FaClock, FaUserCheck,
  FaCircle, FaChartBar, FaSignal, FaTimes, FaExclamationTriangle, FaHeart
} from 'react-icons/fa';
import { io } from 'socket.io-client';
import { ENDPOINTS } from '../config';
import useHeartbeat from '../../hooks/useHeartbeat';

const ActiveUsersMonitor = () => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeframe, setTimeframe] = useState(5);
  const [connectedAdmins, setConnectedAdmins] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const socketRef = useRef(null);
  const fetchingStats = useRef(false);
  const lastRefreshTime = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const isComponentMounted = useRef(true);

  // Configuraciones optimizadas después de corregir nginx WebSocket
  const MAX_RECONNECT_ATTEMPTS = 3; // Reducido porque ahora WebSocket funciona
  const RECONNECT_INTERVAL = 3000; // 3 segundos - más rápido
  const FETCH_THROTTLE_TIME = 5000; // Reducido a 5 segundos
  const MANUAL_REFRESH_COOLDOWN = 3000; // Reducido a 3 segundos

  // Hook de heartbeat para mantener esta sesión activa
  const { manualHeartbeat, isActive: heartbeatActive } = useHeartbeat({
    interval: 30000, // 30 segundos
    enabled: true,
    currentPage: '/admin/usuarios/activos'
  });

  // ✅ MEJORAR: Función de validación de respuesta
  const isValidResponse = (response) => {
    const contentType = response.headers.get('content-type');
    return contentType && contentType.includes('application/json');
  };

  // ✅ MEJORAR: Función para obtener datos de forma manual con mejor manejo de errores
  const fetchActiveUsersManual = useCallback(async () => {
    // Throttling optimizado
    const now = Date.now();
    if (now - lastRefreshTime.current < FETCH_THROTTLE_TIME) {
      console.log('⏳ Throttling fetch - esperando...');
      return;
    }
    lastRefreshTime.current = now;

    if (fetchingStats.current || !isComponentMounted.current) {
      console.log('⏳ Fetch ya en progreso o componente desmontado');
      return;
    }

    fetchingStats.current = true;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      console.log('🔄 Fetching usuarios activos...');
      const response = await fetch(`${ENDPOINTS.ADMIN}/users/active?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortController ? new AbortController().signal : undefined
      });

      // Verificar si la respuesta es válida antes de intentar parsear JSON
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada - por favor, inicia sesión nuevamente');
        }
        if (response.status === 429) {
          throw new Error('Demasiadas solicitudes - esperando...');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      if (!isValidResponse(response)) {
        console.error('❌ Respuesta no es JSON válido');
        throw new Error('Respuesta del servidor no es válida - posible problema de autenticación');
      }

      const data = await response.json();
      
      if (isComponentMounted.current && data.success) {
        setActiveUsers(data.data.active_users || []);
        setLastUpdated(data.data.last_updated);
        setError(null);
        console.log('✅ Usuarios activos obtenidos:', data.data.active_users.length);
      }
    } catch (error) {
      console.error('❌ Error en fetchActiveUsersManual:', error);
      if (isComponentMounted.current) {
        setError(error.message);
        // Si hay error de autenticación, parar intentos automáticos
        if (error.message.includes('Sesión expirada') || error.message.includes('autenticación')) {
          setAutoRefresh(false);
        }
      }
    } finally {
      fetchingStats.current = false;
    }
  }, [timeframe]);

  // ✅ MEJORAR: Función para obtener estadísticas con throttling y mejor manejo de errores
  const fetchStatistics = useCallback(async () => {
    if (fetchingStats.current || !isComponentMounted.current) {
      console.log('⏳ Fetch statistics saltado - ya en progreso o componente desmontado');
      return;
    }
    
    fetchingStats.current = true;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      console.log('📊 Fetching estadísticas...');
      const response = await fetch(`${ENDPOINTS.BASE_URL}/admin/users/activity-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortController ? new AbortController().signal : undefined
      });

      if (response.ok && isValidResponse(response)) {
        const data = await response.json();
        if (isComponentMounted.current) {
          setStatistics(data);
          setLastUpdated(new Date());
          console.log('✅ Estadísticas obtenidas');
        }
      } else if (response.status === 429) {
        console.log('⚠️ Rate limit alcanzado para estadísticas');
        // No mostrar error agresivo para rate limiting
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
      // Solo establecer error si no es rate limiting
      if (!error.message.includes('429') && isComponentMounted.current) {
        setError(`Error al obtener estadísticas: ${error.message}`);
      }
    } finally {
      setTimeout(() => {
        fetchingStats.current = false;
      }, 2000); // Delay para evitar llamadas muy rápidas
    }
  }, []);

  // ✅ NUEVO: Función de reconexión inteligente
  const attemptReconnection = useCallback(() => {
    if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS || !isComponentMounted.current) {
      console.log('❌ Máximo de intentos de reconexión alcanzado');
      setReconnecting(false);
      return;
    }

    setReconnecting(true);
    setConnectionAttempts(prev => prev + 1);
    
    console.log(`🔄 Intento de reconexión ${connectionAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}`);
    
    // Limpiar socket anterior
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Intentar reconexión después de un delay
    reconnectTimeoutRef.current = setTimeout(() => {
      if (isComponentMounted.current) {
        initializeWebSocket();
      }
    }, RECONNECT_INTERVAL * (connectionAttempts + 1)); // Backoff exponencial
  }, [connectionAttempts]);

  // ✅ MEJORAR: Inicialización de WebSocket con configuración optimizada (nginx corregido)
  const initializeWebSocket = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Token de autenticación no encontrado');
      setLoading(false);
      return;
    }

    // Configurar WebSocket con configuración optimizada para nginx corregido
    const socket = io(`${ENDPOINTS.BASE_URL}/admin`, {
      auth: { token },
      transports: ['websocket', 'polling'], // Priorizar WebSocket
      forceNew: true,
      timeout: 10000, // Reducido porque nginx está corregido
      reconnection: false, // Manejaremos la reconexión manualmente
      maxHttpBufferSize: 1e6, // 1MB
      upgrade: true,
      rememberUpgrade: true
    });

    socketRef.current = socket;

    // Eventos de conexión
    socket.on('connect', () => {
      console.log('✅ Conectado al monitor de usuarios activos');
      if (isComponentMounted.current) {
        setConnected(true);
        setError(null);
        setLoading(false);
        setReconnecting(false);
        setConnectionAttempts(0);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Desconectado del monitor de usuarios activos:', reason);
      if (isComponentMounted.current) {
        setConnected(false);
        
        // Solo intentar reconectar si no fue una desconexión intencional
        if (reason !== 'io client disconnect' && connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
          attemptReconnection();
        }
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión WebSocket:', error.message);
      if (isComponentMounted.current) {
        setConnected(false);
        setLoading(false);
        
        // Error menos agresivo ya que nginx está corregido
        setError(`Conexión WebSocket interrumpida: ${error.message}`);
        
        // Fallback más rápido a fetch manual
        setTimeout(() => {
          if (!connected && isComponentMounted.current) {
            console.log('🔄 Fallback a fetch manual...');
            fetchActiveUsersManual();
            setTimeout(() => fetchStatistics(), 2000); // Reducido delay
          }
        }, 1000); // Más rápido

        // Intentar reconectar más agresivamente ya que debería funcionar
        if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
          attemptReconnection();
        }
      }
    });

    // Recibir actualizaciones de usuarios activos
    socket.on('active_users_update', (data) => {
      console.log('📊 Actualización recibida:', data);
      if (isComponentMounted.current) {
        setActiveUsers(data.active_users || []);
        setStatistics(data.statistics);
        setLastUpdated(data.last_updated);
        setConnectedAdmins(data.connected_admins || 0);
        setError(null);
      }
    });

    // Manejar errores del servidor
    socket.on('error', (error) => {
      console.error('❌ Error del servidor:', error);
      if (isComponentMounted.current) {
        setError(error.message || 'Error del servidor');
      }
    });

    return socket;
  }, [attemptReconnection, connected, connectionAttempts, fetchActiveUsersManual, fetchStatistics]);

  // Inicializar WebSocket al montar el componente
  useEffect(() => {
    isComponentMounted.current = true;
    initializeWebSocket();

    // Cleanup al desmontar
    return () => {
      isComponentMounted.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Cambiar timeframe
  useEffect(() => {
    if (connected && socketRef.current && isComponentMounted.current) {
      socketRef.current.emit('change_timeframe', timeframe);
    } else if (!connected && isComponentMounted.current) {
      // Si no hay WebSocket, usar fetch manual con throttling
      const timeoutId = setTimeout(() => {
        fetchActiveUsersManual();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [timeframe, connected, fetchActiveUsersManual]);

  // ✅ MEJORAR: Auto-refresh optimizado con mejor control
  useEffect(() => {
    if (connected || !autoRefresh || !isComponentMounted.current) return;

    console.log('🔄 Configurando auto-refresh (sin WebSocket)');
    
    const interval = setInterval(() => {
      if (!fetchingStats.current && isComponentMounted.current) {
        console.log('🔄 Auto-refresh: obteniendo usuarios activos...');
        fetchActiveUsersManual();
        
        // Retrasar estadísticas para evitar llamadas simultáneas
        setTimeout(() => {
          if (!fetchingStats.current && isComponentMounted.current) {
            console.log('🔄 Auto-refresh: obteniendo estadísticas...');
            fetchStatistics();
          }
        }, 5000); // 5 segundos de delay
      }
    }, 60000); // Reducir frecuencia a 60 segundos

    return () => clearInterval(interval);
  }, [connected, autoRefresh, fetchActiveUsersManual, fetchStatistics]);

  // ✅ MEJORAR: Función para refrescar manualmente con throttling estricto
  const handleManualRefresh = useCallback(async () => {
    const now = Date.now();
    
    // Throttling estricto para refreshes manuales
    if (now - lastRefreshTime.current < MANUAL_REFRESH_COOLDOWN) {
      const remainingTime = Math.ceil((MANUAL_REFRESH_COOLDOWN - (now - lastRefreshTime.current)) / 1000);
      setError(`Por favor espera ${remainingTime} segundos antes del próximo refresh`);
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    lastRefreshTime.current = now;
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Refresh manual iniciado...');
      
      // Si hay WebSocket conectado, usarlo
      if (connected && socketRef.current) {
        socketRef.current.emit('request_update');
        setLoading(false);
        return;
      }
      
      // Fallback a fetch manual
      await fetchActiveUsersManual();
      
      // Esperar antes de la segunda llamada
      setTimeout(async () => {
        if (!fetchingStats.current && isComponentMounted.current) {
          await fetchStatistics();
        }
        setLoading(false);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error en refresh manual:', error);
      if (isComponentMounted.current) {
        setError(`Error en refresh: ${error.message}`);
        setLoading(false);
      }
    }
  }, [connected, fetchActiveUsersManual, fetchStatistics]);

  // Formatear tiempo desde última actividad
  const formatTimeSinceActivity = (minutes) => {
    if (isNaN(minutes) || minutes < 0) return 'Sin datos';
    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours < 24) return `Hace ${hours}h ${remainingMinutes}min`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} días`;
  };

  // ✅ MEJORAR: Badge de rol con estilo outline 
  const getRoleBadge = (role, roleName, roleColor) => {
    return <Badge className={`badge-outline-${roleColor}`}>{roleName}</Badge>;
  };

  // ✅ NUEVO: Badge de tiempo con estilo outline
  const getTiempoBadge = (minutesAgo) => {
    const colorClass = isNaN(minutesAgo) ? 'secondary' :
      minutesAgo <= 2 ? 'success' : 
      minutesAgo <= 5 ? 'warning' : 'secondary';
    
    return (
      <Badge className={`badge-outline-${colorClass}`}>
        {formatTimeSinceActivity(minutesAgo)}
      </Badge>
    );
  };

  // ✅ NUEVO: Badge de estado con estilo outline
  const getEstadoBadge = (variant, children) => {
    return <Badge className={`badge-outline-${variant}`}>{children}</Badge>;
  };

  // Obtener indicador de estado de conexión
  const getStatusIndicator = (minutesAgo) => {
    if (isNaN(minutesAgo) || minutesAgo < 0) return <FaCircle className="text-secondary me-1" title="Sin datos" />;
    if (minutesAgo <= 2) return <FaCircle className="text-success me-1" title="Online" />;
    if (minutesAgo <= 5) return <FaCircle className="text-warning me-1" title="Activo recientemente" />;
    return <FaCircle className="text-secondary me-1" title="Inactivo" />;
  };

  if (loading && activeUsers.length === 0) {
    return (
      <Card className="shadow-sm card-no-border loading-card-improved">
        <Card.Body className="text-center py-5">
          <div className="mb-4 glow-effect rounded-circle d-inline-flex align-items-center justify-content-center" 
               style={{ width: '80px', height: '80px', background: 'rgba(139, 126, 200, 0.1)' }}>
            <Spinner 
              animation="border" 
              variant="primary" 
              style={{ width: '3rem', height: '3rem' }}
            />
          </div>
          <h4 className="loading-text-improved mb-3">
            <FaWifi className="me-2" />
            Conectando al Monitor de Usuarios
          </h4>
          <p className="text-muted mb-3 fs-6">
            Estableciendo conexión en tiempo real con el sistema de monitoreo...
          </p>
          <div className="d-flex justify-content-center align-items-center gap-3">
            <div className="d-flex align-items-center">
              <FaHeart className="text-danger me-2" style={{animation: 'pulse 1.5s infinite'}} />
              <small className="text-secondary">Heartbeat activo</small>
            </div>
            <div className="d-flex align-items-center">
              <FaUsers className="text-info me-2" />
              <small className="text-secondary">WebSocket conectando...</small>
            </div>
          </div>
          <div className="mt-4">
            <div className="progress" style={{ height: '4px', background: 'rgba(139, 126, 200, 0.2)' }}>
              <div 
                className="progress-bar bg-primary" 
                role="progressbar" 
                style={{ width: '100%', animation: 'progress-loading 2s ease-in-out infinite' }}
              ></div>
            </div>
            <small className="text-muted mt-2 d-block">Configurando monitoreo en tiempo real</small>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      {/* Header con controles */}
      <Card className="shadow-sm mb-4 card-no-border">
        <Card.Header className="text-white">
          <Row className="align-items-center">
            <Col md={6}>
              <h5 className="mb-0">
                <FaUsers className="me-2" />
                Monitor de Usuarios Activos
                {connected ? (
                  <FaWifi className="ms-2 text-success" title="Conectado en tiempo real" />
                ) : (
                  <FaExclamationTriangle className="ms-2 text-warning" title="Desconectado - Modo manual" />
                )}
                {heartbeatActive && (
                  <FaHeart className="ms-2 text-light" title="Heartbeat activo" style={{animation: 'pulse 1.5s infinite'}} />
                )}
              </h5>
            </Col>
            <Col md={6} className="text-end">
              <div className="d-flex align-items-center justify-content-end gap-3">
                <Form.Select 
                  size="sm" 
                  value={timeframe} 
                  onChange={(e) => setTimeframe(parseInt(e.target.value))}
                  style={{ width: 'auto' }}
                >
                  <option value={1}>Último minuto</option>
                  <option value={5}>Últimos 5 min</option>
                  <option value={15}>Últimos 15 min</option>
                  <option value={30}>Últimos 30 min</option>
                  <option value={60}>Última hora</option>
                </Form.Select>
                
                <Button 
                  size="sm" 
                  variant="outline-light" 
                  onClick={handleManualRefresh}
                  disabled={loading}
                >
                  {loading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <FaSync />
                  )}
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body>
                    {/* Estadísticas resumen */}
          {statistics && (
            <Row className="mb-3">
              <Col md={3}>
                <div className="text-center p-3 bg-white border-2 border-success rounded metric-card-outline">
                  <div className="h4 mb-1 text-success fw-bold">{activeUsers.length}</div>
                  <small className="text-success fw-semibold">Activos ahora</small>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 bg-white border-2 border-info rounded metric-card-outline">
                  <div className="h4 mb-1 text-info fw-bold">{statistics.summary.active_today}</div>
                  <small className="text-info fw-semibold">Activos hoy</small>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 bg-white border-2 border-warning rounded metric-card-outline">
                  <div className="h4 mb-1 text-warning fw-bold">{statistics.summary.enabled_users}</div>
                  <small className="text-warning fw-semibold">Usuarios habilitados</small>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 bg-white border-2 border-secondary rounded metric-card-outline">
                  <div className="h4 mb-1 text-secondary fw-bold">{connectedAdmins}</div>
                  <small className="text-secondary fw-semibold">Admins conectados</small>
                </div>
              </Col>
            </Row>
          )}

          {/* Estado de conexión */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <span className="me-2">Estado:</span>
              {connected ? (
                getEstadoBadge("success", (
                  <>
                    <FaSignal className="me-1" />
                    Tiempo Real
                  </>
                ))
              ) : reconnecting ? (
                getEstadoBadge("warning", (
                  <>
                    <FaSync className="me-1 fa-spin" />
                    Reconectando... ({connectionAttempts}/{MAX_RECONNECT_ATTEMPTS})
                  </>
                ))
              ) : (
                getEstadoBadge("warning", (
                  <>
                    <FaClock className="me-1" />
                    Modo Manual
                  </>
                ))
              )}
            </div>
            
            {lastUpdated && (
              <small className="text-muted">
                Última actualización: {new Date(lastUpdated).toLocaleTimeString()}
              </small>
            )}
          </div>

          {/* Mostrar errores con mejores mensajes */}
          {error && (
            <Alert variant={error.includes('espera') ? 'info' : 'warning'} className="mb-3">
              <FaExclamationTriangle className="me-2" />
              {error}
              {!connected && !error.includes('espera') && (
                <div className="mt-2">
                  <small>
                    {reconnecting 
                      ? `Reintentando conexión automáticamente... (${connectionAttempts}/${MAX_RECONNECT_ATTEMPTS})`
                      : connectionAttempts >= MAX_RECONNECT_ATTEMPTS 
                        ? 'Se alcanzó el máximo de intentos. Usando modo manual.'
                        : 'Usando modo de actualización manual.'
                    }
                  </small>
                  {!reconnecting && connectionAttempts < MAX_RECONNECT_ATTEMPTS && (
                    <div className="mt-2">
                      <Button 
                        size="sm" 
                        variant="outline-primary"
                        onClick={() => {
                          setConnectionAttempts(0);
                          attemptReconnection();
                        }}
                      >
                        <FaSync className="me-1" />
                        Reintentar Conexión
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Tabla de usuarios activos */}
      <Card className="shadow-sm card-no-border">
        <Card.Header>
          <h6 className="mb-0">
            <FaUserCheck className="me-2" />
            Usuarios Activos (últimos {timeframe} minutos)
          </h6>
        </Card.Header>
        
        <Card.Body className="p-0">
          {activeUsers.length === 0 ? (
            <div className="text-center py-4">
              <FaUsers className="text-muted mb-3" size={48} />
              <p className="text-muted mb-0">
                No hay usuarios activos en los últimos {timeframe} minutos
              </p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Estado</th>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Última Actividad</th>
                  <th>Tiempo</th>
                </tr>
              </thead>
              <tbody>
                {activeUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      {getStatusIndicator(user.minutes_since_activity)}
                    </td>
                    <td>
                      <strong>{user.first_name} {user.last_name}</strong>
                      <div className="small text-muted">ID: {user.id}</div>
                    </td>
                    <td>{user.email}</td>
                    <td>{getRoleBadge(user.role, user.role_name, user.role_color)}</td>
                    <td>
                      <div>{user.last_activity_time || user.last_login_time || 'Sin datos'}</div>
                      <small className="text-muted">{user.last_activity_date || user.last_login_date || 'Sin fecha'}</small>
                    </td>
                    <td>
                      {getTiempoBadge(user.minutes_since_activity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ActiveUsersMonitor;