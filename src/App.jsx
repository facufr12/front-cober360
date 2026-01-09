import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

// ✅ IMPORTAR GESTOR GLOBAL DE SESIÓN EXPIRADA
import sessionExpiredManager from './utils/sessionExpiredManager';

import NavBar from './components/common/NavBar';
import PWAStatus from './components/common/PWAStatus';
import SessionManager from './components/common/SessionManager';
import Login from "./components/features/auth/Login";
import Register from "./components/features/auth/Register";
import AdminDashboard from "./components/features/admin/AdminDashboard";
import ProspectosDashboard from "./components/features/vendedor/ProspectosDashboard";
import SupervisorDashboard from "./components/features/supervisor/SupervisorDashboard";
import BackOfficeDashboard from "./components/features/backoffice/BackOfficeDashboard";
import SupervisoresBackOffice from "./components/features/backoffice/SupervisoresBackOffice";
import VendedoresBackOffice from "./components/features/backoffice/VendedoresBackOffice";
import DetalleSupervisor from "./components/features/backoffice/DetalleSupervisor";
import UnknownRole from "./components/UnknownRole";
import ResetPassword from "./components/features/auth/ResetPassword"; 
import RequestReset from "./components/features/auth/RequestReset";
import VerifyEmail from "./components/features/auth/VerifyEmail";
import FormularioLead from "./components/features/lead/FormularioLead";
import SupervisorResumen from "./components/features/supervisor/SupervisorResumen";
import ProspectoDetalle from "./components/features/vendedor/ProspectoDetalle";
import AccessDenied from "./components/common/AccessDenied";

// Importar hooks para manejar la visibilidad de la página
import { usePageVisibility, useIsMobile } from './hooks/usePageVisibility';

// 🎯 Importar hook para tracking de actividad
import useUserActivity from './hooks/useUserActivity';

// 🛡️ Importar componentes de protección de rutas
import { 
  AdminRoute, 
  BackOfficeRoute,
  SupervisorRoute, 
  VendedorRoute, 
  GuestRoute 
} from './components/common/ProtectedRoute';

// 🔔 Importar el proveedor de notificaciones
import { NotificationProvider } from './contexts/NotificationContext';

// 🔐 Importar el proveedor de autenticación
import { AuthProvider } from './components/common/AuthContext';

// 🔔 Importar inicializador de notificaciones push FCM
import NotificationsInitializer from './components/common/NotificationsInitializer';

