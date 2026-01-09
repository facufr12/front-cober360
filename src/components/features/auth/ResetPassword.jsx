import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { ENDPOINTS } from "../../config";
import logoCoberWhite from "../../../assets/img/logo-cober-white.svg";
// 👇 Importa los íconos
import { FaEye, FaEyeSlash, FaCheck, FaTimes } from "react-icons/fa";


const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    // 👇 Estados para mostrar/ocultar contraseñas
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConf, setShowPasswordConf] = useState(false);
    // 👇 Estado para mostrar indicadores de contraseña
    const [showPasswordIndicators, setShowPasswordIndicators] = useState(false);

    // 📋 Función para validar requisitos de contraseña
    const getPasswordRequirements = (password) => {
        return {
            length: password.length >= 8 && password.length <= 128,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };
    };

    // 💪 Función para calcular fortaleza de contraseña
    const getPasswordStrength = (password) => {
        const requirements = getPasswordRequirements(password);
        const metRequirements = Object.values(requirements).filter(Boolean).length;
        
        if (metRequirements === 0) return { level: 0, text: "", color: "" };
        if (metRequirements <= 2) return { level: 1, text: "Débil", color: "#dc3545" };
        if (metRequirements <= 3) return { level: 2, text: "Regular", color: "#ffc107" };
        if (metRequirements <= 4) return { level: 3, text: "Buena", color: "#fd7e14" };
        return { level: 4, text: "Muy fuerte", color: "#198754" };
    };

    // 🎨 Componente indicador de requisito
    const PasswordRequirement = ({ met, text }) => (
        <div className="d-flex align-items-center mb-1" style={{ fontSize: "0.875rem" }}>
            {met ? (
                <FaCheck className="text-success me-2" />
            ) : (
                <FaTimes className="text-danger me-2" />
            )}
            <span className={met ? "text-success" : "text-muted"}>{text}</span>
        </div>
    );

    // 📊 Componente barra de fortaleza
    const PasswordStrengthBar = ({ strength }) => (
        <div className="mt-2">
            <div className="d-flex justify-content-between align-items-center mb-1">
                <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>Fortaleza:</span>
                <span style={{ 
                    fontSize: "0.875rem", 
                    fontWeight: "600", 
                    color: strength.color 
                }}>
                    {strength.text}
                </span>
            </div>
            <div style={{ 
                height: "6px", 
                backgroundColor: "#e9ecef", 
                borderRadius: "3px",
                overflow: "hidden"
            }}>
                <div style={{
                    height: "100%",
                    width: `${(strength.level / 4) * 100}%`,
                    backgroundColor: strength.color,
                    transition: "all 0.3s ease"
                }}></div>
            </div>
        </div>
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Limpiar error cuando el usuario está escribiendo
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null
            });
        }

        // Mostrar indicadores cuando el usuario comienza a escribir la contraseña
        if (name === "password") {
            setShowPasswordIndicators(value.length > 0);
        }

        // Validar confirmación de contraseña en tiempo real
        if (name === "confirmPassword" || 
            (name === "password" && formData.confirmPassword)) {
            const password = name === "password" ? value : formData.password;
            const confirmation = name === "confirmPassword" ? value : formData.confirmPassword;
            
            if (password && confirmation && password !== confirmation) {
                setErrors({
                    ...errors,
                    confirmPassword: "Las contraseñas no coinciden"
                });
            } else {
                setErrors({
                    ...errors,
                    confirmPassword: null
                });
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        // Validar requisitos de contraseña
        const requirements = getPasswordRequirements(formData.password);
        if (!requirements.length) {
            newErrors.password = "La contraseña debe tener entre 8 y 128 caracteres";
        } else if (!requirements.lowercase) {
            newErrors.password = "La contraseña debe contener al menos una letra minúscula";
        } else if (!requirements.uppercase) {
            newErrors.password = "La contraseña debe contener al menos una letra mayúscula";
        } else if (!requirements.number) {
            newErrors.password = "La contraseña debe contener al menos un número";
        } else if (!requirements.special) {
            newErrors.password = "La contraseña debe contener al menos un símbolo especial";
        }
        
        // Validar que las contraseñas coincidan
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Las contraseñas no coinciden";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validar el formulario antes de enviar
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        
        try {
            const response = await axios.post(
                `${ENDPOINTS.AUTH}/reset-password/${token}`,
                { password: formData.password } // Corregido: usar 'password' en lugar de 'newPassword'
            );
            
            await Swal.fire({
                icon: "success",
                title: "¡Contraseña actualizada!",
                text: response.data.message || "Tu contraseña ha sido restablecida correctamente.",
                confirmButtonColor: "#3085d6"
            });
            
            // Redirigir después de éxito (respetando basename /afiliaciones)
            navigate("/", { replace: true });
            
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.response?.data?.message || "Error al restablecer la contraseña",
                confirmButtonColor: "#3085d6"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", background: "#f8f9fa" }}>
            <div className="card shadow-lg" style={{ width: "600px", maxWidth: "90%", borderRadius: "20px", overflow: "hidden" }}>
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
                    <h4 className="login mb-0">Restablecer Contraseña</h4>
                </div>
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">Nueva Contraseña</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Contraseña segura"
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
                                {errors.password && (
                                    <div className="invalid-feedback">
                                        {errors.password}
                                    </div>
                                )}
                            </div>

                            {/* 📋 Indicadores de requisitos de contraseña */}
                            {showPasswordIndicators && (
                                <div className="mt-2 p-3" style={{ 
                                    backgroundColor: "#f8f9fa", 
                                    borderRadius: "8px", 
                                    border: "1px solid #e9ecef" 
                                }}>
                                    {/* Barra de fortaleza */}
                                    <PasswordStrengthBar strength={getPasswordStrength(formData.password)} />
                                    
                                    <div className="mb-2 mt-3" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#495057" }}>
                                        Requisitos de contraseña:
                                    </div>
                                    {(() => {
                                        const requirements = getPasswordRequirements(formData.password);
                                        return (
                                            <>
                                                <PasswordRequirement 
                                                    met={requirements.length} 
                                                    text="Entre 8 y 128 caracteres" 
                                                />
                                                <PasswordRequirement 
                                                    met={requirements.lowercase} 
                                                    text="Al menos una letra minúscula (a-z)" 
                                                />
                                                <PasswordRequirement 
                                                    met={requirements.uppercase} 
                                                    text="Al menos una letra mayúscula (A-Z)" 
                                                />
                                                <PasswordRequirement 
                                                    met={requirements.number} 
                                                    text="Al menos un número (0-9)" 
                                                />
                                                <PasswordRequirement 
                                                    met={requirements.special} 
                                                    text="Al menos un símbolo especial (!@#$%^&*)" 
                                                />
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                        
                        <div className="mb-4">
                            <label htmlFor="confirmPassword" className="form-label">Confirmar Nueva Contraseña</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type={showPasswordConf ? "text" : "password"}
                                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="Repite tu nueva contraseña"
                                    style={{ paddingRight: "40px" }}
                                />
                                <span
                                    onClick={() => setShowPasswordConf((prev) => !prev)}
                                    style={{
                                        position: "absolute",
                                        right: "10px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        cursor: "pointer",
                                        color: "#888",
                                        zIndex: 2
                                    }}
                                    aria-label={showPasswordConf ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    tabIndex={0}
                                    role="button"
                                >
                                    {showPasswordConf ? <FaEyeSlash /> : <FaEye />}
                                </span>
                                {errors.confirmPassword && (
                                    <div className="invalid-feedback">
                                        {errors.confirmPassword}
                                    </div>
                                )}
                            </div>
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
                                        Procesando...
                                    </>
                                ) : "Restablecer Contraseña"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;