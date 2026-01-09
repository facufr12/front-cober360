import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { FaTachometerAlt, FaUserPlus, FaSignOutAlt, FaFile, FaChevronLeft, FaWhatsapp } from "react-icons/fa";

const VendedorSidebar = ({ vista, setVista, onNuevoProspecto, onCloseDrawer }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (onCloseDrawer) {
      onCloseDrawer();
    }
  };
  
  const handleSetVista = (nuevaVista) => {
    if (setVista) {
      setVista(nuevaVista);
    } else {
      navigate('/prospectos', { state: { vista: nuevaVista } });
    }
    if (onCloseDrawer) {
      onCloseDrawer();
    }
  };

  return (
    <div className="sidebar-vendedor h-100 d-flex flex-column">
      <div className="sidebar-header">
        <div className="d-flex align-items-center justify-content-between">
          <h5 className="sidebar-title mb-0">
            <FaTachometerAlt className="me-2" />
            Panel <span className="fw-light">Vendedor</span>
          </h5>
          {onCloseDrawer && (
            <Button 
              variant="light" 
              size="sm" 
              className="sidebar-close-btn d-md-none"
              onClick={onCloseDrawer}
            >
              <FaChevronLeft />
            </Button>
          )}
        </div>
      </div>
      
      {/* ✅ CAMBIO: Estructura flex mejorada */}
      <div className="sidebar-nav h-100 d-flex flex-column">
        {/* ✅ ÁREA DE NAVEGACIÓN (se expande automáticamente) */}
        <div className="flex-grow-1">
          <div className="nav-item">
            <button
              className={`nav-link w-100 text-start ${vista === "prospectos" ? "active" : ""}`}
              onClick={() => handleSetVista("prospectos")}
            >
              <FaTachometerAlt className="nav-icon" />
              <span className="nav-text">Dashboard Prospectos</span>
            </button>
          </div>
          
          <div className="nav-item">
            <button
              className={`nav-link w-100 text-start ${vista === "polizas" ? "active" : ""}`}
              onClick={() => handleSetVista("polizas")}
            >
              <FaFile className="nav-icon" />
              <span className="nav-text">Mis Pólizas</span>
            </button>
          </div>
          
          <div className="nav-item">
            <button
              className={`nav-link w-100 text-start ${vista === "whatsapp" ? "active" : ""}`}
              onClick={() => handleSetVista("whatsapp")}
            >
              <FaWhatsapp className="nav-icon" />
              <span className="nav-text">WhatsApp</span>
            </button>
          </div>
          
          <div className="nav-divider"></div>
          
          <div className="nav-item">
            <button
              className="nav-link nav-action w-100 text-start"
              onClick={() => onNuevoProspecto ? onNuevoProspecto() : handleNavigation("/prospectos/nuevo")}
            >
              <FaUserPlus className="nav-icon" />
              <span className="nav-text">Nuevo Prospecto</span>
            </button>
          </div>
        </div>
        
        {/* ✅ ÁREA INFERIOR FIJA (Perfil + Botón Logout) */}
        <div className="mt-auto">
          {/* <div className="nav-profile">
            <div className="profile-info">
              <div className="profile-avatar">
                {localStorage.getItem("first_name")?.charAt(0) || "V"}
              </div>
              <div className="profile-details">
                <p className="profile-name">
                  {localStorage.getItem("first_name")} {localStorage.getItem("last_name")}
                </p>
                <p className="profile-role">Vendedor</p>
              </div>
            </div>
          </div> */}
          
          {/* ✅ BOTÓN LOGOUT SIEMPRE VISIBLE */}
          {/* <div className="nav-item mt-3">
            <button
              className="nav-link nav-danger w-100 text-start"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="nav-icon" />
              <span className="nav-text">Cerrar Sesión</span>
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default VendedorSidebar;