function App() {
  const { isVisible } = usePageVisibility();
  const isMobile = useIsMobile();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 🎯 Hook para mantener actividad del usuario (envía heartbeats cada 2 minutos)
  const { sendManualHeartbeat, isUserActive } = useUserActivity(2);

  // 🔐 Verificar autenticación inicial
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    
    // Si hay token, enviar heartbeat inicial
    if (token) {
      setTimeout(() => {
        sendManualHeartbeat();
      }, 1000); // Esperar 1 segundo para que la app esté lista
    }
  }, [sendManualHeartbeat]);

  // 🚪 Manejar sesión expirada
  const handleSessionExpired = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  // ✅ REMOVIDO: Hook que causaba re-render completo
  // useAppResume(() => {
  //   console.log('📱 App resumed - refrescando estado');
  //   setIsAppReady(false);
  //   setTimeout(() => {
  //     setIsAppReady(true);
  //   }, 50);
  // });
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        // Detecta sesión expirada o token inválido
        if (
          error.response &&
          (error.response.status === 401 || error.response.status === 403) &&
          (
            error.response.data?.message === "Token no proporcionado" ||
            error.response.data?.message === "Token inválido"
          )
        ) {
          // ✅ USAR GESTOR GLOBAL PARA EVITAR MÚLTIPLES MODALES
          const shouldShow = sessionExpiredManager.handleExpired('Interceptor Axios');
          
          if (shouldShow) {
            Swal.fire({
              icon: "warning",
              title: "Sesión expirada",
              text: "Tu sesión ha finalizado. Por favor, inicia sesión nuevamente.",
              confirmButtonText: "Ir al login",
              allowOutsideClick: false,
              allowEscapeKey: false,
              didOpen: () => {
                console.log('✅ Modal de sesión expirada abierto (Interceptor Axios)');
              },
              didClose: () => {
                console.log('✅ Modal de sesión expirada cerrado (Interceptor Axios)');
              }
            }).then(() => {
              handleSessionExpired();
            });
          } else {
            // Solo hacer cleanup sin mostrar modal
            handleSessionExpired();
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // ✅ REMOVIDO: Pantalla de carga que causaba re-mount
  // if (!isAppReady || isResuming) {
  //   return (
  //     <div className="app-loading d-flex justify-content-center align-items-center" 
  //          style={{ 
  //            height: '100vh', 
  //            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  //            color: 'white'
  //          }}>
  //       <div className="text-center">
  //         <div className="spinner-border mb-3" role="status">
  //           <span className="visually-hidden">Cargando...</span>
  //         </div>
  //         <h5>
  //           {isResuming ? 'Restaurando aplicación...' : 'Cargando...'}
  //         </h5>
  //         {isMobile && (
  //           <small className="text-light">Optimizando para móvil</small>
  //         )}
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          {/* 🔔 Inicializador de notificaciones push */}
          <NotificationsInitializer isAuthenticated={isAuthenticated} />
          
          <div className="app">
            {/* NavBar global */}
            <NavBar />
            
            {/* PWA Status (solo en desarrollo) */}
            <PWAStatus />
            
            {/* 🛡️ Gestor de Sesiones */}
            <SessionManager 
              isAuthenticated={isAuthenticated}
              onSessionExpired={handleSessionExpired}
            />
            
            {/* Contenido principal con margen superior */}
            <div style={{ marginTop: '70px', minHeight: 'calc(100vh - 70px)' }}>
              <Routes>
              {/* 🚪 RUTAS PÚBLICAS (solo para usuarios NO autenticados) */}
              <Route path="/" element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              } />
              
              <Route path="/register" element={
                <GuestRoute>
                  <Register />
                </GuestRoute>
              } />
              
              <Route path="/reset" element={
                <GuestRoute>
                  <RequestReset />
                </GuestRoute>
              } />
              
              <Route path="/reset-password/:token" element={
                <GuestRoute>
                  <ResetPassword />
                </GuestRoute>
              } />
              
              <Route path="/verify-email/:token" element={
                <GuestRoute>
                  <VerifyEmail />
                </GuestRoute>
              } />

              {/* 🎯 FORMULARIO LEAD (Público - Sin autenticación) */}
              <Route path="/formulario-lead" element={<FormularioLead />} />

              {/* 🛡️ RUTAS PROTEGIDAS POR ROL */}
              
              {/* 🏢 RUTAS DE BACK OFFICE (Solo rol 4) */}
              <Route path="/backoffice" element={
                <BackOfficeRoute>
                  <BackOfficeDashboard />
                </BackOfficeRoute>
              } />
              
              <Route path="/backoffice/dashboard" element={
                <BackOfficeRoute>
                  <BackOfficeDashboard />
                </BackOfficeRoute>
              } />
              
              <Route path="/backoffice/supervisores" element={
                <BackOfficeRoute>
                  <SupervisoresBackOffice />
                </BackOfficeRoute>
              } />
              
              <Route path="/backoffice/supervisores/:id" element={
                <BackOfficeRoute>
                  <DetalleSupervisor />
                </BackOfficeRoute>
              } />
              
              <Route path="/backoffice/vendedores" element={
                <BackOfficeRoute>
                  <VendedoresBackOffice />
                </BackOfficeRoute>
              } />
              
              {/* 👨‍💼 RUTAS DE ADMINISTRADOR (Solo rol 3) */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              
              <Route path="/admin-dashboard" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />

              {/* 👨‍💼 RUTAS DE SUPERVISOR (Roles 2 y 3) */}
              <Route path="/supervisor" element={
                <SupervisorRoute>
                  <SupervisorDashboard />
                </SupervisorRoute>
              } />
              
              <Route path="/supervisor-dashboard" element={
                <SupervisorRoute>
                  <SupervisorDashboard />
                </SupervisorRoute>
              } />
              
              <Route path="/supervisor-resumen" element={
                <SupervisorRoute>
                  <SupervisorResumen />
                </SupervisorRoute>
              } />

              {/* 👨‍💼 RUTAS DE VENDEDOR (Roles 1, 2 y 3) */}
              <Route path="/vendedor" element={
                <VendedorRoute>
                  <ProspectosDashboard />
                </VendedorRoute>
              } />
              
              <Route path="/prospectos-dashboard" element={
                <VendedorRoute>
                  <ProspectosDashboard />
                </VendedorRoute>
              } />
              
              <Route path="/prospectos" element={
                <VendedorRoute>
                  <ProspectosDashboard />
                </VendedorRoute>
              } />
              
              <Route path="/prospectos/:id" element={
                <VendedorRoute>
                  <ProspectoDetalle />
                </VendedorRoute>
              } />

              {/* 🚫 RUTAS DE ERROR */}
              <Route path="/unknown-role" element={<UnknownRole />} />
              <Route path="/access-denied" element={<AccessDenied />} />
              
              {/* 🎯 RUTA 404 - Catch All */}
              <Route path="*" element={
                <div className="container mt-5 text-center">
                  <h2>🚧 En Desarrollo</h2>
                  <p>Esta funcionalidad se encuentra en desarrollo.</p>
                </div>
              } />
            </Routes>
          </div>
        </div>
      </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
