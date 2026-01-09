// URL base de la API
export const API_URL = "https://wspflows.cober.online/api";

// URL local para desarrollo y monitoreo
export const LOCAL_API_URL = "http://localhost:4000";

// URL base para WebSocket (sin /api al final)
export const WS_URL = "https://wspflows.cober.online";
export const LOCAL_WS_URL = "http://localhost:4000";

// Endpoints específicos
export const ENDPOINTS = {
    AUTH: `${API_URL}/auth`, // Módulo de autenticación
    ADMIN: `${API_URL}/admin`, // Módulo de administración
    PROSPECTOS: `${API_URL}/prospectos`, // Módulo de administración
    TIPOS_AFILIACION: `${API_URL}/tipos_afiliacion`, // Tipos de afiliación
    LEAD: `${API_URL}/lead`, // Endpoint para guardar leads
    PERFORMANCE: `${LOCAL_API_URL}/performance`, // Endpoint para métricas de performance
    BASE_URL: WS_URL, // ✅ URL base para WebSocket
};
