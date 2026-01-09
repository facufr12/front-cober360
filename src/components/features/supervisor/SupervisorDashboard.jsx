import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Button,
  Modal,
  Offcanvas,
  ListGroup,
  Spinner,
  Badge,
  Form,
  Table,
  Card,
} from "react-bootstrap";
import {
  FaTachometerAlt,
  FaUsers,
  FaSignOutAlt,
  FaStore,
  FaBars,
  FaChevronLeft,
  FaEdit,
  FaEye,
  FaUserCheck,
  FaComment,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaHome,
  FaIdBadge,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaPeopleCarry,
  FaInfoCircle,
  FaUserFriends,
  FaChartBar,
  FaCoins,
  FaTimes,
  FaFilter,
  FaSearch,
  FaUserShield,
  FaFileAlt,
  FaArrowUp,
  FaArrowDown,
  FaEquals,
  FaExchangeAlt,
  FaWhatsapp, // ✅ AGREGAR
  FaComments,
  FaCloudUploadAlt, // ✅ NUEVO PARA CARGA DE DOCUMENTOS
  FaFileUpload, // ✅ NUEVO PARA CARGA DE DOCUMENTOS
  FaFile, // ✅ NUEVO PARA DOCUMENTOS
  FaFileContract, // ✅ NUEVO PARA PÓLIZAS
  FaInfo // ✅ NUEVO PARA INFORMACIÓN
} from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MetricasVendedor from "./MetricasVendedor";
import CotizacionesPorUsuario from "./CotizacionesPorUsuario";
import SupervisorCotizaciones from "./SupervisorCotizaciones";
import VendedoresSupervisor from "./VendedoresSupervisor";
import PolizasSupervisor from './PolizasSupervisor';
import ChatWidget from '../../common/ChatWidget';
import ManualWidget from '../../common/ManualWidget';
import ModalExportacion from '../../common/ModalExportacion';
import CargaMultipleDocumentos from '../../supervisor/CargaMultipleDocumentos'; // ✅ NUEVO COMPONENTE
import { API_URL } from "../../config";


