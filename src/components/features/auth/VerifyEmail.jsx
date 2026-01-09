import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { ENDPOINTS } from "../../config";


const VerifyEmail = () => {
  const { token } = useParams();
  const [verificationStatus, setVerificationStatus] = useState("pending"); // "pending", "loading", "success", "error"
  const [message, setMessage] = useState("");

  const handleVerification = async () => {
    setVerificationStatus("loading");
    
    try {
      // Hacer la petición al backend para verificar el token
      const response = await axios.get(`${ENDPOINTS.AUTH}/verify/${token}`);
      
      setVerificationStatus("success");
      setMessage(response.data.message || "Tu cuenta ha sido verificada correctamente.");
      
      // Mostrar alerta de éxito
      Swal.fire({
        icon: "success",
        title: "¡Verificación exitosa!",
        text: response.data.message || "Tu cuenta ha sido verificada correctamente.",
        confirmButtonColor: "#3085d6",
      });

         // Esperar 2 segundos y redirigir a la ruta raíz
    setTimeout(() => {
        window.location.href = "/";
      }, 2000);
      
    } catch (error) {
      setVerificationStatus("error");
      setMessage(error.response?.data?.message || "No se pudo verificar tu cuenta. El enlace podría haber expirado.");
      
      // Mostrar alerta de error
      Swal.fire({
        icon: "error",
        title: "Error de verificación",
        text: error.response?.data?.message || "No se pudo verificar tu cuenta. El enlace podría haber expirado.",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <div className="card shadow-lg" style={{ width: "500px", maxWidth: "90%", borderRadius: "20px", overflow: "hidden" }}>
        <div 
          className={`card-header text-white text-center py-3 ${
            verificationStatus === 'success' ? 'bg-success' : 
            verificationStatus === 'error' ? 'bg-danger' : 
            'bg-primary'
          }`}
          style={{ borderTopLeftRadius: "20px", borderTopRightRadius: "20px" }}
        >
          <h4 className="mb-0">
            {verificationStatus === "pending" && "Verificación de cuenta"}
            {verificationStatus === "loading" && "Verificando cuenta..."}
            {verificationStatus === "success" && "¡Cuenta verificada!"}
            {verificationStatus === "error" && "Error de verificación"}
          </h4>
        </div>
        <div className="card-body p-4 text-center">
          {verificationStatus === "pending" && (
            <div className="my-4">
              <div className="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" className="bi bi-envelope-check text-primary" viewBox="0 0 16 16">
                  <path d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l7-4.2V8.5a.5.5 0 0 0 1 0V4a2 2 0 0 0-2-2H2Zm3.708 6.208L1 11.105V5.383l4.708 2.825ZM1 4.217V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.217l-7 4.2-7-4.2Z"/>
                  <path d="M16 12.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-1.993-1.679a.5.5 0 0 0-.686.172l-1.17 1.95-.547-.547a.5.5 0 0 0-.708.708l.774.773a.75.75 0 0 0 1.174-.144l1.335-2.226a.5.5 0 0 0-.172-.686Z"/>
                </svg>
              </div>
              <h5 className="mb-3">¡Estás a un paso de completar tu registro!</h5>
              <p>Para verificar tu cuenta, por favor haz clic en el botón de abajo.</p>
              <div className="mt-4">
                <button 
                  onClick={handleVerification} 
                  className="btn btn-primary btn-lg" 
                  style={{ borderRadius: "12px" }}
                >
                  Verificar mi cuenta
                </button>
              </div>
            </div>
          )}
          
          {verificationStatus === "loading" && (
            <div className="my-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-3">Estamos verificando tu cuenta, por favor espera...</p>
            </div>
          )}
          
          {verificationStatus === "success" && (
            <div className="my-4">
              <div className="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" className="bi bi-check-circle-fill text-success" viewBox="0 0 16 16">
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                </svg>
              </div>
              <h5 className="mb-3">¡Tu cuenta ha sido verificada con éxito!</h5>
              <p>{message}</p>
              <div className="mt-4">
                <Link to="/login" className="btn btn-success btn-lg" style={{ borderRadius: "12px" }}>
                  Iniciar sesión
                </Link>
              </div>
            </div>
          )}
          
          {verificationStatus === "error" && (
            <div className="my-4">
              <div className="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" className="bi bi-x-circle-fill text-danger" viewBox="0 0 16 16">
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
                </svg>
              </div>
              <h5 className="mb-3">No pudimos verificar tu cuenta</h5>
              <p>{message}</p>
              <div className="mt-4">
                <Link to="/login" className="btn btn-primary me-2" style={{ borderRadius: "12px" }}>
                  Ir al inicio de sesión
                </Link>
                <Link to="/resend-verification" className="btn btn-outline-primary" style={{ borderRadius: "12px" }}>
                  Solicitar nuevo enlace
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;