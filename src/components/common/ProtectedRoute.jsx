import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner, Alert } from 'react-bootstrap';
import AccessDenied from './AccessDenied';

const ProtectedRoute = ({ children, requireAuth = true, allowedRoles = [], redirectTo = '/' }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = {
          id: localStorage.getItem('user_id'),
          first_name: localStorage.getItem('first_name'),
          last_name: localStorage.getItem('last_name'),
          email: localStorage.getItem('user_email'),
          role: parseInt(localStorage.getItem('user_role'))
        };

        // Si hay token y datos completos del usuario
        if (token && userData.id && userData.role) {
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname]);

  // Mostrar spinner mientras verifica autenticación
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si la ruta requiere autenticación
  if (requireAuth) {
    // Usuario no autenticado -> redirigir al login
    if (!user) {
      console.log('🚫 Usuario no autenticado, redirigiendo al login');
      return <Navigate to="/" replace state={{ from: location }} />;
    }

    // Verificar roles si se especificaron
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      console.log(`🚫 Usuario sin permisos (rol: ${user.role}), roles permitidos: ${allowedRoles}`);
      
      // Mostrar página de acceso denegado con información detallada
      return (
        <AccessDenied 
          userRole={user.role}
          attemptedRoute={location.pathname}
          message={`Esta sección requiere permisos de: ${allowedRoles.map(role => {
            const roleNames = { 1: 'Vendedor', 2: 'Supervisor', 3: 'Administrador', 4: 'Back Office' };
            return roleNames[role];
          }).join(', ')}`}
        />
      );
    }

    // Usuario autenticado y con permisos -> mostrar contenido
    return children;
  } 
  
  // Si la ruta NO requiere autenticación (páginas públicas)
  else {
    // Usuario ya autenticado tratando de acceder a login/register -> redirigir a su dashboard
    if (user) {
      console.log('🔄 Usuario ya autenticado, redirigiendo a dashboard');
      
      const roleRedirects = {
        1: '/vendedor',           // VENDEDOR
        2: '/supervisor',         // SUPERVISOR
        3: '/admin',              // ADMIN
        4: '/backoffice'          // BACK_OFFICE
      };
      
      const userDashboard = roleRedirects[user.role] || '/unknown-role';
      return <Navigate to={userDashboard} replace />;
    }

    // Usuario no autenticado en página pública -> mostrar contenido
    return children;
  }
};

// 🛡️ HOC para rutas que requieren autenticación
export const withAuth = (Component, allowedRoles = []) => {
  return (props) => (
    <ProtectedRoute requireAuth={true} allowedRoles={allowedRoles}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// 🚪 HOC para rutas públicas (que redirigen si ya están autenticados)
export const withGuest = (Component) => {
  return (props) => (
    <ProtectedRoute requireAuth={false}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// 🎯 Componentes específicos por rol
export const BackOfficeRoute = ({ children }) => (
  <ProtectedRoute requireAuth={true} allowedRoles={[4]}>
    {children}
  </ProtectedRoute>
);

export const AdminRoute = ({ children }) => (
  <ProtectedRoute requireAuth={true} allowedRoles={[3]}>
    {children}
  </ProtectedRoute>
);

export const SupervisorRoute = ({ children }) => (
  <ProtectedRoute requireAuth={true} allowedRoles={[2, 3]}>
    {children}
  </ProtectedRoute>
);

export const VendedorRoute = ({ children }) => (
  <ProtectedRoute requireAuth={true} allowedRoles={[1, 2, 3]}>
    {children}
  </ProtectedRoute>
);

export const GuestRoute = ({ children }) => (
  <ProtectedRoute requireAuth={false}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
