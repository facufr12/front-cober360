import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { FaShieldAlt, FaHome, FaSignOutAlt } from 'react-icons/fa';

const AccessDenied = ({ userRole, attemptedRoute, message }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener datos del localStorage si no se pasan como props
  const currentUserRole = userRole || parseInt(localStorage.getItem('user_role'));
  const currentAttemptedRoute = attemptedRoute || location.pathname;

  const roleNames = {
    1: 'Vendedor',
    2: 'Supervisor', 
    3: 'Administrador'
  };

  const roleDashboards = {
    1: '/vendedor',
    2: '/supervisor',
    3: '/admin'
  };

  const handleGoToDashboard = () => {
    const dashboard = roleDashboards[currentUserRole] || '/unknown-role';
    navigate(dashboard, { replace: true });
  };

  const handleLogout = () => {
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('user_id');
    localStorage.removeItem('first_name');
    localStorage.removeItem('last_name');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    
    // Redirigir al login
    navigate('/', { replace: true });
    window.location.reload();
  };

  useEffect(() => {
    // Prevenir navegación hacia atrás
    const preventBack = () => {
      window.history.pushState(null, '', window.location.pathname);
    };
    
    preventBack();
    window.addEventListener('popstate', preventBack);
    
    return () => {
      window.removeEventListener('popstate', preventBack);
    };
  }, []);

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Header className="bg-warning text-dark text-center">
              <FaShieldAlt size={40} className="mb-2" />
              <h4 className="mb-0">Acceso Denegado</h4>
            </Card.Header>
            
            <Card.Body className="text-center">
              <Alert variant="warning" className="mb-4">
                <strong>
                  {message || "No tienes permisos para acceder a esta sección"}
                </strong>
              </Alert>
              
              <div className="mb-4">
                <p className="text-muted mb-2">
                  <strong>Tu rol actual:</strong> {roleNames[currentUserRole] || 'Desconocido'}
                </p>
                {currentAttemptedRoute && (
                  <p className="text-muted">
                    <strong>Ruta solicitada:</strong> <code>{currentAttemptedRoute}</code>
                  </p>
                )}
                
                <div className="mt-3 p-3 bg-light rounded">
                  <h6 className="text-muted mb-2">🎯 Rutas disponibles para tu rol:</h6>
                  <div className="text-start">
                    {currentUserRole === 1 && (
                      <ul className="list-unstyled mb-0">
                        <li>• Dashboard de Vendedor</li>
                        <li>• Gestión de Prospectos</li>
                        <li>• Detalle de Prospectos</li>
                      </ul>
                    )}
                    {currentUserRole === 2 && (
                      <ul className="list-unstyled mb-0">
                        <li>• Dashboard de Supervisor</li>
                        <li>• Resumen de Supervisor</li>
                        <li>• Gestión de Vendedores</li>
                        <li>• Dashboard de Vendedor</li>
                        <li>• Gestión de Prospectos</li>
                      </ul>
                    )}
                    {currentUserRole === 3 && (
                      <ul className="list-unstyled mb-0">
                        <li>• Dashboard de Administrador</li>
                        <li>• Dashboard de Supervisor</li>
                        <li>• Dashboard de Vendedor</li>
                        <li>• Todas las funcionalidades</li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className="d-flex gap-3 justify-content-center">
                <Button 
                  variant="primary" 
                  onClick={handleGoToDashboard}
                  className="d-flex align-items-center"
                >
                  <FaHome className="me-2" />
                  Ir a mi Dashboard
                </Button>
                
                <Button 
                  variant="outline-secondary" 
                  onClick={handleLogout}
                  className="d-flex align-items-center"
                >
                  <FaSignOutAlt className="me-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AccessDenied;
