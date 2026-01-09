import { useEffect, useState } from "react";
import axios from "axios";
import { ENDPOINTS } from "../../config";
import {
  Container, Row, Col, Card, Button, Modal, Form, Alert, Spinner, Badge, Table, InputGroup,
  DropdownButton, Dropdown, Nav, Tab
} from "react-bootstrap";
import { 
  FaUserPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSearch,
  FaEnvelope, FaPhone, FaUserTag, FaIdCard, FaSort, FaSortUp, FaSortDown, FaEye, FaLock,
  FaCalendarAlt, FaChartBar, FaUsers, FaWifi // ✅ Iconos necesarios
} from "react-icons/fa";
import Swal from "sweetalert2";
import ActiveUsersMonitor from "../../admin/ActiveUsersMonitor"; // ✅ Importar el componente
import '../../../assets/Style/responsive-1366.css'; // ✅ Importar estilos responsive

const ROLES = [
  { value: 1, label: "Vendedor", color: "primary" },
  { value: 2, label: "Supervisor", color: "success" },
  { value: 3, label: "Administrador", color: "danger" },
  { value: 4, label: "Back Office", color: "info" }
];

const UsuariosAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    role: 1,
    password: "", // ✅ Agregar campo password
  });
  const [alert, setAlert] = useState({ show: false, message: "", variant: "success" });
  const [tipoVista, setTipoVista] = useState(window.innerWidth <= 768 ? "tarjetas" : "tabla");
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [ordenPor, setOrdenPor] = useState("id");
  const [ordenDir, setOrdenDir] = useState("asc");
  const [verDetalle, setVerDetalle] = useState(false);
  const [userDetalle, setUserDetalle] = useState(null);
  const [modalAlert, setModalAlert] = useState({ show: false, message: "", variant: "success" });
  const [activeTab, setActiveTab] = useState("usuarios"); // ✅ Estado para las pestañas

  // ✅ AGREGAR: Funciones para formatear fechas
  const formatearFecha = (fecha) => {
    if (!fecha) return "No disponible";
    
    try {
      const date = new Date(fecha);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return "Fecha inválida";
      }
      
      // Formatear la fecha en español
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return "Error en fecha";
    }
  };

  // ✅ AGREGAR: Función para formatear fechas cortas
  const formatearFechaCorta = (fecha) => {
    if (!fecha) return "No disponible";
    
    try {
      const date = new Date(fecha);
      
      if (isNaN(date.getTime())) {
        return "Fecha inválida";
      }
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return "Error en fecha";
    }
  };

  // ✅ MEJORAR: Función para resetear formulario
  const resetFormData = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      role: 1,
      password: "" // ✅ Incluir password en reset
    });
  };

  // ✅ NUEVO: Función para validar contraseña en tiempo real
  const validatePassword = (password) => {
    const validations = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    const allValid = Object.values(validations).every(Boolean);
    
    return { validations, allValid };
  };

  useEffect(() => {
    fetchUsers();
    
    // Configurar vista responsiva automática
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setTipoVista("tarjetas");
      } else {
        setTipoVista("tabla");
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${ENDPOINTS.ADMIN}/list-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setAlert({ 
        show: true, 
        message: "No se pudieron cargar los usuarios. " + (error.response?.data?.message || error.message), 
        variant: "danger" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    setModalAlert({ show: false, message: "", variant: "success" });
    
    // ✅ NUEVO: Validación del lado del cliente para contraseña
    if (!selectedUser && formData.password) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.allValid) {
        setModalAlert({ 
          show: true, 
          message: "❌ La contraseña no cumple con todos los requisitos de seguridad. Por favor, revisa los criterios mostrados abajo.", 
          variant: "danger" 
        });
        return;
      }
    }
    
    try {
      setLoading(true);
      
      if (selectedUser) {
        console.log(`📝 Editando usuario ID: ${selectedUser.id}`, formData);
        
        // Para editar, no enviar password
        const { password, ...dataToUpdate } = formData;
        
        await axios.put(`${ENDPOINTS.ADMIN}/update-user/${selectedUser.id}`, dataToUpdate, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setModalAlert({ 
          show: true, 
          message: "✅ Usuario actualizado correctamente.", 
          variant: "success" 
        });
        
        setTimeout(() => {
          fetchUsers();
          resetFormData();
          setSelectedUser(null);
          setFormOpen(false);
          setModalAlert({ show: false, message: "", variant: "success" });
        }, 2000);
        
      } else {
        // Para crear, incluir password
        await axios.post(`${ENDPOINTS.ADMIN}/create-user`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setModalAlert({ 
          show: true, 
          message: "✅ Usuario creado correctamente. Se ha enviado un email de verificación.", 
          variant: "success" 
        });
        
        setTimeout(() => {
          fetchUsers();
          resetFormData();
          setSelectedUser(null);
          setFormOpen(false);
          setModalAlert({ show: false, message: "", variant: "success" });
        }, 2000);
      }
      
    } catch (error) {
      console.error("❌ Error al guardar usuario:", error);
      
      let errorMessage = "❌ No se pudo guardar el usuario.";
      
      if (error.response?.data?.errores) {
        errorMessage = "❌ " + error.response.data.errores.join(', ');
      } else if (error.response?.data?.message) {
        errorMessage = "❌ " + error.response.data.message;
      }
      
      setModalAlert({ 
        show: true, 
        message: errorMessage, 
        variant: "danger" 
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ MEJORAR: Eliminar usuario con confirmación avanzada
  const handleDelete = async (user) => {
    const token = localStorage.getItem("token");
    
    // Crear modal de confirmación personalizado con SweetAlert2
    const { isConfirmed, value } = await Swal.fire({
      title: '¿Eliminar Usuario?',
      html: `
        <div style="text-align: left;">
          <p><strong>📋 Usuario a eliminar:</strong></p>
          <ul style="margin: 10px 0;">
            <li><strong>Nombre:</strong> ${user.first_name} ${user.last_name}</li>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>Rol:</strong> ${ROLES.find(r => r.value === user.role)?.label}</li>
          </ul>
          <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 0; color: #856404;"><strong>⚠️ Advertencia:</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #856404;">
              Esta acción eliminará permanentemente al usuario y no se puede deshacer.
              Si el usuario tiene prospectos o pólizas asociadas, no podrá ser eliminado.
            </p>
          </div>
          <p style="margin: 10px 0;"><strong>Para confirmar, escribe:</strong> <code>ELIMINAR</code></p>
        </div>
      `,
      input: 'text',
      inputPlaceholder: 'Escribe ELIMINAR para confirmar',
      showCancelButton: true,
      confirmButtonText: '🗑️ Eliminar Usuario',
      cancelButtonText: '❌ Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      inputValidator: (value) => {
        if (value !== 'ELIMINAR') {
          return 'Debes escribir "ELIMINAR" para confirmar la acción'
        }
      },
      customClass: {
        popup: 'swal-wide'
      }
    });

    if (!isConfirmed || value !== 'ELIMINAR') {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await axios.delete(`${ENDPOINTS.ADMIN}/delete-user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Mostrar mensaje de éxito
      await Swal.fire({
        icon: 'success',
        title: '✅ Usuario Eliminado',
        text: `${user.first_name} ${user.last_name} ha sido eliminado exitosamente.`,
        confirmButtonColor: '#28a745',
        timer: 3000,
        timerProgressBar: true
      });
      
      // Actualizar la lista de usuarios
      setUsers(users.filter((u) => u.id !== user.id));
      
    } catch (error) {
      console.error("❌ Error al eliminar usuario:", error);
      
      let errorMessage = "No se pudo eliminar el usuario.";
      let suggestion = "";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      if (error.response?.data?.suggestion) {
        suggestion = error.response.data.suggestion;
      }
      
      // Mostrar error con opción de deshabilitar en su lugar
      const result = await Swal.fire({
        icon: 'error',
        title: '❌ Error al Eliminar',
        html: `
          <p>${errorMessage}</p>
          ${suggestion ? `<p style="color: #007bff; margin-top: 10px;"><strong>💡 Sugerencia:</strong> ${suggestion}</p>` : ''}
        `,
        showCancelButton: suggestion ? true : false,
        confirmButtonText: suggestion ? '🚫 Deshabilitar Usuario' : 'Entendido',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: suggestion ? '#ffc107' : '#007bff',
      });
      
      // Si tiene dependencias, ofrecer deshabilitar
      if (result.isConfirmed && suggestion) {
        await handleDisable(user);
      }
      
    } finally {
      setLoading(false);
    }
  };

  // ✅ AGREGAR: Deshabilitar usuario
  const handleDisable = async (user) => {
    const token = localStorage.getItem("token");
    
    const { isConfirmed } = await Swal.fire({
      title: '🚫 Deshabilitar Usuario',
      html: `
        <div style="text-align: left;">
          <p>¿Estás seguro de que quieres deshabilitar a <strong>${user.first_name} ${user.last_name}</strong>?</p>
          <div style="background: #d1ecf1; padding: 10px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 0; color: #0c5460;"><strong>ℹ️ Información:</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #0c5460;">
              El usuario no podrá iniciar sesión, pero sus datos y registros se conservarán.
              Podrás habilitarlo nuevamente en cualquier momento.
            </p>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '🚫 Deshabilitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#6c757d'
    });

    if (!isConfirmed) return;
    
    try {
      setLoading(true);
      
      await axios.put(`${ENDPOINTS.ADMIN}/disable-user/${user.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      await Swal.fire({
        icon: 'success',
        title: '🚫 Usuario Deshabilitado',
        text: `${user.first_name} ${user.last_name} ha sido deshabilitado exitosamente.`,
        confirmButtonColor: '#28a745',
        timer: 3000,
        timerProgressBar: true
      });
      
      fetchUsers(); // Recargar la lista
      
    } catch (error) {
      console.error("❌ Error al deshabilitar usuario:", error);
      
      const errorMessage = error.response?.data?.message || "No se pudo deshabilitar el usuario.";
      
      await Swal.fire({
        icon: 'error',
        title: '❌ Error',
        text: errorMessage,
        confirmButtonColor: '#dc3545'
      });
      
    } finally {
      setLoading(false);
    }
  };

  // ✅ AGREGAR: Función para habilitar usuario
  const handleEnable = async (userId) => {
    const token = localStorage.getItem("token");
    
    // Buscar el usuario en la lista para mostrar información
    const user = users.find(u => u.id === userId);
    if (!user) {
      await Swal.fire({
        icon: 'error',
        title: '❌ Error',
        text: 'Usuario no encontrado.',
        confirmButtonColor: '#dc3545'
      });
      return;
    }
    
    const { isConfirmed } = await Swal.fire({
      title: '✅ Habilitar Usuario',
      html: `
        <div style="text-align: left;">
          <p>¿Estás seguro de que quieres habilitar a <strong>${user.first_name} ${user.last_name}</strong>?</p>
          <div style="background: #d4edda; padding: 10px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 0; color: #155724;"><strong>ℹ️ Información:</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #155724;">
              El usuario podrá iniciar sesión nuevamente y acceder a todas sus funcionalidades.
              Se enviará un email de confirmación de habilitación.
            </p>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '✅ Habilitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d'
    });

    if (!isConfirmed) return;
    
    try {
      setLoading(true);
      
      await axios.put(`${ENDPOINTS.ADMIN}/enable-user/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      await Swal.fire({
        icon: 'success',
        title: '✅ Usuario Habilitado',
        text: `${user.first_name} ${user.last_name} ha sido habilitado exitosamente.`,
        confirmButtonColor: '#28a745',
        timer: 3000,
        timerProgressBar: true
      });
      
      fetchUsers(); // Recargar la lista
      
    } catch (error) {
      console.error("❌ Error al habilitar usuario:", error);
      
      const errorMessage = error.response?.data?.message || "No se pudo habilitar el usuario.";
      
      await Swal.fire({
        icon: 'error',
        title: '❌ Error',
        text: errorMessage,
        confirmButtonColor: '#dc3545'
      });
      
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    console.log('📝 Editando usuario:', user);
    setSelectedUser(user);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role,
      password: "" // ✅ No mostrar password existente
    });
    setModalAlert({ show: false, message: "", variant: "success" });
    setFormOpen(true);
  };

  const handleVerDetalle = (user) => {
    console.log('📋 Datos del usuario para detalle:', user); // ✅ Debug
    setUserDetalle(user);
    setVerDetalle(true);
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    resetFormData();
    setModalAlert({ show: false, message: "", variant: "success" });
    setFormOpen(true);
  };

  const handleCloseAlert = () => setAlert({ ...alert, show: false });
  const handleCloseModalAlert = () => {
    setModalAlert({ ...modalAlert, show: false });
  };

  const handleOrdenar = (campo) => {
    if (ordenPor === campo) {
      setOrdenDir(ordenDir === "asc" ? "desc" : "asc");
    } else {
      setOrdenPor(campo);
      setOrdenDir("asc");
    }
  };

  const usuariosFiltrados = users
    .filter(user => {
      const termino = busqueda.toLowerCase();
      const coincideBusqueda = 
        user.first_name.toLowerCase().includes(termino) ||
        user.last_name.toLowerCase().includes(termino) ||
        user.email.toLowerCase().includes(termino) ||
        (user.phone_number && user.phone_number.toLowerCase().includes(termino));
        
      const coincideRol = filtroRol === "" || user.role === parseInt(filtroRol);
      const coincideEstado = filtroEstado === "" || 
        (filtroEstado === "habilitado" && user.is_enabled) || 
        (filtroEstado === "deshabilitado" && !user.is_enabled);
        
      return coincideBusqueda && coincideRol && coincideEstado;
    })
    .sort((a, b) => {
      let valorA, valorB;
      
      switch (ordenPor) {
        case "nombre":
          valorA = a.first_name.toLowerCase();
          valorB = b.first_name.toLowerCase();
          break;
        case "apellido":
          valorA = a.last_name.toLowerCase();
          valorB = b.last_name.toLowerCase();
          break;
        case "email":
          valorA = a.email.toLowerCase();
          valorB = b.email.toLowerCase();
          break;
        case "rol":
          valorA = a.role;
          valorB = b.role;
          break;
        case "estado":
          valorA = a.is_enabled ? 1 : 0;
          valorB = b.is_enabled ? 1 : 0;
          break;
        default: // id
          valorA = a.id;
          valorB = b.id;
      }
      
      if (ordenDir === "asc") {
        return valorA > valorB ? 1 : -1;
      } else {
        return valorA < valorB ? 1 : -1;
      }
    });

  const getIconoOrden = (campo) => {
    if (ordenPor !== campo) return <FaSort className="ms-1 text-muted" size={12} />;
    return ordenDir === "asc" ? <FaSortUp className="ms-1 text-primary" size={12} /> : <FaSortDown className="ms-1 text-primary" size={12} />;
  };

  const getRoleBadge = (role) => {
    const rolInfo = ROLES.find(r => r.value === role) || { label: "Desconocido", color: "secondary" };
    return (
      <Badge className={`badge-outline-${rolInfo.color}`}>
        {rolInfo.label}
      </Badge>
    );
  };

  // ✅ Función para badge de estado con estilo outline
  const getEstadoBadge = (isEnabled) => {
    const estado = isEnabled ? "success" : "secondary";
    const label = isEnabled ? "HABILITADO" : "DESHABILITADO";
    
    return (
      <Badge className={`badge-outline-${estado}`}>
        {label}
      </Badge>
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <>
      {/* Estilos CSS personalizados para optimizar 1366x768 */}
      <style jsx>{`
        .usuarios-admin-responsive {
          max-width: 1366px;
          margin: 0 auto;
        }
        
        .usuarios-admin-responsive .table-responsive {
          max-height: 500px;
          overflow-y: auto;
        }
        
        .usuarios-admin-responsive .table th {
          position: sticky;
          top: 0;
          background: white;
          z-index: 10;
          box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.4);
        }
        
        .usuarios-card {
          transition: all 0.3s ease;
        }
        .usuarios-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
        }
        .table-responsive {
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .table-striped tbody tr:nth-of-type(odd) {
          background-color: rgba(0,0,0,0.02);
        }
        .badge {
          font-size: 0.75em;
        }
        
        @media (max-width: 1366px) {
          .table td, .table th {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .btn-group-compact .btn {
            padding: 0.2rem 0.3rem !important;
            font-size: 0.7rem !important;
            margin: 0.1rem !important;
          }
          
          .badge-compact {
            padding: 0.2rem 0.4rem !important;
            font-size: 0.65rem !important;
          }
          
          .table-compact {
            font-size: 0.75rem !important;
          }
          
          .table-compact td {
            padding: 0.4rem 0.6rem !important;
            vertical-align: middle !important;
          }
          
          .table-compact th {
            padding: 0.5rem 0.6rem !important;
            font-size: 0.8rem !important;
            font-weight: 600 !important;
          }
          
          .text-truncate-custom {
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            display: inline-block;
          }
        }
      `}</style>
      
      <Container fluid className="usuarios-admin-responsive" style={{ maxWidth: '1366px', margin: '0 auto' }}>
      {/* ✅ NUEVO: Navegación por pestañas */}
      <Card className="shadow-sm mb-2">
        <Card.Body className="pb-0">
          <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab}>
            <Nav.Item>
              <Nav.Link eventKey="usuarios">
                <FaUsers className="me-2" />
                Gestión de Usuarios
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="activos">
                <FaWifi className="me-2" />
                Usuarios Activos
                <Badge bg="success" className="ms-2">Tiempo Real</Badge>
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Body>
      </Card>

      {/* ✅ CONTENIDO DE LAS PESTAÑAS */}
      <Tab.Content>
        <Tab.Pane active={activeTab === "usuarios"}>
          {/* CONTENIDO ORIGINAL DE GESTIÓN DE USUARIOS */}
      {/* Barra de filtros y acciones */}
      <Card className="mb-4 card-no-border  filtros-admin-card">
        <Card.Body>
          <Row className="align-items-center mb-3">
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control
                  placeholder="Buscar por nombre, email o teléfono"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select 
                value={filtroRol} 
                onChange={(e) => setFiltroRol(e.target.value)}
                className="mb-2 mb-md-0"
              >
                <option value="">Todos los roles</option>
                {ROLES.map(rol => (
                  <option key={rol.value} value={rol.value}>{rol.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select 
                value={filtroEstado} 
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="mb-2 mb-md-0"
              >
                <option value="">Todos los estados</option>
                <option value="habilitado">Habilitados</option>
                <option value="deshabilitado">Deshabilitados</option>
              </Form.Select>
            </Col>
            <Col md={3} className="d-flex justify-content-end">
              <Button variant="success" onClick={handleOpenCreate}>
                <FaUserPlus className="me-1" /> Nuevo Usuario
              </Button>
            </Col>
          </Row>
          
          {alert.show && (
            <Alert variant={alert.variant} onClose={handleCloseAlert} dismissible>
              {alert.message}
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Vista de tabla */}
      {tipoVista === "tabla" && (
        <Card className="shadow-sm card-no-border">
          <Card.Body className="p-0">
            <div className="table-responsive" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <Table hover className="mb-0 table-compact" size="sm">
              <thead className="table-light sticky-top">
                <tr>
                  <th style={{ width: '6%', padding: '0.5rem 0.75rem' }} className="cursor-pointer" onClick={() => handleOrdenar("id")}>
                    ID {getIconoOrden("id")}
                  </th>
                  <th style={{ width: '14%', padding: '0.5rem 0.75rem' }} className="cursor-pointer" onClick={() => handleOrdenar("nombre")}>
                    Nombre {getIconoOrden("nombre")}
                  </th>
                  <th style={{ width: '14%', padding: '0.5rem 0.75rem' }} className="cursor-pointer" onClick={() => handleOrdenar("apellido")}>
                    Apellido {getIconoOrden("apellido")}
                  </th>
                  <th style={{ width: '22%', padding: '0.5rem 0.75rem' }} className="cursor-pointer" onClick={() => handleOrdenar("email")}>
                    Email {getIconoOrden("email")}
                  </th>
                  <th style={{ width: '12%', padding: '0.5rem 0.75rem' }}>Teléfono</th>
                  <th style={{ width: '10%', padding: '0.5rem 0.75rem' }} className="cursor-pointer" onClick={() => handleOrdenar("rol")}>
                    Rol {getIconoOrden("rol")}
                  </th>
                  <th style={{ width: '8%', padding: '0.5rem 0.75rem' }} className="cursor-pointer" onClick={() => handleOrdenar("estado")}>
                    Estado {getIconoOrden("estado")}
                  </th>
                  <th style={{ width: '14%', padding: '0.5rem 0.75rem' }} className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      No hay usuarios que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((user) => (
                    <tr key={user.id} style={{ height: '60px' }}>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <div className="fw-bold text-primary" style={{ fontSize: '0.85rem' }}>
                          {user.id}
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <div className="fw-bold text-truncate" style={{ fontSize: '0.85rem', maxWidth: '120px' }}>
                          {user.first_name}
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <div className="fw-bold text-truncate" style={{ fontSize: '0.85rem', maxWidth: '120px' }}>
                          {user.last_name}
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <div className="text-truncate" style={{ fontSize: '0.8rem', maxWidth: '200px' }}>
                          {user.email}
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <div className="text-truncate" style={{ fontSize: '0.8rem', maxWidth: '100px' }}>
                          {user.phone_number || "-"}
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {getRoleBadge(user.role)}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {getEstadoBadge(user.is_enabled)}
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-1">
                          {/* Botón principal - Vista de detalles */}
                          <Button 
                            size="sm" 
                            variant="outline-primary" 
                            onClick={() => handleVerDetalle(user)}
                            title="Ver detalles del usuario"
                            className="border-0"
                          >
                            <FaEye />
                          </Button>
                          
                          {/* Botón de edición */}
                          <Button 
                            size="sm" 
                            variant="outline-secondary" 
                            onClick={() => handleEdit(user)}
                            title="Editar usuario"
                            className="border-0 px-2 py-1"
                            style={{ fontSize: '0.7rem' }}
                          >
                            <FaEdit size={10} />
                          </Button>
                          
                          {/* Botón de estado (habilitar/deshabilitar) */}
                          {user.is_enabled ? (
                            <Button 
                              size="sm" 
                              variant="outline-secondary" 
                              onClick={() => handleDisable(user)}
                              title="Deshabilitar usuario"
                              className="border-0 px-2 py-1"
                              style={{ fontSize: '0.7rem' }}
                            >
                              <FaLock size={10} />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline-secondary" 
                              onClick={() => handleEnable(user.id)}
                              title="Habilitar usuario"
                              className="border-0 px-2 py-1"
                              style={{ fontSize: '0.7rem' }}
                            >
                              <FaCheck size={10} />
                            </Button>
                          )}
                          
                          {/* Botón de eliminación */}
                          <Button 
                            size="sm" 
                            variant="outline-secondary" 
                            onClick={() => handleDelete(user)}
                            title="Eliminar usuario permanentemente"
                            className="border-0 text-danger px-2 py-1"
                            style={{ fontSize: '0.7rem' }}
                          >
                            <FaTrash size={10} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Vista de tarjetas */}
      {tipoVista === "tarjetas" && (
        <Row>
          {usuariosFiltrados.length === 0 ? (
            <Col className="text-center py-5">
              <p className="text-muted">No hay usuarios que coincidan con los filtros aplicados.</p>
            </Col>
          ) : (
            usuariosFiltrados.map((user) => (
              <Col key={user.id} lg={4} md={6} sm={12} className="mb-3">
                <Card className="h-100 shadow-sm usuarios-admin-card">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold">{user.first_name} {user.last_name}</span>
                    {getEstadoBadge(user.is_enabled)}
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <FaEnvelope className="me-2 text-muted" /> 
                        <div>{user.email}</div>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <FaPhone className="me-2 text-muted" /> 
                        <div>{user.phone_number || "No disponible"}</div>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <FaUserTag className="me-2 text-muted" /> 
                        <div>{getRoleBadge(user.role)}</div>
                      </div>
                      <div className="d-flex align-items-center">
                        <FaIdCard className="me-2 text-muted" /> 
                        <div>ID: {user.id}</div>
                      </div>
                    </div>
                  </Card.Body>
                  <Card.Footer>
                    <div className="d-flex justify-content-between align-items-center">
                      {/* Botón principal - Vista con texto para mayor claridad en tarjetas */}
                      <Button 
                        size="sm" 
                        variant="outline-primary" 
                        onClick={() => handleVerDetalle(user)}
                        title="Ver detalles completos del usuario"
                        className="border-0"
                      >
                        <FaEye className="me-1" /> Ver Detalles
                      </Button>
                      
                      {/* Grupo de acciones secundarias */}
                      <div className="d-flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline-secondary" 
                          onClick={() => handleEdit(user)}
                          title="Editar información del usuario"
                          className="border-0"
                        >
                          <FaEdit />
                        </Button>
                        
                        {user.is_enabled ? (
                          <Button 
                            size="sm" 
                            variant="outline-secondary" 
                            onClick={() => handleDisable(user)}
                            title="Deshabilitar acceso del usuario"
                            className="border-0"
                          >
                            <FaLock />
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline-secondary" 
                            onClick={() => handleEnable(user.id)}
                            title="Habilitar acceso del usuario"
                            className="border-0"
                          >
                            <FaCheck />
                          </Button>
                        )}
                        
                        <Button 
                          size="sm" 
                          variant="outline-secondary" 
                          onClick={() => handleDelete(user)}
                          title="Eliminar usuario permanentemente"
                          className="border-0 text-danger"
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            ))
          )}
        </Row>
      )}

      {/* Modal para crear/editar usuario */}
      <Modal show={formOpen} onHide={() => setFormOpen(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedUser ? (
              <>
                <FaEdit className="me-2" />
                Editar Usuario
              </>
            ) : (
              <>
                <FaUserPlus className="me-2" />
                Crear Usuario
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {modalAlert.show && (
              <Alert 
                variant={modalAlert.variant} 
                onClose={handleCloseModalAlert} 
                dismissible
                className="mb-3"
              >
                <div className="d-flex align-items-center">
                  {modalAlert.variant === "success" ? (
                    <FaCheck className="me-2" />
                  ) : (
                    <FaTimes className="me-2" />
                  )}
                  {modalAlert.message}
                </div>
              </Alert>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaUserTag className="me-1" />
                    Nombre
                  </Form.Label>
                  <Form.Control
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Ingrese el nombre"
                    disabled={loading}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaUserTag className="me-1" />
                    Apellido
                  </Form.Label>
                  <Form.Control
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Ingrese el apellido"
                    disabled={loading}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>
                <FaEnvelope className="me-1" />
                Correo Electrónico
              </Form.Label>
              <Form.Control
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="usuario@ejemplo.com"
                disabled={loading}
                required
              />
              <Form.Text className="text-muted">
                {selectedUser ? 
                  "Se validará que el email no esté siendo usado por otro usuario." :
                  "Se enviará un email de verificación a esta dirección."
                }
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>
                <FaPhone className="me-1" />
                Teléfono
              </Form.Label>
              <Form.Control
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="Ej: +1234567890"
                disabled={loading}
              />
              <Form.Text className="text-muted">
                Formato: números, espacios, paréntesis, guiones y signo +
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>
                <FaUserTag className="me-1" />
                Rol
              </Form.Label>
              <Form.Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={loading}
                required
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Define los permisos y accesos del usuario en el sistema.
              </Form.Text>
            </Form.Group>

            {/* ✅ AGREGAR: Campo de contraseña solo para crear usuario */}
            {!selectedUser && (
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaLock className="me-1" />
                  Contraseña Temporal
                </Form.Label>
                <Form.Control
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Ingrese una contraseña segura temporal"
                  disabled={loading}
                  required
                  className={formData.password ? 
                    (validatePassword(formData.password).allValid ? 'is-valid' : 'is-invalid') : 
                    ''
                  }
                />
                
                {/* Validación en tiempo real */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="card border-0 bg-light">
                      <div className="card-body py-2 px-3">
                        <div className="small">
                          <strong>🔍 Estado de validación:</strong>
                        </div>
                        <div className="row g-2 mt-1">
                          <div className="col-md-6">
                            <div className={`small d-flex align-items-center ${validatePassword(formData.password).validations.length ? 'text-success' : 'text-danger'}`}>
                              {validatePassword(formData.password).validations.length ? '✅' : '❌'} 
                              <span className="ms-1">Mínimo 8 caracteres</span>
                            </div>
                            <div className={`small d-flex align-items-center ${validatePassword(formData.password).validations.lowercase ? 'text-success' : 'text-danger'}`}>
                              {validatePassword(formData.password).validations.lowercase ? '✅' : '❌'} 
                              <span className="ms-1">Letra minúscula</span>
                            </div>
                            <div className={`small d-flex align-items-center ${validatePassword(formData.password).validations.uppercase ? 'text-success' : 'text-danger'}`}>
                              {validatePassword(formData.password).validations.uppercase ? '✅' : '❌'} 
                              <span className="ms-1">Letra mayúscula</span>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className={`small d-flex align-items-center ${validatePassword(formData.password).validations.number ? 'text-success' : 'text-danger'}`}>
                              {validatePassword(formData.password).validations.number ? '✅' : '❌'} 
                              <span className="ms-1">Al menos 1 número</span>
                            </div>
                            <div className={`small d-flex align-items-center ${validatePassword(formData.password).validations.special ? 'text-success' : 'text-danger'}`}>
                              {validatePassword(formData.password).validations.special ? '✅' : '❌'} 
                              <span className="ms-1">Símbolo especial</span>
                            </div>
                          </div>
                        </div>
                        
                        {validatePassword(formData.password).allValid ? (
                          <div className="mt-2 text-success small">
                            <strong>🎉 ¡Contraseña válida!</strong> Cumple todos los requisitos de seguridad.
                          </div>
                        ) : (
                          <div className="mt-2 text-primary small">
                            <strong>💡 Ejemplos válidos:</strong> "TempPass2024@", "AdminUser123!", "Secure2025#"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <Form.Text className="text-muted">
                  El usuario deberá cambiar esta contraseña en su primer inicio de sesión.
                </Form.Text>
              </Form.Group>
            )}
          </Modal.Body>
          
          <Modal.Footer className="d-flex justify-content-between">
            <div>
              {selectedUser && (
                <small className="text-muted">
                  Última actualización: {new Date(selectedUser.updated_at || selectedUser.created_at).toLocaleString()}
                </small>
              )}
            </div>
            <div>
              <Button 
                variant="secondary" 
                onClick={() => setFormOpen(false)}
                disabled={loading}
                className="me-2"
              >
                <FaTimes className="me-1" />
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant={selectedUser ? "warning" : "success"}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    {selectedUser ? "Actualizando..." : "Creando..."}
                  </>
                ) : (
                  <>
                    {selectedUser ? (
                      <>
                        <FaEdit className="me-1" />
                        Actualizar Usuario
                      </>
                    ) : (
                      <>
                        <FaUserPlus className="me-1" />
                        Crear Usuario
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal para ver detalles */}
      <Modal show={verDetalle} onHide={() => setVerDetalle(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEye className="me-2" />
            Detalles del Usuario
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {userDetalle && (
            <div>
              {/* Información básica */}
              <div className="mb-4">
                <h6 className="text-primary mb-3">
                  <FaIdCard className="me-2" />
                  Información General
                </h6>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>ID:</strong> 
                      <span className="ms-2">{userDetalle.id}</span>
                    </div>
                    <div className="mb-3">
                      <strong>Nombre completo:</strong> 
                      <span className="ms-2">{userDetalle.first_name} {userDetalle.last_name}</span>
                    </div>
                    <div className="mb-3">
                      <strong>Email:</strong> 
                      <span className="ms-2">{userDetalle.email}</span>
                    </div>
                    <div className="mb-3">
                      <strong>Teléfono:</strong> 
                      <span className="ms-2">{userDetalle.phone_number || "No disponible"}</span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Rol:</strong> 
                      <span className="ms-2">{getRoleBadge(userDetalle.role)}</span>
                    </div>
                    <div className="mb-3">
                      <strong>Estado:</strong> 
                      <span className="ms-2">
                        {getEstadoBadge(userDetalle.is_enabled)}
                      </span>
                    </div>
                    <div className="mb-3">
                      <strong>Email verificado:</strong> 
                      <span className="ms-2">
                        <Badge bg={userDetalle.verified ? "success" : "warning"}>
                          {userDetalle.verified ? "✅ Verificado" : "⏳ Pendiente"}
                        </Badge>
                      </span>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Información de fechas */}
              <div className="mb-4">
                <h6 className="text-primary mb-3">
                  <FaCalendarAlt className="me-2" />
                  Fechas Importantes
                </h6>
                <div className="bg-light p-3 rounded">
                  <div className="mb-2">
                    <strong>Fecha de creación:</strong> 
                    <div className="ms-2">{formatearFecha(userDetalle.created_at)}</div>
                  </div>
                  
                  {userDetalle.updated_at && (
                    <div className="mb-2">
                      <strong>Última actualización:</strong> 
                      <div className="ms-2">{formatearFecha(userDetalle.updated_at)}</div>
                    </div>
                  )}
                  
                  {userDetalle.last_login ? (
                    <div className="mb-2">
                      <strong>Último login:</strong> 
                      <div className="ms-2">{formatearFecha(userDetalle.last_login)}</div>
                    </div>
                  ) : (
                    <div className="mb-2">
                      <strong>Último login:</strong> 
                      <div className="ms-2 text-muted">Nunca ha iniciado sesión</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Estadísticas */}
              <div className="mb-4">
                <h6 className="text-primary mb-3">
                  <FaChartBar className="me-2" />
                  Estadísticas
                </h6>
                <Row>
                  <Col md={4}>
                    <div className="text-center p-3 bg-light rounded">
                      <div className="h5 text-primary mb-1">
                        {userDetalle.created_at ? 
                          Math.floor((new Date() - new Date(userDetalle.created_at)) / (1000 * 60 * 60 * 24)) : 
                          "N/A"
                        }
                      </div>
                      <small className="text-muted">Días en el sistema</small>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center p-3 bg-light rounded">
                      <div className="h5 text-success mb-1">
                        {userDetalle.verified ? "✅" : "❌"}
                      </div>
                      <small className="text-muted">Email verificado</small>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center p-3 bg-light rounded">
                      <div className="h5 text-info mb-1">
                        {userDetalle.is_enabled ? "🟢" : "🔴"}
                      </div>
                      <small className="text-muted">Estado actual</small>
                    </div>
                  </Col>
                </Row>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <div>
            <small className="text-muted">
              Usuario ID: {userDetalle?.id} | Creado: {formatearFechaCorta(userDetalle?.created_at)}
            </small>
          </div>
          <div>
            <Button variant="secondary" onClick={() => setVerDetalle(false)} className="me-2">
              <FaTimes className="me-1" />
              Cerrar
            </Button>
            {userDetalle && (
              <Button variant="warning" onClick={() => {
                setVerDetalle(false);
                handleEdit(userDetalle);
              }}>
                <FaEdit className="me-1" />
                Editar
              </Button>
            )}
          </div>
        </Modal.Footer>
      </Modal>
        </Tab.Pane>

        {/* ✅ NUEVA PESTAÑA: Monitor de usuarios activos */}
        <Tab.Pane active={activeTab === "activos"}>
          <ActiveUsersMonitor />
        </Tab.Pane>
      </Tab.Content>
      </Container>
    </>
  );
};

// ✅ AGREGAR: Estilos CSS para el modal amplio
const style = document.createElement('style');
style.textContent = `
  .swal-wide {
    width: 600px !important;
  }
  
  .swal-wide .swal2-html-container {
    max-height: 400px;
    overflow-y: auto;
  }
`;
document.head.appendChild(style);

export default UsuariosAdmin;