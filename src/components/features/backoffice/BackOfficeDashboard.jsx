import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Badge, 
  Button, 
  Alert,
  Spinner,
  Offcanvas,
  Form,
} from 'react-bootstrap';
import { 
  FaUsers, 
  FaUserTie, 
  FaChartLine, 
  FaDollarSign,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaDownload,
  FaHandshake,
  FaTachometerAlt,
  FaBuilding,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaFileAlt,
  FaUserFriends,
  FaUserCheck,
  FaMoneyBillWave
} from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../../config';
import MetricasAvanzadas from './MetricasAvanzadas';
import SupervisoresBackOffice from './SupervisoresBackOffice';
import VendedoresBackOffice from './VendedoresBackOffice';
import PolizasBackOffice from './PolizasBackOffice';
import ProspectosBackOffice from './ProspectosBackOffice';
import './BackOfficeDashboard.scss';
// MUI (para nuevas tarjetas de métricas con gráficos)
import {
  Card as MUICard,
  CardContent,
  Typography,
  Stack,
  Grid,
  Box,
  Paper
} from '@mui/material';
// Recharts (alinear gráficos con SupervisorDashboard)
import { ResponsiveContainer, LineChart as RLineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

const BackOfficeDashboard = () => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vista, setVista] = useState('dashboard');
  const [openDrawer, setOpenDrawer] = useState(false);
  const [periodType, setPeriodType] = useState('month'); // 'month' | 'year'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1..12
  const navigate = useNavigate();

  // Menú items para el sidebar
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Principal',
      icon: FaTachometerAlt,
      description: 'Vista general y métricas principales'
    },
    {
      id: 'prospectos',
      label: 'Gestión Prospectos',
      icon: FaHandshake,
      description: 'Administrar prospectos y asignaciones'
    },
    {
      id: 'polizas',
      label: 'Gestión Pólizas',
      icon: FaFileAlt,
      description: 'Administrar pólizas del sistema'
    },
    {
      id: 'supervisores',
      label: 'Gestión Supervisores',
      icon: FaUserTie,
      description: 'Administrar supervisores y equipos'
    },
    {
      id: 'vendedores',
      label: 'Gestión Vendedores',
      icon: FaUsers,
      description: 'Administrar vendedores y asignaciones'
    }
  ];

  useEffect(() => {
    if (vista === 'dashboard') {
      fetchEstadisticas();
    }
  }, [vista, periodType, selectedYear, selectedMonth]);

  const fetchEstadisticas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/');
        return;
      }

      const params = new URLSearchParams();
      params.append('periodType', periodType);
      params.append('year', String(selectedYear));
      if (periodType === 'month') params.append('month', String(selectedMonth));

      const response = await axios.get(`${API_URL}/backoffice/dashboard?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setEstadisticas(response.data.data);
      } else {
        setError('Error al cargar estadísticas');
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/');
      } else {
        setError('Error al conectar con el servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (number) => {
    if (number === null || number === undefined) return '0';
    return Number(number).toLocaleString('es-AR');
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0%';
    return `${Number(value).toFixed(1)}%`;
  };

  // Serie simple para mini-gráficos (sparklines)
  const buildSpark = (base = 0) => {
    const v = Number(base) || 0;
    const arr = [0.6, 0.8, 1, 0.9, 1.1].map((k) => Math.max(0, Math.round(v * k)));
    // Evitar todo cero para que el gráfico se vea
    return arr.every((n) => n === 0) ? [1, 2, 1, 2, 1] : arr;
  };

  // Generar datos históricos de prospectos/ventas/pólizas
  const getHistoricoProspectos = (datos) => {
    // Si backend envía etiquetas, usarlas directamente
    if (Array.isArray(datos?.labels) && datos.labels.length > 0) {
      const len = datos.labels.length;
      const normalize = (arr) => {
        if (!Array.isArray(arr) || arr.length === 0) return Array(len).fill(0);
        if (arr.length === len) return arr;
        const diff = len - arr.length;
        return [...Array(diff).fill(0), ...arr.slice(-len)];
      };
      return {
        meses: datos.labels,
        prospectos: normalize(datos?.prospectos_historico),
        ventas: normalize(datos?.ventas_historico),
        polizas: normalize(datos?.polizas_historico),
      };
    }
    const lPros = (datos?.prospectos_historico || []).length;
    const lVent = (datos?.ventas_historico || []).length;
    const lPoli = (datos?.polizas_historico || []).length;
    let len = Math.max(lPros, lVent, lPoli, 8);

    // Si recibimos 12 puntos, asumimos meses del año en curso (enero..diciembre)
    const isFullYear = len === 12 && (lPros === 12 || lVent === 12 || lPoli === 12);
    let meses;
    if (isFullYear) {
      const year = new Date().getFullYear();
      meses = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1).toLocaleString('es', { month: 'short' }));
      len = 12;
    } else {
      meses = Array.from({ length: len }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (len - 1 - i));
        return d.toLocaleString('es', { month: 'short' });
      });
    }

    const normalize = (arr) => {
      if (!Array.isArray(arr) || arr.length === 0) return Array(len).fill(0);
      if (arr.length === len) return arr;
      const diff = len - arr.length;
      return [...Array(diff).fill(0), ...arr.slice(-len)];
    };

    return {
      meses,
      prospectos: normalize(datos?.prospectos_historico),
      ventas: normalize(datos?.ventas_historico),
      polizas: normalize(datos?.polizas_historico),
    };
  };

  const getVistaTitle = () => {
    const titles = {
      'dashboard': 'Dashboard Principal',
      'metricas': 'Métricas Avanzadas',
      'prospectos': 'Gestión de Prospectos',
      'polizas': 'Gestión de Pólizas',
      'supervisores': 'Gestión de Supervisores',
      'vendedores': 'Gestión de Vendedores'
    };
    return titles[vista] || 'Back Office';
  };  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('first_name');
    localStorage.removeItem('last_name');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    navigate('/');
  };

  // Sidebar content
  const drawerContent = (
    <div className="sidebar-backoffice h-100">
      <div className="sidebar-header">
        <div className="d-flex align-items-center justify-content-between">
          <h5 className="sidebar-title mb-0">
            <FaBuilding className="backoffice-icon" />
            Back Office <span className="fw-light">Panel</span>
          </h5>
          <Button
            variant="light"
            size="sm"
            className="sidebar-close-btn d-md-none"
            onClick={() => setOpenDrawer(false)}
          >
            <FaTimes />
          </Button>
        </div>
      </div>

      <div className="sidebar-nav h-100 d-flex flex-column">
        <div className="flex-grow-1">
          {menuItems.map((item) => (
            <div key={item.id} className="nav-item">
              <button
                className={`nav-link w-100 text-start ${vista === item.id ? "active" : ""}`}
                onClick={() => {
                  setVista(item.id);
                  setOpenDrawer(false);
                }}
              >
                <item.icon className="nav-icon" />
                <span className="nav-text">{item.label}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Logout section */}
        <div className="nav-logout">
          {/* <button
            className="logout-btn"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            <span>Cerrar Sesión</span>
          </button> */}
        </div>
      </div>
    </div>
  );

  // Renderizar contenido según la vista seleccionada
  const renderVistaContent = () => {
    switch (vista) {
      case 'metricas':
        return <MetricasAvanzadas />;
      case 'prospectos':
        return <ProspectosBackOffice />;
      case 'polizas':
        return <PolizasBackOffice />;
      case 'supervisores':
        return <SupervisoresBackOffice />;
      case 'vendedores':
        return <VendedoresBackOffice />;
      case 'dashboard':
      default:
        return renderDashboardContent();
    }
  };

  const renderDashboardContent = () => {
    if (loading) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '500px' }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" size="lg" />
            <p className="mt-3 text-muted">Cargando dashboard de Back Office...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="danger">
          <FaExclamationTriangle className="me-2" />
          {error}
        </Alert>
      );
    }

    const { generales, porSupervisor } = estadisticas || {};

    // Verificar que los datos existan
    if (!generales || !porSupervisor) {
      return (
        <Alert variant="warning">
          <FaExclamationTriangle className="me-2" />
          No hay datos disponibles para mostrar.
        </Alert>
      );
    }

    // Calcular tasas de conversión y otras métricas
    const tasaConversionGeneral = generales.prospectos_activos_total > 0 
      ? (generales.ventas_mes / generales.prospectos_activos_total * 100) 
      : 0;

  // Los ingresos ahora vienen directamente de la base de datos (polizas cerradas)
  const ingresosTotales = generales.ingresos_mes || 0;
  // Normalizar histórico para el chart principal (usar estadisticas completas, no solo 'generales')
  const hist = getHistoricoProspectos(estadisticas);

    // Componente de card de estadísticas (igual que Supervisor)
    const StatCard = ({ icon: Icon, title, value, change, changeType, color }) => (
      <Card className="h-100 border-0 shadow-sm">
        <Card.Body className="d-flex align-items-center">
          <div className={`rounded-circle p-3 me-3 bg-${color} bg-opacity-10`}>
            <Icon className={`text-${color} fs-4`} />
          </div>
          <div className="flex-grow-1">
            <h6 className="text-muted mb-1 fw-normal">{title}</h6>
            <h3 className="mb-0 fw-bold">{value}</h3>
            {change !== undefined && (
              <div className="d-flex align-items-center mt-1">
                {changeType === 'up' && <FaArrowUp className="text-success me-1" size={12} />}
                {changeType === 'down' && <FaArrowDown className="text-danger me-1" size={12} />}
                {changeType !== 'up' && changeType !== 'down' && <span className="text-muted me-1">—</span>}
                <small className={`text-${changeType === 'up' ? 'success' : changeType === 'down' ? 'danger' : 'muted'}`}>{change || 0}% vs mes anterior</small>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    );

  // Datos para cards (usar totales globales provistos por el backend)
  const totalProspectos = generales.total_prospectos ?? generales.prospectos_activos_total ?? 0;
  const vendedoresActivos = generales.total_vendedores_activos ?? generales.vendedores_activos ?? 0;
  const ventasConfirmadas = generales.ventas_confirmadas_total ?? generales.ventas_mes ?? 0;
  const totalPolizas = generales.polizas_generadas_total ?? generales.polizas_mes ?? 0;
  const totalFacturado = generales.total_facturado ?? ingresosTotales ?? 0;

    // Datos de gráfica al estilo Supervisor
    const chartData = (hist.meses || []).map((mes, i) => ({
      mes,
      nuevosProspectos: (hist.prospectos || [])[i] || 0,
      vendedores: vendedoresActivos, // No hay histórico; línea plana
      ventas: (hist.ventas || [])[i] || 0,
      polizasGeneradas: (hist.polizas || [])[i] || 0,
    }));

    return (
      <>
        {/* Fila de tarjetas de estadísticas */}
        <Row className="g-4 mb-4">
          <Col lg className="col-lg">
            <StatCard icon={FaUserFriends} title="Total Prospectos" value={formatNumber(totalProspectos)} change={12.5} changeType="up" color="" />
          </Col>
          <Col lg className="col-lg">
            <StatCard icon={FaUsers} title="Vendedores Activos" value={formatNumber(vendedoresActivos)} change={5.2} changeType="up" color="success" />
          </Col>
          <Col lg className="col-lg">
            <StatCard icon={FaUserCheck} title="Ventas Confirmadas" value={formatNumber(ventasConfirmadas)} change={-2.1} changeType="down" color="warning" />
          </Col>
          <Col lg className="col-lg">
            <StatCard icon={FaFileAlt} title="Pólizas Generadas" value={formatNumber(totalPolizas)} change={3.4} changeType="up" color="info" />
          </Col>
        </Row>

        {/* Filtros de período (UX/UI) debajo de las cards */}
        <Card className="shadow-sm border-0 mb-4">
          <Card.Body>
            <Row className="g-3 align-items-end">
              <Col xs={12} md={4}>
                <Form.Label className="small text-muted mb-1">Período</Form.Label>
                <Form.Select size="sm" value={periodType} onChange={(e) => setPeriodType(e.target.value)}>
                  <option value="month">Mes</option>
                  <option value="year">Año</option>
                </Form.Select>
              </Col>

              {periodType === 'month' && (
                <>
                  <Col xs={6} md={4}>
                    <Form.Label className="small text-muted mb-1">Mes</Form.Label>
                    <Form.Select size="sm" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                      {[
                        'Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
                      ].map((mName, idx) => (
                        <option key={idx+1} value={idx+1}>{mName}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col xs={6} md={3}>
                    <Form.Label className="small text-muted mb-1">Año</Form.Label>
                    <Form.Select size="sm" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                      {Array.from({length: 5}, (_,i) => new Date().getFullYear() - 2 + i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </Form.Select>
                  </Col>
                </>
              )}

              {periodType === 'year' && (
                <Col xs={12} md={4}>
                  <Form.Label className="small text-muted mb-1">Año</Form.Label>
                  <Form.Select size="sm" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                    {Array.from({length: 7}, (_,i) => new Date().getFullYear() - 3 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </Form.Select>
                </Col>
              )}

              <Col className="d-flex justify-content-end">
                <Button variant="primary" size="sm" onClick={fetchEstadisticas}>
                  <FaArrowUp className="me-1" /> Actualizar
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Fila: Gráfica de Tendencias */}
        <Row className="g-4">
          <Col lg={12}>
            <Card className="h-100 border-0 shadow-sm card-no-boorder">
              <Card.Header className="bg-white border-0 pb-0">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h5 className="mb-1 fw-bold">Tendencias Mensuales</h5>
                    <p className="text-muted mb-0 small">Evolución de prospectos, vendedores, ventas y pólizas</p>
                  </div>
                  <div className="d-flex gap-3">
                    <div className="d-flex align-items-center">
                      <div className="bg-primary rounded-circle me-2" style={{ width: '12px', height: '12px' }}></div>
                      <small className="text-muted">Nuevos Prospectos</small>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="bg-success rounded-circle me-2" style={{ width: '12px', height: '12px' }}></div>
                      <small className="text-muted">Vendedores</small>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="bg-warning rounded-circle me-2" style={{ width: '12px', height: '12px' }}></div>
                      <small className="text-muted">Ventas</small>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="bg-info rounded-circle me-2" style={{ width: '12px', height: '12px' }}></div>
                      <small className="text-muted">Pólizas Generadas</small>
                    </div>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <RLineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="nuevosProspectos" stroke="#8B7EC8" strokeWidth={3} dot={{ fill: '#8B7EC8', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: '#8B7EC8', strokeWidth: 2 }} />
                    <Line type="monotone" dataKey="vendedores" stroke="#48BB78" strokeWidth={3} dot={{ fill: '#48BB78', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: '#48BB78', strokeWidth: 2 }} />
                    <Line type="monotone" dataKey="ventas" stroke="#ED8936" strokeWidth={3} dot={{ fill: '#ED8936', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: '#ED8936', strokeWidth: 2 }} />
                    <Line type="monotone" dataKey="polizasGeneradas" stroke="#17A2B8" strokeWidth={3} dot={{ fill: '#17A2B8', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: '#17A2B8', strokeWidth: 2 }} />
                  </RLineChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </>
    );
      };

      return (
        <>
          {/* Layout para Desktop y Tablet */}
          <div className="backoffice-dashboard d-none d-md-flex min-vh-100" style={{ background: "#f8fafc" }}>
            {/* Sidebar fijo */}
            <div className="sidebar-wrapper">
              {drawerContent}
            </div>

            {/* Contenido principal */}
            <div className="content-wrapper">
              {/* Header */}
              <div className="backoffice-topbar">
                <div className="topbar-left">
                  <div className="topbar-title">
                    <FaTachometerAlt className="title-icon" />
                    <span className="title-text">{getVistaTitle()}</span>
                  </div>
                </div>

                <div className="topbar-right d-flex align-items-center gap-2"></div>
              </div>

              {/* Contenido de la vista */}
              <div className="main-content">
                <Container fluid className="px-0">
                  {renderVistaContent()}
                </Container>
              </div>
            </div>
          </div>

          {/* Layout para Mobile */}
          <div className="backoffice-dashboard d-md-none min-vh-100" style={{ background: "#f8fafc" }}>
            {/* Header mobile */}
            <div className="mobile-header">
              <Button
                variant="light"
                size="sm"
                onClick={() => setOpenDrawer(true)}
                className="me-2"
              >
                <FaBars />
              </Button>
              <h6 className="mb-0 flex-grow-1 text-truncate" title={getVistaTitle()}>
                {getVistaTitle()}
              </h6>
              <Button variant="outline-primary" size="sm" onClick={fetchEstadisticas}>
                <FaArrowUp />
              </Button>
            </div>

            {/* Contenido mobile */}
            <div className="mobile-content">
              <Container fluid className="px-0">
                {renderVistaContent()}
              </Container>
            </div>

            {/* Offcanvas Sidebar para mobile */}
            <Offcanvas
              show={openDrawer}
              onHide={() => setOpenDrawer(false)}
              placement="start"
              className="backoffice-offcanvas"
            >
              <Offcanvas.Body className="p-0">
                {drawerContent}
              </Offcanvas.Body>
            </Offcanvas>
          </div>
        </>
      );
    };
    
    export default BackOfficeDashboard;
