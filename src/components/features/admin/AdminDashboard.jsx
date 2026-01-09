import { useState, useEffect } from "react";
import { Container, Row, Col, Button, ListGroup, Offcanvas, Spinner, Card, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { 
  FaUsers, 
  FaMoneyBillWave, 
  FaSignOutAlt, 
  FaBars, 
  FaChevronLeft,
  FaTachometerAlt,
  FaChartLine,
  FaCog,
  FaClipboardList,
  FaHospital,
  FaTimes,
  FaUserShield,
  FaFileContract, // ✅ NUEVO ICONO PARA PÓLIZAS
  FaAddressBook, // ✅ NUEVO ICONO PARA PROSPECTOS
  FaUserTie, // ✅ NUEVO ICONO PARA VENDEDORES
  FaChalkboardTeacher // ✅ NUEVO ICONO PARA SUPERVISORES
} from "react-icons/fa";
import axios from "axios";
import Swal from "sweetalert2";
import { API_URL } from "../../config.js";
import UsuariosAdmin from "./UsuariosAdmin";
import ListaPreciosAdmin from "./ListaPreciosAdmin";
import PrestadoresAdmin from "./PrestadoresAdmin";
import PolizasAdmin from "./PolizasAdmin"; // ✅ IMPORTAR COMPONENTE DE PÓLIZAS
import ProspectosAdmin from "./ProspectosAdmin"; // ✅ IMPORTAR COMPONENTE DE PROSPECTOS
import VendedoresAdmin from "./VendedoresAdmin"; // ✅ NUEVO: Gestión de vendedores
import SupervisoresAdmin from "./SupervisoresAdmin"; // ✅ NUEVO: Gestión de supervisores

const AdminDashboard = () => {
  const [vista, setVista] = useState("usuarios");
  const [openDrawer, setOpenDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setOpenDrawer(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const sessionId = localStorage.getItem("sessionId");
      const loginTime = localStorage.getItem("loginTime");
      
      if (token && sessionId) {
        const sessionTime = Math.floor((new Date() - new Date(loginTime)) / 1000);
        
        await axios.post(
          `${API_URL}/sessions/end`,
          {
            session_id: sessionId,
            logout_time: new Date().toISOString(),
            session_time: sessionTime
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("loginTime");
      localStorage.removeItem("sessionId");
      localStorage.removeItem("user_id");
      localStorage.removeItem("first_name");
      localStorage.removeItem("last_name");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_email");
      
      Swal.fire({
        icon: 'success',
        title: 'Sesión cerrada',
        text: 'Has cerrado sesión correctamente',
        confirmButtonColor: '#3085d6'
      }).then(() => {
        navigate('/');
      });
    }
  };

  // ✅ OPCIONES DEL MENÚ ACTUALIZADAS (agregamos pólizas y prospectos)
  const menuItems = [
    { id: "usuarios", label: "Usuarios", icon: FaUsers, color: "primary" },
    { id: "vendedores", label: "Vendedores", icon: FaUserTie, color: "info" }, // ✅ NUEVO
    { id: "supervisores", label: "Supervisores", icon: FaChalkboardTeacher, color: "secondary" }, // ✅ NUEVO
    { id: "prospectos", label: "Prospectos", icon: FaAddressBook, color: "warning" }, // ✅ NUEVO
    { id: "polizas", label: "Pólizas", icon: FaFileContract, color: "success" }, // ✅ NUEVO
    { id: "prestadores", label: "Prestadores", icon: FaHospital, color: "info" },
    { id: "precios", label: "Lista de Precios", icon: FaMoneyBillWave, color: "warning" }
  ];

  // Sidebar content mejorado
  const drawerContent = (
    <div className="sidebar-admin h-100">
      <div className="sidebar-header">
        <div className="d-flex align-items-center justify-content-between">
          <h5 className="sidebar-title mb-0">
            <FaUserShield className="admin-icon" />
            Admin <span className="fw-light">Panel</span>
          </h5>
          <Button 
            variant="light" 
            size="sm" 
            className="sidebar-close-btn d-lg-none"
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

  const getVistaTitle = () => {
    const item = menuItems.find(item => item.id === vista);
    return item ? item.label : "Dashboard";
  };

  const getVistaIcon = () => {
    const item = menuItems.find(item => item.id === vista);
    return item ? item.icon : FaTachometerAlt;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <div className="mt-2">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Layout para Desktop */}
      <div className="d-none d-lg-flex min-vh-100" style={{ background: "#f8fafc" }}>
        {/* Sidebar fijo */}
        <div style={{ width: 280, minHeight: "100vh", position: "fixed", zIndex: 1030 }}>
          {drawerContent}
        </div>
        
        {/* Contenido principal */}
        <div style={{ flex: 1, marginLeft: 280 }}>
          {/* Header mejorado */}
          <div className="admin-topbar">
            <div className="topbar-left">
              <div className="topbar-title">
                <FaTachometerAlt className="title-icon" />
                <span className="title-text">{getVistaTitle()}</span>
              </div>
            </div>
            
            <div className="topbar-right">
              <div className="admin-badge">
                <FaUserShield className="me-1" />
                Administrador
              </div>
            </div>
          </div>

          {/* Contenido */}
          <Container fluid className="p-4">
            {vista === "usuarios" && <UsuariosAdmin />}
            {vista === "vendedores" && <VendedoresAdmin />} {/* ✅ NUEVO */}
            {vista === "supervisores" && <SupervisoresAdmin />} {/* ✅ NUEVO */}
            {vista === "prospectos" && <ProspectosAdmin />} {/* ✅ NUEVA VISTA */}
            {vista === "polizas" && <PolizasAdmin />} {/* ✅ NUEVA VISTA */}
            {vista === "prestadores" && <PrestadoresAdmin />}
            {vista === "precios" && <ListaPreciosAdmin />}
            {/* Se removieron vistas de Estadísticas y Configuración */}
          </Container>
        </div>
      </div>

      {/* Layout para Mobile/Tablet */}
      <div className="d-lg-none min-vh-100" style={{ background: "#f8fafc" }}>
        {/* Offcanvas Sidebar mejorado */}
        <Offcanvas
          show={openDrawer}
          onHide={() => setOpenDrawer(false)}
          placement="start"
          className="offcanvas-admin"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Panel de Administración</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-0">
            {drawerContent}
          </Offcanvas.Body>
        </Offcanvas>

        {/* Header móvil mejorado */}
        <div className="admin-topbar">
          <div className="topbar-left">
            <Button 
              variant="light" 
              size="sm" 
              className="menu-toggle"
              onClick={() => setOpenDrawer(true)}
            >
              <FaBars />
            </Button>
            <div className="topbar-title">
              <FaTachometerAlt className="title-icon" />
              <span className="title-text">{getVistaTitle()}</span>
            </div>
          </div>
          
          <div className="topbar-right">
            <div className="admin-badge">
              Admin
            </div>
          </div>
        </div>

        {/* Contenido móvil */}
        <Container fluid className="p-3">
          {/* Dashboard principal - Cards de navegación mejoradas */}
          {vista === "dashboard" && (
            <Row className="g-3">
              {menuItems.map((item) => (
                <Col key={item.id} xs={6} sm={4}>
                  <Card 
                    className={`admin-card-mobile card-${item.id} shadow-sm h-100`} 
                    style={{ cursor: "pointer" }}
                    onClick={() => setVista(item.id)}
                  >
                    <Card.Body>
                      <item.icon className="card-icon" />
                      <h6 className="card-title">{item.label}</h6>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {/* Vistas específicas con botón de regreso mejorado */}
          {vista === "usuarios" && (
            <div>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="mb-3 d-flex align-items-center"
                onClick={() => setVista("dashboard")}
              >
                <FaChevronLeft className="me-1" /> Dashboard
              </Button>
              <UsuariosAdmin />
            </div>
          )}

          {/* ✅ NUEVA VISTA DE VENDEDORES PARA MÓVIL */}
          {vista === "vendedores" && (
            <div>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="mb-3 d-flex align-items-center"
                onClick={() => setVista("dashboard")}
              >
                <FaChevronLeft className="me-1" /> Dashboard
              </Button>
              <VendedoresAdmin />
            </div>
          )}

          {/* ✅ NUEVA VISTA DE SUPERVISORES PARA MÓVIL */}
          {vista === "supervisores" && (
            <div>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="mb-3 d-flex align-items-center"
                onClick={() => setVista("dashboard")}
              >
                <FaChevronLeft className="me-1" /> Dashboard
              </Button>
              <SupervisoresAdmin />
            </div>
          )}

          {/* ✅ NUEVA VISTA DE PROSPECTOS PARA MÓVIL */}
          {vista === "prospectos" && (
            <div>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="mb-3 d-flex align-items-center"
                onClick={() => setVista("dashboard")}
              >
                <FaChevronLeft className="me-1" /> Dashboard
              </Button>
              <ProspectosAdmin />
            </div>
          )}

          {/* ✅ NUEVA VISTA DE PÓLIZAS PARA MÓVIL */}
          {vista === "polizas" && (
            <div>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="mb-3 d-flex align-items-center"
                onClick={() => setVista("dashboard")}
              >
                <FaChevronLeft className="me-1" /> Dashboard
              </Button>
              <PolizasAdmin />
            </div>
          )}



          {vista === "prestadores" && (
            <div>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="mb-3 d-flex align-items-center"
                onClick={() => setVista("dashboard")}
              >
                <FaChevronLeft className="me-1" /> Dashboard
              </Button>
              <PrestadoresAdmin />
            </div>
          )}

          {vista === "precios" && (
            <div>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="mb-3 d-flex align-items-center"
                onClick={() => setVista("dashboard")}
              >
                <FaChevronLeft className="me-1" /> Dashboard
              </Button>
              <ListaPreciosAdmin />
            </div>
          )}

          {/* Se removieron vistas de Estadísticas y Configuración en mobile */}
        </Container>
      </div>
    </>
  );
};

export default AdminDashboard;