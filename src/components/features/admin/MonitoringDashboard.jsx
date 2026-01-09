import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Badge, Spinner, Button, ProgressBar } from 'react-bootstrap';
import { 
  FaServer, 
  FaDatabase, 
  FaNetworkWired, 
  FaMemory, 
  FaMicrochip, 
  FaHdd,
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaUsers,
  FaSync,
  FaEye
} from 'react-icons/fa';
import axios from 'axios';
import { LOCAL_API_URL, ENDPOINTS } from '../../config';

const MonitoringDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener métricas
  const fetchMetrics = async () => {
    try {
      console.log('🔄 Iniciando fetchMetrics...');
      setError(null);
      const response = await axios.get(`${ENDPOINTS.PERFORMANCE}/metrics`);
      
      console.log('📊 Respuesta recibida:', response.data);
      
      // Validar que la respuesta tenga la estructura esperada
      if (response.data && typeof response.data === 'object') {
        setMetrics(response.data);
        setLastUpdate(new Date());
        setLoading(false); // ✅ IMPORTANTE: Desactivar loading aquí
        console.log('✅ Métricas cargadas exitosamente');
      } else {
        throw new Error('Respuesta con formato inválido');
      }
    } catch (error) {
      console.error('❌ Error fetching metrics:', error);
      
      if (error.response) {
        // Error de respuesta del servidor
        setError(`Error del servidor: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        // Error de red
        setError('Error de conexión: No se pudo conectar al servidor');
      } else {
        // Otro tipo de error
        setError(`Error: ${error.message}`);
      }
      
      setLoading(false); // ✅ IMPORTANTE: Desactivar loading en caso de error también
    }
  };

  // Efecto para cargar métricas inicialmente
  useEffect(() => {
    fetchMetrics();
  }, []);

  // Efecto para actualización automática
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchMetrics, 60000); // Actualizar cada 60 segundos (reducido para evitar memory leaks)
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Función para determinar el estado de salud
  const getHealthStatus = (score) => {
    if (score >= 90) return { status: 'Excelente', variant: 'success', icon: FaCheckCircle };
    if (score >= 70) return { status: 'Bueno', variant: 'info', icon: FaCheckCircle };
    if (score >= 50) return { status: 'Advertencia', variant: 'warning', icon: FaExclamationTriangle };
    return { status: 'Crítico', variant: 'danger', icon: FaExclamationTriangle };
  };

  // Función para formatear bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Función para formatear porcentajes
  const formatPercentage = (value) => {
    return `${Math.round(value)}%`;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <div className="mt-3">Cargando métricas del sistema...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        <Alert.Heading>Error de Conexión</Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={fetchMetrics}>
          <FaSync className="me-2" />
          Reintentar
        </Button>
      </Alert>
    );
  }

  if (!metrics) {
    return (
      <Alert variant="warning" className="m-3">
        No se pudieron cargar las métricas del sistema.
      </Alert>
    );
  }

  // Validar estructura de datos
  if (!metrics.health || !metrics.metrics) {
    return (
      <Alert variant="danger" className="m-3">
        <Alert.Heading>Datos Incompletos</Alert.Heading>
        <p>La estructura de métricas recibida no es válida.</p>
        <Button variant="outline-danger" onClick={fetchMetrics}>
          <FaSync className="me-2" />
          Reintentar
        </Button>
      </Alert>
    );
  }

  const healthInfo = getHealthStatus(metrics.health?.score || 0);
  const HealthIcon = healthInfo.icon;

  return (
    <div className="monitoring-dashboard">
      {/* Header con estado general */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-2">
            <FaChartLine className="me-2 text-primary" />
            Monitoreo del Sistema
          </h2>
          <div className="d-flex align-items-center gap-3">
            <Badge bg={healthInfo.variant} className="d-flex align-items-center gap-1">
              <HealthIcon />
              {healthInfo.status} ({metrics.health.score}%)
            </Badge>
            {lastUpdate && (
              <small className="text-muted">
                <FaClock className="me-1" />
                Última actualización: {lastUpdate.toLocaleTimeString()}
              </small>
            )}
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant={autoRefresh ? "success" : "outline-secondary"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <FaEye className="me-1" />
            {autoRefresh ? "Auto" : "Manual"}
          </Button>
          <Button variant="primary" size="sm" onClick={fetchMetrics}>
            <FaSync className="me-1" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Alertas de problemas */}
      {metrics.health.issues && metrics.health.issues.length > 0 && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>
            <FaExclamationTriangle className="me-2" />
            Problemas Detectados
          </Alert.Heading>
          <ul className="mb-0">
            {metrics.health.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Row>
        {/* Métricas del Sistema */}
        <Col lg={6} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <FaServer className="me-2" />
              Sistema Operativo
            </Card.Header>
            <Card.Body>
              {metrics.metrics?.system ? (
                <div className="row g-3">
                  <div className="col-6">
                    <div className="metric-item">
                      <div className="d-flex align-items-center mb-1">
                        <FaMicrochip className="text-info me-2" />
                        <small className="text-muted">CPU</small>
                      </div>
                      <div className="d-flex align-items-center">
                        <ProgressBar 
                          now={metrics.metrics.system.cpu?.usage || 0} 
                          variant={(metrics.metrics.system.cpu?.usage || 0) > 80 ? "danger" : (metrics.metrics.system.cpu?.usage || 0) > 60 ? "warning" : "success"}
                          className="flex-grow-1 me-2"
                          style={{ height: '8px' }}
                        />
                        <Badge bg="light" text="dark" className="ms-2">
                          {formatPercentage(metrics.metrics.system.cpu?.usage || 0)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="metric-item">
                      <div className="d-flex align-items-center mb-1">
                        <FaMemory className="text-warning me-2" />
                        <small className="text-muted">Memoria</small>
                      </div>
                      <div className="d-flex align-items-center">
                        <ProgressBar 
                          now={metrics.metrics.system.memory?.usage || 0} 
                          variant={(metrics.metrics.system.memory?.usage || 0) > 85 ? "danger" : (metrics.metrics.system.memory?.usage || 0) > 70 ? "warning" : "success"}
                          className="flex-grow-1 me-2"
                          style={{ height: '8px' }}
                        />
                        <Badge bg="light" text="dark" className="ms-2">
                          {formatPercentage(metrics.metrics.system.memory?.usage || 0)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <small className="text-muted d-block">
                      <FaHdd className="me-1" />
                      Memoria: {formatBytes((metrics.metrics.system.memory?.used || 0) * 1024 * 1024)} / {formatBytes((metrics.metrics.system.memory?.total || 0) * 1024 * 1024)}
                    </small>
                    <small className="text-muted d-block">
                      Uptime: {Math.floor((metrics.metrics.system.uptime?.system || 0) / 3600)}h {Math.floor(((metrics.metrics.system.uptime?.system || 0) % 3600) / 60)}m
                    </small>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3">
                  <Spinner animation="border" size="sm" className="mb-2" />
                  <div><small className="text-muted">Cargando métricas del sistema...</small></div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Métricas de Node.js */}
        <Col lg={6} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-success text-white">
              <FaServer className="me-2" />
              Node.js
            </Card.Header>
            <Card.Body>
              {metrics.metrics?.node ? (
                <div className="row g-3">
                  <div className="col-6">
                    <div className="metric-item">
                      <div className="d-flex align-items-center mb-1">
                        <FaMemory className="text-success me-2" />
                        <small className="text-muted">Heap Used</small>
                      </div>
                      <div className="d-flex align-items-center">
                        <ProgressBar 
                          now={metrics.metrics.node.memory?.heapUsage || 0} 
                          variant="success"
                          className="flex-grow-1 me-2"
                          style={{ height: '8px' }}
                        />
                        <Badge bg="light" text="dark" className="ms-2">
                          {formatPercentage(metrics.metrics.node.memory?.heapUsage || 0)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="metric-item">
                      <div className="d-flex align-items-center mb-1">
                        <FaClock className="text-info me-2" />
                        <small className="text-muted">Uptime</small>
                      </div>
                      <Badge bg="info" className="w-100">
                        {Math.floor((metrics.metrics.node.uptime || 0) / 3600)}h {Math.floor(((metrics.metrics.node.uptime || 0) % 3600) / 60)}m
                      </Badge>
                    </div>
                  </div>
                  <div className="col-12">
                    <small className="text-muted d-block">
                      Heap: {formatBytes(metrics.metrics.node.memory?.heapUsed || 0)} / {formatBytes(metrics.metrics.node.memory?.heapTotal || 0)}
                    </small>
                    <small className="text-muted d-block">
                      Versión: {metrics.metrics.node.version || 'N/A'}
                    </small>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3">
                  <Spinner animation="border" size="sm" className="mb-2" />
                  <div><small className="text-muted">Cargando métricas de Node.js...</small></div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Métricas de la Aplicación */}
        <Col lg={6} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-info text-white">
              <FaUsers className="me-2" />
              Aplicación
            </Card.Header>
            <Card.Body>
              {metrics.metrics?.application ? (
                <div className="row g-3">
                  <div className="col-6">
                    <div className="text-center">
                      <div className="h4 mb-1 text-info">{metrics.metrics.application.requests?.total || 0}</div>
                      <small className="text-muted">Total Requests</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center">
                      <div className="h4 mb-1 text-success">{metrics.metrics.application.performance?.requestsPerMinute || 0}</div>
                      <small className="text-muted">Req/min</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center">
                      <div className="h4 mb-1 text-warning">{metrics.metrics.application.performance?.avgResponseTime || 0}ms</div>
                      <small className="text-muted">Avg Response</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center">
                      <div className="h4 mb-1 text-danger">{metrics.metrics.application.requests?.errors || 0}</div>
                      <small className="text-muted">Errores</small>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3">
                  <Spinner animation="border" size="sm" className="mb-2" />
                  <div><small className="text-muted">Cargando métricas de aplicación...</small></div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Métricas de Base de Datos */}
        <Col lg={6} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-warning text-dark">
              <FaDatabase className="me-2" />
              Base de Datos
            </Card.Header>
            <Card.Body>
              {metrics.metrics?.database ? (
                <div className="row g-3">
                  <div className="col-6">
                    <div className="text-center">
                      <Badge bg={metrics.metrics.database.status === 'connected' ? 'success' : 'danger'} className="mb-2">
                        {metrics.metrics.database.status || 'unknown'}
                      </Badge>
                      <div><small className="text-muted">Estado</small></div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center">
                      <div className="h5 mb-1 text-info">{metrics.metrics.database.connections?.active || 'N/A'}</div>
                      <small className="text-muted">Conexiones</small>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="row">
                      <div className="col-6 text-center">
                        <div className="h6 mb-1 text-success">{metrics.metrics.database.queries?.total || 0}</div>
                        <small className="text-muted">Total Queries</small>
                      </div>
                      <div className="col-6 text-center">
                        <div className="h6 mb-1 text-warning">{Math.floor((metrics.metrics.database.uptime || 0) / 3600)}h</div>
                        <small className="text-muted">Uptime DB</small>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3">
                  <Spinner animation="border" size="sm" className="mb-2" />
                  <div><small className="text-muted">Cargando métricas de base de datos...</small></div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Métricas de Red */}
        {metrics.metrics?.network && (
          <Col lg={12} className="mb-4">
            <Card className="shadow-sm">
              <Card.Header className="bg-secondary text-white">
                <FaNetworkWired className="me-2" />
                Red y Conectividad
              </Card.Header>
              <Card.Body>
                <Row>
                  {metrics.metrics.network.interfaces && Object.entries(metrics.metrics.network.interfaces).map(([name, iface]) => (
                    <Col md={6} lg={4} key={name} className="mb-3">
                      <div className="border rounded p-3">
                        <h6 className="mb-2">{name}</h6>
                        <small className="text-muted d-block">
                          Enviados: {formatBytes(iface.tx_bytes || 0)}
                        </small>
                        <small className="text-muted d-block">
                          Recibidos: {formatBytes(iface.rx_bytes || 0)}
                        </small>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default MonitoringDashboard;
