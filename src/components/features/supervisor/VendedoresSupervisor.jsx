import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_URL } from "../../config";
import { 
  Container, Row, Col, Table, Button, Form, Badge, 
  Card, Modal, Alert, ButtonGroup, Spinner, InputGroup, ProgressBar
} from "react-bootstrap";
import { FaEdit, FaTrash, FaEye, FaSearch, FaList, FaThLarge, FaSort, FaSortUp, FaSortDown, FaUserPlus, FaChevronUp, FaChevronDown, FaUserCheck, FaUserTimes, FaExchangeAlt, FaUsers, FaUserTag, FaCog } from "react-icons/fa";
import { getEstadoConfig } from '../../utils/estadosHelper';

const ROLES = [
  { value: 1, label: "Vendedor", color: "primary" }
];

const VendedoresSupervisor = () => {
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [verDetalle, setVerDetalle] = useState(false);
  const [vendedorDetalle, setVendedorDetalle] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: "", variant: "success" });
  const [tipoVista, setTipoVista] = useState("tabla"); // "tabla" o "tarjetas"
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [ordenPor, setOrdenPor] = useState("apellido");
  const [ordenDir, setOrdenDir] = useState("asc");
  const [metricas, setMetricas] = useState({
    totalVendedores: 0,
    vendedoresActivos: 0,
    prospectosPorVendedor: []
  });
  const [vendedorMetricas, setVendedorMetricas] = useState(null);
  const [loadingMetricas, setLoadingMetricas] = useState(false);
  
  // Estados para gestión de prospectos
  const [showProspectosModal, setShowProspectosModal] = useState(false);
  const [prospectosVendedor, setProspectosVendedor] = useState([]);
  const [selectedProspectos, setSelectedProspectos] = useState([]);
  const [showReasignarModal, setShowReasignarModal] = useState(false);
  const [vendedorParaReasignar, setVendedorParaReasignar] = useState(null);
  const [nuevoVendedorId, setNuevoVendedorId] = useState("");
  const [loadingProspectos, setLoadingProspectos] = useState(false);

  // Estados para gestión de categorías
  const [categorias, setCategorias] = useState([]);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [vendedorParaCategoria, setVendedorParaCategoria] = useState(null);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState("");

  useEffect(() => {
    fetchVendedores();
    fetchMetricas();
    fetchCategorias();
  }, []);

  const fetchVendedores = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/supervisor/vendedores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setVendedores(response.data);
    } catch (error) {
      console.error("Error al obtener vendedores:", error);
      Swal.fire("Error", "No se pudieron cargar los usuarios vendedores.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchMetricas = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/supervisor/metricas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMetricas({
        totalVendedores: response.data.prospectosPorVendedor.length,
        vendedoresActivos: response.data.prospectosPorVendedor.filter(v => v.total_prospectos > 0).length,
        prospectosPorVendedor: response.data.prospectosPorVendedor
      });
    } catch (error) {
      console.error("Error al obtener métricas:", error);
    }
  };

  const fetchVendedorMetricas = async (vendedorId) => {
    try {
      setLoadingMetricas(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/supervisor/vendedores/${vendedorId}/metricas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setVendedorMetricas(response.data);
    } catch (error) {
      console.error("Error al obtener métricas del vendedor:", error);
      Swal.fire("Error", "No se pudieron cargar las métricas del vendedor.", "error");
    } finally {
      setLoadingMetricas(false);
    }
  };

  const fetchProspectosVendedor = async (vendedorId) => {
    try {
      setLoadingProspectos(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/supervisor/vendedores/${vendedorId}/prospectos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProspectosVendedor(response.data);
      setSelectedProspectos([]);
    } catch (error) {
      console.error("Error al obtener prospectos del vendedor:", error);
      Swal.fire("Error", "No se pudieron cargar los prospectos del vendedor.", "error");
    } finally {
      setLoadingProspectos(false);
    }
  };

  const handleDisableVendedor = async (vendedorId) => {
    try {
      const result = await Swal.fire({
        title: '¿Deshabilitar vendedor?',
        text: 'El vendedor no podrá acceder al sistema pero mantendrá sus prospectos asignados.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, deshabilitar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        await axios.put(`${API_URL}/supervisor/disable-vendedor/${vendedorId}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setAlert({ 
          show: true, 
          message: "Vendedor deshabilitado correctamente.", 
          variant: "success" 
        });
        
        // Actualizar el vendedor en la lista local
        setVendedores(vendedores.map(v => 
          v.id === vendedorId ? {...v, is_enabled: 0} : v
        ));
        
        // Si el vendedor detalle está abierto y es el mismo que se deshabilitó
        if (vendedorDetalle && vendedorDetalle.id === vendedorId) {
          setVendedorDetalle({...vendedorDetalle, is_enabled: 0});
        }
      }
    } catch (error) {
      console.error("Error al deshabilitar vendedor:", error);
      setAlert({ 
        show: true, 
        message: "No se pudo deshabilitar el vendedor. " + (error.response?.data?.message || error.message), 
        variant: "danger" 
      });
    }
  };

  const handleDeleteVendedor = async (vendedor) => {
    try {
      // Primero verificar si tiene prospectos asignados
      await fetchProspectosVendedor(vendedor.id);
      
      if (prospectosVendedor.length > 0) {
        const result = await Swal.fire({
          title: 'Vendedor tiene prospectos asignados',
          text: `${vendedor.first_name} ${vendedor.last_name} tiene ${prospectosVendedor.length} prospectos asignados. Debe reasignarlos antes de eliminar.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#007bff',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Reasignar prospectos',
          cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
          setVendedorParaReasignar(vendedor);
          setShowProspectosModal(true);
        }
      } else {
        // No tiene prospectos, puede eliminar directamente
        const result = await Swal.fire({
          title: '¿Eliminar vendedor?',
          text: `Esta acción eliminará permanentemente a ${vendedor.first_name} ${vendedor.last_name}.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
          await eliminarVendedor(vendedor.id);
        }
      }
    } catch (error) {
      console.error("Error al procesar eliminación:", error);
      setAlert({ 
        show: true, 
        message: "Error al procesar la eliminación del vendedor.", 
        variant: "danger" 
      });
    }
  };

  const eliminarVendedor = async (vendedorId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/supervisor/vendedores/${vendedorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAlert({ 
        show: true, 
        message: "Vendedor eliminado correctamente.", 
        variant: "success" 
      });
      
      // Remover de la lista local
      setVendedores(vendedores.filter(v => v.id !== vendedorId));
      
      // Si el modal estaba abierto, cerrarlo
      if (vendedorDetalle && vendedorDetalle.id === vendedorId) {
        setVerDetalle(false);
        setVendedorDetalle(null);
      }
    } catch (error) {
      console.error("Error al eliminar vendedor:", error);
      setAlert({ 
        show: true, 
        message: "No se pudo eliminar el vendedor. " + (error.response?.data?.message || error.message), 
        variant: "danger" 
      });
    }
  };

  const handleReasignarProspectos = async () => {
    if (!nuevoVendedorId || selectedProspectos.length === 0) {
      setAlert({ 
        show: true, 
        message: "Debe seleccionar al menos un prospecto y un vendedor destino.", 
        variant: "warning" 
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/supervisor/reasignar-prospectos`, {
        prospectos: selectedProspectos,
        nuevo_vendedor_id: nuevoVendedorId,
        vendedor_anterior_id: vendedorParaReasignar.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAlert({ 
        show: true, 
        message: `${selectedProspectos.length} prospectos reasignados correctamente.`, 
        variant: "success" 
      });

      // Actualizar la lista de prospectos
      await fetchProspectosVendedor(vendedorParaReasignar.id);
      setSelectedProspectos([]);
      setShowReasignarModal(false);

      // Si ya no tiene prospectos, ofrecer eliminar
      if (prospectosVendedor.filter(p => !selectedProspectos.includes(p.id)).length === 0) {
        const result = await Swal.fire({
          title: 'Todos los prospectos reasignados',
          text: '¿Desea eliminar ahora el vendedor?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'No, mantener'
        });

        if (result.isConfirmed) {
          setShowProspectosModal(false);
          await eliminarVendedor(vendedorParaReasignar.id);
        }
      }
    } catch (error) {
      console.error("Error al reasignar prospectos:", error);
      setAlert({ 
        show: true, 
        message: "Error al reasignar prospectos: " + (error.response?.data?.message || error.message), 
        variant: "danger" 
      });
    }
  };

  const handleSelectProspecto = (prospectoId) => {
    setSelectedProspectos(prev => {
      if (prev.includes(prospectoId)) {
        return prev.filter(id => id !== prospectoId);
      } else {
        return [...prev, prospectoId];
      }
    });
  };

  const handleSelectAllProspectos = () => {
    if (selectedProspectos.length === prospectosVendedor.length) {
      setSelectedProspectos([]);
    } else {
      setSelectedProspectos(prospectosVendedor.map(p => p.id));
    }
  };

  const handleVerProspectos = (vendedor) => {
    setVendedorParaReasignar(vendedor);
    fetchProspectosVendedor(vendedor.id);
    setShowProspectosModal(true);
  };

  const handleEnable = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/supervisor/enable-vendedor/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setAlert({ 
        show: true, 
        message: "Vendedor habilitado correctamente. Ya puede acceder al sistema.", 
        variant: "success" 
      });
      
      // Actualizar el vendedor en la lista local
      setVendedores(vendedores.map(v => 
        v.id === id ? {...v, is_enabled: 1} : v
      ));
      
      // Si el vendedor detalle está abierto y es el mismo que se habilitó
      if (vendedorDetalle && vendedorDetalle.id === id) {
        setVendedorDetalle({...vendedorDetalle, is_enabled: 1});
      }
      
    } catch (error) {
      console.error("Error al habilitar vendedor:", error);
      setAlert({ 
        show: true, 
        message: "No se pudo habilitar el vendedor. " + (error.response?.data?.message || error.message), 
        variant: "danger" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (vendedor) => {
    setVendedorDetalle(vendedor);
    fetchVendedorMetricas(vendedor.id);
    setVerDetalle(true);
  };

  // Funciones para gestión de categorías
  const fetchCategorias = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/admin/categorias`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategorias(response.data.filter(c => c.activa));
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  };

  const handleCambiarCategoria = (vendedor) => {
    setVendedorParaCategoria(vendedor);
    setSelectedCategoriaId(vendedor.categoria_id || '');
    setShowCategoriaModal(true);
  };

  const handleAsignarCategoria = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/admin/categorias/vendedor/${vendedorParaCategoria.id}/categoria`, 
        { categoriaId: selectedCategoriaId || null }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAlert({
        show: true,
        message: "Categoría asignada correctamente",
        variant: "success"
      });
      
      setShowCategoriaModal(false);
      setVendedorParaCategoria(null);
      setSelectedCategoriaId('');
      fetchVendedores();
    } catch (error) {
      console.error("Error al asignar categoría:", error);
      setAlert({
        show: true,
        message: "Error al asignar la categoría: " + (error.response?.data?.message || error.message),
        variant: "danger"
      });
    }
  };

  const handleCloseAlert = () => setAlert({ ...alert, show: false });

  const handleOrdenar = (campo) => {
    if (campo === ordenPor) {
      setOrdenDir(ordenDir === "asc" ? "desc" : "asc");
    } else {
      setOrdenPor(campo);
      setOrdenDir("asc");
    }
  };

  // Icono para mostrar dirección de ordenamiento
  const getIconoOrden = (campo) => {
    if (ordenPor !== campo) return null;
    return ordenDir === "asc" ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />;
  };

  // Filtrar y ordenar vendedores
  const vendedoresFiltrados = vendedores
    .filter(vendedor => {
      const termino = busqueda.toLowerCase();
      const coincideBusqueda = 
        vendedor.first_name?.toLowerCase().includes(termino) ||
        vendedor.last_name?.toLowerCase().includes(termino) ||
        vendedor.email?.toLowerCase().includes(termino) ||
        (vendedor.phone_number && vendedor.phone_number.toLowerCase().includes(termino));
        
      const coincideEstado = filtroEstado === "" || 
        (filtroEstado === "habilitado" && vendedor.is_enabled) || 
        (filtroEstado === "deshabilitado" && !vendedor.is_enabled);
        
      return coincideBusqueda && coincideEstado;
    })
    .sort((a, b) => {
      let valorA, valorB;
      
      switch (ordenPor) {
        case "nombre":
          valorA = a.first_name?.toLowerCase() || "";
          valorB = b.first_name?.toLowerCase() || "";
          break;
        case "apellido":
          valorA = a.last_name?.toLowerCase() || "";
          valorB = b.last_name?.toLowerCase() || "";
          break;
        case "email":
          valorA = a.email?.toLowerCase() || "";
          valorB = b.email?.toLowerCase() || "";
          break;
        case "estado":
          valorA = a.is_enabled ? 1 : 0;
          valorB = b.is_enabled ? 1 : 0;
          break;
        default:
          valorA = a.id;
          valorB = b.id;
      }
      
      if (valorA < valorB) return ordenDir === "asc" ? -1 : 1;
      if (valorA > valorB) return ordenDir === "asc" ? 1 : -1;
      return 0;
    });

  // Renderizar ícono para el rol
  const getRoleBadge = (role) => {
    const roleInfo = ROLES.find(r => r.value === role);
    return (
      <Badge bg={roleInfo ? roleInfo.color : "secondary"}>
        {roleInfo ? roleInfo.label : "Desconocido"}
      </Badge>
    );
  };

  if (loading && vendedores.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Container fluid className="p-2 p-md-3 vendedores-supervisor">
      {alert.show && (
        <Alert variant={alert.variant} onClose={handleCloseAlert} dismissible>
          {alert.message}
        </Alert>
      )}

      {/* Header con título responsivo */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 mb-md-4">
        <h2 className="mb-2 mb-md-0 h4 h2-md">
          <FaUsers className="me-2" />
          <span className="d-none d-sm-inline">Gestión de </span>Vendedores
        </h2>
      </div>

      {/* Métricas responsivas */}
      {/* <Row className="g-2 g-md-3 mb-3 mb-md-4">
        <Col xs={12} sm={6} md={4}>
          <Card className="text-center h-100 shadow-sm border-0">
            <Card.Body className="py-3">
              <h3 className="mb-1 text-primary">{metricas.totalVendedores}</h3>
              <p className="mb-0 text-muted small">Total Vendedores</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card className="text-center h-100 shadow-sm border-0">
            <Card.Body className="py-3">
              <h3 className="mb-1 text-success">{metricas.vendedoresActivos}</h3>
              <p className="mb-0 text-muted small">Vendedores Activos</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={4}>
          <Card className="text-center h-100 shadow-sm border-0">
            <Card.Body className="py-3">
              <h3 className="mb-1 text-info">{vendedores.filter(u => u.is_enabled).length}</h3>
              <p className="mb-0 text-muted small">Vendedores Habilitados</p>
            </Card.Body>
          </Card>
        </Col>
      </Row> */}

      {/* Panel de filtros y controles responsivo */}
      <Card className="shadow-sm border-0 mb-3 mb-md-4 card-no-border">
        <Card.Body className="py-3">
          <Row className="g-2 g-md-3 align-items-end">
            {/* Búsqueda */}
            <Col xs={12} md={6} lg={4}>
              <Form.Label className="small text-muted mb-1">Buscar vendedor</Form.Label>
              <InputGroup size="sm">
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Nombre, email..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </InputGroup>
            </Col>

            {/* Filtro por estado */}
            <Col xs={6} md={3} lg={2}>
              <Form.Label className="small text-muted mb-1">Estado</Form.Label>
              <Form.Select 
                size="sm"
                value={filtroEstado} 
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="habilitado">Habilitados</option>
                <option value="deshabilitado">Deshabilitados</option>
              </Form.Select>
            </Col>

            {/* Controles de vista */}
            <Col xs={6} md={3} lg={2}>
              <Form.Label className="small text-muted mb-1 d-none d-md-block">Vista</Form.Label>
              <ButtonGroup size="sm" className="w-100">
                <Button 
                  variant={tipoVista === "tabla" ? "primary" : "outline-primary"} 
                  onClick={() => setTipoVista("tabla")}
                  className="d-none d-lg-inline-flex"
                  title="Vista tabla"
                >
                  <FaList />
                </Button>
                <Button 
                  variant={tipoVista === "tarjetas" ? "primary" : "outline-primary"} 
                  onClick={() => setTipoVista("tarjetas")}
                  title="Vista tarjetas"
                >
                  <FaThLarge />
                </Button>
              </ButtonGroup>
            </Col>

            {/* Botón actualizar */}
            <Col xs={12} lg={4} className="d-flex justify-content-end">
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => fetchVendedores()}
                disabled={loading}
                className="w-100 w-lg-auto"
              >
                {loading ? <Spinner animation="border" size="sm" /> : 'Actualizar'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Contenido principal responsivo */}
      {/* Vista de tabla - solo en desktop, dentro de contenedor blanco */}
      {tipoVista === "tabla" ? (
        <div className="bg-white rounded shadow-sm d-none d-lg-block">
          <div className="table-responsive">
            <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="cursor-pointer" onClick={() => handleOrdenar("id")}>
                      ID {getIconoOrden("id")}
                    </th>
                    <th className="cursor-pointer" onClick={() => handleOrdenar("nombre")}>
                      Nombre {getIconoOrden("nombre")}
                    </th>
                    <th className="cursor-pointer" onClick={() => handleOrdenar("apellido")}>
                      Apellido {getIconoOrden("apellido")}
                    </th>
                    <th className="cursor-pointer" onClick={() => handleOrdenar("email")}>
                      Email {getIconoOrden("email")}
                    </th>
                    <th>Teléfono</th>
                    <th>Categoría</th>
                    <th>Prospectos</th>
                    <th className="cursor-pointer" onClick={() => handleOrdenar("estado")}>
                      Estado {getIconoOrden("estado")}
                    </th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {vendedoresFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-4 text-muted">
                        <div className="py-3">
                          <FaUsers className="mb-2" size={32} opacity={0.5} />
                          <p className="mb-0">No hay vendedores que coincidan con los filtros aplicados.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    vendedoresFiltrados.map((vendedor) => (
                      <tr key={vendedor.id}>
                        <td className="fw-bold text-primary">{vendedor.id}</td>
                        <td>{vendedor.first_name}</td>
                        <td>{vendedor.last_name}</td>
                        <td>
                          <div className="text-truncate" style={{ maxWidth: '200px' }}>
                            {vendedor.email}
                          </div>
                        </td>
                        <td>{vendedor.phone_number || "-"}</td>
                        <td>
                          {vendedor.categoria_nombre ? (
                            <Badge bg={vendedor.categoria_prioridad === 1 ? 'success' : vendedor.categoria_prioridad === 2 ? 'warning' : 'info'}>
                              {vendedor.categoria_nombre}
                            </Badge>
                          ) : (
                            <Badge bg="secondary">Sin asignar</Badge>
                          )}
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <Badge bg="info">
                              {vendedor.total_prospectos || 0} prospectos
                            </Badge>
                          </div>
                        </td>
                        <td>
                          <Badge bg={vendedor.is_enabled ? "success" : "secondary"}>
                            {vendedor.is_enabled ? "Habilitado" : "Deshabilitado"}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex justify-content-center gap-1">
                            <Button size="sm" variant="info" onClick={() => handleVerDetalle(vendedor)} title="Ver detalles">
                              <FaEye />
                            </Button>
                            
                            <Button size="sm" variant="primary" onClick={() => handleVerProspectos(vendedor)} title="Ver prospectos">
                              <FaUsers />
                            </Button>

                            <Button 
                              size="sm" 
                              variant="outline-secondary" 
                              onClick={() => handleCambiarCategoria(vendedor)}
                              title="Cambiar categoría"
                            >
                              <FaUserTag />
                            </Button>
                            
                            {vendedor.is_enabled ? (
                              <Button 
                                size="sm" 
                                variant="warning" 
                                onClick={() => handleDisableVendedor(vendedor.id)}
                                disabled={loading}
                                title="Deshabilitar vendedor"
                              >
                                <FaUserTimes />
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="success" 
                                onClick={() => handleEnable(vendedor.id)}
                                disabled={loading}
                                title="Habilitar vendedor"
                              >
                                <FaUserCheck />
                              </Button>
                            )}

                            <Button 
                              size="sm" 
                              variant="danger" 
                              onClick={() => handleDeleteVendedor(vendedor)}
                              disabled={loading}
                              title="Eliminar vendedor"
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
            </Table>
          </div>
        </div>
      ) : null}

      {/* Vista de tarjetas (móvil, tablet y también desktop cuando se elige tarjetas) */}
      {tipoVista === "tarjetas" || tipoVista === "tabla" ? (
        <div className={tipoVista === "tabla" ? "d-lg-none p-3" : "p-3"}>
          <Row className="g-3 g-lg-4 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-4">
              {vendedoresFiltrados.length === 0 ? (
                <Col className="text-center py-5">
                  <FaUsers className="mb-3 text-muted" size={48} />
                  <h5 className="text-muted">No hay vendedores</h5>
                  <p className="text-muted">No se encontraron vendedores que coincidan con los filtros aplicados.</p>
                </Col>
              ) : (
                vendedoresFiltrados.map((vendedor) => (
                  <Col key={vendedor.id}>
                    <Card className="h-100 shadow-sm border-0 hover-shadow">
                      <Card.Header className="bg-light border-0 pb-2">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1 fw-bold text-truncate">
                              {vendedor.first_name} {vendedor.last_name}
                            </h6>
                            <small className="text-muted">ID: {vendedor.id}</small>
                          </div>
                          <Badge bg={vendedor.is_enabled ? "success" : "secondary"} className="ms-2">
                            {vendedor.is_enabled ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </Card.Header>
                      
                      <Card.Body className="py-3">
                        <div className="mb-3">
                          <div className="mb-2">
                            <small className="text-muted d-block">Email</small>
                            <div className="text-truncate small">{vendedor.email}</div>
                          </div>
                          
                          <div className="mb-2">
                            <small className="text-muted d-block">Teléfono</small>
                            <div className="small">{vendedor.phone_number || "No disponible"}</div>
                          </div>
                          
                          <div className="mb-2">
                            <small className="text-muted d-block">Categoría</small>
                            {vendedor.categoria_nombre ? (
                              <Badge bg={vendedor.categoria_prioridad === 1 ? 'success' : vendedor.categoria_prioridad === 2 ? 'warning' : 'info'}>
                                {vendedor.categoria_nombre}
                              </Badge>
                            ) : (
                              <Badge bg="secondary">Sin asignar</Badge>
                            )}
                          </div>
                          
                          <div>
                            <small className="text-muted d-block">Prospectos</small>
                            <Badge bg="info">
                              {vendedor.total_prospectos || 0} prospectos
                            </Badge>
                          </div>
                        </div>
                      </Card.Body>
                      
                      <Card.Footer className="bg-transparent border-0 pt-0">
                        <Row className="g-1">
                          <Col xs={6}>
                            <Button 
                              size="sm" 
                              variant="info" 
                              className="w-100 text-nowrap" 
                              onClick={() => handleVerDetalle(vendedor)}
                              style={{ writingMode: 'horizontal-tb' }}
                            >
                              <FaEye className="me-1" />
                              <span className="d-none d-md-inline"> Ver</span>
                            </Button>
                          </Col>
                          <Col xs={6}>
                            <Button 
                              size="sm" 
                              variant="primary" 
                              className="w-100 text-nowrap" 
                              onClick={() => handleVerProspectos(vendedor)}
                              style={{ writingMode: 'horizontal-tb' }}
                            >
                              <FaUsers className="me-1" />
                              <span className="d-none d-md-inline"> Prospectos</span>
                              <span className="d-md-none"> Pros</span>
                            </Button>
                          </Col>
                          <Col xs={6}>
                            <Button 
                              size="sm" 
                              variant="outline-secondary" 
                              className="w-100 text-nowrap" 
                              onClick={() => handleCambiarCategoria(vendedor)}
                              style={{ writingMode: 'horizontal-tb' }}
                            >
                              <FaUserTag className="me-1" />
                              <span className="d-none d-md-inline"> Categoría</span>
                              <span className="d-md-none"> Cat.</span>
                            </Button>
                          </Col>
                          <Col xs={6}>
                            {vendedor.is_enabled ? (
                              <Button 
                                size="sm" 
                                variant="warning" 
                                className="w-100 text-nowrap" 
                                onClick={() => handleDisableVendedor(vendedor.id)}
                                disabled={loading}
                                style={{ writingMode: 'horizontal-tb' }}
                              >
                                <FaUserTimes className="me-1" /> <span className="d-none d-md-inline">Deshabilitar</span>
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="success" 
                                className="w-100 text-nowrap" 
                                onClick={() => handleEnable(vendedor.id)}
                                disabled={loading}
                                style={{ writingMode: 'horizontal-tb' }}
                              >
                                <FaUserCheck className="me-1" /> <span className="d-none d-md-inline">Habilitar</span>
                              </Button>
                            )}
                          </Col>
                          <Col xs={12}>
                            <Button 
                              size="sm" 
                              variant="outline-danger" 
                              className="w-100 text-nowrap" 
                              onClick={() => handleDeleteVendedor(vendedor)}
                              disabled={loading}
                              style={{ writingMode: 'horizontal-tb' }}
                            >
                              <FaTrash className="me-1" /> Eliminar
                            </Button>
                          </Col>
                        </Row>
                      </Card.Footer>
                    </Card>
                  </Col>
                ))
              )}
          </Row>
        </div>
      ) : null}

      {/* Modal de Detalle de Usuario */}
      <Modal show={verDetalle} onHide={() => setVerDetalle(false)} centered size="lg" className="modal-responsive">
        <Modal.Header closeButton>
          <Modal.Title className="h5">
            <FaUsers className="me-2" />
            Detalle del Vendedor
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {vendedorDetalle && (
            <Row className="g-3">
              <Col xs={12} md={6}>
                <div className="d-flex flex-column gap-2">
                  <div>
                    <strong className="text-muted">ID:</strong>
                    <div className="fs-6">{vendedorDetalle.id}</div>
                  </div>
                  <div>
                    <strong className="text-muted">Nombre completo:</strong>
                    <div className="fs-6">{vendedorDetalle.first_name} {vendedorDetalle.last_name}</div>
                  </div>
                  <div>
                    <strong className="text-muted">Email:</strong>
                    <div className="fs-6 text-break">{vendedorDetalle.email}</div>
                  </div>
                  <div>
                    <strong className="text-muted">Teléfono:</strong>
                    <div className="fs-6">{vendedorDetalle.phone_number || "No disponible"}</div>
                  </div>
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="d-flex flex-column gap-2">
                  <div>
                    <strong className="text-muted">Estado:</strong>
                    <div className="mt-1">
                      <Badge bg={vendedorDetalle.is_enabled ? "success" : "secondary"}>
                        {vendedorDetalle.is_enabled ? "Habilitado" : "Deshabilitado"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <strong className="text-muted">Prospectos asignados:</strong>
                    <div className="fs-6">{vendedorDetalle.total_prospectos || 0}</div>
                  </div>
                  <div>
                    <strong className="text-muted">Conversiones:</strong>
                    <div className="fs-6">{vendedorDetalle.conversiones || 0}</div>
                  </div>
                  {vendedorDetalle.created_at && (
                    <div>
                      <strong className="text-muted">Fecha de creación:</strong>
                      <div className="fs-6 small">{new Date(vendedorDetalle.created_at).toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer className="flex-column flex-md-row gap-2">
          <Button variant="secondary" onClick={() => setVerDetalle(false)} className="w-100 w-md-auto">
            Cerrar
          </Button>
          
          <Button variant="primary" onClick={() => handleVerProspectos(vendedorDetalle)} className="w-100 w-md-auto">
            <FaUsers className="me-1" /> Ver Prospectos
          </Button>
          
          {/* Botones para habilitar/deshabilitar y eliminar vendedor */}
          {vendedorDetalle && vendedorDetalle.is_enabled ? (
            <Button 
              variant="warning" 
              onClick={() => {
                handleDisableVendedor(vendedorDetalle.id);
                setVerDetalle(false);
              }}
              disabled={loading}
              className="w-100 w-md-auto"
            >
              <FaUserTimes className="me-1" /> Deshabilitar
            </Button>
          ) : (
            <Button 
              variant="success" 
              onClick={() => {
                handleEnable(vendedorDetalle.id);
                setVerDetalle(false);
              }}
              disabled={loading}
              className="w-100 w-md-auto"
            >
              <FaUserCheck className="me-1" /> Habilitar
            </Button>
          )}

          <Button 
            variant="danger" 
            onClick={() => {
              setVerDetalle(false);
              handleDeleteVendedor(vendedorDetalle);
            }}
            disabled={loading}
            className="w-100 w-md-auto"
          >
            <FaTrash className="me-1" /> Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para ver y gestionar prospectos */}
      <Modal show={showProspectosModal} onHide={() => setShowProspectosModal(false)} centered size="xl" className="modal-responsive">
        <Modal.Header closeButton>
          <Modal.Title className="h5">
            <FaUsers className="me-2" />
            Prospectos de {vendedorParaReasignar?.first_name} {vendedorParaReasignar?.last_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingProspectos ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <div className="mt-2">Cargando prospectos...</div>
            </div>
          ) : prospectosVendedor.length === 0 ? (
            <div className="text-center py-4">
              <FaUsers className="mb-3 text-muted" size={48} />
              <h5 className="text-muted">Sin prospectos</h5>
              <p className="text-muted">Este vendedor no tiene prospectos asignados.</p>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <Row className="align-items-center">
                  <Col xs={12} md={6}>
                    <div>
                      <strong>Total: {prospectosVendedor.length} prospectos</strong>
                      {selectedProspectos.length > 0 && (
                        <div className="text-primary mt-1">
                          <small>({selectedProspectos.length} seleccionados)</small>
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col xs={12} md={6} className="mt-2 mt-md-0">
                    <div className="d-flex flex-column flex-md-row gap-2 justify-content-md-end">
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={handleSelectAllProspectos}
                        className="w-100 w-md-auto"
                      >
                        {selectedProspectos.length === prospectosVendedor.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                      </Button>
                      {selectedProspectos.length > 0 && (
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={() => setShowReasignarModal(true)}
                          className="w-100 w-md-auto"
                        >
                          <FaExchangeAlt className="me-1" />
                          Reasignar ({selectedProspectos.length})
                        </Button>
                      )}
                    </div>
                  </Col>
                </Row>
              </div>

              <div className="table-responsive">
                <Table striped hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{width: '40px'}}>
                        <Form.Check 
                          type="checkbox"
                          checked={selectedProspectos.length === prospectosVendedor.length && prospectosVendedor.length > 0}
                          onChange={handleSelectAllProspectos}
                        />
                      </th>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th className="d-none d-md-table-cell">Contacto</th>
                      <th>Estado</th>
                      <th className="d-none d-lg-table-cell">Fecha Asignación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prospectosVendedor.map((prospecto) => (
                      <tr key={prospecto.id}>
                        <td>
                          <Form.Check 
                            type="checkbox"
                            checked={selectedProspectos.includes(prospecto.id)}
                            onChange={() => handleSelectProspecto(prospecto.id)}
                          />
                        </td>
                        <td className="fw-bold text-primary">{prospecto.id}</td>
                        <td>
                          <div>{prospecto.nombre} {prospecto.apellido}</div>
                          <div className="d-md-none">
                            <small className="text-muted">{prospecto.numero_contacto}</small>
                          </div>
                        </td>
                        <td className="d-none d-md-table-cell">
                          <div>{prospecto.numero_contacto}</div>
                          <small className="text-muted">{prospecto.correo}</small>
                        </td>
                        <td>
                          {(() => { 
                            const cfg = getEstadoConfig(prospecto.asignacion_estado || prospecto.estado);
                            return <Badge bg={cfg.bg} className="small">{cfg.text}</Badge>;
                          })()}
                        </td>
                        <td className="d-none d-lg-table-cell">
                          <small>
                            {prospecto.fecha_asignacion 
                              ? new Date(prospecto.fecha_asignacion).toLocaleDateString()
                              : 'No disponible'
                            }
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="flex-column flex-md-row gap-2">
          <Button variant="secondary" onClick={() => setShowProspectosModal(false)} className="w-100 w-md-auto">
            Cerrar
          </Button>
          {prospectosVendedor.length > 0 && (
            <Button 
              variant="primary"
              onClick={() => setShowReasignarModal(true)}
              disabled={selectedProspectos.length === 0}
              className="w-100 w-md-auto"
            >
              <FaExchangeAlt className="me-1" />
              Reasignar seleccionados ({selectedProspectos.length})
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Modal para reasignar prospectos */}
      <Modal show={showReasignarModal} onHide={() => setShowReasignarModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reasignar Prospectos</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Reasignar <strong>{selectedProspectos.length}</strong> prospectos de{' '}
            <strong>{vendedorParaReasignar?.first_name} {vendedorParaReasignar?.last_name}</strong> a:
          </p>
          
          <Form.Group className="mb-3">
            <Form.Label>Seleccionar nuevo vendedor:</Form.Label>
            <Form.Select 
              value={nuevoVendedorId} 
              onChange={(e) => setNuevoVendedorId(e.target.value)}
            >
              <option value="">Seleccionar vendedor...</option>
              {vendedores
                .filter(v => v.id !== vendedorParaReasignar?.id && v.is_enabled) // Excluir el vendedor actual y mostrar solo habilitados
                .map(vendedor => (
                  <option key={vendedor.id} value={vendedor.id}>
                    {vendedor.first_name} {vendedor.last_name}
                  </option>
                ))
              }
            </Form.Select>
          </Form.Group>

          {selectedProspectos.length > 0 && (
            <div className="bg-light p-3 rounded">
              <h6>Prospectos seleccionados:</h6>
              <ul className="mb-0" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {prospectosVendedor
                  .filter(p => selectedProspectos.includes(p.id))
                  .map(prospecto => (
                    <li key={prospecto.id}>
                      {prospecto.nombre} {prospecto.apellido} (ID: {prospecto.id})
                    </li>
                  ))
                }
              </ul>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReasignarModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleReasignarProspectos}
            disabled={!nuevoVendedorId}
          >
            <FaExchangeAlt className="me-1" />
            Reasignar prospectos
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para cambiar categoría */}
      <Modal show={showCategoriaModal} onHide={() => setShowCategoriaModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUserTag className="me-2" />
            Cambiar Categoría de Vendedor
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAsignarCategoria}>
          <Modal.Body>
            {vendedorParaCategoria && (
              <>
                <div className="mb-3">
                  <strong>Vendedor:</strong> {vendedorParaCategoria.first_name} {vendedorParaCategoria.last_name}
                </div>
                
                <div className="mb-3">
                  <strong>Categoría actual:</strong>{' '}
                  {vendedorParaCategoria.categoria_nombre ? (
                    <Badge bg={vendedorParaCategoria.categoria_prioridad === 1 ? 'success' : vendedorParaCategoria.categoria_prioridad === 2 ? 'warning' : 'info'}>
                      {vendedorParaCategoria.categoria_nombre}
                    </Badge>
                  ) : (
                    <Badge bg="secondary">Sin asignar</Badge>
                  )}
                </div>

                <div className="mb-3">
                  <strong>Carga actual:</strong> {vendedorParaCategoria.total_prospectos} prospectos
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Nueva Categoría</Form.Label>
                  <Form.Select
                    value={selectedCategoriaId}
                    onChange={(e) => setSelectedCategoriaId(e.target.value)}
                  >
                    <option value="">Sin categoría asignada</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre} (Cap: {categoria.capacidad_maxima}, Prioridad: {categoria.prioridad})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    La categoría determina la capacidad máxima y prioridad en la distribución de prospectos.
                  </Form.Text>
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCategoriaModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              <FaUserTag className="me-1" />
              Cambiar Categoría
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default VendedoresSupervisor;