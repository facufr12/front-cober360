import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Dropdown, Badge, Button, Container, Modal } from 'react-bootstrap';
import { 
  FaUser, 
  FaSignOutAlt, 
  FaUserCircle, 
  FaBell,
  FaSearch,
  FaCog,
  FaQuestionCircle,
  FaWhatsapp // Importar ícono de WhatsApp
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import './NavBar.scss';
import logoImg from '../../assets/img/logo.png';
import { API_URL } from "../config";

// 🔔 Importar el hook de notificaciones
import { useNotifications } from '../../contexts/NotificationContext';

// 🔐 Importar el contexto de autenticación
import { useAuth } from './AuthContext';


const NavBar = () => {
  // 🔔 Usar el contexto de notificaciones
  const { totalUnread, whatsappUnread } = useNotifications();

  // 🔐 Usar el contexto de autenticación
  const { user, isAuthenticated, logout: authLogout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileNotificationsOpen, setMobileNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Definir páginas de autenticación
  const authPages = ['/', '/register', '/reset', '/verify-email', '/formulario-lead'];
  const isAuthPage = authPages.some(page => 
    location.pathname === page || 
    location.pathname.startsWith('/reset-password') ||
    location.pathname.startsWith('/verify-email')
  );

  // Gestionar clase CSS del body para navbar fijo
  useEffect(() => {
    if (!isAuthenticated || isAuthPage) {
      document.body.classList.remove('has-navbar');
    } else {
      document.body.classList.add('has-navbar');
    }
    
    // Cleanup al desmontar
    return () => {
      document.body.classList.remove('has-navbar');
    };
  }, [isAuthenticated, isAuthPage]);

  // 🚪 Interceptar navegación hacia atrás para cerrar sesión
  useEffect(() => {
    // Solo aplicar si el usuario está autenticado y no está en páginas de auth
    if (!isAuthenticated || isAuthPage) return;

    const handlePopState = async (event) => {
      // 🔧 CAMBIO: Verificar si realmente es navegación hacia atrás no deseada
      const currentPath = window.location.pathname;
      const isNavigatingToAuth = authPages.some(page => 
        currentPath === page || 
        currentPath.startsWith('/reset-password') ||
        currentPath.startsWith('/verify-email')
      );

      // Solo intervenir si está navegando a páginas de auth
      if (!isNavigatingToAuth) {
        return; // Permitir navegación normal dentro de la app
      }
      
      // Prevenir la navegación automática
      event.preventDefault();
      
      console.log('🔙 Navegación a página de auth detectada - Iniciando proceso de cierre de sesión');
      
      // Mostrar el diálogo de confirmación de cierre de sesión
      const result = await Swal.fire({
        title: '🚪 ¿Cerrar sesión?',
        html: `
          <div style="text-align: left; margin: 20px 0;">
            <p><strong>Para navegar fuera del sistema, debes cerrar sesión.</strong></p>
            <p>Esto es por seguridad para proteger tu información.</p>
            <br>
            <p>¿Deseas cerrar sesión ahora?</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: '✅ Sí, cerrar sesión',
        cancelButtonText: '❌ Permanecer aquí',
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
          popup: 'logout-confirmation-popup'
        }
      });

      if (result.isConfirmed) {
        console.log('✅ Usuario confirmó cierre de sesión');
        await handleLogout(false);
      } else {
        console.log('❌ Usuario canceló cierre de sesión');
        // Restaurar el estado del historial
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    // 🔧 CAMBIO: Solo agregar entrada si no existe
    const currentState = window.history.state;
    if (!currentState?.navigationProtected) {
      window.history.pushState({ navigationProtected: true }, '', window.location.pathname);
    }
    
    window.addEventListener('popstate', handlePopState);

    console.log('🛡️ Protección de navegación hacia atrás activada');

    return () => {
      window.removeEventListener('popstate', handlePopState);
      console.log('🛡️ Protección de navegación hacia atrás desactivada');
    };
  }, [isAuthenticated, isAuthPage, location.pathname]);

  // Cerrar sesión
  const handleLogout = async (showConfirmation = true) => {
    let shouldProceed = true;

    // Solo mostrar confirmación si se solicita explícitamente
    if (showConfirmation) {
      const result = await Swal.fire({
        title: '¿Cerrar sesión?',
        text: '¿Estás seguro de que quieres cerrar sesión?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: '✅ Sí, cerrar sesión',
        cancelButtonText: '❌ Cancelar'
      });
      
      shouldProceed = result.isConfirmed;
    }

    if (shouldProceed) {
      try {
        // 🔹 NUEVO: Marcar usuario como inactivo antes de cerrar sesión
        try {
          const token = localStorage.getItem('token');
          if (token) {
            await axios.post(`${API_URL}/admin/users/logout-activity`, {
              action: 'logout',
              timestamp: new Date().toISOString()
            }, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 5000
            });
            console.log('✅ Usuario marcado como inactivo exitosamente');
          }
        } catch (activityError) {
          console.warn('⚠️ Error marcando usuario como inactivo:', activityError.message);
          // No impedir el logout por este error
        }

        // Usar el método logout del contexto de autenticación
        await authLogout(false); // false para no mostrar el mensaje del contexto ya que lo mostramos aquí
        
        // Mostrar mensaje de confirmación
        Swal.fire({
          icon: 'success',
          title: 'Sesión cerrada',
          text: 'Has cerrado sesión exitosamente',
          timer: 1500,
          showConfirmButton: false
        });
        
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        // En caso de error, usar el método del contexto como fallback
        await authLogout(false);
      }
    }
    
    return shouldProceed;
  };

  // Obtener información del rol
  const getRoleInfo = (roleId) => {
    const roles = {
      1: { label: 'Vendedor', color: 'info' },
      2: { label: 'Supervisor', color: 'warning' },
      3: { label: 'Administrador', color: 'danger' },
      4: { label: 'Back Office', color: 'success' }
    };
    return roles[roleId] || { label: 'Desconocido', color: 'secondary' };
  };

  // Obtener título de la página actual
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('admin')) return 'Panel de Administración';
    if (path.includes('supervisor')) return 'Panel de Supervisión';
    if (path.includes('backoffice')) return 'Panel de Back Office';
    if (path.includes('vendedor') || path.includes('prospectos')) return 'Panel de Ventas';
    return 'COBER 360';
  };

  // Función para cerrar el menú mobile
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // No mostrar el navbar en páginas de autenticación
  if (isAuthPage || !isAuthenticated || !user) {
    console.log('🚫 NavBar oculto - isAuthPage:', isAuthPage, 'isAuthenticated:', isAuthenticated, 'user:', !!user, 'path:', location.pathname);
    return null;
  }

  console.log('✅ NavBar visible - user:', user?.firstName, 'role:', user?.role, 'path:', location.pathname);

  const roleInfo = getRoleInfo(user?.role || 0);  return (
    <Navbar className="modern-navbar" fixed="top" expand={false}>
      <Container fluid>
        {/* Logo y título */}
        <div className="navbar-brand-section mb-desktop-2"> 
          <Navbar.Brand href="#" className="modern-brand">
            <div className="brand-logo">
              <div className="logo-circle">
                <img src={logoImg} alt="Cober 360" className="logo-image" />
              </div>
            </div>
            <div className="brand-content">
              <div className="brand-title-container">
                <div className="brand-title">{getPageTitle()}</div>
                <Badge bg="warning" text="dark" className="beta-badge ms-2">
                  BETA
                </Badge>
              </div>
              <div className="brand-subtitle">Sistema de Gestión</div>
            </div>
          </Navbar.Brand>
        </div>

        {/* Barra de búsqueda central - Solo desktop */}
        <div className="navbar-search d-none d-md-flex mb-desktop-2"> 
          <div className="search-container">
            <FaSearch className="search-icon mb-desktop-2" />
            <input
              type="text"
              placeholder="Buscar prospectos, usuarios..."
              className="search-input"
            />
          </div>
        </div>

        {/* Sección derecha - Acciones */}
        <div className="navbar-actions">
          {/* Acciones desktop - ocultas en mobile */}
          <div className="desktop-actions d-none d-md-flex">
            {/* Modo oscuro
            <Button
              variant="link"
              className="action-btn"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Modo claro" : "Modo oscuro"}
            >
              {darkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
            </Button> */}

            {/* Notificaciones - Solo para vendedores y admins */}
            {user?.role !== 2 && user?.role !== 4 && (
              <Dropdown align="end">
                <Dropdown.Toggle variant="link" className="action-btn position-relative">
                  <FaBell size={18} />
                  {totalUnread > 0 && (
                    <Badge bg="danger" className="notification-badge">
                      {totalUnread}
                    </Badge>
                  )}
                </Dropdown.Toggle>
              <Dropdown.Menu className="modern-dropdown notifications-dropdown">
                <Dropdown.Header>
                  <div className="dropdown-header-content">
                    <span className="header-title">Notificaciones</span>
                    {totalUnread > 0 && <Badge bg="primary" pill>{totalUnread}</Badge>}
                  </div>
                </Dropdown.Header>
                <Dropdown.Divider />
                
                {/* Notificaciones de WhatsApp */}
                {whatsappUnread > 0 && (
                  <Dropdown.Item className="notification-item">
                    <div className="notification-content">
                      <div className="notification-title">
                        <FaWhatsapp className="me-2 text-success" />
                        {whatsappUnread} mensaje(s) de WhatsApp sin leer
                      </div>
                      <div className="notification-time">Ahora</div>
                    </div>
                  </Dropdown.Item>
                )}

                {/* Otras notificaciones (ejemplo) */}
                <Dropdown.Item className="notification-item">
                  <div className="notification-content">
                    <div className="notification-title">Nuevo prospecto asignado</div>
                    <div className="notification-time">Hace 5 minutos</div>
                  </div>
                </Dropdown.Item>
                
                <Dropdown.Divider />
                <Dropdown.Item className="text-center text-primary">
                  Ver todas las notificaciones
                </Dropdown.Item>
              </Dropdown.Menu>
              </Dropdown>
            )}

            {/* Ayuda */}
            <Button
              variant="link"
              className="action-btn mb-desktop-2"
              title="Ayuda"
            >
              <FaQuestionCircle size={18} />
            </Button>

            {/* Configuración */}
            <Button
              variant="link"
              className="action-btn mb-desktop-2"
              title="Configuración"
            >
              <FaCog size={18} />
            </Button>
          </div>

          {/* Menú mobile colapsable */}
          <div className="mobile-menu-container d-md-none">
            <div className={`mobile-actions-bar ${user?.role === 3 ? 'admin-only' : ''}`}>
              {/* Icono de notificaciones compacto - Solo para vendedores y admins */}
              {user?.role !== 3 && user?.role !== 2 && user?.role !== 4 && (
                <Button
                  variant="link"
                  className="mobile-notification-icon"
                  onClick={() => setMobileNotificationsOpen(true)}
                  title="Ver notificaciones"
                >
                  <FaBell size={20} />
                  {totalUnread > 0 && (
                    <div className="mobile-notification-dot"></div>
                  )}
                </Button>
              )}

              {/* Botón de usuario que abre el menú */}
              <Button
                variant="link"
                className="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <FaUserCircle size={32} />
              </Button>
            </div>

            {/* Menú desplegable mobile */}
            {mobileMenuOpen && (
              <div className="mobile-menu-dropdown">
                <div className="mobile-menu-overlay" onClick={closeMobileMenu}></div>
                <div className="mobile-menu-content">
                  {/* Información del usuario */}
                  <div className="mobile-user-info">
                    <div className="mobile-user-avatar">
                      <FaUserCircle size={48} />
                    </div>
                    <div className="mobile-user-details">
                      <div className="mobile-user-name">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="mobile-user-email">{user?.email}</div>
                      <Badge bg={roleInfo.color} className="mt-1">
                        {roleInfo.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="mobile-menu-divider"></div>

                  {/* Acciones del menú */}
                  <div className="mobile-menu-actions">
                    {/* Notificaciones - Solo para vendedores y admins */}
                    {user?.role !== 3 && user?.role !== 2 && user?.role !== 4 && (
                      <Button
                        variant="link"
                        className="mobile-action-btn position-relative"
                        onClick={() => {
                          setMobileNotificationsOpen(true);
                          closeMobileMenu();
                        }}
                      >
                        <FaBell size={18} />
                        <span>Notificaciones</span>
                        {totalUnread > 0 && (
                          <Badge bg="danger" className="ms-auto">
                            {totalUnread}
                          </Badge>
                        )}
                      </Button>
                    )}

                    <Button
                      variant="link"
                      className="mobile-action-btn"
                      onClick={closeMobileMenu}
                    >
                      <FaQuestionCircle size={18} />
                      <span>Ayuda</span>
                    </Button>

                    <Button
                      variant="link"
                      className="mobile-action-btn"
                      onClick={closeMobileMenu}
                    >
                      <FaCog size={18} />
                      <span>Configuración</span>
                    </Button>

                    <Button
                      variant="link"
                      className="mobile-action-btn"
                      onClick={closeMobileMenu}
                    >
                      <FaUser size={18} />
                      <span>Mi Perfil</span>
                    </Button>
                  </div>

                  <div className="mobile-menu-divider"></div>

                  {/* Cerrar sesión */}
                  <Button
                    variant="link"
                    className="mobile-action-btn logout-btn"
                    onClick={() => {
                      closeMobileMenu();
                      handleLogout(true);
                    }}
                  >
                    <FaSignOutAlt size={18} />
                    <span>Cerrar Sesión</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Usuario dropdown - Solo desktop */}
          <div className="d-none d-md-block">
            <Dropdown align="end">
              <Dropdown.Toggle variant="link" className="user-dropdown-toggle">
                <div className="user-info-container">
                  <div className="user-avatar">
                    <FaUserCircle size={32} />
                  </div>
                  <div className="user-details d-none d-lg-block">
                    <div className="user-name">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="user-role">
                      <Badge bg={roleInfo.color} size="sm">
                        {roleInfo.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu className="modern-dropdown user-dropdown">
                <Dropdown.Header>
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-avatar">
                      <FaUserCircle size={48} />
                    </div>
                    <div className="user-dropdown-info">
                      <div className="user-dropdown-name">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="user-dropdown-email">{user?.email}</div>
                      <Badge bg={roleInfo.color} className="mt-1">
                        {roleInfo.label}
                      </Badge>
                    </div>
                  </div>
                </Dropdown.Header>
                
                <Dropdown.Divider />
                
                <Dropdown.Item className="dropdown-item-modern">
                  <FaUser className="dropdown-icon" />
                  <div className="dropdown-content">
                    <div className="dropdown-title">Mi Perfil</div>
                    <div className="dropdown-description">Ver información personal</div>
                  </div>
                </Dropdown.Item>
                
                <Dropdown.Item className="dropdown-item-modern">
                  <FaCog className="dropdown-icon" />
                  <div className="dropdown-content">
                    <div className="dropdown-title">Configuración</div>
                    <div className="dropdown-description">Preferencias del sistema</div>
                  </div>
                </Dropdown.Item>
                
                <Dropdown.Divider />
                
                <Dropdown.Item
                  onClick={() => handleLogout(true)}
                  className="dropdown-item-modern logout-item"
                >
                  <FaSignOutAlt className="dropdown-icon" />
                  <div className="dropdown-content">
                    <div className="dropdown-title">Cerrar Sesión</div>
                    <div className="dropdown-description">Salir del sistema</div>
                  </div>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </Container>

      {/* Modal de notificaciones para mobile */}
      <Modal 
        show={mobileNotificationsOpen} 
        onHide={() => setMobileNotificationsOpen(false)}
        size="lg"
        centered
        className="mobile-notifications-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaBell className="me-2" />
            Notificaciones
            {totalUnread > 0 && <Badge bg="primary" className="ms-2">{totalUnread}</Badge>}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Notificaciones de WhatsApp */}
          {whatsappUnread > 0 && (
            <div className="notification-item border-0 bg-light rounded mb-3 p-3">
              <div className="notification-content">
                <div className="notification-title">
                  <FaWhatsapp className="me-2 text-success" />
                  {whatsappUnread} mensaje(s) de WhatsApp sin leer
                </div>
                <div className="notification-time text-muted">Ahora</div>
              </div>
            </div>
          )}

          {/* Otras notificaciones (ejemplo) */}
          <div className="notification-item border-0 bg-light rounded mb-3 p-3">
            <div className="notification-content">
              <div className="notification-title">Nuevo prospecto asignado</div>
              <div className="notification-time text-muted">Hace 5 minutos</div>
            </div>
          </div>

          {totalUnread === 0 && (
            <div className="text-center text-muted py-4">
              <FaBell size={48} className="mb-3 opacity-25" />
              <p>No tienes notificaciones nuevas</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-primary" 
            onClick={() => setMobileNotificationsOpen(false)}
            className="w-100"
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </Navbar>
  );
};

export default NavBar;