const SupervisorDashboard = () => {
  const [prospectos, setProspectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [prospectoSeleccionado, setProspectoSeleccionado] = useState(null);
  const [vista, setVista] = useState("dashboard"); // Cambio: empezar en dashboard
  const [historial, setHistorial] = useState([]);
  const [modalTipo, setModalTipo] = useState("detalle");
  const [filtros, setFiltros] = useState({
    vendedor: "",
    edad: "",
    estado: "",
    nombre: "",
    apellido: "",
  });
  const [cotizaciones, setCotizaciones] = useState([]);
  const [showDetallesCotizacion, setShowDetallesCotizacion] = useState({});
  const [showFiltros, setShowFiltros] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    totalProspectos: 0,
    totalVendedores: 0,
    ventasConfirmadas: 0,
    totalFacturado: 0,
    totalPolizas: 0
  });
  const [datosGrafica, setDatosGrafica] = useState([]);
  const [showReasignarModal, setShowReasignarModal] = useState(false);
  const [prospectoParaReasignar, setProspectoParaReasignar] = useState(null);
  const [vendedoresDisponibles, setVendedoresDisponibles] = useState([]);
  const [nuevoVendedorId, setNuevoVendedorId] = useState("");
  const [showModalExportacion, setShowModalExportacion] = useState(false);

  // Estados para cambio de estado de prospectos
  const [editValues, setEditValues] = useState({});
  const [showModalCambioEstado, setShowModalCambioEstado] = useState(false);
  const [prospectoParaCambioEstado, setProspectoParaCambioEstado] = useState(null);

  // ✅ NUEVOS ESTADOS: Modal de conversaciones WhatsApp
  const [modalConversaciones, setModalConversaciones] = useState(false);
  const [prospectoConversaciones, setProspectoConversaciones] = useState(null);
  const [conversacionesProspecto, setConversacionesProspecto] = useState([]);
  const [loadingConversaciones, setLoadingConversaciones] = useState(false);
  
  // ✅ NUEVOS ESTADOS: Vista de mensajes individuales
  const [conversacionSeleccionada, setConversacionSeleccionada] = useState(null);
  const [mensajesConversacion, setMensajesConversacion] = useState([]);
  const [loadingMensajes, setLoadingMensajes] = useState(false);
  
  // ✅ NUEVOS ESTADOS: Modal de carga múltiple de documentos
  const [showModalCargaDocumentos, setShowModalCargaDocumentos] = useState(false);
  const [polizaSeleccionadaDocumentos, setPolizaSeleccionadaDocumentos] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      await fetchProspectos();
      await fetchEstadisticas();
      await fetchDatosGrafica();
      await fetchVendedoresDisponibles();
    };
    loadData();
  }, []);

  useEffect(() => {
    // Actualizar estadísticas cuando cambien los prospectos
    if (prospectos.length > 0) {
      fetchEstadisticas();
    }
  }, [prospectos]);

  useEffect(() => {
    // Debug: monitorear cambios en datosGrafica
    console.log('datosGrafica cambió:', datosGrafica);
  }, [datosGrafica]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setOpenDrawer(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(num);
  };

  // Función para obtener la clase de color del plan
  const getPlanColorClass = (planNombre) => {
    if (!planNombre) return "bg-primary";
    const nombre = planNombre.toLowerCase();
    if (nombre.includes("classic")) return "bg-primary";
    if (nombre.includes("taylored")) return "bg-success";
    if (nombre.includes("wagon")) return "bg-warning";
    if (nombre.includes("cober x")) return "bg-danger";
    return "bg-primary";
  };

  // Función para mostrar/ocultar detalles de cotización
  const toggleDetallesCotizacion = (index) => {
    setShowDetallesCotizacion(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const fetchProspectos = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/supervisor/prospectos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProspectos(response.data);
    } catch (error) {
      Swal.fire("Error", "No se pudieron cargar los prospectos.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchEstadisticas = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/supervisor/estadisticas`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Usar los datos de la API si la respuesta es exitosa
      if (response.data && response.data.success) {
        setEstadisticas({
          totalProspectos: response.data.data.totalProspectos || 0,
          totalVendedores: response.data.data.vendedoresActivos || 0,
          ventasConfirmadas: response.data.data.ventasConfirmadas || 0,
          totalFacturado: response.data.data.totalFacturado || 0,
          totalPolizas: response.data.data.totalPolizas || 0
        });
      } else {
        // Fallback a cálculo local
        const totalProspectos = prospectos.length;
        const vendedoresUnicos = [...new Set(prospectos.map(p => p.vendedor_id))].length;
        const ventasConfirmadas = prospectos.filter(p => p.estado === 'Venta').length;
        const totalFacturado = prospectos
          .filter(p => p.estado === 'Venta')
          .reduce((sum, p) => sum + (p.monto_facturado || 0), 0);

        setEstadisticas({
          totalProspectos,
          totalVendedores: vendedoresUnicos,
          ventasConfirmadas,
          totalFacturado,
          totalPolizas: ventasConfirmadas * 0.8 // Estimación: 80% de las ventas generan póliza
        });
      }
    } catch (error) {
      console.warn('Error al obtener estadísticas de la API, usando cálculo local:', error);
      // Si el endpoint no existe, usar datos calculados localmente
      const totalProspectos = prospectos.length;
      const vendedoresUnicos = [...new Set(prospectos.map(p => p.vendedor_id))].filter(Boolean).length;
      const ventasConfirmadas = prospectos.filter(p => p.estado === 'Venta').length;

      setEstadisticas({
        totalProspectos,
        totalVendedores: vendedoresUnicos,
        ventasConfirmadas,
        totalFacturado: ventasConfirmadas * 45000, // Estimación
        totalPolizas: ventasConfirmadas * 0.8 // Estimación: 80% de las ventas generan póliza
      });
    }
  };

  const fetchDatosGrafica = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/supervisor/datos-grafica`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Respuesta de datos-grafica:', response.data);

      // Usar los datos de la API si la respuesta es exitosa
      if (response.data && response.data.success) {
        console.log('Actualizando datosGrafica con:', response.data.data);
        setDatosGrafica(response.data.data);
      } else {
        console.log('Usando datos mock - respuesta no exitosa');
        // Usar datos mock como fallback
        const mesesData = [
          { mes: 'Ene', nuevosProspectos: 280, vendedores: 12, ventas: 45, polizasGeneradas: 35 },
          { mes: 'Feb', nuevosProspectos: 320, vendedores: 14, ventas: 52, polizasGeneradas: 42 },
          { mes: 'Mar', nuevosProspectos: 380, vendedores: 15, ventas: 68, polizasGeneradas: 58 },
          { mes: 'Abr', nuevosProspectos: 200, vendedores: 13, ventas: 35, polizasGeneradas: 28 },
          { mes: 'May', nuevosProspectos: 190, vendedores: 12, ventas: 42, polizasGeneradas: 35 },
          { mes: 'Jun', nuevosProspectos: 220, vendedores: 14, ventas: 48, polizasGeneradas: 40 },
          { mes: 'Jul', nuevosProspectos: 350, vendedores: 16, ventas: 75, polizasGeneradas: 62 },
          { mes: 'Ago', nuevosProspectos: 380, vendedores: 17, ventas: 82, polizasGeneradas: 70 },
          { mes: 'Sep', nuevosProspectos: 320, vendedores: 16, ventas: 68, polizasGeneradas: 55 },
          { mes: 'Oct', nuevosProspectos: 290, vendedores: 15, ventas: 55, polizasGeneradas: 45 },
          { mes: 'Nov', nuevosProspectos: 250, vendedores: 14, ventas: 48, polizasGeneradas: 38 },
          { mes: 'Dic', nuevosProspectos: 200, vendedores: 13, ventas: 38, polizasGeneradas: 30 }
        ];
        setDatosGrafica(mesesData);
      }
    } catch (error) {
      console.warn('Error al obtener datos de gráfica de la API, usando datos mock:', error);
      // Datos mock para la gráfica como fallback
      const mesesData = [
        { mes: 'Ene', nuevosProspectos: 280, vendedores: 12, ventas: 45, polizasGeneradas: 35 },
        { mes: 'Feb', nuevosProspectos: 320, vendedores: 14, ventas: 52, polizasGeneradas: 42 },
        { mes: 'Mar', nuevosProspectos: 380, vendedores: 15, ventas: 68, polizasGeneradas: 58 },
        { mes: 'Abr', nuevosProspectos: 200, vendedores: 13, ventas: 35, polizasGeneradas: 28 },
        { mes: 'May', nuevosProspectos: 190, vendedores: 12, ventas: 42, polizasGeneradas: 35 },
        { mes: 'Jun', nuevosProspectos: 220, vendedores: 14, ventas: 48, polizasGeneradas: 40 },
        { mes: 'Jul', nuevosProspectos: 350, vendedores: 16, ventas: 75, polizasGeneradas: 62 },
        { mes: 'Ago', nuevosProspectos: 380, vendedores: 17, ventas: 82, polizasGeneradas: 70 },
        { mes: 'Sep', nuevosProspectos: 320, vendedores: 16, ventas: 68, polizasGeneradas: 55 },
        { mes: 'Oct', nuevosProspectos: 290, vendedores: 15, ventas: 55, polizasGeneradas: 45 },
        { mes: 'Nov', nuevosProspectos: 250, vendedores: 14, ventas: 48, polizasGeneradas: 38 },
        { mes: 'Dic', nuevosProspectos: 200, vendedores: 13, ventas: 38, polizasGeneradas: 30 }
      ];
      setDatosGrafica(mesesData);
    }
  };

  const fetchVendedoresDisponibles = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/supervisor/vendedores`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVendedoresDisponibles(response.data.filter(v => v.is_enabled));
    } catch (error) {
      console.error("Error al obtener vendedores:", error);
    }
  };

  const fetchHistorial = async (prospectoId) => {
    const token = localStorage.getItem("token");
    const { data } = await axios.get(`${API_URL}/prospectos/${prospectoId}/historial`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setHistorial(data);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      const sessionId = localStorage.getItem("sessionId");
      const loginTime = localStorage.getItem("loginTime");

      if (token && sessionId) {
        const sessionTime = Math.floor((new Date() - new Date(loginTime)) / 1000);

        await axios.post(
          `${API_URL}/sessions/end`,
          {
            session_id: sessionId,
            logout_time: new Date().toISOString(),
            session_time: sessionTime
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("loginTime");
      localStorage.removeItem("sessionId");
      localStorage.removeItem("user_id");
      localStorage.removeItem("first_name");
      localStorage.removeItem("last_name");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_email");

      Swal.fire({
        icon: 'success',
        title: 'Sesión cerrada',
        text: 'Has cerrado sesión correctamente',
        confirmButtonColor: '#3085d6'
      }).then(() => {
        navigate('/');
      });
    }
  };

  const prospectosConVendedor = prospectos.map(p => ({
    ...p,
    vendedor: (p.vendedor_nombre && p.vendedor_apellido)
      ? `${p.vendedor_nombre} ${p.vendedor_apellido}`
      : p.vendedor_nombre || p.vendedor_apellido || "Sin asignar",
    handleOpenModal: handleOpenModal,
    handleOpenHistorial: handleOpenHistorial,
    handleOpenReasignar: handleOpenReasignar
  }));

  function handleOpenModal(row) {
    setProspectoSeleccionado(row);
    setModalTipo("detalle");
    setModalOpen(true);
    fetchHistorial(row.id);
  }

  function handleOpenHistorial(row) {
    setProspectoSeleccionado(row);
    setModalTipo("historial");
    setModalOpen(true);
    fetchHistorial(row.id);
  }

  async function handleOpenCotizacion(row) {
    setProspectoSeleccionado(row);
    setModalTipo("cotizacion");
    setModalOpen(true);
    setShowDetallesCotizacion({ // Reset details visibility
    });

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/lead/${row.id}/cotizaciones?detalles=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Procesar las cotizaciones como en ProspectoDetalle
      if (Array.isArray(data) && data.length > 0 && data[0].plan_nombre) {
        setCotizaciones(data);
      } else {
        const cotizacionesAgrupadas = data.reduce((acc, cotizacion) => {
          const planId = cotizacion.plan_id;
          if (!acc[planId]) {
            acc[planId] = {
              id: cotizacion.id,
              plan_nombre: cotizacion.plan_nombre,
              tipo_afiliacion_nombre: cotizacion.tipo_afiliacion_nombre,
              total_bruto: cotizacion.total_bruto,
              total_descuento_aporte: cotizacion.total_descuento_aporte || 0,
              total_descuento_promocion: cotizacion.total_descuento_promocion || 0,
              total_final: cotizacion.total_final,
              anio: cotizacion.anio || new Date().getFullYear(),
              fecha: cotizacion.fecha || new Date().toISOString(),
              detalles: [],
            };
          }
          acc[planId].detalles.push({
            id: cotizacion.id,
            persona: cotizacion.persona,
            vinculo: cotizacion.vinculo,
            edad: cotizacion.edad,
            tipo_afiliacion_id: cotizacion.tipo_afiliacion_id,
            tipo_afiliacion: cotizacion.tipo_afiliacion_nombre,
            precio_base: cotizacion.precio_base,
            descuento_aporte: cotizacion.descuento_aporte,
            promocion_aplicada: cotizacion.promocion_aplicada,
            descuento_promocion: cotizacion.descuento_promocion,
            precio_final: cotizacion.precio_final,
          });
          return acc;
        }, {});

        setCotizaciones(Object.values(cotizacionesAgrupadas));
      }
    } catch (error) {
      console.error("Error al obtener cotizaciones:", error);
      setCotizaciones([]);
    }
  }

  async function handleOpenReasignar(row) {
    setProspectoParaReasignar(row);
    setNuevoVendedorId("");
    await fetchVendedoresDisponibles(); // Cargar vendedores antes de abrir modal
    setShowReasignarModal(true);
  }

  const handleReasignarProspecto = async () => {
    if (!nuevoVendedorId || !prospectoParaReasignar) {
      Swal.fire("Error", "Debe seleccionar un vendedor destino.", "error");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/supervisor/reasignar-prospectos`,
        {
          prospectos: [prospectoParaReasignar.id],
          nuevo_vendedor_id: nuevoVendedorId,
          vendedor_anterior_id: prospectoParaReasignar.vendedor_id || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
        icon: 'success',
        title: 'Reasignación exitosa',
        text: `El prospecto ha sido reasignado correctamente.`,
        confirmButtonColor: '#3085d6'
      });

      // Actualizar la lista de prospectos
      await fetchProspectos();
      setShowReasignarModal(false);
      setProspectoParaReasignar(null);
      setNuevoVendedorId("");
    } catch (error) {
      console.error("Error al reasignar prospecto:", error);
      Swal.fire("Error", "No se pudo reasignar el prospecto: " + (error.response?.data?.message || error.message), "error");
    }
  };

  // Funciones para cambio de estado
  const handleCardChange = (id, field, value) => {
    setEditValues((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleOpenCambioEstado = (prospecto) => {
    setProspectoParaCambioEstado(prospecto);
    setEditValues((prev) => ({
      ...prev,
      [prospecto.id]: {
        estado: prospecto.asignacion_estado || prospecto.estado,
        comentario: prospecto.asignacion_comentario || prospecto.comentario || ""
      }
    }));
    setShowModalCambioEstado(true);
  };

  const handleSaveEstado = async () => {
    if (!prospectoParaCambioEstado) return;

    const values = editValues[prospectoParaCambioEstado.id] || {};
    const nuevoEstado = values.estado;
    const comentario = values.comentario || '';

    // Validación: si cambia el estado, debe haber comentario
    const estadoCambiado = nuevoEstado !== (prospectoParaCambioEstado.asignacion_estado || prospectoParaCambioEstado.estado);

    if (estadoCambiado && (!comentario || comentario.trim() === "")) {
      Swal.fire("Atención", "Debes agregar un comentario al cambiar el estado.", "warning");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_URL}/supervisor/prospectos/${prospectoParaCambioEstado.id}/estado`,
        {
          estado: nuevoEstado,
          motivo: comentario
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Éxito", "Estado del prospecto actualizado correctamente.", "success");
      setShowModalCambioEstado(false);
      setProspectoParaCambioEstado(null);
      setEditValues((prev) => ({ ...prev, [prospectoParaCambioEstado.id]: {} }));
      fetchProspectos(); // Recargar la lista
    } catch (error) {
      console.error("Error al actualizar estado del prospecto:", error);
      Swal.fire("Error", "No se pudo actualizar el estado: " + (error.response?.data?.message || error.message), "error");
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setProspectoSeleccionado(null);
  };

  // ✅ NUEVAS FUNCIONES: Modal de conversaciones WhatsApp
  const handleEnviarWhatsApp = async (prospecto) => {
    try {
      if (!prospecto?.id) {
        Swal.fire("Error", "No se encontró información del prospecto", "error");
        return;
      }

      setProspectoConversaciones(prospecto);
      setLoadingConversaciones(true);
      setModalConversaciones(true);

      // Obtener conversaciones del prospecto
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${API_URL}/supervisor/chat/conversaciones/prospecto/${prospecto.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('📋 Respuesta del servidor:', data);

      if (data.success) {
        console.log('✅ Conversaciones encontradas:', data.data.conversaciones);
        setConversacionesProspecto(data.data.conversaciones);
      } else {
        console.log('⚠️ No hay conversaciones disponibles');
        setConversacionesProspecto([]);
      }

    } catch (error) {
      console.error("Error obteniendo conversaciones:", error);
      setConversacionesProspecto([]);
      Swal.fire("Error", "No se pudieron cargar las conversaciones", "error");
    } finally {
      setLoadingConversaciones(false);
    }
  };

  const handleVerConversacion = async (conversacion) => {
    try {
      setConversacionSeleccionada(conversacion);
      setLoadingMensajes(true);
      
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${API_URL}/supervisor/chat/mensajes/${conversacion.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('📨 Mensajes de conversación:', data);

      if (data.success) {
        setMensajesConversacion(data.data.mensajes);
      } else {
        setMensajesConversacion([]);
        Swal.fire("Info", "No hay mensajes en esta conversación", "info");
      }

    } catch (error) {
      console.error("Error obteniendo mensajes:", error);
      setMensajesConversacion([]);
      Swal.fire("Error", "No se pudieron cargar los mensajes", "error");
    } finally {
      setLoadingMensajes(false);
    }
  };

  const handleVolverAConversaciones = () => {
    setConversacionSeleccionada(null);
    setMensajesConversacion([]);
  };

  const handleNuevaConversacion = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const { data } = await axios.post(
        `${API_URL}/supervisor/chat/conversaciones`,
        {
          prospecto_id: prospectoConversaciones.id,
          tipo_origen: 'manual'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        Swal.fire("Éxito", "Nueva conversación creada", "success");
        handleEnviarWhatsApp(prospectoConversaciones);
      }

    } catch (error) {
      console.error("Error creando conversación:", error);
      Swal.fire("Error", "No se pudo crear la conversación", "error");
    }
  };

  // ✅ NUEVAS FUNCIONES: Gestión de documentos
  const handleAbrirCargaDocumentos = (poliza) => {
    setPolizaSeleccionadaDocumentos(poliza);
    setShowModalCargaDocumentos(true);
  };

  const handleCerrarCargaDocumentos = () => {
    setShowModalCargaDocumentos(false);
    setPolizaSeleccionadaDocumentos(null);
  };

  const handleDocumentosActualizados = () => {
    // Refrescar datos de pólizas si es necesario
    console.log('Documentos actualizados para póliza:', polizaSeleccionadaDocumentos?.id);
    // Aquí podrías recargar la lista de pólizas o actualizar estadísticas
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoConversacion = (estado) => {
    const estados = {
      'activa': 'success',
      'pausada': 'warning', 
      'cerrada': 'secondary',
      'finalizada': 'dark'
    };
    return estados[estado] || 'secondary';
  };

  const getEstadoTexto = (estado) => {
    const estados = {
      'activa': 'Activa',
      'pausada': 'Pausada',
      'cerrada': 'Cerrada', 
      'finalizada': 'Finalizada'
    };
    return estados[estado] || estado;
  };

  const getTipoOrigen = (tipo) => {
    const tipos = {
      'cotizacion': 'Cotización',
      'poliza': 'Póliza',
      'manual': 'Manual',
      'webhook': 'Automático'
    };
    return tipos[tipo] || tipo;
  };

  const getTipoOrigenIcon = (tipo) => {
    const iconos = {
      'cotizacion': '📋',
      'poliza': '📄', 
      'manual': '✍️',
      'webhook': '🔔'
    };
    return iconos[tipo] || '❓';
  };

  const maskPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return phone;
    
    const masked = '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
    
    if (phone.includes('+')) {
      return `+${masked}`;
    } else if (phone.includes('-') || phone.includes(' ') || phone.includes('(')) {
      return `******${cleaned.slice(-4)}`;
    }
    
    return masked;
  };

  const handleFiltroChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const prospectosFiltrados = prospectosConVendedor.filter((p) => {
    return (
      (filtros.vendedor === "" || p.vendedor.toLowerCase().includes(filtros.vendedor.toLowerCase())) &&
      (filtros.edad === "" || String(p.edad) === filtros.edad) &&
      (filtros.estado === "" || (p.asignacion_estado || p.estado).toLowerCase().includes(filtros.estado.toLowerCase())) &&
      (filtros.nombre === "" || p.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())) &&
      (filtros.apellido === "" || p.apellido.toLowerCase().includes(filtros.apellido.toLowerCase()))
    );
  });

  // Estados disponibles para prospectos
  const estadosDisponibles = [
    'Lead',
    '1º Contacto',
    'Calificado Cotización',
    'Calificado Póliza',
    'Calificado Pago',
    'Venta',
    'Fuera de zona',
    'Fuera de edad',
    'Preexistencia',
    'Reafiliación',
    'No contesta',
    'prueba interna',
    'Ya es socio',
    'Busca otra Cobertura',
    'Teléfono erróneo',
    'No le interesa (económico)',
    'No le interesa cartilla',
    'No busca cobertura médica'
  ];

  const estadoPorcentaje = {
    "Lead": 10,
    "1º Contacto": 25,
    "Calificado Cotización": 50,
    "Calificado Póliza": 75,
    "Calificado Pago": 90,
    "Venta": 100,
    "Fuera de zona": 0,
    "Fuera de edad": 0,
    "Preexistencia": 0,
    "Reafiliación": 0,
    "No contesta": 0,
    "prueba interna": 0,
    "Ya es socio": 0,
    "Busca otra Cobertura": 0,
    "Teléfono erróneo": 0,
    "No le interesa (económico)": 0,
    "No le interesa cartilla": 0,
    "No busca cobertura médica": 0
  };

  // ✅ Función para obtener la clase CSS del color dinámico basado en el porcentaje
  const getProgressColorClass = (porcentaje) => {
    if (porcentaje === 0) return 'bg-danger-gradient';
    if (porcentaje <= 20) return 'bg-danger-gradient';
    if (porcentaje <= 40) return 'bg-warning-gradient';
    if (porcentaje <= 60) return 'bg-yellow-gradient';
    if (porcentaje <= 80) return 'bg-success-light-gradient';
    if (porcentaje < 100) return 'bg-success-gradient';
    return 'bg-complete-gradient';
  };

  // Función para obtener el color del estado basado en el progreso (igual que vendedor)
  const getEstadoColor = (estado) => {
    const progreso = estadoPorcentaje[estado] || 0;
    return progreso === 100 ? "success" :
      progreso > 50 ? "primary" :
        progreso > 0 ? "warning" :
          "danger";
  };

  // Función para obtener la variante del botón del estado
  const getEstadoVariant = (estado) => {
    const color = getEstadoColor(estado);
    return `outline-${color}`;
  };

  // Opciones del menú con colores y estadísticas
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: FaTachometerAlt,
      color: "primary",
      count: null,
      description: "Panel principal"
    },
    {
      id: "prospectos",
      label: "Prospectos",
      icon: FaUserFriends,
      color: "success",
      count: prospectos.length,
      description: "Gestión de leads"
    },
    {
      id: "vendedores",
      label: "Vendedores",
      icon: FaUsers,
      color: "warning",
      count: null,
      description: "Gestión del equipo"
    },
    {
      id: "polizas",
      label: "Pólizas",
      icon: FaFileAlt,
      color: "danger",
      count: null,
      description: "Gestión de pólizas"
    },
    {
      id: "documentos",
      label: "Documentos",
      icon: FaCloudUploadAlt,
      color: "info",
      count: null,
      description: "Carga múltiple de documentos"
    }
  ];

  const getVistaTitle = () => {
    const item = menuItems.find(item => item.id === vista);
    return item ? item.label : "Supervisor Dashboard";
  };

  // Componente para las cards estadísticas
  const StatCard = ({ icon: Icon, title, value, change, changeType, color }) => (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body className="d-flex align-items-center">
        <div className={`rounded-circle p-3 me-3 bg-${color} bg-opacity-10`}>
          <Icon className={`text-${color} fs-4`} />
        </div>
        <div className="flex-grow-1">
          <h6 className="text-muted mb-1 fw-normal">{title}</h6>
          <h3 className="mb-0 fw-bold">{value}</h3>
          {change && (
            <div className="d-flex align-items-center mt-1">
              {changeType === 'up' && <FaArrowUp className="text-success me-1" size={12} />}
              {changeType === 'down' && <FaArrowDown className="text-danger me-1" size={12} />}
              {changeType === 'equal' && <FaEquals className="text-muted me-1" size={12} />}
              <small className={`text-${changeType === 'up' ? 'success' : changeType === 'down' ? 'danger' : 'muted'}`}>
                {change}% vs mes anterior
              </small>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );

  // Componente del dashboard principal
  const renderDashboard = () => (
    <div>
      {/* Cards de estadísticas */}
      <Row className="g-4 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={FaUserFriends}
            title="Total Prospectos"
            value={estadisticas.totalProspectos.toLocaleString()}
            change={12.5}
            changeType="up"
            color=""
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={FaUsers}
            title="Vendedores Activos"
            value={estadisticas.totalVendedores}
            change={5.2}
            changeType="up"
            color="success"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={FaUserCheck}
            title="Ventas Confirmadas"
            value={estadisticas.ventasConfirmadas}
            change={-2.1}
            changeType="down"
            color="warning"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            icon={FaFileAlt}
            title="Pólizas Generadas"
            value={estadisticas.totalPolizas}
            change={3.4}
            changeType="up"
            color="info"
          />
        </Col>
      
      </Row>

      {/* Gráfica y métricas adicionales */}
      <Row className="g-4">
        <Col xs={12}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pb-0">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h5 className="mb-1 fw-bold">Tendencias Mensuales</h5>
                  <p className="text-muted mb-0 small">Evolución de prospectos, vendedores, ventas y pólizas</p>
                </div>
                <div className="d-flex gap-3">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary rounded-circle me-2" style={{ width: '12px', height: '12px' }}></div>
                    <small className="text-muted">Nuevos Prospectos</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="bg-success rounded-circle me-2" style={{ width: '12px', height: '12px' }}></div>
                    <small className="text-muted">Vendedores</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="bg-warning rounded-circle me-2" style={{ width: '12px', height: '12px' }}></div>
                    <small className="text-muted">Ventas</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="bg-info rounded-circle me-2" style={{ width: '12px', height: '12px' }}></div>
                    <small className="text-muted">Pólizas Generadas</small>
                  </div>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {console.log('Datos para la gráfica:', datosGrafica)}
              {datosGrafica && datosGrafica.length > 0 ? (
                <ResponsiveContainer width="100%" height={300} key={JSON.stringify(datosGrafica)}>
                  <LineChart data={datosGrafica}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="mes"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#666' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#666' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="nuevosProspectos"
                      stroke="#8B7EC8"
                      strokeWidth={3}
                      dot={{ fill: '#8B7EC8', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#8B7EC8', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="vendedores"
                      stroke="#48BB78"
                      strokeWidth={3}
                      dot={{ fill: '#48BB78', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#48BB78', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ventas"
                      stroke="#ED8936"
                      strokeWidth={3}
                      dot={{ fill: '#ED8936', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#ED8936', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="polizasGeneradas"
                      stroke="#17A2B8"
                      strokeWidth={3}
                      dot={{ fill: '#17A2B8', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#17A2B8', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">Cargando datos de la gráfica...</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* <Col lg={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pb-0">
              <h5 className="mb-1 fw-bold">Resumen Ejecutivo</h5>
              <p className="text-muted mb-0 small">Métricas clave del período</p>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                <div>
                  <h6 className="mb-0">Tasa de Conversión</h6>
                  <small className="text-muted">Prospectos → Ventas</small>
                </div>
                <div className="text-end">
                  <h5 className="mb-0 text-success">
                    {estadisticas.totalProspectos > 0
                      ? ((estadisticas.ventasConfirmadas / estadisticas.totalProspectos) * 100).toFixed(1)
                      : 0}%
                  </h5>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                <div>
                  <h6 className="mb-0">Promedio por Venta</h6>
                  <small className="text-muted">Valor promedio</small>
                </div>
                <div className="text-end">
                  <h5 className="mb-0 text-primary">
                    {estadisticas.ventasConfirmadas > 0
                      ? formatCurrency(estadisticas.totalFacturado / estadisticas.ventasConfirmadas)
                      : formatCurrency(0)}
                  </h5>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                <div>
                  <h6 className="mb-0">Prospectos por Vendedor</h6>
                  <small className="text-muted">Distribución promedio</small>
                </div>
                <div className="text-end">
                  <h5 className="mb-0 text-warning">
                    {estadisticas.totalVendedores > 0
                      ? Math.round(estadisticas.totalProspectos / estadisticas.totalVendedores)
                      : 0}
                  </h5>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center py-3">
                <div>
                  <h6 className="mb-0">Meta Mensual</h6>
                  <small className="text-muted">Progreso actual</small>
                </div>
                <div className="text-end">
                  <h5 className="mb-0 text-info">
                    {Math.min(100, (estadisticas.ventasConfirmadas / 100) * 100).toFixed(0)}%
                  </h5>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col> */}
      </Row>
    </div>
  );

  // ✅ NUEVA VISTA: Gestión de documentos
  const renderVistaDocumentos = () => (
    <div>
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <FaCloudUploadAlt className="me-2" />
                Gestión de Documentos
              </h5>
              <p className="mb-0 small">Carga múltiple de documentos para pólizas</p>
            </Card.Header>
            <Card.Body>
              <div className="text-center py-4">
                <FaFileUpload size={48} className="text-muted mb-3" />
                <h6>Selecciona una póliza para cargar documentos</h6>
                <p className="text-muted mb-3">
                  Utiliza la vista de pólizas para seleccionar una póliza específica y cargar documentos.
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => setVista('polizas')}
                >
                  <FaFileContract className="me-2" />
                  Ir a Pólizas
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header>
              <h6 className="mb-0">
                <FaInfo className="me-2 text-info" />
                Tipos de documentos soportados
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <h6 className="text-primary">Documentos de Cliente:</h6>
                    <ul className="list-unstyled ms-3">
                      <li><FaFile className="me-2 text-secondary" />Póliza firmada por cliente</li>
                      <li><FaFile className="me-2 text-secondary" />Auditoría médica</li>
                      <li><FaFile className="me-2 text-secondary" />Documentos de identidad</li>
                      <li><FaFile className="me-2 text-secondary" />Comprobantes de ingresos</li>
                    </ul>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <h6 className="text-success">Documentos Internos:</h6>
                    <ul className="list-unstyled ms-3">
                      <li><FaFile className="me-2 text-secondary" />Formularios internos</li>
                      <li><FaFile className="me-2 text-secondary" />Reportes médicos</li>
                      <li><FaFile className="me-2 text-secondary" />Comunicaciones internas</li>
                      <li><FaFile className="me-2 text-secondary" />Otros documentos</li>
                    </ul>
                  </div>
                </Col>
              </Row>
              <div className="alert alert-info mb-0">
                <FaInfoCircle className="me-2" />
                <strong>Límites:</strong> Máximo 6 archivos por carga, 10MB por archivo. 
                Formatos soportados: JPG, PNG, PDF, DOC, DOCX.
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );

  // Sidebar content mejorado
  const drawerContent = (
    <div className="sidebar-supervisor h-100">
      <div className="sidebar-header">
        <div className="d-flex align-items-center justify-content-between">
          <h5 className="sidebar-title mb-0">
            <FaUserShield className="supervisor-icon" />
            Supervisor <span className="fw-light">Panel</span>
          </h5>
          <Button
            variant="light"
            size="sm"
            className="sidebar-close-btn d-lg-none"
            onClick={() => setOpenDrawer(false)}
          >
            <FaTimes />
          </Button>
        </div>
      </div>

      <div className="sidebar-nav h-100 d-flex flex-column">
        <div className="flex-grow-1">
          {menuItems.map((item) => (
            <div key={item.id} className="nav-item">
              <button
                className={`nav-link w-100 text-start ${vista === item.id ? "active" : ""}`}
                onClick={() => {
                  setVista(item.id);
                  setOpenDrawer(false);
                }}
              >
                <item.icon className="nav-icon" />
                <span className="nav-text">{item.label}</span>
                {item.count !== null && item.count !== undefined && item.count > 0 && <Badge bg="secondary" className="ms-auto">{item.count}</Badge>}
              </button>
            </div>
          ))}
        </div>

        {/* Logout section */}
        <div className="nav-logout">
          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <div className="mt-2">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Layout para Desktop y Tablet */}
      <div className="supervisor-dashboard d-none d-md-flex min-vh-100" style={{ background: "#f8fafc" }}>
        {/* Sidebar fijo */}
        <div className="sidebar-wrapper">
          {drawerContent}
        </div>

        {/* Contenido principal */}
        <div className="content-wrapper">
          {/* Header mejorado */}
          <div className="supervisor-topbar">
            <div className="topbar-left">
              <div className="topbar-title">
                <FaTachometerAlt className="title-icon" />
                <span className="title-text">{getVistaTitle()}</span>
              </div>
            </div>

            <div className="topbar-right">
              {vista === "prospectos" && (
                <Button
                  variant="success"
                  onClick={() => setShowModalExportacion(true)}
                  className="d-flex align-items-center me-2"
                  size="sm"
                >
                  <FaFileAlt className="me-1" />
                  <span className="d-none d-sm-inline">Exportar</span>
                </Button>
              )}
              <div className="supervisor-badge">
                <FaUserShield className="me-1" />
                Supervisor
              </div>
            </div>
          </div>

          {/* Contenido */}
          <Container fluid className="p-3 p-lg-4">
            {vista === "prospectos" && (
              <>
                {/* Filtros - Desktop/Tablet */}
                <Card className="supervisor-filters mb-3 mb-lg-4">
                  <Card.Header className="filters-header">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="filters-title mb-0">
                        <FaSearch className="me-2" />Filtros de Búsqueda
                      </h6>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-2 g-lg-3">
                      <Col md={6} lg={2}>
                        <Form.Label className="small text-muted">Vendedor</Form.Label>
                        <Form.Control
                          placeholder="Buscar vendedor..."
                          name="vendedor"
                          value={filtros.vendedor}
                          onChange={handleFiltroChange}
                          size="sm"
                        />
                      </Col>
                      <Col md={6} lg={2}>
                        <Form.Label className="small text-muted">Edad</Form.Label>
                        <Form.Control
                          placeholder="Edad"
                          name="edad"
                          value={filtros.edad}
                          onChange={handleFiltroChange}
                          size="sm"
                          type="number"
                          min="0"
                        />
                      </Col>
                      <Col md={6} lg={2}>
                        <Form.Label className="small text-muted">Estado</Form.Label>
                        <Form.Control
                          placeholder="Estado"
                          name="estado"
                          value={filtros.estado}
                          onChange={handleFiltroChange}
                          size="sm"
                        />
                      </Col>
                      <Col md={6} lg={2}>
                        <Form.Label className="small text-muted">Nombre</Form.Label>
                        <Form.Control
                          placeholder="Nombre"
                          name="nombre"
                          value={filtros.nombre}
                          onChange={handleFiltroChange}
                          size="sm"
                        />
                      </Col>
                      <Col md={6} lg={2}>
                        <Form.Label className="small text-muted">Apellido</Form.Label>
                        <Form.Control
                          placeholder="Apellido"
                          name="apellido"
                          value={filtros.apellido}
                          onChange={handleFiltroChange}
                          size="sm"
                        />
                      </Col>
                      <Col md={6} lg={2} className="d-flex align-items-end">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="w-100"
                          onClick={() => setFiltros({ vendedor: "", edad: "", estado: "", nombre: "", apellido: "" })}
                        >
                          Limpiar
                        </Button>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Tabla - Desktop/Tablet */}
                <Card className="shadow-sm card-no-border">
                  <Card.Body className="p-0">
                    {loading ? (
                      <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <div className="mt-2">Cargando prospectos...</div>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table hover className="mb-0">
                          <thead className="bg-light">
                            <tr>
                              <th className="px-3 px-lg-4 py-3">ID</th>
                              <th className="px-3 px-lg-4 py-3">Nombre</th>
                              <th className="px-3 px-lg-4 py-3 d-none d-lg-table-cell">Contacto</th>
                              <th className="px-3 px-lg-4 py-3 d-none d-xl-table-cell">Edad</th>
                              <th className="px-3 px-lg-4 py-3">Estado</th>
                              <th className="px-3 px-lg-4 py-3 d-none d-lg-table-cell">Vendedor</th>
                              <th className="px-3 px-lg-4 py-3">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prospectosFiltrados.map((row) => (
                              <tr key={row.id}>
                                <td className="px-3 px-lg-4 py-3">
                                  <Badge bg="secondary">{row.id}</Badge>
                                </td>
                                <td className="px-3 px-lg-4 py-3">
                                  <div>
                                    <div className="fw-bold">{row.nombre} {row.apellido}</div>
                                    <small className="text-muted d-block d-lg-none">{row.numero_contacto}</small>
                                    <small className="text-muted">{row.correo}</small>
                                  </div>
                                </td>
                                <td className="px-3 px-lg-4 py-3 d-none d-lg-table-cell">
                                  <div>
                                    <div className="fw-bold">{row.numero_contacto}</div>
                                    <small className="text-muted">{row.localidad}</small>
                                  </div>
                                </td>
                                <td className="px-3 px-lg-4 py-3 d-none d-xl-table-cell">
                                  <Badge bg="info">{row.edad} años</Badge>
                                </td>
                                <td className="px-3 px-lg-4 py-3">
                                  <div className="d-flex align-items-center">
                                    <Button
                                      variant={getEstadoVariant(row.asignacion_estado || row.estado)}
                                      size="sm"
                                      onClick={() => handleOpenCambioEstado(row)}
                                      className="me-2"
                                      title="Cambiar estado"
                                    >
                                      {row.asignacion_estado || row.estado}
                                    </Button>
                                  </div>
                                  <div className="d-block d-lg-none">
                                    <small className="text-muted">{row.vendedor}</small>
                                  </div>
                                </td>
                                <td className="px-3 px-lg-4 py-3 d-none d-lg-table-cell">
                                  <div className="small">{row.vendedor}</div>
                                </td>
                                <td className="px-3 px-lg-4 py-3">
                                  <div className="d-flex gap-1 flex-wrap">
                                    <Button size="sm" variant="outline-primary" onClick={() => handleOpenModal(row)} title="Ver detalle">
                                      <FaEye />
                                    </Button>
                                    <Button size="sm" variant="outline-info" onClick={() => handleOpenHistorial(row)} title="Ver historial" className="d-none d-lg-inline-block">
                                      <FaUserCheck />
                                    </Button>
                                    <Button size="sm" variant="outline-success" onClick={() => handleOpenCotizacion(row)} title="Ver cotizaciones" className="d-none d-xl-inline-block">
                                      <FaMoneyBillWave />
                                    </Button>
                                    <Button size="sm" variant="outline-warning" onClick={() => handleOpenReasignar(row)} title="Reasignar vendedor">
                                      <FaExchangeAlt />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline-secondary" 
                                      onClick={() => handleEnviarWhatsApp(row)} 
                                      title="Ver conversaciones de WhatsApp"
                                      className="d-none d-lg-inline-block"
                                    >
                                      <FaWhatsapp />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </>
            )}

            {vista === "dashboard" && renderDashboard()}
            {vista === "metricas" && <MetricasVendedor />}
            {vista === "vendedores" && <VendedoresSupervisor />}
            {vista === "cotizaciones" && <SupervisorCotizaciones />}
            {vista === "polizas" && <PolizasSupervisor />}
            {vista === "documentos" && renderVistaDocumentos()}
          </Container>
        </div>
      </div>

      {/* Layout para Mobile */}
      <div className="supervisor-dashboard d-md-none min-vh-100" style={{ background: "#f8fafc" }}>
        {/* Offcanvas Sidebar mejorado */}
        <Offcanvas
          show={openDrawer}
          onHide={() => setOpenDrawer(false)}
          placement="start"
          className="offcanvas-supervisor"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Panel de Supervisor</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-0">
            {drawerContent}
          </Offcanvas.Body>
        </Offcanvas>

        {/* Header móvil mejorado */}
        <div className="supervisor-topbar">
          <div className="topbar-left">
            <Button
              variant="light"
              size="sm"
              className="menu-toggle"
              onClick={() => setOpenDrawer(true)}
            >
              <FaBars />
            </Button>
            <div className="topbar-title">
              <FaTachometerAlt className="title-icon" />
              <span className="title-text">{getVistaTitle()}</span>
            </div>
          </div>

          <div className="topbar-right">
            {vista === "prospectos" && (
              <Button
                variant="success"
                onClick={() => setShowModalExportacion(true)}
                size="sm"
                className="me-2"
              >
                <FaFileAlt />
              </Button>
            )}
            <div className="supervisor-badge">
              Supervisor
            </div>
          </div>
        </div>

        {/* Contenido móvil */}
        <Container fluid className="p-2">
          {/* Dashboard principal - Cards de navegación mejoradas */}
          {vista === "dashboard" && (
            <>
              {/* Resumen rápido en mobile */}
              <Row className="g-2 mb-3">
                <Col xs={6}>
                  <Card className="supervisor-summary-card h-100">
                    <Card.Body>
                      <FaUserFriends className="card-icon" />
                      <div className="card-value">{estadisticas.totalProspectos}</div>
                      <div className="card-label">Prospectos</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6}>
                  <Card className="supervisor-summary-card bg-success h-100">
                    <Card.Body>
                      <FaUsers className="card-icon" />
                      <div className="card-value">{estadisticas.totalVendedores}</div>
                      <div className="card-label">Vendedores</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6}>
                  <Card className="supervisor-summary-card bg-warning h-100">
                    <Card.Body>
                      <FaUserCheck className="card-icon" />
                      <div className="card-value">{estadisticas.ventasConfirmadas}</div>
                      <div className="card-label">Ventas</div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6}>
                  <Card className="supervisor-summary-card bg-danger h-100">
                    <Card.Body>
                      <FaMoneyBillWave className="card-icon" />
                      <div className="card-value">${(estadisticas.totalFacturado / 1000000).toFixed(1)}M</div>
                      <div className="card-label">Facturado</div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Cards de navegación */}
              <Row className="g-2">
                {menuItems.slice(1).map((item) => ( // Excluir dashboard de las cards
                  <Col key={item.id} xs={6}>
                    <Card
                      className={`supervisor-card-mobile card-${item.id} shadow-sm h-100`}
                      style={{ cursor: "pointer" }}
                      onClick={() => setVista(item.id)}
                    >
                      <Card.Body>
                        <item.icon className="card-icon" />
                        <h6 className="card-title">{item.label}</h6>
                        <div className="card-description">{item.description}</div>
                        {item.count !== null && item.count !== undefined && item.count > 0 && (
                          <Badge bg={item.color} className="mt-1">{item.count}</Badge>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}

          {/* Vista específica de Prospectos */}
          {vista === "prospectos" && (
            <>
              {/* Botón para volver al dashboard en mobile */}
              <Button
                variant="outline-secondary"
                size="sm"
                className="mb-2"
                onClick={() => setVista("dashboard")}
              >
                <FaChevronLeft className="me-1" /> Dashboard
              </Button>

              {/* Filtros móvil - Colapsables */}
              <Card className="supervisor-filters mb-2">
                <Card.Header
                  className="filters-header py-2"
                  onClick={() => setShowFiltros(!showFiltros)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="filters-title mb-0">
                      <FaFilter className="me-2" />Filtros
                    </h6>
                    <small className="text-muted">
                      {showFiltros ? 'Ocultar' : 'Mostrar'}
                    </small>
                  </div>
                </Card.Header>
                {showFiltros && (
                  <Card.Body className="p-2">
                    <Row className="g-2">
                      <Col xs={6}>
                        <Form.Control
                          placeholder="Vendedor"
                          name="vendedor"
                          value={filtros.vendedor}
                          onChange={handleFiltroChange}
                          size="sm"
                        />
                      </Col>
                      <Col xs={6}>
                        <Form.Control
                          placeholder="Estado"
                          name="estado"
                          value={filtros.estado}
                          onChange={handleFiltroChange}
                          size="sm"
                        />
                      </Col>
                      <Col xs={6}>
                        <Form.Control
                          placeholder="Nombre"
                          name="nombre"
                          value={filtros.nombre}
                          onChange={handleFiltroChange}
                          size="sm"
                        />
                      </Col>
                      <Col xs={6}>
                        <Form.Control
                          placeholder="Apellido"
                          name="apellido"
                          value={filtros.apellido}
                          onChange={handleFiltroChange}
                          size="sm"
                        />
                      </Col>
                      <Col xs={12}>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="w-100"
                          onClick={() => {
                            setFiltros({ vendedor: "", edad: "", estado: "", nombre: "", apellido: "" });
                            setShowFiltros(false);
                          }}
                        >
                          Limpiar Filtros
                        </Button>
                      </Col>
                    </Row>
                  </Card.Body>
                )}
              </Card>

              {/* Lista de prospectos para móvil */}
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" size="sm" />
                  <div className="mt-2 small">Cargando...</div>
                </div>
              ) : (
                <div className="d-grid gap-2">
                  {prospectosFiltrados.map((row) => (
                    <Card key={row.id} className="shadow-sm">
                      <Card.Body className="p-2">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="flex-grow-1">
                            <h6 className="mb-1 fs-6">{row.nombre} {row.apellido}</h6>
                            <div className="d-flex flex-wrap gap-1 mb-1">
                              <Badge bg="secondary" className="small">#{row.id}</Badge>
                              <Badge bg="info" className="small">{row.edad}a</Badge>
                              <Button
                                variant={getEstadoVariant(row.asignacion_estado || row.estado)}
                                size="sm"
                                onClick={() => handleOpenCambioEstado(row)}
                                className="small p-1 px-2"
                              >
                                {row.asignacion_estado || row.estado}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="mb-2">
                          <div className="d-flex justify-content-between">
                            <small className="text-muted">📞</small>
                            <small className="fw-bold">{row.numero_contacto}</small>
                          </div>
                          <div className="d-flex justify-content-between">
                            <small className="text-muted">👤</small>
                            <small>{row.vendedor}</small>
                          </div>
                        </div>

                        <div className="d-flex gap-1">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            className="flex-fill"
                            onClick={() => handleOpenModal(row)}
                          >
                            <FaEye />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-info"
                            className="flex-fill"
                            onClick={() => handleOpenHistorial(row)}
                          >
                            <FaUserCheck />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-success"
                            className="flex-fill"
                            onClick={() => handleOpenCotizacion(row)}
                          >
                            <FaMoneyBillWave />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-warning"
                            className="flex-fill"
                            onClick={() => handleOpenReasignar(row)}
                          >
                            <FaExchangeAlt />
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}

                  {prospectosFiltrados.length === 0 && (
                    <Card className="text-center py-4">
                      <Card.Body>
                        <FaSearch className="text-muted mb-2" size={24} />
                        <p className="text-muted mb-0">No se encontraron prospectos</p>
                        <small className="text-muted">Intenta ajustar los filtros</small>
                      </Card.Body>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}

          {/* Vista específica de Vendedores */}
          {vista === "vendedores" && (
            <div>
              <Button
                variant="outline-secondary"
                size="sm"
                className="mb-2"
                onClick={() => setVista("dashboard")}
              >
                <FaChevronLeft className="me-1" /> Dashboard
              </Button>
              <VendedoresSupervisor />
            </div>
          )}

          {/* Vista específica de Cotizaciones */}
          {vista === "cotizaciones" && (
            <div>
              <Button
                variant="outline-secondary"
                size="sm"
                className="mb-2"
                onClick={() => setVista("dashboard")}
              >
                <FaChevronLeft className="me-1" /> Dashboard
              </Button>
              <SupervisorCotizaciones />
            </div>
          )}

          {/* Vista específica de Pólizas */}
          {vista === "polizas" && (
            <div>
              <Button
                variant="outline-secondary"
                size="sm"
                className="mb-2"
                onClick={() => setVista("dashboard")}
              >
                <FaChevronLeft className="me-1" /> Dashboard
              </Button>
              <PolizasSupervisor />
            </div>
          )}

          {/* ✅ NUEVA Vista específica de Documentos */}
          {vista === "documentos" && (
            <div>
              <Button
                variant="outline-secondary"
                size="sm"
                className="mb-2"
                onClick={() => setVista("dashboard")}
              >
                <FaChevronLeft className="me-1" /> Dashboard
              </Button>
              {renderVistaDocumentos()}
            </div>
          )}
        </Container>
      </div>

      {/* Modal responsivo mejorado */}
      <Modal
        show={modalOpen}
        onHide={handleCloseModal}
        centered
        size="xl"
        fullscreen="sm-down"
        className="supervisor-modal"
      >
        <Modal.Header closeButton className="border-0 pb-2">
          <Modal.Title className="fs-6 fw-bold">
            {modalTipo === "historial"
              ? "Historial de acciones"
              : modalTipo === "cotizacion"
                ? `💰 Cotizaciones`
                : "👤 Información del Prospecto"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          className="p-3"
          style={{
            maxHeight: '70vh',
            overflowY: 'auto'
          }}
        >
          {modalTipo === "historial" ? (
            <div>
              {historial.length === 0 ? (
                <div className="text-center text-muted py-4">
                  No hay registros de historial para este prospecto
                </div>
              ) : (
                historial.map((accion, index) => (
                  <Card key={index} className="mb-2 border-left-info">
                    <Card.Body className="py-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <Badge bg={accion.accion === 'APLICAR_PROMOCION' ? 'success' : 'info'}>
                          {accion.accion}
                        </Badge>
                        <small className="text-muted">{new Date(accion.fecha).toLocaleString()}</small>
                      </div>
                      <div>{accion.descripcion}</div>
                      <div className="mt-1">
                        <small>Por: {accion.first_name} {accion.last_name}</small>
                      </div>
                    </Card.Body>
                  </Card>
                ))
              )}
            </div>
          ) : modalTipo === "cotizacion" ? (
            cotizaciones.length === 0 ? (
              <div className="text-muted text-center py-3">
                <FaMoneyBillWave className="mb-2" size={24} />
                <div>Sin cotizaciones disponibles</div>
              </div>
            ) : (
              <div className="gap-2">
                {cotizaciones.map((cotizacion, index) => (
                  <Card key={cotizacion.id} className="mb-3 shadow-sm border-0 cotizacion-card">
                    <Card.Header className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center bg-white border-bottom">
                      <div className="mb-2 mb-md-0">
                        <span className={`badge fw-bold fs-6 text-white ${getPlanColorClass(cotizacion.plan_nombre)} px-3 py-2 rounded-pill`}>
                          {cotizacion.plan_nombre}
                        </span>
                        <small className="text-muted d-block mt-1">Año: {cotizacion.anio || new Date().getFullYear()}</small>
                      </div>
                      <div className="text-start text-md-end">
                        <span className="fw-bold fs-5 text-success">{formatCurrency(cotizacion.total_final)}</span>
                        <br />
                        <small className="text-muted">Total Final</small>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-2 p-md-3">
                      <Row className="mb-2 g-2">
                        <Col xs={6} md={3}>
                          <div className="text-muted small">Bruto</div>
                          <div className="fw-bold text-info small">{formatCurrency(cotizacion.total_bruto)}</div>
                        </Col>
                        <Col xs={6} md={3}>
                          <div className="text-muted small">Descuento</div>
                          <div className="fw-bold text-warning small">{formatCurrency(parseFloat(cotizacion.total_descuento_aporte || 0) + parseFloat(cotizacion.total_descuento_promocion || 0))}</div>
                        </Col>
                        <Col xs={6} md={3}>
                          <div className="text-muted small">Personas</div>
                          <div className="fw-bold">{cotizacion.detalles ? cotizacion.detalles.length : 1}</div>
                        </Col>
                        <Col xs={6} md={3}>
                          <div className="text-muted small">Fecha</div>
                          <div className="fw-bold small">{new Date(cotizacion.fecha).toLocaleDateString()}</div>
                        </Col>
                      </Row>
                      <div className="d-flex gap-2 mb-2">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => toggleDetallesCotizacion(index)}
                          className="flex-fill flex-md-grow-0"
                        >
                          <FaEye className="me-1" />
                          {showDetallesCotizacion[index] ? 'Ocultar' : 'Ver'} Detalles
                        </Button>
                      </div>
                      {showDetallesCotizacion[index] && (
                        <div className="mt-3 border-top pt-3">
                          {cotizacion.detalles && cotizacion.detalles.length > 0 ? (
                            <>
                              {/* Vista de escritorio - Tabla */}
                              <div className="d-none d-lg-block">
                                <div className="table-responsive">
                                  <Table size="sm" responsive className="mb-0 table-striped align-middle">
                                    <thead>
                                      <tr>
                                        <th className="small">Persona</th>
                                        <th className="small">Vínculo</th>
                                        <th className="small">Edad</th>
                                        <th className="small">Tipo Afiliación</th>
                                        <th className="small">Base</th>
                                        <th className="small">Desc. Aporte</th>
                                        <th className="small">Desc. Promoción</th>
                                        <th className="small">Promoción</th>
                                        <th className="small">Final</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {cotizacion.detalles.map((detalle, idx) => (
                                        <tr key={detalle.id || idx}>
                                          <td className="small">{detalle.persona}</td>
                                          <td className="small">{detalle.vinculo}</td>
                                          <td className="small">{detalle.edad}</td>
                                          <td className="small">{detalle.tipo_afiliacion}</td>
                                          <td className="small">{formatCurrency(detalle.precio_base)}</td>
                                          <td className="small">
                                            {formatCurrency(detalle.descuento_aporte)}
                                            {parseFloat(detalle.descuento_aporte || 0) > 0 && (
                                              <span className="badge bg-info ms-1">Aporte</span>
                                            )}
                                          </td>
                                          <td className="small">
                                            {formatCurrency(detalle.descuento_promocion)}
                                            {parseFloat(detalle.descuento_promocion || 0) > 0 && (
                                              <span className="badge bg-warning text-dark ms-1">Promoción</span>
                                            )}
                                          </td>
                                          <td className="small">
                                            {detalle.promocion_aplicada
                                              ? <span className="badge bg-warning text-dark">{detalle.promocion_aplicada}</span>
                                              : <span className="text-muted small">Sin promoción</span>
                                            }
                                          </td>
                                          <td className="fw-bold text-success small">{formatCurrency(detalle.precio_final)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                </div>
                              </div>

                              {/* Vista móvil - Cards */}
                              <div className="d-lg-none">
                                {cotizacion.detalles.map((detalle, idx) => (
                                  <Card key={detalle.id || idx} className="mb-2 border-start border-primary border-3">
                                    <Card.Body className="p-2">
                                      <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                          <h6 className="mb-0 fw-bold">{detalle.persona}</h6>
                                          <Badge bg="secondary" className="small">{detalle.vinculo}</Badge>
                                        </div>
                                        <Badge bg="info">{detalle.edad} años</Badge>
                                      </div>

                                      <Row className="g-2 mb-2">
                                        <Col xs={6}>
                                          <div className="small text-muted">Tipo Afiliación</div>
                                          <div className="fw-bold small">{detalle.tipo_afiliacion}</div>
                                        </Col>
                                        <Col xs={6}>
                                          <div className="small text-muted">Precio Base</div>
                                          <div className="fw-bold small text-primary">{formatCurrency(detalle.precio_base)}</div>
                                        </Col>
                                      </Row>

                                      <Row className="g-2 mb-2">
                                        <Col xs={6}>
                                          <div className="small text-muted">Desc. Aporte</div>
                                          <div className="fw-bold small text-info">
                                            {formatCurrency(detalle.descuento_aporte)}
                                            {parseFloat(detalle.descuento_aporte || 0) > 0 && (
                                              <Badge bg="info" className="ms-1 small">Aporte</Badge>
                                            )}
                                          </div>
                                        </Col>
                                        <Col xs={6}>
                                          <div className="small text-muted">Desc. Promoción</div>
                                          <div className="fw-bold small text-warning">
                                            {formatCurrency(detalle.descuento_promocion)}
                                            {parseFloat(detalle.descuento_promocion || 0) > 0 && (
                                              <Badge bg="warning" className="ms-1 small text-dark">Promo</Badge>
                                            )}
                                          </div>
                                        </Col>
                                      </Row>

                                      {detalle.promocion_aplicada && (
                                        <div className="mb-2">
                                          <div className="small text-muted">Promoción Aplicada</div>
                                          <Badge bg="warning" className="text-dark">{detalle.promocion_aplicada}</Badge>
                                        </div>
                                      )}

                                      <div className="border-top pt-2 mt-2">
                                        <div className="d-flex justify-content-between align-items-center">
                                          <span className="fw-bold">Precio Final:</span>
                                          <span className="fw-bold fs-6 text-success">{formatCurrency(detalle.precio_final)}</span>
                                        </div>
                                      </div>
                                    </Card.Body>
                                  </Card>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="text-muted small">Sin detalles disponibles</div>
                          )}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )
          ) : prospectoSeleccionado ? (
            <div>
              <Row className="g-2 g-md-3">
                <Col xs={12} md={6}>
                  <Card className="h-100 border-0 bg-light">
                    <Card.Body className="p-2 p-md-3">
                      <h6 className="text-primary mb-2 mb-md-3">
                        <FaUser className="me-2" />Información Personal
                      </h6>
                      <div className="mb-2">
                        <small className="text-muted">Nombre completo</small>
                        <div className="fw-bold">{prospectoSeleccionado.nombre} {prospectoSeleccionado.apellido}</div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Edad</small>
                        <div>{prospectoSeleccionado.edad} años</div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Contacto</small>
                        <div>{prospectoSeleccionado.numero_contacto}</div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Email</small>
                        <div className="small">{prospectoSeleccionado.correo}</div>
                      </div>
                      <div>
                        <small className="text-muted">Localidad</small>
                        <div>{prospectoSeleccionado.localidad}</div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card className="h-100 border-0 bg-light">
                    <Card.Body className="p-2 p-md-3">
                      <h6 className="text-success mb-2 mb-md-3">
                        <FaUserCheck className="me-2" />Estado y Asignación
                      </h6>
                      <div className="mb-2">
                        <small className="text-muted">Estado actual</small>
                        <div><Badge bg={getEstadoColor(prospectoSeleccionado.asignacion_estado || prospectoSeleccionado.estado)}>{prospectoSeleccionado.asignacion_estado || prospectoSeleccionado.estado}</Badge></div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Vendedor asignado</small>
                        <div className="small">{prospectoSeleccionado.vendedor || "Sin asignar"}</div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Comentario</small>
                        <div className="small">{prospectoSeleccionado.comentario || "Sin comentario"}</div>
                      </div>
                      {prospectoSeleccionado.asignacion_fecha && (
                        <div>
                          <small className="text-muted">Fecha de asignación</small>
                          <div className="small">{new Date(prospectoSeleccionado.asignacion_fecha).toLocaleString()}</div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {prospectoSeleccionado.familiares && prospectoSeleccionado.familiares.length > 0 && (
                <div className="mt-3">
                  <h6 className="text-info mb-2 mb-md-3">
                    <FaUserFriends className="me-2" />Grupo Familiar
                  </h6>
                  <div className="d-grid gap-2">
                    {prospectoSeleccionado.familiares.map((f, idx) => (
                      <Card key={idx} className="border-start border-info border-3">
                        <Card.Body className="p-2 p-md-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="flex-grow-1">
                              <div className="fw-bold small">{f.nombre}</div>
                              <small className="text-muted">{f.vinculo}</small>
                            </div>
                            <Badge bg="secondary">{f.edad} años</Badge>
                          </div>
                          <div className="d-flex flex-wrap gap-1">
                            {f.tipo_afiliacion_id && (
                              <Badge bg="info" className="small">Afiliación: {f.tipo_afiliacion_id}</Badge>
                            )}
                            {f.sueldo_bruto && (
                              <Badge bg="success" className="small">Sueldo: {f.sueldo_bruto}</Badge>
                            )}
                            {f.categoria_monotributo && (
                              <Badge bg="warning" className="small">Monotributo: {f.categoria_monotributo}</Badge>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </Modal.Body>
      </Modal>

      {/* Modal de reasignación responsivo */}
      <Modal
        show={showReasignarModal}
        onHide={() => setShowReasignarModal(false)}
        centered
        size={window.innerWidth < 576 ? undefined : "md"}
        fullscreen={window.innerWidth < 576 ? "sm-down" : false}
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-6 fw-bold">
            <FaExchangeAlt className="me-2" />
            Reasignar Prospecto
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-2 p-md-3">
          {prospectoParaReasignar && (
            <>
              <div className="mb-3 p-2 p-md-3 bg-light rounded">
                <h6 className="mb-2">Prospecto a reasignar:</h6>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start">
                  <div className="mb-2 mb-md-0">
                    <strong>{prospectoParaReasignar.nombre} {prospectoParaReasignar.apellido}</strong>
                    <div className="small text-muted">ID: {prospectoParaReasignar.id}</div>
                    <div className="small text-muted">Estado: <Badge bg={getEstadoColor(prospectoParaReasignar.asignacion_estado || prospectoParaReasignar.estado)}>{prospectoParaReasignar.asignacion_estado || prospectoParaReasignar.estado}</Badge></div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="small text-muted">Vendedor actual:</div>
                  <div className="fw-bold">{prospectoParaReasignar.vendedor || "Sin asignar"}</div>
                </div>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Seleccionar nuevo vendedor:</Form.Label>
                <Form.Select
                  value={nuevoVendedorId}
                  onChange={(e) => setNuevoVendedorId(e.target.value)}
                  size={window.innerWidth < 576 ? "sm" : undefined}
                >
                  <option value="">Seleccionar vendedor...</option>
                  {vendedoresDisponibles
                    .filter(v => v.id !== prospectoParaReasignar.vendedor_id) // Excluir el vendedor actual
                    .map(vendedor => (
                      <option key={vendedor.id} value={vendedor.id}>
                        {vendedor.first_name} {vendedor.last_name}
                        {vendedor.total_prospectos && ` (${vendedor.total_prospectos} prospectos)`}
                      </option>
                    ))
                  }
                </Form.Select>
                {vendedoresDisponibles.length === 0 && (
                  <Form.Text className="text-muted small">
                    No hay vendedores disponibles para la reasignación.
                  </Form.Text>
                )}
              </Form.Group>

              <div className="alert alert-info small">
                <FaInfoCircle className="me-1" />
                <strong>Nota:</strong> Al reasignar este prospecto, el nuevo vendedor será notificado y podrá ver toda la información y historial del prospecto.
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <div className="d-flex gap-2 w-100 flex-column flex-md-row">
            <Button
              variant="secondary"
              onClick={() => setShowReasignarModal(false)}
              className="flex-fill"
              size={window.innerWidth < 576 ? "sm" : undefined}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleReasignarProspecto}
              disabled={!nuevoVendedorId}
              className="flex-fill"
              size={window.innerWidth < 576 ? "sm" : undefined}
            >
              <FaExchangeAlt className="me-1" />
              Reasignar Prospecto
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Modal de Exportación */}
      {/* Modal Cambio de Estado */}
      <Modal
        show={showModalCambioEstado}
        onHide={() => {
          setShowModalCambioEstado(false);
          setProspectoParaCambioEstado(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Cambiar Estado del Prospecto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {prospectoParaCambioEstado && (
            <>
              <div className="mb-3">
                <h6>Prospecto: {prospectoParaCambioEstado.nombre} {prospectoParaCambioEstado.apellido}</h6>
                <small className="text-muted">
                  ID: {prospectoParaCambioEstado.id} |
                  Vendedor: {prospectoParaCambioEstado.vendedor} |
                  Estado actual: {prospectoParaCambioEstado.asignacion_estado || prospectoParaCambioEstado.estado}
                </small>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  value={editValues[prospectoParaCambioEstado.id]?.estado || prospectoParaCambioEstado.asignacion_estado || prospectoParaCambioEstado.estado}
                  onChange={(e) => handleCardChange(prospectoParaCambioEstado.id, "estado", e.target.value)}
                >
                  {estadosDisponibles.map(estado => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Comentario <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editValues[prospectoParaCambioEstado.id]?.comentario || ""}
                  onChange={(e) => handleCardChange(prospectoParaCambioEstado.id, "comentario", e.target.value)}
                  placeholder="Agrega un comentario sobre el cambio de estado..."
                />
                <Form.Text className="text-muted">
                  El comentario es obligatorio al cambiar el estado.
                </Form.Text>
              </Form.Group>

              {/* Mostrar progreso estimado */}
              {editValues[prospectoParaCambioEstado.id]?.estado && (
                <div className="mb-3">
                  <small className="text-muted">Progreso estimado:</small>
                  <div className="progress mt-1" style={{ height: "8px" }}>
                    <div
                      className={`progress-bar ${getProgressColorClass(estadoPorcentaje[editValues[prospectoParaCambioEstado.id].estado] || 0)}`}
                      role="progressbar"
                      style={{
                        width: `${estadoPorcentaje[editValues[prospectoParaCambioEstado.id].estado] || 0}%`
                      }}
                      aria-valuenow={estadoPorcentaje[editValues[prospectoParaCambioEstado.id].estado] || 0}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      {estadoPorcentaje[editValues[prospectoParaCambioEstado.id].estado] || 0}%
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowModalCambioEstado(false);
              setProspectoParaCambioEstado(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveEstado}
            disabled={
              !prospectoParaCambioEstado ||
              !editValues[prospectoParaCambioEstado.id]?.estado ||
              (!editValues[prospectoParaCambioEstado.id]?.comentario ||
                editValues[prospectoParaCambioEstado.id]?.comentario.trim() === "")
            }
          >
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>

      <ModalExportacion
        show={showModalExportacion}
        onHide={() => setShowModalExportacion(false)}
        userRole="supervisor"
      />

      {/* Modal de Conversaciones de WhatsApp */}
      <Modal 
        show={modalConversaciones} 
        onHide={() => {
          setModalConversaciones(false);
          setConversacionSeleccionada(null);
          setMensajesConversacion([]);
        }} 
        size="lg"
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaWhatsapp className="me-2 text-success" />
            {conversacionSeleccionada ? 'Historial de Mensajes' : 'Conversaciones de WhatsApp'}
            {prospectoConversaciones && (
              <span className="text-muted ms-2">
                - {prospectoConversaciones.nombre} {prospectoConversaciones.apellido}
              </span>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {conversacionSeleccionada ? (
            // Vista de mensajes individuales
            <div className="messages-view">
              <div className="d-flex align-items-center mb-3">
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  onClick={handleVolverAConversaciones}
                  className="me-3"
                >
                  ← Volver
                </Button>
                <div>
                  <h6 className="mb-0">Conversación #{conversacionSeleccionada.numero_conversacion}</h6>
                  <small className="text-muted">
                    {conversacionSeleccionada.telefono_cliente ? maskPhoneNumber(conversacionSeleccionada.telefono_cliente) : 'N/A'}
                  </small>
                </div>
              </div>
              
              {loadingMensajes ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando mensajes...</span>
                  </div>
                  <p className="mt-2 text-muted">Cargando mensajes...</p>
                </div>
              ) : mensajesConversacion.length === 0 ? (
                <div className="text-center py-4">
                  <FaComments size={48} className="text-muted mb-3" />
                  <p className="text-muted">No hay mensajes en esta conversación.</p>
                </div>
              ) : (
                <div className="messages-list">
                  {mensajesConversacion.map((mensaje, index) => (
                    <div 
                      key={mensaje.id || index}
                      className={`message-item mb-3 d-flex ${mensaje.tipo === 'enviado' ? 'justify-content-end' : 'justify-content-start'}`}
                    >
                      <div 
                        className={`message-bubble p-3 rounded ${
                          mensaje.tipo === 'enviado' 
                            ? 'bg-primary text-white' 
                            : mensaje.tipo === 'recibido'
                            ? 'bg-light'
                            : 'bg-warning text-dark'
                        }`}
                        style={{ maxWidth: '70%' }}
                      >
                        <div className="message-content">
                          {mensaje.contenido}
                        </div>
                        <div className="message-meta mt-2">
                          <small className={mensaje.tipo === 'enviado' ? 'text-light' : 'text-muted'}>
                            {mensaje.tipo === 'enviado' && '👤 '} 
                            {mensaje.tipo === 'recibido' && '💬 '}
                            {mensaje.tipo === 'sistema' && '🔧 '}
                            {new Date(mensaje.created_at).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Vista de lista de conversaciones
            <>
              {loadingConversaciones ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando conversaciones...</span>
                  </div>
                  <p className="mt-2 text-muted">Cargando conversaciones...</p>
                </div>
              ) : conversacionesProspecto.length === 0 ? (
                <div className="text-center py-4">
                  <FaWhatsapp size={48} className="text-muted mb-3" />
                  <p className="text-muted">No hay conversaciones de WhatsApp para este prospecto.</p>
                </div>
              ) : (
                <div className="conversation-list">
                  {conversacionesProspecto.map((conversacion, index) => (
                    <Card key={index} className="mb-3 border-0 shadow-sm">
                      <Card.Header className="bg-light py-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <Badge 
                              bg={getEstadoConversacion(conversacion.estado || 'activa')} 
                              className="me-2"
                            >
                              {getEstadoTexto(conversacion.estado || 'activa')}
                            </Badge>
                            <small className="text-muted">
                              <strong>Teléfono:</strong> {conversacion.telefono_cliente ? maskPhoneNumber(conversacion.telefono_cliente) : 'N/A'}
                            </small>
                          </div>
                          <small className="text-muted">
                            {conversacion.fecha_conversacion ? new Date(conversacion.fecha_conversacion).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Fecha no disponible'}
                          </small>
                        </div>
                      </Card.Header>
                      <Card.Body className="py-2">
                        <div className="conversation-content">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <Badge bg="info" className="me-2">
                              {getTipoOrigenIcon(conversacion.tipo_origen || 'manual')} {getTipoOrigen(conversacion.tipo_origen || 'manual')}
                            </Badge>
                            {conversacion.vendedor_asignado && (
                              <small className="text-muted">
                                <strong>Vendedor:</strong> {conversacion.vendedor_asignado}
                              </small>
                            )}
                          </div>
                          
                          {conversacion.mensaje_cliente && (
                            <div className="mb-2">
                              <strong className="text-primary">Cliente:</strong>
                              <div className="bg-light p-2 rounded mt-1">
                                {conversacion.mensaje_cliente}
                              </div>
                            </div>
                          )}
                          
                          {conversacion.respuesta_bot && (
                            <div className="mb-2">
                              <strong className="text-success">Vendedor:</strong>
                              <div className="bg-light p-2 rounded mt-1">
                                {conversacion.respuesta_bot}
                              </div>
                            </div>
                          )}
                          
                          <div className="d-flex justify-content-between align-items-center mt-2">
                            <small className="text-muted">
                              {conversacion.total_mensajes || 0} mensaje(s)
                            </small>
                            <Button 
                              size="sm" 
                              variant="outline-primary"
                              onClick={() => handleVerConversacion(conversacion)}
                            >
                              <FaComments className="me-1" />
                              Ver Historial
                            </Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setModalConversaciones(false)}
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ✅ NUEVO MODAL: Carga múltiple de documentos */}
      <Modal 
        show={showModalCargaDocumentos} 
        onHide={handleCerrarCargaDocumentos} 
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFileUpload className="me-2 text-primary" />
            Carga Múltiple de Documentos
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {polizaSeleccionadaDocumentos && (
            <div className="mb-3 p-3 bg-light rounded">
              <h6 className="mb-1">Póliza Seleccionada:</h6>
              <div className="row">
                <div className="col-md-6">
                  <small><strong>ID:</strong> {polizaSeleccionadaDocumentos.id}</small>
                </div>
                <div className="col-md-6">
                  <small><strong>Cliente:</strong> {polizaSeleccionadaDocumentos.nombre_cliente}</small>
                </div>
              </div>
            </div>
          )}
          
          {polizaSeleccionadaDocumentos && (
            <CargaMultipleDocumentos 
              polizaId={polizaSeleccionadaDocumentos.id}
              onDocumentosActualizados={handleDocumentosActualizados}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleCerrarCargaDocumentos}
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* <ChatWidget /> */}
      <ManualWidget userRole="supervisor" />
    </>
  );
};

export default SupervisorDashboard;