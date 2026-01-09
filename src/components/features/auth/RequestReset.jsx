import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { ENDPOINTS } from "../../config";
import logoCoberWhite from "../../../assets/img/logo-cober-white.svg";


const RequestReset = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validación básica de email
        if (!email.includes("@") || !email.includes(".")) {
            Swal.fire({
                icon: "error",
                title: "Email inválido",
                text: "Por favor ingresa un correo electrónico válido",
                confirmButtonColor: "#3085d6"
            });
            return;
        }

        setLoading(true);
        
        try {
            const response = await axios.post(
                `${ENDPOINTS.AUTH}/request-password-reset`,
                { email }
            );
            
            await Swal.fire({
                icon: "success",
                title: "¡Solicitud enviada!",
                html: `
                    <p>${response.data.message || 'Hemos enviado un enlace de recuperación a tu correo electrónico.'}</p>
                    <small class="text-muted">Si no lo ves en tu bandeja principal, revisa la carpeta de spam.</small>
                `,
                confirmButtonColor: "#3085d6"
            });
            
            // Limpiar el formulario después del éxito
            setEmail("");
            
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.response?.data?.message || "Error al solicitar el restablecimiento de contraseña",
                confirmButtonColor: "#3085d6"
            });
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
                    <h4 className="login mb-0">Recuperar Contraseña</h4>
                </div>
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="email" className="form-label">Correo Electrónico</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Ingresa tu correo registrado"
                            />
                        </div>
                        <div className="d-grid">
                            <button 
                                type="submit" 
                                className="btn btn-primary btn-lg"
                                disabled={loading}
                                style={{ borderRadius: "12px" }}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Enviando...
                                    </>
                                ) : "Enviar Instrucciones"}
                            </button>
                        </div>
                        <div className="mt-3 text-center">
                            <small className="text-muted">
                                Te enviaremos un enlace para restablecer tu contraseña.
                            </small>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RequestReset;