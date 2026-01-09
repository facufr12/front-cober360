import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { API_URL } from '../config';
// import { registerFcmToken, unregisterFcmToken } from '../../push/fcm';

// 🔐 Crear contexto de autenticación
const AuthContext = createContext();

// 🪝 Hook para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

// 🛡️ Proveedor de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // 🔍 Verificar autenticación al cargar
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // ✅ Verificar estado de autenticación
  const checkAuthStatus = () => {
    try {
      const token = localStorage.getItem('token');
      const userData = {
        id: localStorage.getItem('user_id'),
        firstName: localStorage.getItem('first_name'),
        lastName: localStorage.getItem('last_name'),
        email: localStorage.getItem('user_email'),
        role: parseInt(localStorage.getItem('user_role')),
        sessionId: localStorage.getItem('sessionId'),
        loginTime: localStorage.getItem('loginTime')
      };

      if (token && userData.id && userData.role) {
        setUser(userData);
        setIsAuthenticated(true);
        
        // Configurar header de autorización global
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Registrar FCM en segundo plano si no hay token registrado
        try {
          registerFcmToken(async () => localStorage.getItem('token'));
        } catch (e) {
          console.warn('FCM no pudo registrarse en checkAuthStatus:', e);
        }
      } else {
        clearAuthData();
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  // 🔐 Función de login
  const login = (userData, token) => {
    try {
      // Guardar en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user_id', userData.id);
      localStorage.setItem('first_name', userData.firstName);
      localStorage.setItem('last_name', userData.lastName);
      localStorage.setItem('user_email', userData.email);
      localStorage.setItem('user_role', userData.role);
      localStorage.setItem('sessionId', userData.sessionId);
      localStorage.setItem('loginTime', userData.loginTime);

      // Actualizar estado
      setUser(userData);
      setIsAuthenticated(true);

      // Configurar header global
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      console.log('✅ Login exitoso:', userData);

      // Registrar token FCM tras login
      try {
        registerFcmToken(async () => localStorage.getItem('token'));
      } catch (e) {
        console.warn('FCM no pudo registrarse tras login:', e);
      }
      return true;
    } catch (error) {
      console.error('❌ Error en login:', error);
      return false;
    }
  };

  // 🚪 Función de logout
  const logout = async (showMessage = true) => {
    try {
      const token = localStorage.getItem('token');
      const sessionId = localStorage.getItem('sessionId');
      const loginTime = localStorage.getItem('loginTime');

      // Intentar desregistrar FCM
      try {
        await unregisterFcmToken(async () => localStorage.getItem('token'));
      } catch (e) {
        console.warn('No se pudo desregistrar FCM en logout:', e);
      }

      // Intentar cerrar sesión en el backend
      if (token && sessionId && loginTime) {
        try {
          const logoutTime = new Date().toISOString();
          const sessionStartTime = new Date(loginTime);
          const sessionTimeSeconds = Math.floor((new Date() - sessionStartTime) / 1000);

          await axios.post(`${API_URL}/sessions/end`, {
            session_id: parseInt(sessionId),
            logout_time: logoutTime,
            session_time: sessionTimeSeconds
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          console.log('✅ Sesión cerrada exitosamente en el backend');
        } catch (error) {
          console.warn('⚠️ Error cerrando sesión en backend:', error);
        }
      }

      // Limpiar datos locales
      clearAuthData();

      if (showMessage) {
        Swal.fire({
          title: '✅ Sesión Cerrada',
          text: 'Has cerrado sesión exitosamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }

      // Redirigir al login
      navigate('/', { replace: true });

    } catch (error) {
      console.error('❌ Error en logout:', error);
      clearAuthData();
      navigate('/', { replace: true });
    }
  };

  // 🧹 Limpiar datos de autenticación
  const clearAuthData = () => {
    // Limpiar localStorage
    const keysToRemove = [
      'token', 'user_id', 'first_name', 'last_name', 
      'user_email', 'user_role', 'sessionId', 'loginTime'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Limpiar estado
    setUser(null);
    setIsAuthenticated(false);

    // Limpiar header global
    delete axios.defaults.headers.common['Authorization'];
  };

  // 🔄 Renovar sesión
  const renewSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/sessions/renew`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.renewed) {
        console.log('✅ Sesión renovada exitosamente');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error renovando sesión:', error);
      await logout(false);
      return false;
    }
  };

  // 🎯 Obtener dashboard por rol
  const getDashboardRoute = (role = user?.role) => {
    const roleRoutes = {
      1: '/vendedor',
      2: '/supervisor', 
      3: '/admin'
    };
    return roleRoutes[role] || '/unknown-role';
  };

  // 🛡️ Verificar permisos
  const hasPermission = (allowedRoles) => {
    if (!user || !isAuthenticated) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(user.role);
  };

  // 📊 Valor del contexto
  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    renewSession,
    checkAuthStatus,
    getDashboardRoute,
    hasPermission,
    clearAuthData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
