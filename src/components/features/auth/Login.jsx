import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import Swal from "sweetalert2";
import { ENDPOINTS, API_URL } from "../../config";
import logoCoberWhite from "../../../assets/img/logo-cober-white.svg";
// 👇 Importa el icono que prefieras (FontAwesome en este ejemplo)
import { FaEye, FaEyeSlash } from "react-icons/fa";

// 🔐 Importar el contexto de autenticación
import { useAuth } from "../../common/AuthContext";

const ROLES = {
  VENDEDOR: 1,
  SUPERVISOR: 2,
  ADMIN: 3,
  BACK_OFFICE: 4,
};

const Login = () => {
  // 🔐 Usar el contexto de autenticación
  const { login: authLogin } = useAuth();
  
  // 🔐 Hook de reCAPTCHA v3
  const { executeRecaptcha } = useGoogleReCaptcha();
  
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showAlert = (icon, title, text) => {
    return Swal.fire({
      icon,
      title,
      text,
      confirmButtonColor: "#3085d6",
      timer: 1800,
      showConfirmButton: false,
      timerProgressBar: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // � Verificar que reCAPTCHA esté disponible
    if (!executeRecaptcha) {
      showAlert("warning", "Verificación requerida", "reCAPTCHA no está listo. Por favor, recarga la página.");
      return;
    }
    
    setLoading(true);

    try {
      // 🔐 Ejecutar reCAPTCHA v3 antes del login
      const recaptchaToken = await executeRecaptcha('login');
      
      // Incluir el token de reCAPTCHA en la petición
      const response = await axios.post(`${ENDPOINTS.AUTH}/login`, {
        ...formData,
        recaptchaToken
      });
      const { token, role, user } = response.data;
      
      const loginTime = new Date().toISOString();

      // Crear sesión en el backend
      let sessionId = null;
      try {
        const sessionRes = await axios.post(
          `${API_URL}/sessions/start`,
          {
            login_time: loginTime,
            user_agent: navigator.userAgent
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        sessionId = sessionRes.data.sessionId;
      } catch (sessionError) {
        console.error("Error registrando sesión:", sessionError);
      }

      // Preparar datos del usuario para el contexto
      const userData = {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        sessionId: sessionId,
        loginTime: loginTime
      };

      // Usar el método login del contexto
      const loginSuccess = authLogin(userData, token);
      
      if (loginSuccess) {
        await showAlert("success", "¡Bienvenido!", "Has iniciado sesión correctamente");

        // Navegar según el rol
        if (role === ROLES.ADMIN) {
          navigate("/admin-dashboard", { replace: true });
        } else if (role === ROLES.BACK_OFFICE) {
          navigate("/backoffice", { replace: true });
        } else if (role === ROLES.SUPERVISOR) {
          navigate("/supervisor-dashboard", { replace: true });
        } else if (role === ROLES.VENDEDOR) {
          navigate("/prospectos-dashboard", { replace: true });
        }
      } else {
        throw new Error("Error en el proceso de autenticación");
      }

    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error en el inicio de sesión";
      showAlert("error", "Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <div className="card shadow-lg" style={{ width: "500px", maxWidth: "90%", borderRadius: "20px", overflow: "hidden" }}>
        <div className="card-header bg-primary text-white text-center py-3" 
             style={{ borderTopLeftRadius: "20px", borderTopRightRadius: "20px" }}>
          <div className="mb-3">
            <img 
              src={logoCoberWhite} 
              alt="COBER Salud" 
              style={{ 
                height: "50px", 
                width: "auto",
                filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))"
              }}
            />
          </div>
          <h4 className="mb-0 login">Iniciar Sesión</h4>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Correo Electrónico</label>
              <input 
                type="email" 
                name="email" 
                className="form-control" 
                onChange={handleChange} 
                placeholder="ejemplo@correo.com"
                required 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Contraseña</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-control"
                  onChange={handleChange}
                  placeholder="Ingresa tu contraseña"
                  required
                  style={{ paddingRight: "40px" }}
                />
                <span
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "#888",
                    zIndex: 2
                  }}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  tabIndex={0}
                  role="button"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>
            
            <div className="d-grid gap-2">
              <button 
                type="submit" 
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ borderRadius: "12px" }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Verificando...
                  </>
                ) : "Iniciar Sesión"}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="mb-2">¿No tienes una cuenta? <Link to="/register" className="text-decoration-none">Regístrate</Link></p>
            <p>¿Olvidaste tu contraseña? <Link to="/reset" className="text-decoration-none">Recupérala aquí</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;