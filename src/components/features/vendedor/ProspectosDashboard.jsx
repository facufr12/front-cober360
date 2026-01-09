import { useEffect, useState, useMemo, useCallback, memo } from "react";
import axios from "axios";
import { ENDPOINTS, API_URL } from "../../config"; // ✅ Asegúrate de importar API_URL
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../assets/Style/GamingMetrics.css"; // 🎮 GAMING: Estilos para métricas
import { FaPlus, FaEdit, FaEye, FaUserCheck, FaMoneyBillWave, FaWhatsapp, FaPhone, FaHome, FaTachometerAlt, FaUserPlus, FaSignOutAlt, FaBars, FaChevronLeft, FaList, FaThLarge, FaFile, FaTrash } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { Modal, Spinner, Badge, Card } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import PromocionesModal from "./PromocionesModal";
import { Container, Row, Col, Button, Offcanvas, ListGroup, Form, Table, ButtonGroup, ProgressBar } from "react-bootstrap";
import DocumentPreviewModal from "../../common/DocumentPreviewModal";
import ChatVendedor from './ChatVendedor'; // ✅ AGREGAR
import WhatsAppChat from "../../common/WhatsAppChat"; // ✅ NUEVO: Chat de WhatsApp
import PolizasDashboard from "./PolizasDashboard";
import WhatsAppVista from "./WhatsAppVista"; // ✅ NUEVO: Vista de WhatsApp
import VendedorSidebar from "../../layout/VendedorSidebar"; // Importar el nuevo sidebar
import ManualWidget from "../../common/ManualWidget"; // ✅ AGREGAR Manual Widget
import { FaDollarSign } from "react-icons/fa"; // Asegúrate de importar el icono
import { Alert } from "@mui/material";
import CargaDocumentosModal from "../../common/CargaDocumentosModal"; // ✅ Importar componente genérico de carga de documentos
import EditarPolizaModal from "./modals/EditarPolizaModal"; // ✅ Importar modal de edición


const drawerWidth = 220;

const ProspectosDashboard = () => {
  const [prospectos, setProspectos] = useState([]);
  const [tiposAfiliacion, setTiposAfiliacion] = useState([]);
  const [localidades, setLocalidades] = useState([]); // ✅ AGREGAR estado para localidades
  const [loading, setLoading] = useState(true);
  const [showFiltrosMobile, setShowFiltrosMobile] = useState(false);
  const [alertaGuardado, setAlertaGuardado] = useState({ show: false, mensaje: "", prospectoId: null });


  const [selectedProspecto, setSelectedProspecto] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    edad: "",
    tipo_afiliacion_id: "",
    sueldo_bruto: "",
    categoria_monotributo: "",
    estado: "Lead",
    comentario: "",
  });
  const [editValues, setEditValues] = useState({});
  const [familiares, setFamiliares] = useState([]);
  const [nuevoFamiliar, setNuevoFamiliar] = useState({
    vinculo: "",
    nombre: "",
    edad: "",
    tipo_afiliacion_id: "",
    sueldo_bruto: "",
    categoria_monotributo: ""
  });
  const [showFamiliar, setShowFamiliar] = useState(false);
  const [categoriasMonotributo] = useState(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "A exento", "B exento"]);
  const [showPromocionesModal, setShowPromocionesModal] = useState(false);
  const [prospectoSeleccionado, setProspectoSeleccionado] = useState(null);
  const [promociones, setPromociones] = useState([]);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [vista, setVista] = useState("prospectos");
  const [tipoVista, setTipoVista] = useState("tarjetas"); // "tabla" o "tarjetas"
  const [filtros, setFiltros] = useState({
    nombre: "",
    apellido: "",
    edad: "",
    estado: "",
  });
  const [showFormModal, setShowFormModal] = useState(false);
  const [modalHistorial, setModalHistorial] = useState(false);
  const [historial, setHistorial] = useState([]);

  // Agregar estados para pólizas
  const [polizas, setPolizas] = useState([]);
  const [loadingPolizas, setLoadingPolizas] = useState(false);

  // Agregar estados para documentos
  const [documentos, setDocumentos] = useState([]);
  const [modalDocumentos, setModalDocumentos] = useState(false);
  const [polizaSeleccionada, setPolizaSeleccionada] = useState(null);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);

  // Estados para actualización de documentos
  const [modalActualizarDoc, setModalActualizarDoc] = useState(false);
  const [documentoActualizar, setDocumentoActualizar] = useState(null);
  const [nuevoArchivo, setNuevoArchivo] = useState(null);
  const [motivoActualizacion, setMotivoActualizacion] = useState('');
  const [loadingActualizar, setLoadingActualizar] = useState(false);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewMime, setPreviewMime] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showWhatsAppChat, setShowWhatsAppChat] = useState(false); // ✅ NUEVO: Estado para chat
  const [chatProspecto, setChatProspecto] = useState(null); // ✅ NUEVO: Prospecto activo en chat
  const [modalCargaDocumentos, setModalCargaDocumentos] = useState(false); // ✅ Estado para modal de carga de documentos

  // ✅ NUEVO: Estados para editar póliza
  const [showEditarPolizaModal, setShowEditarPolizaModal] = useState(false);
  const [polizaEditando, setPolizaEditando] = useState(null);

  // 🎮 GAMING: Estados para métricas motivadoras
  const [metricsVisible, setMetricsVisible] = useState(true);
  const [gamingStats, setGamingStats] = useState({
    nivel: 1,
    experiencia: 0,
    experienciaParaSiguienteNivel: 100,
    ventasHoy: 0,
    ventasSemana: 0,
    ventasMes: 0,
    streakActual: 0,
    mejorStreak: 0,
    puntuacionTotal: 0,
    logrosDesbloqueados: []
  });

  const navigate = useNavigate();

  const vinculos = [
    { value: "pareja/conyuge", label: "Pareja/Conyuge" },
    { value: "hijo/a", label: "Hijo/a" },
    { value: "familiar a cargo", label: "Familiar a cargo" }
  ];

  useEffect(() => {
    fetchProspectos();
    fetchTiposAfiliacion();
    fetchPromociones();
    fetchLocalidades(); // ✅ AGREGAR llamada para cargar localidades
  }, []);

  // ✅ AGREGAR función para cargar localidades
  const fetchLocalidades = async () => {
    try {
      const response = await axios.get(`${API_URL}/localidades/buenos-aires`);
      setLocalidades(response.data);
    } catch (error) {
      console.error("Error al obtener localidades:", error);
      setLocalidades([]); // En caso de error, mantener array vacío
    }
  };

  const guardarCambioProspecto = async (prospecto, campo, valor) => {
    const token = localStorage.getItem("token");

    // Evitar guardados innecesarios: verificar cambios reales
    const valorActual = campo === "comentario"
      ? (prospecto.comentario || "")
      : (campo === "estado" ? (prospecto.estado || "") : prospecto[campo]);

    const valorNuevo = (valor ?? "");
    if (String(valorNuevo).trim() === String(valorActual).trim()) {
      return; // No hay cambios reales, no guardar ni mostrar alerta
    }

    try {
      await axios.put(
        `${ENDPOINTS.PROSPECTOS}/${prospecto.id}`,
        { ...prospecto, [campo]: valor },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAlertaGuardado({ show: true, mensaje: `Cambio de ${campo === "estado" ? "estado" : "comentario"} guardado correctamente.`, prospectoId: prospecto.id });
      setTimeout(() => setAlertaGuardado({ show: false, mensaje: "", prospectoId: null }), 2500);
      await fetchProspectos();
      if (campo === "estado") {
        actualizarMetricasGaming();
      }
    } catch (error) {
      setAlertaGuardado({ show: true, mensaje: "Error al guardar el cambio.", prospectoId: prospecto.id });
      setTimeout(() => setAlertaGuardado({ show: false, mensaje: "", prospectoId: null }), 2500);
    }
  };

  // 🎮 GAMING: Crear una versión estable de los datos para evitar recálculos innecesarios
  const prospectoDataStable = useMemo(() => {
    const estadosHash = prospectos.map(p => `${p.id}-${p.estado}-${p.updated_at}`).join('|');
    const totalProspectos = prospectos.length;
    const totalVentas = prospectos.filter(p => p.estado === 'Venta').length;

    return {
      totalProspectos,
      totalVentas,
      estadosHash,
      prospectos: prospectos
    };
  }, [prospectos.map(p => `${p.id}-${p.estado}-${p.updated_at}`).join('|')]);

  // 🎮 GAMING: Calcular métricas solo cuando realmente cambien los estados
  const gamingStatsCalculated = useMemo(() => {
    if (prospectoDataStable.totalProspectos === 0) {
      return {
        nivel: 1,
        experiencia: 0,
        experienciaParaSiguienteNivel: 500,
        ventasHoy: 0,
        ventasSemana: 0,
        ventasMes: 0,
        streakActual: 0,
        mejorStreak: 0,
        puntuacionTotal: 0,
        logrosDesbloqueados: []
      };
    }

    const hoy = new Date().toDateString();
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    const inicioMes = new Date();
    inicioMes.setDate(1);

    // Contar ventas por período
    const ventasHoy = prospectoDataStable.prospectos.filter(p =>
      p.estado === 'Venta' &&
      new Date(p.updated_at).toDateString() === hoy
    ).length;

    const ventasSemana = prospectoDataStable.prospectos.filter(p =>
      p.estado === 'Venta' &&
      new Date(p.updated_at) >= inicioSemana
    ).length;

    const ventasMes = prospectoDataStable.prospectos.filter(p =>
      p.estado === 'Venta' &&
      new Date(p.updated_at) >= inicioMes
    ).length;

    // Calcular puntuación total
    let puntuacionTotal = 0;
    prospectoDataStable.prospectos.forEach(p => {
      switch (p.estado) {
        case 'Venta': puntuacionTotal += 100; break;
        case 'Calificado Pago': puntuacionTotal += 75; break;
        case 'Calificado Póliza': puntuacionTotal += 50; break;
        case 'Calificado Cotización': puntuacionTotal += 25; break;
        case '1º Contacto': puntuacionTotal += 10; break;
        default: puntuacionTotal += 5; break;
      }
    });

    // Calcular nivel y experiencia
    const nivel = Math.floor(puntuacionTotal / 500) + 1;
    const experiencia = puntuacionTotal % 500;
    const experienciaParaSiguienteNivel = 500;

    // Calcular streak
    const ventasPorDia = {};
    prospectoDataStable.prospectos.filter(p => p.estado === 'Venta').forEach(p => {
      const fecha = new Date(p.updated_at).toDateString();
      ventasPorDia[fecha] = (ventasPorDia[fecha] || 0) + 1;
    });

    let streakActual = 0;
    let mejorStreak = 0;
    let racha = 0;

    const fechas = Object.keys(ventasPorDia).sort((a, b) => new Date(b) - new Date(a));

    for (let i = 0; i < fechas.length; i++) {
      const fechaActual = new Date(fechas[i]);
      const fechaAnterior = i > 0 ? new Date(fechas[i - 1]) : null;

      if (!fechaAnterior || (fechaAnterior - fechaActual) / (1000 * 60 * 60 * 24) === 1) {
        racha++;
        if (i === 0) streakActual = racha;
      } else {
        mejorStreak = Math.max(mejorStreak, racha);
        racha = 1;
      }
    }

    mejorStreak = Math.max(mejorStreak, racha);

    // Calcular logros
    const logrosDesbloqueados = [];
    const totalVentas = prospectoDataStable.totalVentas;
    const totalProspectos = prospectoDataStable.totalProspectos;

    // Logros por cantidad de ventas
    if (totalVentas >= 1) logrosDesbloqueados.push({ id: 'primera_venta', titulo: '🎯 Primera Venta', descripcion: '¡Tu primera venta!' });
    if (totalVentas >= 5) logrosDesbloqueados.push({ id: 'vendedor_junior', titulo: '🥉 Vendedor Junior', descripcion: '5 ventas completadas' });
    if (totalVentas >= 10) logrosDesbloqueados.push({ id: 'vendedor_experto', titulo: '🥈 Vendedor Experto', descripcion: '10 ventas completadas' });
    if (totalVentas >= 25) logrosDesbloqueados.push({ id: 'vendedor_master', titulo: '🥇 Vendedor Master', descripcion: '25 ventas completadas' });
    if (totalVentas >= 50) logrosDesbloqueados.push({ id: 'vendedor_legend', titulo: '💎 Vendedor Legendario', descripcion: '50 ventas completadas' });

    // Logros por streak
    if (mejorStreak >= 3) logrosDesbloqueados.push({ id: 'racha_3', titulo: '🔥 En Racha', descripcion: '3 días consecutivos vendiendo' });
    if (mejorStreak >= 7) logrosDesbloqueados.push({ id: 'racha_7', titulo: '🚀 Imparable', descripcion: '7 días consecutivos vendiendo' });

    // Logros por productividad
    if (totalProspectos >= 50) logrosDesbloqueados.push({ id: 'prospector', titulo: '📈 Gran Prospector', descripcion: '50 prospectos gestionados' });
    if (totalProspectos >= 100) logrosDesbloqueados.push({ id: 'super_prospector', titulo: '🎪 Super Prospector', descripcion: '100 prospectos gestionados' });

    return {
      nivel,
      experiencia,
      experienciaParaSiguienteNivel,
      ventasHoy,
      ventasSemana,
      ventasMes,
      streakActual,
      mejorStreak,
      puntuacionTotal,
      logrosDesbloqueados
    };
  }, [prospectoDataStable.estadosHash]); // Solo cuando cambien realmente los estados

  // 🎮 GAMING: Crear valores estables para evitar re-renders innecesarios
  const gamingStatsStable = useMemo(() => ({
    nivel: gamingStats.nivel,
    experiencia: gamingStats.experiencia,
    experienciaParaSiguienteNivel: gamingStats.experienciaParaSiguienteNivel,
    ventasHoy: gamingStats.ventasHoy,
    ventasSemana: gamingStats.ventasSemana,
    ventasMes: gamingStats.ventasMes,
    streakActual: gamingStats.streakActual,
    logrosDesbloqueados: gamingStats.logrosDesbloqueados
  }), [
    gamingStats.nivel,
    gamingStats.experiencia,
    gamingStats.ventasHoy,
    gamingStats.ventasSemana,
    gamingStats.ventasMes,
    gamingStats.streakActual,
    gamingStats.logrosDesbloqueados.length
  ]);

  // 🎮 GAMING: Función estable para actualizar métricas solo cuando cambia estado
  const actualizarMetricasGaming = useCallback(() => {
    // 🛡️ PROTECCIÓN: No actualizar durante verificaciones de sesión
    const isSessionChecking = document.body.classList.contains('session-check-active');
    if (isSessionChecking) {
      // Retrasar actualización hasta que termine la verificación de sesión
      setTimeout(() => {
        setGamingStats(prevStats => {
          if (JSON.stringify(prevStats) !== JSON.stringify(gamingStatsCalculated)) {
            return gamingStatsCalculated;
          }
          return prevStats;
        });
      }, 250);
      return;
    }

    setGamingStats(prevStats => {
      // Solo actualizar si realmente hay cambios
      if (JSON.stringify(prevStats) !== JSON.stringify(gamingStatsCalculated)) {
        return gamingStatsCalculated;
      }
      return prevStats;
    });
  }, [gamingStatsCalculated]);

  // 🎮 GAMING: Cargar métricas iniciales solo una vez y cuando cambien los estados
  useEffect(() => {
    if (prospectoDataStable.totalProspectos > 0) {
      // 🛡️ PROTECCIÓN: Verificar que no hay verificación de sesión activa
      const isSessionChecking = document.body.classList.contains('session-check-active');
      if (!isSessionChecking) {
        setGamingStats(gamingStatsCalculated);
      } else {
        // Si hay verificación de sesión, retrasar la actualización
        setTimeout(() => {
          setGamingStats(gamingStatsCalculated);
        }, 200);
      }
    }
  }, [prospectoDataStable.estadosHash]); // Solo cuando cambien realmente los estados

  // 🎮 GAMING: Función para mostrar celebración de venta - ELIMINADA para evitar animaciones
  // Esta función ha sido removida para eliminar las animaciones de celebración

  // 🎮 GAMING: Función para obtener clase CSS según el valor
  // 🎮 GAMING: Función para obtener clase CSS según el valor - memoizada para Service Worker
  const getStatClass = useCallback((value, type) => {
    let baseClass = "stat-number";

    if (type === 'ventas') {
      if (value >= 50) return `${baseClass} diamond`;
      if (value >= 25) return `${baseClass} gold`;
      if (value >= 10) return `${baseClass} silver`;
      if (value >= 5) return `${baseClass} bronze`;
    } else if (type === 'streak') {
      if (value >= 7) return `${baseClass} diamond`;
      if (value >= 5) return `${baseClass} gold`;
      if (value >= 3) return `${baseClass} silver`;
      if (value >= 1) return `${baseClass} bronze`;
    }

    return baseClass;
  }, []);

  // 🎮 GAMING: Función para obtener mensaje motivacional dinámico - estable
  const getMensajeMotivacional = useCallback((stats) => {
    const { ventasHoy, streakActual, nivel } = stats || gamingStats;

    if (ventasHoy === 0) {
      const mensajes = [
        "¡Es hora de conseguir tu primera venta del día! 💪",
        "¡Un nuevo día, nuevas oportunidades! ¡Ve por esa venta! 🎯",
        "¡Tu próxima venta está esperándote! ¡Adelante! 🚀"
      ];
      return mensajes[Math.floor(Math.random() * mensajes.length)];
    } else if (ventasHoy === 1) {
      return "¡Excelente! Ya tienes una venta. ¿Puedes conseguir una más? 🎯";
    } else if (streakActual >= 5) {
      return `¡INCREÍBLE! ${streakActual} días vendiendo consecutivos. ¡Eres una máquina! 🔥`;
    } else if (ventasHoy >= 5) {
      return `¡BRUTAL! ${ventasHoy} ventas hoy. ¡Estás en modo bestia! 🦁`;
    } else {
      return `¡Genial! ${ventasHoy} ventas hoy. ¡Sigue así, campeón! 🌟`;
    }
  }, []); // Sin dependencias para evitar re-renders

  // Función para obtener prospectos
  const fetchProspectos = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${ENDPOINTS.PROSPECTOS}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ ORDENAR prospectos por ID descendente (más recientes primero)
      const prospectosOrdenados = response.data.sort((a, b) => b.id - a.id);
      setProspectos(prospectosOrdenados);
    } catch (error) {
      console.error("Error al obtener los prospectos:", error);
      Swal.fire("Error", "No se pudieron cargar los prospectos.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTiposAfiliacion = async () => {
    try {
      const response = await axios.get(`${ENDPOINTS.TIPOS_AFILIACION}`);
      setTiposAfiliacion(response.data);
    } catch (error) {
      console.error("Error al obtener los tipos de afiliación:", error);
      Swal.fire("Error", "No se pudieron cargar los tipos de afiliación.", "error");
    }
  };

  const fetchPromociones = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/vendedor/promociones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPromociones(data);
    } catch (error) {
      console.error("Error al obtener promociones:", error);
    }
  };

  // Función para obtener pólizas
  const fetchPolizas = async () => {
    try {
      setLoadingPolizas(true);
      console.log('🔍 Iniciando fetchPolizas...');

      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${API_URL}/polizas/vendedor/mis-polizas`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('📊 Respuesta completa del servidor:', data);
      console.log('📋 Datos de pólizas:', data?.data);
      console.log('📋 Cantidad de pólizas:', data?.data?.length);

      if (data?.data?.length > 0) {
        console.log('🔍 Primera póliza recibida:', data.data[0]);
        console.log('👤 Datos del prospecto en primera póliza:', {
          nombre: data.data[0].prospecto_nombre,
          apellido: data.data[0].prospecto_apellido,
          plan: data.data[0].plan_nombre,
          total: data.data[0].total_final
        });
      }

      setPolizas(data.data || []);
    } catch (error) {
      console.error("❌ Error al obtener pólizas:", error);
      Swal.fire("Error", "No se pudieron cargar las pólizas.", "error");
    } finally {
      setLoadingPolizas(false);
    }
  };

  const fetchHistorial = async (prospectoId) => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/prospectos/${prospectoId}/historial`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistorial(data);
    } catch (error) {
      console.error("Error al obtener historial:", error);
      setHistorial([]);
    }
  };

  // Función para obtener documentos de una póliza
  const fetchDocumentosPoliza = async (polizaId) => {
    try {
      setLoadingDocumentos(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${API_URL}/vendedor/polizas/${polizaId}/documentos`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('📄 Documentos obtenidos del vendedor:', data);
      // El backend devuelve { success, documentos: {...}, total_documentos }
      // Convertir el objeto agrupado en un array plano para el componente
      const documentosArray = [];
      if (data.documentos) {
        Object.entries(data.documentos).forEach(([tipo, docs]) => {
          docs.forEach(doc => {
            documentosArray.push({ ...doc, tipo_documento: tipo });
          });
        });
      }
      setDocumentos(documentosArray);
    } catch (error) {
      console.error("Error al obtener documentos:", error);
      setDocumentos([]);
    } finally {
      setLoadingDocumentos(false);
    }
  };

  const handlePreviewDocumento = async (documentoId, mimeType) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/vendedor/polizas/documentos/${documentoId}/preview`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
      setPreviewUrl(url);
      setPreviewMime(mimeType);
      setShowPreview(true);
    } catch (error) {
      console.error("Error al previsualizar documento:", error);
      Swal.fire("Error", "No se pudo previsualizar el documento", "error");
    }
  };

  // Funciones para actualizar documentos
  const handleActualizarDocumento = (documento) => {
    setDocumentoActualizar(documento);
    setMotivoActualizacion('');
    setNuevoArchivo(null);
    setModalActualizarDoc(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire("Error", "El archivo es demasiado grande. Máximo 10MB permitido.", "error");
        e.target.value = '';
        return;
      }
      setNuevoArchivo(file);
    }
  };

  const handleSubmitActualizacion = async (e) => {
    e.preventDefault();

    if (!nuevoArchivo) {
      Swal.fire("Error", "Debe seleccionar un archivo", "error");
      return;
    }

    if (!motivoActualizacion.trim()) {
      Swal.fire("Error", "Debe ingresar el motivo de la actualización", "error");
      return;
    }

    setLoadingActualizar(true);

    try {
      const formData = new FormData();
      formData.append('documento', nuevoArchivo);
      formData.append('motivo_actualizacion', motivoActualizacion.trim());

      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${API_URL}/polizas/documentos/${documentoActualizar.id}/actualizar`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        Swal.fire("Éxito", "Documento actualizado correctamente", "success");
        setModalActualizarDoc(false);
        // Recargar documentos
        await fetchDocumentosPoliza(polizaSeleccionada.id);
      } else {
        throw new Error(response.data.message || 'Error al actualizar documento');
      }

    } catch (error) {
      console.error("Error actualizando documento:", error);
      const errorMsg = error.response?.data?.message || error.message || "Error al actualizar documento";
      Swal.fire("Error", errorMsg, "error");
    } finally {
      setLoadingActualizar(false);
    }
  };

  const handleCancelarActualizacion = () => {
    setModalActualizarDoc(false);
    setDocumentoActualizar(null);
    setNuevoArchivo(null);
    setMotivoActualizacion('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    if (name === "tipo_afiliacion_id") {
      const tipo = tiposAfiliacion.find(t => t.id === Number(value));
      if (tipo?.requiere_sueldo !== 1) newFormData.sueldo_bruto = "";
      if (tipo?.requiere_categoria !== 1) newFormData.categoria_monotributo = "";
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    // ✅ NO enviar 'origen' para que el backend asigne automáticamente "Vendedor-App"
    const { origen, ...formDataSinOrigen } = formData;

    const data = {
      ...formDataSinOrigen,
      familiares: familiares.map(fam => ({
        vinculo: fam.vinculo,
        nombre: fam.nombre,
        edad: fam.edad ? Number(fam.edad) : null,
        tipo_afiliacion_id: fam.tipo_afiliacion_id ? Number(fam.tipo_afiliacion_id) : null,
        sueldo_bruto: fam.sueldo_bruto ? Number(fam.sueldo_bruto) : null,
        categoria_monotributo: fam.categoria_monotributo || null,
      })),
    };

    // 🔍 DEBUG: Verificar qué se está enviando
    console.log('📤 Datos a enviar:', data);
    console.log('📤 ¿Tiene origen?', 'origen' in data);

    try {
      const response = await axios.post(`${ENDPOINTS.PROSPECTOS}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Verificar si es prospecto existente y mostrar información de vendedores
      if (response.data.esProspectoExistente) {
        const vendedoresInfo = response.data.vendedoresAsignados && response.data.vendedoresAsignados.length > 0
          ? `<div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 10px; margin-top: 10px;"><strong>⚠️ Prospecto Existente</strong><br/>Este prospecto ya estaba registrado y asignado a:<br/><ul style="margin-bottom: 0;">${response.data.vendedoresAsignados.map(v => `<li>${v}</li>`).join('')}</ul></div>`
          : '';

        Swal.fire({
          title: "Prospecto Duplicado Detectado",
          html: `${response.data.message}${vendedoresInfo}`,
          icon: "info",
          confirmButtonText: "Entendido"
        });
      } else {
        Swal.fire("Éxito", response.data.message || "Prospecto creado y cotizado correctamente.", "success");
      }

      setShowFormModal(false);

      // ✅ Actualizar la lista de prospectos primero
      await fetchProspectos();

      // 🎮 GAMING: Actualizar métricas después de crear nuevo prospecto
      setTimeout(() => {
        actualizarMetricasGaming();
      }, 100);

      setFormData({
        nombre: "",
        apellido: "",
        edad: "",
        tipo_afiliacion_id: "",
        sueldo_bruto: "",
        categoria_monotributo: "",
        numero_contacto: "",
        correo: "",
        localidad: "",
        estado: "Lead",
        comentario: "",
      });
      setFamiliares([]); // ✅ Limpiar familiares
      setNuevoFamiliar({ vinculo: "", nombre: "", edad: "", tipo_afiliacion_id: "", sueldo_bruto: "", categoria_monotributo: "" }); // ✅ Limpiar formulario de familiar
    } catch (error) {
      console.error("Error al guardar el prospecto:", error);

      // Verificar si hay errores de validación específicos
      if (error.response && error.response.data && error.response.data.errores) {
        // Crear una lista HTML con los errores
        const erroresList = error.response.data.errores.map(err => `• ${err}`).join('<br>');

        Swal.fire({
          title: "Error de validación",
          html: `Por favor, corrige los siguientes errores:<br><br>${erroresList}`,
          icon: "warning",
          confirmButtonText: "Entendido"
        });
      } else {
        // Mensaje genérico para otros tipos de errores
        Swal.fire("Error",
          error.response?.data?.message || "No se pudo guardar el prospecto.",
          "error");
      }
    }
  };

  const handleCardChange = (id, field, value) => {
    setEditValues((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleCardSave = async (prospecto) => {
    const token = localStorage.getItem("token");
    const values = editValues[prospecto.id] || {};

    // Detectar cambio de estado y comentario actual
    const estadoCambiado = values.estado !== undefined && values.estado !== prospecto.estado;
    const comentarioActual = values.comentario !== undefined ? values.comentario : prospecto.comentario;

    // 🎮 GAMING: Detectar nueva venta
    const nuevaVenta = estadoCambiado && values.estado === 'Venta' && prospecto.estado !== 'Venta';

    try {
      await axios.put(
        `${ENDPOINTS.PROSPECTOS}/${prospecto.id}`,
        {
          ...prospecto,
          estado: values.estado !== undefined ? values.estado : prospecto.estado,
          comentario: comentarioActual,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Actualizar la lista de prospectos primero
      await fetchProspectos();

      // 🎮 GAMING: Actualizar métricas solo cuando cambia el estado
      if (estadoCambiado) {
        setTimeout(() => {
          actualizarMetricasGaming();
        }, 100); // Pequeño delay para que se actualicen los prospectos primero
      }

      // 🎮 GAMING: Celebración eliminada - solo actualización silenciosa de métricas

      Swal.fire("Éxito", "Prospecto actualizado correctamente.", "success");
      setEditValues((prev) => ({ ...prev, [prospecto.id]: {} }));
    } catch (error) {
      console.error("Error al actualizar el prospecto:", error);

      // Verificar si hay errores de validación específicos
      if (error.response && error.response.data && error.response.data.errores) {
        // Crear una lista HTML con los errores
        const erroresList = error.response.data.errores.map(err => `• ${err}`).join('<br>');

        Swal.fire({
          title: "Error de validación",
          html: `Por favor, corrige los siguientes errores:<br><br>${erroresList}`,
          icon: "warning",
          confirmButtonText: "Entendido"
        });
      } else {
        // Mensaje genérico para otros tipos de errores
        Swal.fire("Error",
          error.response?.data?.message || "No se pudo actualizar el prospecto.",
          "error");
      }
    }
  };

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

  const handleFamiliarChange = e => {
    setNuevoFamiliar({ ...nuevoFamiliar, [e.target.name]: e.target.value });
  };

  const agregarFamiliar = () => {
    if (
      nuevoFamiliar.vinculo &&
      nuevoFamiliar.nombre &&
      nuevoFamiliar.edad &&
      (
        nuevoFamiliar.vinculo !== "pareja/conyuge" ||
        (
          nuevoFamiliar.tipo_afiliacion_id &&
          (
            (tiposAfiliacion.find(t => t.id === Number(nuevoFamiliar.tipo_afiliacion_id))?.requiere_sueldo !== 1 || nuevoFamiliar.sueldo_bruto) &&
            (tiposAfiliacion.find(t => t.id === Number(nuevoFamiliar.tipo_afiliacion_id))?.requiere_categoria !== 1 || nuevoFamiliar.categoria_monotributo)
          )
        )
      )
    ) {
      setFamiliares([...familiares, nuevoFamiliar]);
      setNuevoFamiliar({ vinculo: "", nombre: "", edad: "", tipo_afiliacion_id: "", sueldo_bruto: "", categoria_monotributo: "" });
    } else {
      Swal.fire("Atención", "Completa todos los datos requeridos del familiar.", "warning");
    }
  };

  // ✅ NUEVA FUNCIÓN: Eliminar familiar por índice
  const eliminarFamiliar = (indice) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Se eliminará este familiar de la lista',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const nuevaListaFamiliares = familiares.filter((_, idx) => idx !== indice);
        setFamiliares(nuevaListaFamiliares);
        Swal.fire({
          title: 'Eliminado',
          text: 'El familiar ha sido eliminado',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  const handleOpenPromocionesModal = (prospectoId) => {
    setProspectoSeleccionado(prospectoId);
    setShowPromocionesModal(true);
  };

  const handleFiltroChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleOpenHistorial = (prospecto) => {
    setSelectedProspecto(prospecto);
    fetchHistorial(prospecto.id);
    setModalHistorial(true);
  };

  const handleVerDocumentos = (poliza) => {
    setPolizaSeleccionada(poliza);
    setModalDocumentos(true);
    fetchDocumentosPoliza(poliza.id);
  };

  // ✅ NUEVA FUNCIÓN: Manejar carga de documentos exitosa
  const handleDocumentosActualizados = async () => {
    if (polizaSeleccionada) {
      await fetchDocumentosPoliza(polizaSeleccionada.id);
    }
  };

  const handleDescargarDocumento = async (documentoId, nombreOriginal) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/vendedor/polizas/documentos/${documentoId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Crear enlace de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nombreOriginal);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar documento:", error);
      Swal.fire("Error", "No se pudo descargar el documento", "error");
    }
  };

  // Filtrado dinámico
  const prospectosFiltrados = prospectos.filter((p) => {
    return (
      (filtros.nombre === "" || p.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())) &&
      (filtros.apellido === "" || p.apellido.toLowerCase().includes(filtros.apellido.toLowerCase())) &&
      (filtros.edad === "" || String(p.edad) === filtros.edad) &&
      (filtros.estado === "" || p.estado.toLowerCase().includes(filtros.estado.toLowerCase()))
    );
  });

  // Drawer/Sidebar content mejorado - Reemplazar el drawerContent existente
  const drawerContent = (
    <VendedorSidebar
      vista={vista}
      setVista={setVista}
      onNuevoProspecto={() => setShowFormModal(true)}
      onCloseDrawer={() => setOpenDrawer(false)}
    />
  );

  // Cargar pólizas cuando cambie la vista
  useEffect(() => {
    if (vista === "polizas") {
      fetchPolizas();
    }
  }, [vista]);

  // Formatear fecha
  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  // Formatear estado de póliza
  const getEstadoPoliza = (estado) => {
    const estados = {
      'borrador': { bg: 'secondary', text: 'Borrador' },
      'pendiente': { bg: 'warning', text: 'Pendiente' },
      'activa': { bg: 'success', text: 'Activa' },
      'cancelada': { bg: 'danger', text: 'Cancelada' },
      'vencida': { bg: 'dark', text: 'Vencida' }
    };
    return estados[estado] || { bg: 'secondary', text: estado };
  };

  const handleVerDetallePoliza = (poliza) => {
    Swal.fire({
      title: `Póliza N° ${poliza.numero_poliza}`,
      html: `
        <div class="text-start">
          <p><strong>Prospecto:</strong> ${poliza.cliente?.nombre || 'Sin nombre'} ${poliza.cliente?.apellido || 'Sin apellido'}</p>
          <p><strong>Plan:</strong> ${poliza.plan?.nombre || 'Sin plan'}</p>
          <p><strong>Total:</strong> ${formatCurrency(poliza.plan?.total_final || 0)}</p>
          <p><strong>Estado:</strong> ${getEstadoPoliza(poliza.estado).text}</p>
          <p><strong>Fecha de creación:</strong> ${formatFecha(poliza.created_at)}</p>
          ${poliza.cliente?.localidad ? `<p><strong>Localidad:</strong> ${poliza.cliente.localidad}</p>` : ''}
          ${poliza.cliente?.telefono ? `<p><strong>Contacto:</strong> ${poliza.cliente.telefono}</p>` : ''}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Descargar PDF',
      cancelButtonText: 'Cerrar',
      width: 600
    }).then((result) => {
      if (result.isConfirmed) {
        window.open(`${API_URL}/polizas/${poliza.id}/pdf`, '_blank');
      }
    });
  };

  const handleEnviarPolizaPorWhatsApp = async (poliza) => {
    try {
      // Obtener el número del prospecto y enmascararlo
      const numeroProspecto = poliza.prospecto_telefono || poliza.cliente?.telefono || '';
      const numeroEnmascarado = numeroProspecto ? maskPhoneNumber(numeroProspecto) : '';

      const { value: formValues } = await Swal.fire({
        title: 'Enviar Póliza por WhatsApp',
        html: `
          <div class="text-start">
            <div class="mb-3">
              <label for="swal-poliza-info" class="form-label">Póliza a enviar:</label>
              <div class="alert alert-info">
                <strong>N° ${poliza.numero_poliza_oficial || poliza.numero_poliza}</strong><br>
                <small>Plan: ${poliza.plan_nombre || 'Plan no especificado'}</small><br>
                <small>Cliente: ${poliza.prospecto_nombre || 'Sin nombre'} ${poliza.prospecto_apellido || 'Sin apellido'}</small><br>
                <small>Total: ${formatCurrency(poliza.total_final || 0)}</small>
              </div>
            </div>
            <div class="mb-3">
              <label for="swal-telefono-poliza" class="form-label">Número de WhatsApp:</label>
              <input 
                id="swal-telefono-poliza" 
                class="swal2-input" 
                type="tel"
                placeholder="Haz clic para ingresar número" 
                value="${numeroEnmascarado}" 
                style="margin-top: 0.5rem;"
              />
              <small class="text-muted d-block mt-1">
                ${numeroProspecto ? 'Número del prospecto enmascarado por seguridad. Haz clic para usar otro número.' : 'Ingresa el número de WhatsApp donde enviar la póliza'}
              </small>
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Enviar Póliza',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#28a745',
        preConfirm: () => {
          const telefonoInput = document.getElementById('swal-telefono-poliza');
          const telefono = telefonoInput.value.trim();

          if (!telefono) {
            Swal.showValidationMessage('Por favor ingresa un número de teléfono');
            return false;
          }

          if (telefono.length < 10) {
            Swal.showValidationMessage('Número de teléfono inválido (mínimo 10 dígitos)');
            return false;
          }

          return { telefono };
        },
        didOpen: () => {
          const telefonoInput = document.getElementById('swal-telefono-poliza');
          let estaEnModoEdicion = false;

          // Al hacer foco, permitir edición
          telefonoInput.addEventListener('focus', () => {
            if (!estaEnModoEdicion && numeroProspecto) {
              // Si es la primera vez que hace clic y hay número del prospecto
              telefonoInput.value = '';
              telefonoInput.placeholder = 'Ingresa número de WhatsApp o deja vacío para usar el del prospecto';
              estaEnModoEdicion = true;
            }
          });
        }
      });

      if (formValues && formValues.telefono) {
        // Determinar qué número usar
        const telefonoIngresado = formValues.telefono.trim();
        const numeroEnmascaradoComparacion = numeroProspecto ? maskPhoneNumber(numeroProspecto) : '';

        // Si el teléfono ingresado es igual al enmascarado, usar el número real del prospecto
        const numeroFinal = telefonoIngresado === numeroEnmascaradoComparacion || telefonoIngresado === ''
          ? numeroProspecto
          : telefonoIngresado;

        if (!numeroFinal) {
          Swal.fire({
            title: 'Error',
            text: 'No hay número disponible para enviar la póliza',
            icon: 'error'
          });
          return;
        }

        const token = localStorage.getItem("token");
        await axios.post(
          `${API_URL}/polizas/${poliza.id}/enviar-whatsapp`,
          { telefono: numeroFinal },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        Swal.fire({
          title: '¡Enviado!',
          text: `Póliza enviada por WhatsApp exitosamente al ${maskPhoneNumber(numeroFinal)}`,
          icon: 'success',
          timer: 3000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error enviando póliza por WhatsApp:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.error || 'Error al enviar la póliza',
        icon: 'error'
      });
    }
  };

  // ✅ NUEVA: Función para enviar primer contacto por WhatsApp
  const handleEnviarPrimerContactoWhatsApp = async (prospecto) => {
    try {
      // Verificar que el prospecto tenga número de contacto
      if (!prospecto.numero_contacto) {
        Swal.fire({
          title: 'Error',
          text: 'Este prospecto no tiene número de contacto registrado',
          icon: 'error'
        });
        return;
      }

      const result = await Swal.fire({
        title: '¿Iniciar conversación WhatsApp?',
        html: `
          <div class="text-start">
            <div class="mb-3">
              <strong>Prospecto:</strong> ${prospecto.nombre} ${prospecto.apellido}<br>
              <strong>Teléfono:</strong> ${maskPhoneNumber(prospecto.numero_contacto)}
            </div>
            <div class="alert alert-info">
              <strong>📱 Mensaje que se enviará:</strong><br><br>
              <em>👋 Hola ${prospecto.nombre},<br>
              Te contactamos desde Cober | Medicina Privada por la consulta que realizaste en nuestra web 🌐.<br><br>
              Si querés que un representante oficial se comunique con vos 📞 para brindarte más información ℹ️, respondé "Sí" ✅ a este mensaje.</em>
            </div>
            <small class="text-muted">
              Este mensaje utiliza un template aprobado por Meta/WhatsApp para primer contacto.
            </small>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#25D366',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '📱 Enviar WhatsApp',
        cancelButtonText: 'Cancelar',
        width: '600px'
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem("token");

        // Mostrar loading
        Swal.fire({
          title: 'Enviando mensaje...',
          text: 'Por favor espera mientras se envía el mensaje por WhatsApp',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const response = await axios.post(
          `${API_URL}/prospectos/${prospecto.id}/primer-contacto-whatsapp`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          Swal.fire({
            title: '¡Mensaje enviado!',
            html: `
              <div class="text-start">
                <p><strong>✅ Primer contacto enviado exitosamente</strong></p>
                <p><strong>Destinatario:</strong> ${prospecto.nombre} ${prospecto.apellido}</p>
                <p><strong>Teléfono:</strong> ${maskPhoneNumber(prospecto.numero_contacto)}</p>
                <p><strong>Conversación ID:</strong> #${response.data.data.conversacion_id}</p>
                <hr>
                <small class="text-muted">
                  <strong>📝 Próximos pasos:</strong><br>
                  • El prospecto recibirá el mensaje en WhatsApp<br>
                  • Cuando responda, aparecerá en tu bandeja de chat<br>
                  • Podrás continuar la conversación desde el panel de chat
                </small>
              </div>
            `,
            icon: 'success',
            timer: 8000,
            showConfirmButton: true,
            confirmButtonText: 'Entendido'
          });

          // Actualizar la lista de prospectos para reflejar el cambio
          await fetchProspectos();
        } else {
          throw new Error(response.data.message || 'Error al enviar mensaje');
        }
      }

    } catch (error) {
      console.error('Error enviando primer contacto WhatsApp:', error);

      let mensajeError = 'Error al enviar el mensaje por WhatsApp';

      if (error.response?.data?.message) {
        mensajeError = error.response.data.message;
      } else if (error.message) {
        mensajeError = error.message;
      }

      Swal.fire({
        title: 'Error al enviar WhatsApp',
        text: mensajeError,
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    }
  };

  // ✅ NUEVA: Función para editar póliza
  const handleEditarPoliza = (poliza) => {
    setPolizaEditando(poliza);
    setShowEditarPolizaModal(true);
  };

  // ✅ NUEVA: Función para actualizar póliza tras edición
  const handleActualizarPoliza = async () => {
    // Recargar pólizas
    await fetchPolizas();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatTipoDocumento = (tipo) => {
    const tipos = {
      // Nuevos tipos de documentos adicionales
      'codem': 'CODEM',
      'formulario_f152': 'Formulario F152',
      'formulario_f184': 'Formulario F184',
      'constancia_inscripcion': 'Constancia de Inscripción',
      'comprobante_pago_cuota': 'Comprobante de Pago de Cuota',
      'estudios_medicos': 'Estudios Médicos',
      // Tipos existentes
      'dni_frente': 'DNI Frente',
      'dni_dorso': 'DNI Dorso',
      'constancia_ingresos': 'Constancia de Ingresos',
      'recibo_sueldo': 'Recibo de Sueldo',
      'autorizacion_debito': 'Autorización de Débito',
      'declaracion_jurada': 'Declaración Jurada',
      'poliza_firmada': 'Póliza Firmada',
      'auditoria_medica': 'Auditoría Médica',
      'documento_identidad_adicional': 'Documento de Identidad Adicional',
      'comprobante_ingresos': 'Comprobante de Ingresos',
      'otros': 'Otros'
    };
    return tipos[tipo] || tipo;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ✅ NUEVA: Función para enmascarar números de teléfono
  const maskPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, ''); // Remover caracteres no numéricos
    if (cleaned.length < 4) return phone; // Si es muy corto, devolver tal como está

    // Mostrar solo los últimos 4 dígitos
    const masked = '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);

    // Mantener formato original si tiene caracteres especiales
    if (phone.includes('+')) {
      return `+${masked}`;
    } else if (phone.includes('-') || phone.includes(' ') || phone.includes('(')) {
      // Para formatos como (011) 1234-5678 o 011 1234-5678
      return `******${cleaned.slice(-4)}`;
    }

    return masked;
  };

  // ✅ NUEVA: Función para enmascarar correos electrónicos
  const maskEmail = (email) => {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    if (!domain) return email; // Si no tiene @, devolver tal como está

    if (localPart.length <= 2) {
      return `**@${domain}`;
    }

    // Mostrar los primeros 2 caracteres y enmascarar el resto hasta @
    const maskedLocal = localPart.substring(0, 2) + '*'.repeat(localPart.length - 2);
    return `${maskedLocal}@${domain}`;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }


  return (
    <div className="container-fluid p-0">
      {/* Sidebar fijo para escritorio */}
      <div
        className="d-none d-md-block position-fixed top-0 start-0 h-100"
        style={{ width: drawerWidth, zIndex: 1020, top: '80px', height: 'calc(100% - 80px)' }}
      >
        {drawerContent}
      </div>

      {/* Offcanvas para móvil */}
      <Offcanvas
        show={openDrawer}
        onHide={() => setOpenDrawer(false)}
        backdrop={true}
        scroll={false}
        className="offcanvas-sidebar d-md-none"
        style={{ width: drawerWidth }}
      >
        <Offcanvas.Header closeButton className="border-0">
          <Offcanvas.Title>Panel Vendedor</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          {drawerContent}
        </Offcanvas.Body>
      </Offcanvas>

      {/* Contenido principal */}
      <div style={{ marginLeft: window.innerWidth >= 768 ? drawerWidth : 0 }}>
        {/* ========== VISTA DE PROSPECTOS ========== */}
        {vista === "prospectos" && (
          <>
            {/* Topbar mejorada para prospectos */}
            <div className="dashboard-topbar">
              <div className="topbar-left">
                <Button
                  variant="light"
                  className="menu-toggle d-md-none"
                  onClick={() => setOpenDrawer(true)}
                >
                  <FaBars />
                </Button>
                <h1 className="topbar-title">
                  Gestión de <span className="title-accent">Prospectos</span>
                </h1>
              </div>

              <div className="topbar-right">
                <ButtonGroup className="view-toggle">
                  <Button
                    variant={tipoVista === "tabla" ? "primary" : "outline-primary"}
                    onClick={() => setTipoVista("tabla")}
                    title="Vista de tabla"
                    size="sm"
                  >
                    <FaList />
                  </Button>
                  <Button
                    variant={tipoVista === "tarjetas" ? "primary" : "outline-primary"}
                    onClick={() => setTipoVista("tarjetas")}
                    title="Vista de tarjetas"
                    size="sm"
                  >
                    <FaThLarge />
                  </Button>
                </ButtonGroup>

                <div className="d-flex gap-2">
                  <Button
                    className="new-prospect-btn"
                    onClick={() => setShowFormModal(true)}
                  >
                    <FaPlus />
                    <span className="d-none d-sm-inline">Nuevo Prospecto</span>
                  </Button>
                </div>
              </div>
            </div>


            {/* {metricsVisible && (
              <Container fluid className="py-2">
                <Card className="gaming-metrics-card shadow-sm border-0 mb-3" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }}>
                  <Card.Header className="border-0 d-flex justify-content-between align-items-center" style={{ background: 'transparent' }}>
                    <div className="d-flex align-items-center">
                      <h5 className="mb-0 text-white">
                        🎮 Panel de Vendedor - Nivel <span>{gamingStats.nivel}</span>
                      </h5>
                    </div>
                    <Button 
                      variant="outline-light" 
                      size="sm"
                      onClick={() => setMetricsVisible(false)}
                      style={{ opacity: 0.8 }}
                    >
                      ✕
                    </Button>
                  </Card.Header>
                  <Card.Body className="pb-2">
                    <Row className="g-3">
                      <Col xs={12}>
                        <div className="mb-2">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className="text-light opacity-75">Experiencia</small>
                            <small className="text-light opacity-75">
                              {gamingStatsStable.experiencia} / {gamingStatsStable.experienciaParaSiguienteNivel} XP
                            </small>
                          </div>
                          <ProgressBar
                            now={(gamingStatsStable.experiencia / gamingStatsStable.experienciaParaSiguienteNivel) * 100}
                            style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.2)' }}
                            className="rounded-pill experience-bar"
                          >
                            <ProgressBar
                              now={(gamingStats.experiencia / gamingStats.experienciaParaSiguienteNivel) * 100}
                              style={{ 
                                backgroundColor: '#ffd700',
                                background: 'linear-gradient(90deg, #ffd700, #ffed4e)'
                              }}
                            />
                          </ProgressBar>
                        </div>
                      </Col>

                      <Col md={3} xs={6}>
                        <div className="text-center gaming-stat">
                          <div className="stat-icon mb-1">🎯</div>
                          <div className={`${getStatClass(gamingStatsStable.ventasHoy, 'ventas')}`} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {gamingStatsStable.ventasHoy}
                          </div>
                          <div className="stat-label" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                            Ventas Hoy
                          </div>
                        </div>
                      </Col>

                      <Col md={3} xs={6}>
                        <div className="text-center gaming-stat">
                          <div className="stat-icon mb-1">📈</div>
                          <div className={`${getStatClass(gamingStatsStable.ventasSemana, 'ventas')}`} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {gamingStatsStable.ventasSemana}
                          </div>
                          <div className="stat-label" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                            Esta Semana
                          </div>
                        </div>
                      </Col>

                      <Col md={3} xs={6}>
                        <div className="text-center gaming-stat">
                          <div className="stat-icon mb-1">🚀</div>
                          <div className={`${getStatClass(gamingStatsStable.ventasMes, 'ventas')}`} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {gamingStatsStable.ventasMes}
                          </div>
                          <div className="stat-label" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                            Este Mes
                          </div>
                        </div>
                      </Col>

                      <Col md={3} xs={6}>
                        <div className="text-center gaming-stat">
                          <div className="stat-icon mb-1">🔥</div>
                          <div className={`${getStatClass(gamingStatsStable.streakActual, 'streak')}`} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {gamingStatsStable.streakActual}
                          </div>
                          <div className="stat-label" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                            Racha Actual
                          </div>
                        </div>
                      </Col>
                    </Row>

                    {gamingStatsStable.logrosDesbloqueados.length > 0 && (
                      <Row className="mt-3">
                        <Col xs={12}>
                          <div className="d-flex align-items-center mb-2">
                            <h6 className="mb-0 text-white me-3">🏆 Logros Desbloqueados</h6>
                          </div>
                          <div className="d-flex flex-wrap gap-2">
                            {gamingStatsStable.logrosDesbloqueados.slice(-3).map((logro, index) => (
                              <Badge 
                                key={logro.id}
                                bg="warning" 
                                text="dark"
                                className="px-2 py-1"
                                style={{ 
                                  fontSize: '0.75rem',
                                  background: 'linear-gradient(45deg, #ffd700, #ffed4e) !important'
                                }}
                                title={logro.descripcion}
                              >
                                {logro.titulo}
                              </Badge>
                            ))}
                            {gamingStatsStable.logrosDesbloqueados.length > 3 && (
                              <Badge bg="secondary" className="px-2 py-1" style={{ fontSize: '0.75rem' }}>
                                +{gamingStatsStable.logrosDesbloqueados.length - 3} más
                              </Badge>
                            )}
                          </div>
                        </Col>
                      </Row>
                    )}

                    <Row className="mt-3">
                      <Col xs={12}>
                        <div className="text-center p-2 rounded motivational-message" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                          <small className="text-light">
                            {getMensajeMotivacional(gamingStatsStable)}
                          </small>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Container>
            )}

            {!metricsVisible && (
              <Container fluid className="py-1">
                <div className="text-center">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => setMetricsVisible(true)}
                    className="rounded-pill"
                  >
                    🎮 Mostrar Panel Gaming
                  </Button>
                </div>
              </Container>
            )} */}


            <Container fluid className="py-3">
              {/* Formulario de filtros */}
              <div className="mb-3">
                {/* Botón para mostrar/ocultar filtros en móvil */}
                <div className="d-block d-md-none mb-2 text-end">
                  <Button
                    variant={showFiltrosMobile ? "outline-primary" : "primary"}
                    size="sm"
                    onClick={() => setShowFiltrosMobile(!showFiltrosMobile)}
                  >
                    {showFiltrosMobile ? "Ocultar filtros" : "Mostrar filtros"}
                  </Button>
                </div>
                {/* Filtros: visible en desktop, desplegable en móvil */}
                <div className={`bg-white rounded shadow-sm p-3 ${showFiltrosMobile ? '' : 'd-none d-md-block'}`}>
                  <Row>
                    <Col md={3}>
                      <Form.Control
                        placeholder="Filtrar por nombre"
                        name="nombre"
                        value={filtros.nombre}
                        onChange={handleFiltroChange}
                        size="sm"
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Control
                        placeholder="Filtrar por apellido"
                        name="apellido"
                        value={filtros.apellido}
                        onChange={handleFiltroChange}
                        size="sm"
                      />
                    </Col>
                    <Col md={2}>
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
                    <Col md={3}>
                      <Form.Control
                        placeholder="Estado"
                        name="estado"
                        value={filtros.estado}
                        onChange={handleFiltroChange}
                        size="sm"
                      />
                    </Col>
                    <Col md={1}>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setFiltros({ nombre: "", apellido: "", edad: "", estado: "" })}
                      >
                        Limpiar
                      </Button>
                    </Col>
                  </Row>
                </div>
              </div>

              {/* Vista de tabla de prospectos */}
              {tipoVista === "tabla" && (
                <div className="bg-white rounded shadow-sm p-3 mb-4">
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Edad</th>
                        <th>Contacto</th>
                        <th>Tipo Afiliación</th>
                        <th>Estado</th>
                        <th>Progreso</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prospectosFiltrados.map((prospecto) => {
                        const values = editValues[prospecto.id] || {};
                        const estadoActual = values.estado !== undefined ? values.estado : prospecto.estado;
                        return (
                          <tr key={prospecto.id}>
                            <td>{prospecto.id}</td>
                            <td>{prospecto.nombre}</td>
                            <td>{prospecto.apellido}</td>
                            <td>{prospecto.edad}</td>
                            <td>
                              {maskPhoneNumber(prospecto.numero_contacto)}
                            </td>
                            <td>{tiposAfiliacion.find(t => t.id === Number(prospecto.tipo_afiliacion_id))?.etiqueta || "Sin datos"}</td>
                            <td>
                              <select
                                className="form-select form-select-sm"
                                value={estadoActual}
                                onChange={(e) => guardarCambioProspecto(prospecto, "estado", e.target.value)}
                              >
                                <option value="Lead">Lead</option>
                                <option value="1º Contacto">1º Contacto</option>
                                <option value="Calificado Cotización">Calificado Cotización</option>
                                <option value="Calificado Póliza">Calificado Póliza</option>
                                <option value="Calificado Pago">Calificado Pago</option>
                                <option value="Venta">Venta</option>
                                <option value="Fuera de zona">Fuera de zona</option>
                                <option value="Fuera de edad">Fuera de edad</option>
                                <option value="Preexistencia">Preexistencia</option>
                                <option value="Reafiliación">Reafiliación</option>
                                <option value="No contesta">No contesta</option>
                                <option value="prueba interna">prueba interna</option>
                                <option value="Ya es socio">Ya es socio</option>
                                <option value="Busca otra Cobertura">Busca otra Cobertura</option>
                                <option value="Teléfono erróneo">Teléfono erróneo</option>
                                <option value="No le interesa (económico)">No le interesa (económico)</option>
                                <option value="No le interesa cartilla">No le interesa cartilla</option>
                                <option value="No busca cobertura médica">No busca cobertura médica</option>
                              </select>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                name="comentario"
                                value={values.comentario !== undefined ? values.comentario : prospecto.comentario || ""}
                                onChange={(e) => guardarCambioProspecto(prospecto, "comentario", e.target.value)}
                                placeholder="Agrega un comentario..."
                                className="mb-2"
                              />
                              {alertaGuardado.show && alertaGuardado.prospectoId === prospecto.id && (
                                <Alert severity="success" sx={{ mb: 2 }}>
                                  {alertaGuardado.mensaje}
                                </Alert>
                              )}
                            </td>
                            <td>
                              <div className="progress" style={{ height: "12px" }}>
                                <div
                                  className={`progress-bar ${getProgressColorClass(estadoPorcentaje[estadoActual] || 0)}`}
                                  role="progressbar"
                                  style={{
                                    width: `${estadoPorcentaje[estadoActual] || 0}%`
                                  }}
                                  aria-valuenow={estadoPorcentaje[estadoActual] || 0}
                                  aria-valuemin="0"
                                  aria-valuemax="100"
                                >
                                  {estadoPorcentaje[estadoActual] || 0}%
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex gap-1">

                                <Button
                                  size="sm"
                                  variant="info"
                                  title="Ver historial"
                                  onClick={() => handleOpenHistorial(prospecto)}
                                >
                                  <FaEye />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="success"
                                  title="Iniciar conversación WhatsApp"
                                  onClick={() => handleEnviarPrimerContactoWhatsApp(prospecto)}
                                  className="text-white"
                                >
                                  <FaWhatsapp />
                                </Button>
                                {/* <Button
                                  size="sm"
                                  variant="info"
                                  title="Aplicar promoción"
                                  onClick={() => handleOpenPromocionesModal(prospecto.id)}
                                >
                                  <FaMoneyBillWave />
                                </Button> */}
                                <Link
                                  to={`/prospectos/${prospecto.id}`}
                                  className="btn-primary-cards-vendedor"
                                  title="Ver detalles"
                                >
                                  <FaUserCheck />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}

              {/* Vista de tarjetas de prospectos */}
              {tipoVista === "tarjetas" && (
                <Row>
                  {/* Animación CSS para el Alert */}
                  <style>
                    {`
                      @keyframes slideInRight {
                        0% {
                          opacity: 0;
                          transform: translateX(100px);
                        }
                        100% {
                          opacity: 1;
                          transform: translateX(0);
                        }
                      }
                    `}
                  </style>
                  {prospectosFiltrados.map((prospecto) => {
                    const values = editValues[prospecto.id] || {};
                    const estadoActual = values.estado !== undefined ? values.estado : prospecto.estado;
                    const progreso = estadoPorcentaje[estadoActual] || 0;
                    return (
                      <Col lg={4} md={6} sm={12} key={prospecto.id} className="mb-3">
                        <Card className="h-100 shadow-sm">
                          <Card.Header className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold">
                              {prospecto.nombre} {prospecto.apellido} ({prospecto.edad} años)
                            </span>
                            <div className="d-flex gap-2">
                              <Badge bg={
                                progreso === 100 ? "success" :
                                  progreso > 50 ? "primary" :
                                    progreso > 0 ? "warning" :
                                      "danger"
                              }>
                                {estadoActual}
                              </Badge>
                            </div>
                          </Card.Header>
                          <Card.Body>
                            {/* Alert posicionado en la tarjeta del usuario */}
                            {alertaGuardado.show && alertaGuardado.prospectoId === prospecto.id && (
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                                  position: 'relative',
                                  zIndex: 9999
                                }}
                              >
                                <Alert
                                  variant="outlined"
                                  severity="success"
                                  sx={{
                                    mb: 2,
                                    borderRadius: 3,
                                    boxShadow: 2,
                                    minWidth: 320,
                                    maxWidth: 400,
                                    fontWeight: 500,
                                    animation: 'slideInRight 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                                    background: '#f6fff6',
                                    borderColor: '#4caf50',
                                  }}
                                >
                                  {alertaGuardado.mensaje}
                                </Alert>
                              </div>
                            )}
                            
                            {/* Preferencia de contacto arriba */}
                            {prospecto.preferencia_contacto && (
                              <div className="mb-3">
                                <small className="text-muted d-block mb-1">Preferencia de contacto:</small>
                                <Badge bg={
                                  prospecto.preferencia_contacto === 'email' ? 'info' :
                                  prospecto.preferencia_contacto === 'whatsapp' ? 'success' :
                                  prospecto.preferencia_contacto === 'llamada' ? 'warning' :
                                  'secondary'
                                } className="d-flex align-items-center gap-1" style={{ width: 'fit-content', padding: '0.5rem 0.75rem' }}>
                                  {prospecto.preferencia_contacto === 'email' && '📧 Email'}
                                  {prospecto.preferencia_contacto === 'whatsapp' && '💬 WhatsApp'}
                                  {prospecto.preferencia_contacto === 'llamada' && '📞 Llamada'}
                                </Badge>
                              </div>
                            )}

                            <div className="mb-3">
                              <small className="text-muted d-block mb-1">Tipo de Afiliación:</small>
                              <div>
                                {tiposAfiliacion.find(t => t.id === Number(prospecto.tipo_afiliacion_id))?.etiqueta || "Sin datos"}
                              </div>
                            </div>

                            <div className="mb-3">
                              <small className="text-muted d-block mb-1">Contacto:</small>
                              <div className="d-flex align-items-center">
                                <FaPhone className="me-1 text-muted" />
                                {maskPhoneNumber(prospecto.numero_contacto) || "No disponible"}
                              </div>
                              {prospecto.correo && (
                                <div className="d-flex align-items-center mt-1">
                                  <MdEmail className="me-1 text-muted" /> {maskEmail(prospecto.correo)}
                                </div>
                              )}
                              {prospecto.localidad && (
                                <div className="d-flex align-items-center mt-1">
                                  <FaHome className="me-1 text-muted" /> {prospecto.localidad}
                                </div>
                              )}
                            </div>

                            <div className="mb-3">
                              <small className="text-muted d-block mb-1">Comentario:</small>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                name="comentario"
                                value={values.comentario !== undefined ? values.comentario : prospecto.comentario || ""}
                                onChange={(e) => {
                                  handleCardChange(prospecto.id, "comentario", e.target.value);
                                }}
                                onBlur={async (e) => {
                                  await guardarCambioProspecto(prospecto, "comentario", e.target.value);
                                }}
                                placeholder="Agrega un comentario..."
                                className="mb-2"
                              />
                            </div>

                            <div className="mb-3">
                              <small className="text-muted d-block mb-1">Estado:</small>
                              <Form.Select
                                className="mb-2"
                                value={estadoActual}
                                onChange={async (e) => {
                                  handleCardChange(prospecto.id, "estado", e.target.value);
                                  await guardarCambioProspecto(prospecto, "estado", e.target.value);
                                }}
                              >
                                <option value="Lead">Lead</option>
                                <option value="1º Contacto">1º Contacto</option>
                                <option value="Calificado Cotización">Calificado Cotización</option>
                                <option value="Calificado Póliza">Calificado Póliza</option>
                                <option value="Calificado Pago">Calificado Pago</option>
                                <option value="Venta">Venta</option>
                                <option value="Fuera de zona">Fuera de zona</option>
                                <option value="Fuera de edad">Fuera de edad</option>
                                <option value="Preexistencia">Preexistencia</option>
                                <option value="Reafiliación">Reafiliación</option>
                                <option value="No contesta">No contesta</option>
                                <option value="prueba interna">prueba interna</option>
                                <option value="Ya es socio">Ya es socio</option>
                                <option value="Busca otra Cobertura">Busca otra Cobertura</option>
                                <option value="Teléfono erróneo">Teléfono erróneo</option>
                                <option value="No le interesa (económico)">No le interesa (económico)</option>
                                <option value="No le interesa cartilla">No le interesa cartilla</option>
                                <option value="No busca cobertura médica">No busca cobertura médica</option>
                              </Form.Select>
                            </div>

                            <div className="mb-3">
                              <small className="text-muted d-block mb-1">Progreso:</small>
                              <ProgressBar
                                now={progreso}
                                label={`${progreso}%`}
                                variant={
                                  progreso === 100 ? "success" :
                                    progreso > 50 ? "primary" :
                                      progreso > 0 ? "warning" :
                                        "danger"
                                }
                              />
                            </div>
                          </Card.Body>
                          <Card.Footer className="d-flex justify-content-center">
                            <div className="d-flex gap-1">
                              <Button
                                size="sm"
                                variant="info"
                                title="Ver historial"
                                onClick={() => handleOpenHistorial(prospecto)}
                              >
                                <FaEye />
                              </Button>
                              <Button
                                size="sm"
                                variant="success"
                                title="Iniciar conversación WhatsApp"
                                onClick={() => handleEnviarPrimerContactoWhatsApp(prospecto)}
                                className="text-white"
                              >
                                <FaWhatsapp />
                              </Button>
                              {/* ✅ NUEVO BOTÓN: Llamar al prospecto */}
                              <Button
                                size="sm"
                                variant="primary"
                                title="Llamar al prospecto"
                                onClick={() => window.open(`tel:${prospecto.numero_contacto}`, '_self')}
                                className="text-white"
                                disabled={!prospecto.numero_contacto}
                              >
                                <FaPhone />
                              </Button>
                              <Link
                                to={`/prospectos/${prospecto.id}`}
                                className="btn btn-outline-success btn-sm"
                                title="Ver cotizaciones/detalles"
                                style={{
                                  border: '2px solid #28a745',
                                  background: '#fff',
                                  color: '#28a745',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <FaDollarSign style={{ color: '#28a745', fontSize: '1.2em' }} />
                              </Link>
                            </div>
                          </Card.Footer>
                        </Card>
                      </Col>
                    );
                  })}
                  {prospectosFiltrados.length === 0 && (
                    <Col className="text-center py-5">
                      <p className="text-muted">No se encontraron prospectos con los filtros aplicados.</p>
                    </Col>
                  )}
                </Row>
              )}
            </Container>
          </>
        )}

        {/* ========== VISTA DE PÓLIZAS ========== */}
        {vista === "polizas" && (
          <>
            {/* Topbar para pólizas */}
            <div className="dashboard-topbar">
              <div className="topbar-left">
                <Button
                  variant="light"
                  className="menu-toggle d-md-none"
                  onClick={() => setOpenDrawer(true)}
                >
                  <FaBars />
                </Button>
                <h1 className="topbar-title">
                  Mis <span className="title-accent">Pólizas</span>
                </h1>
              </div>

              <div className="topbar-right">
                <ButtonGroup className="view-toggle">
                  <Button
                    variant={tipoVista === "tabla" ? "primary" : "outline-primary"}
                    onClick={() => setTipoVista("tabla")}
                    title="Vista de tabla"
                    size="sm"
                  >
                    <FaList />
                  </Button>
                  <Button
                    variant={tipoVista === "tarjetas" ? "primary" : "outline-primary"}
                    onClick={() => setTipoVista("tarjetas")}
                    title="Vista de tarjetas"
                    size="sm"
                  >
                    <FaThLarge />
                  </Button>
                </ButtonGroup>
              </div>
            </div>

            <PolizasDashboard
              polizas={polizas}
              loadingPolizas={loadingPolizas}
              formatCurrency={formatCurrency}
              formatFecha={formatFecha}
              getEstadoPoliza={getEstadoPoliza}
              handleVerDocumentos={handleVerDocumentos}
              handleEnviarPolizaPorWhatsApp={handleEnviarPolizaPorWhatsApp}
              handleVerDetallePoliza={handleVerDetallePoliza}
              handleEditarPoliza={handleEditarPoliza}
              tipoVista={tipoVista}
              setTipoVista={setTipoVista}
              drawerWidth={0} // No necesario aquí
            />
          </>
        )}

        {vista === "whatsapp" && (
          <WhatsAppVista onOpenSidebar={() => setOpenDrawer(true)} />
        )}
      </div>

      {/* Modales */}
      <Modal
        show={showFormModal}
        onHide={() => {
          setShowFormModal(false);
          setFamiliares([]); // ✅ Limpiar familiares al cerrar
          setNuevoFamiliar({ vinculo: "", nombre: "", edad: "", tipo_afiliacion_id: "", sueldo_bruto: "", categoria_monotributo: "" }); // ✅ Limpiar formulario
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Crear Nuevo Prospecto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    maxLength={100}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellido</Form.Label>
                  <Form.Control
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    required
                    maxLength={100}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Edad</Form.Label>
                  <Form.Control
                    type="number"
                    name="edad"
                    value={formData.edad}
                    onChange={handleChange}
                    min={0}
                    max={120}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Afiliación</Form.Label>
                  <Form.Select
                    name="tipo_afiliacion_id"
                    value={formData.tipo_afiliacion_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona...</option>
                    {tiposAfiliacion.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.etiqueta}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Campo SUELDO BRUTO solo si requiere_sueldo */}
            {tiposAfiliacion.find(t => t.id === Number(formData.tipo_afiliacion_id))?.requiere_sueldo === 1 && (
              <Form.Group className="mb-3">
                <Form.Label>Sueldo Bruto</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="sueldo_bruto"
                  value={formData.sueldo_bruto}
                  onChange={handleChange}
                  min={0}
                  max={99999999.99}
                  required
                />
              </Form.Group>
            )}

            {/* Campo CATEGORÍA solo si requiere_categoria */}
            {tiposAfiliacion.find(t => t.id === Number(formData.tipo_afiliacion_id))?.requiere_categoria === 1 && (
              <Form.Group className="mb-3">
                <Form.Label>Categoría Monotributo</Form.Label>
                <Form.Select
                  name="categoria_monotributo"
                  value={formData.categoria_monotributo || ""}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona...</option>
                  {Array.isArray(tiposAfiliacion.find(t => t.id === Number(formData.tipo_afiliacion_id)).categorias)
                    ? tiposAfiliacion.find(t => t.id === Number(formData.tipo_afiliacion_id)).categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))
                    // Si categorias viene como string JSON:
                    : Array.isArray(JSON.parse(tiposAfiliacion.find(t => t.id === Number(formData.tipo_afiliacion_id)).categorias || "[]")) &&
                    JSON.parse(tiposAfiliacion.find(t => t.id === Number(formData.tipo_afiliacion_id)).categorias || "[]").map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))
                  }
                </Form.Select>
              </Form.Group>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Número de contacto</Form.Label>
                  <Form.Control
                    type="text"
                    name="numero_contacto"
                    value={formData.numero_contacto || ""}
                    onChange={handleChange}
                    required
                    maxLength={30}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Correo</Form.Label>
                  <Form.Control
                    type="email"
                    name="correo"
                    value={formData.correo || ""}
                    onChange={handleChange}
                    required
                    maxLength={100}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Localidad</Form.Label>
              <Form.Select // ✅ Cambiar de Form.Control a Form.Select
                name="localidad"
                value={formData.localidad || ""}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona...</option>
                {localidades.map(loc => (
                  <option key={loc.id} value={loc.nombre}>{loc.nombre}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Comentario</Form.Label>
              <Form.Control
                as="textarea"
                name="comentario"
                value={formData.comentario}
                onChange={handleChange}
                maxLength={500}
                placeholder="Agrega un comentario sobre el prospecto"
                rows={3}
              />
            </Form.Group>

            {/* Bloque para agregar familiares */}
            <Card className="mb-3 mt-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Familiares</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Vínculo</Form.Label>
                      <Form.Select
                        name="vinculo"
                        value={nuevoFamiliar.vinculo}
                        onChange={handleFamiliarChange}
                      >
                        <option value="">Selecciona...</option>
                        {vinculos.map(v => (
                          <option key={v.value} value={v.value}>{v.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nombre</Form.Label>
                      <Form.Control
                        type="text"
                        name="nombre"
                        value={nuevoFamiliar.nombre}
                        onChange={handleFamiliarChange}
                        maxLength={100}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Edad</Form.Label>
                      <Form.Control
                        type="number"
                        name="edad"
                        value={nuevoFamiliar.edad}
                        onChange={handleFamiliarChange}
                        min={0}
                        max={120}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Si vínculo es pareja/conyuge, mostrar tipo de afiliación y campos adicionales */}
                {nuevoFamiliar.vinculo === "pareja/conyuge" && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Tipo de Afiliación</Form.Label>
                      <Form.Select
                        name="tipo_afiliacion_id"
                        value={nuevoFamiliar.tipo_afiliacion_id}
                        onChange={handleFamiliarChange}
                        required
                      >
                        <option value="">Selecciona...</option>
                        {tiposAfiliacion.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.etiqueta}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    {/* Sueldo bruto si corresponde */}
                    {tiposAfiliacion.find(t => t.id === Number(nuevoFamiliar.tipo_afiliacion_id))?.requiere_sueldo === 1 && (
                      <Form.Group className="mb-3">
                        <Form.Label>Sueldo Bruto</Form.Label>
                        <Form.Control
                          type="number"
                          name="sueldo_bruto"
                          value={nuevoFamiliar.sueldo_bruto}
                          onChange={handleFamiliarChange}
                          min={0}
                        />
                      </Form.Group>
                    )}

                    {/* Categoría monotributo si corresponde */}
                    {tiposAfiliacion.find(t => t.id === Number(nuevoFamiliar.tipo_afiliacion_id))?.requiere_categoria === 1 && (
                      <Form.Group className="mb-3">
                        <Form.Label>Categoría Monotributo</Form.Label>
                        <Form.Select
                          name="categoria_monotributo"
                          value={nuevoFamiliar.categoria_monotributo}
                          onChange={handleFamiliarChange}
                        >
                          <option value="">Selecciona...</option>
                          {categoriasMonotributo.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    )}
                  </>
                )}

                <Button
                  variant="primary"
                  onClick={agregarFamiliar}
                  className="mt-2"
                >
                  <FaPlus className="me-1" />
                  Agregar Familiar
                </Button>

                {/* ✅ LISTA DE FAMILIARES CON BOTÓN DE ELIMINAR */}
                {familiares.length > 0 && (
                  <div className="mt-4">
                    <h6>Familiares agregados:</h6>
                    <div className="list-group">
                      {familiares.map((fam, idx) => (
                        <div key={idx} className="list-group-item d-flex justify-content-between align-items-start">
                          <div className="flex-fill">
                            <div className="fw-bold">
                              {fam.vinculo}: {fam.nombre}
                            </div>
                            <small className="text-muted">
                              {fam.edad} años
                              {fam.tipo_afiliacion_id && (
                                <>
                                  {' • '}
                                  {tiposAfiliacion.find(t => t.id === Number(fam.tipo_afiliacion_id))?.etiqueta}
                                </>
                              )}
                              {fam.sueldo_bruto && (
                                <>
                                  {' • '}
                                  Sueldo: ${parseFloat(fam.sueldo_bruto).toLocaleString()}
                                </>
                              )}
                              {fam.categoria_monotributo && (
                                <>
                                  {' • '}
                                  Categoría: {fam.categoria_monotributo}
                                </>
                              )}
                            </small>
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => eliminarFamiliar(idx)}
                            title="Eliminar familiar"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            <div className="d-flex justify-content-end mt-3">
              <Button variant="secondary" onClick={() => setShowFormModal(false)} className="me-2">
                Cancelar
              </Button>
              <Button variant="primary" type="submit">
                Crear Prospecto
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={modalHistorial} onHide={() => setModalHistorial(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Historial de acciones</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
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
        </Modal.Body>
      </Modal>

      <PromocionesModal
        prospectoId={prospectoSeleccionado}
        show={showPromocionesModal}
        onClose={() => setShowPromocionesModal(false)}
      />

      {/* Modal para ver documentos de póliza */}
      <Modal show={modalDocumentos} onHide={() => setModalDocumentos(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Documentos de Póliza N° {polizaSeleccionada?.numero_poliza}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingDocumentos ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando documentos...</span>
              </Spinner>
            </div>
          ) : (
            <div>
              {documentos.length === 0 ? (
                <div className="text-center text-muted py-4">
                  No hay documentos disponibles para esta póliza
                </div>
              ) : (
                <div className="row row-cols-1 row-cols-md-2 g-4">
                  {documentos.map((documento) => (
                    <div className="col" key={documento.id}>
                      <Card className="h-100">
                        <Card.Header>
                          <small className="text-muted">
                            {formatTipoDocumento(documento.tipo_documento)}
                          </small>
                          {documento.integrante_index !== null && (
                            <Badge bg="info">
                              Integrante {documento.integrante_index + 1}
                            </Badge>
                          )}
                        </Card.Header>
                        <Card.Body>
                          <div className="mb-2">
                            <strong>Archivo:</strong>
                            <br />
                            <small className="text-muted">{documento.nombre_original}</small>
                          </div>
                          <div className="mb-2">
                            <strong>Tamaño:</strong>
                            <br />
                            <small className="text-muted">{formatFileSize(documento.tamaño_bytes)}</small>
                          </div>
                          <div className="mb-2">
                            <strong>Subido:</strong>
                            <br />
                            <small className="text-muted">
                              {new Date(documento.created_at).toLocaleDateString('es-AR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </small>
                          </div>
                        </Card.Body>
                        <Card.Footer className="d-flex justify-content-between">
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleDescargarDocumento(documento.id, documento.nombre_original)}
                            >
                              <FaFile className="me-1" />
                              Descargar
                            </Button>
                            <Button
                              size="sm"
                              variant="warning"
                              onClick={() => handleActualizarDocumento(documento)}
                            >
                              <FaEdit className="me-1" />
                              Actualizar
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handlePreviewDocumento(documento.id, documento.tipo_mime)}
                          >
                            <FaEye className="me-1" />
                            Ver
                          </Button>
                        </Card.Footer>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="success" 
            onClick={() => setModalCargaDocumentos(true)}
          >
            <FaPlus className="me-1" />
            Cargar Documentos
          </Button>
          <Button variant="secondary" onClick={() => setModalDocumentos(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para actualizar documento */}
      <Modal show={modalActualizarDoc} onHide={handleCancelarActualizacion} centered>
        <Modal.Header closeButton>
          <Modal.Title>Actualizar Documento</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitActualizacion}>
          <Modal.Body>
            {documentoActualizar && (
              <div className="mb-3">
                <div className="alert alert-info">
                  <strong>Documento actual:</strong> {documentoActualizar.nombre_original}
                  <br />
                  <small className="text-muted">
                    Tipo: {formatTipoDocumento(documentoActualizar.tipo_documento)}
                  </small>
                </div>
              </div>
            )}

            <div className="mb-3">
              <Form.Label>Nuevo archivo *</Form.Label>
              <Form.Control
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                required
              />
              <Form.Text className="text-muted">
                Formatos admitidos: PDF, JPG, PNG. Máximo 10MB.
              </Form.Text>
            </div>

            <div className="mb-3">
              <Form.Label>Motivo de la actualización *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={motivoActualizacion}
                onChange={(e) => setMotivoActualizacion(e.target.value)}
                placeholder="Ej: Documento ilegible, información incompleta, etc."
                required
              />
            </div>

            {nuevoArchivo && (
              <div className="alert alert-success">
                <strong>Archivo seleccionado:</strong> {nuevoArchivo.name}
                <br />
                <small>Tamaño: {(nuevoArchivo.size / 1024 / 1024).toFixed(2)} MB</small>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleCancelarActualizacion}
              disabled={loadingActualizar}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="warning"
              disabled={loadingActualizar}
            >
              {loadingActualizar ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Actualizando...
                </>
              ) : (
                <>
                  <FaEdit className="me-1" />
                  Actualizar Documento
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ✅ NUEVO: Modal para cargar múltiples documentos */}
      <CargaDocumentosModal 
        polizaId={polizaSeleccionada?.id}
        userRole="vendedor"
        onDocumentosActualizados={handleDocumentosActualizados}
        show={modalCargaDocumentos}
        onHide={() => setModalCargaDocumentos(false)}
      />

      {/* ✅ NUEVO: Modal para editar póliza */}
      <EditarPolizaModal
        show={showEditarPolizaModal}
        onHide={() => {
          setShowEditarPolizaModal(false);
          setPolizaEditando(null);
        }}
        poliza={polizaEditando}
        onActualizar={handleActualizarPoliza}
      />

      <DocumentPreviewModal
        show={showPreview}
        onHide={() => {
          setShowPreview(false);
          if (previewUrl) window.URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }}
        previewUrl={previewUrl}
        previewMime={previewMime}
        documentName="Documento de Póliza"
        onDownload={() => {
          if (previewUrl) {
            // Crear un enlace temporal para descargar
            const link = document.createElement('a');
            link.href = previewUrl;
            link.download = `documento_${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }}
      />

      {/* ✅ AGREGAR: Chat Vendedor */}
      {/* <ChatVendedor /> */}

      {/* ✅ NUEVO: WhatsApp Chat Component */}
      {showWhatsAppChat && chatProspecto && (
        <WhatsAppChat
          show={showWhatsAppChat}
          onHide={handleCerrarChatWhatsApp}
          prospecto={chatProspecto}
          tipo="prospecto"
        />
      )}

      {/* ✅ AGREGAR: Manual de Usuario */}
      <ManualWidget userRole="vendedor" />
    </div>
  );
};

// 🎮 GAMING: Componente memoizado para métricas (completamente optimizado contra flickering)
const GamingMetrics = memo(({
  gamingStats,
  metricsVisible,
  setMetricsVisible,
  getStatClass,
  getMensajeMotivacional
}) => {
  // Memoizar valores que se usan en el render para evitar recálculos
  const experiencePercentage = useMemo(() =>
    (gamingStats.experiencia / gamingStats.experienciaParaSiguienteNivel) * 100
    , [gamingStats.experiencia, gamingStats.experienciaParaSiguienteNivel]);

  const recentAchievements = useMemo(() =>
    gamingStats.logrosDesbloqueados.slice(-3)
    , [gamingStats.logrosDesbloqueados]);

  const motivationalMessage = useMemo(() =>
    getMensajeMotivacional(gamingStats)
    , [gamingStats.nivel, gamingStats.ventasHoy, getMensajeMotivacional]);

  // 🛡️ Memoizar clases CSS para evitar recálculos por Service Worker
  const ventasHoyClass = useMemo(() => getStatClass(gamingStats.ventasHoy, 'ventas'), [gamingStats.ventasHoy]);
  const ventasSemanaClass = useMemo(() => getStatClass(gamingStats.ventasSemana, 'ventas'), [gamingStats.ventasSemana]);
  const ventasMesClass = useMemo(() => getStatClass(gamingStats.ventasMes, 'ventas'), [gamingStats.ventasMes]);
  const streakClass = useMemo(() => getStatClass(gamingStats.streakActual, 'streak'), [gamingStats.streakActual]);

  if (!metricsVisible) {
    return (
      <Container fluid className="py-1">
        <div className="text-center">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setMetricsVisible(true)}
            className="rounded-pill"
          >
            🎮 Mostrar Panel Gaming
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-2">
      <Card className="gaming-metrics-card gaming-metrics-stable shadow-sm border-0 mb-3" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Card.Header className="border-0 d-flex justify-content-between align-items-center" style={{ background: 'transparent' }}>
          <div className="d-flex align-items-center">
            <h5 className="mb-0 text-white">
              🎮 Panel de Vendedor - Nivel <span className="stat-number-stable">{gamingStats.nivel}</span>
            </h5>
          </div>
          <Button
            variant="outline-light"
            size="sm"
            onClick={() => setMetricsVisible(false)}
            style={{ opacity: 0.8 }}
          >
            ✕
          </Button>
        </Card.Header>
        <Card.Body className="pb-2">
          <Row className="g-3">
            {/* Barra de Experiencia */}
            <Col xs={12}>
              <div className="mb-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small className="text-light opacity-75">Experiencia</small>
                  <small className="text-light opacity-75">
                    <span className="stat-number-stable">{gamingStats.experiencia}</span> / <span className="stat-number-stable">{gamingStats.experienciaParaSiguienteNivel}</span> XP
                  </small>
                </div>
                <ProgressBar
                  now={experiencePercentage}
                  style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.2)' }}
                  className="rounded-pill experience-bar"
                >
                  <ProgressBar
                    now={experiencePercentage}
                    style={{
                      backgroundColor: '#ffd700',
                      background: 'linear-gradient(90deg, #ffd700, #ffed4e)',
                      transition: 'none' // Eliminar transición para evitar flickering
                    }}
                  />
                </ProgressBar>
              </div>
            </Col>

            {/* Estadísticas de Ventas */}
            <Col md={3} xs={6}>
              <div className="text-center gaming-stat">
                <div className="stat-icon mb-1">🎯</div>
                <div className={`${ventasHoyClass} stat-number-stable`} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {gamingStats.ventasHoy}
                </div>
                <div className="stat-label" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  Ventas Hoy
                </div>
              </div>
            </Col>

            <Col md={3} xs={6}>
              <div className="text-center gaming-stat">
                <div className="stat-icon mb-1">📈</div>
                <div className={`${ventasSemanaClass} stat-number-stable`} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {gamingStats.ventasSemana}
                </div>
                <div className="stat-label" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  Esta Semana
                </div>
              </div>
            </Col>

            <Col md={3} xs={6}>
              <div className="text-center gaming-stat">
                <div className="stat-icon mb-1">🚀</div>
                <div className={`${ventasMesClass} stat-number-stable`} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {gamingStats.ventasMes}
                </div>
                <div className="stat-label" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  Este Mes
                </div>
              </div>
            </Col>

            <Col md={3} xs={6}>
              <div className="text-center gaming-stat">
                <div className="stat-icon mb-1">🔥</div>
                <div className={`${streakClass} stat-number-stable`} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {gamingStats.streakActual}
                </div>
                <div className="stat-label" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  Racha Actual
                </div>
              </div>
            </Col>
          </Row>

          {/* Logros Recientes */}
          {recentAchievements.length > 0 && (
            <Row className="mt-3">
              <Col xs={12}>
                <div className="d-flex align-items-center mb-2">
                  <h6 className="mb-0 text-white me-3">🏆 Logros Desbloqueados</h6>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {recentAchievements.map((logro) => (
                    <Badge
                      key={logro.id}
                      bg="warning"
                      text="dark"
                      className="px-2 py-1"
                      style={{
                        fontSize: '0.75rem',
                        background: 'linear-gradient(45deg, #ffd700, #ffed4e) !important'
                      }}
                      title={logro.descripcion}
                    >
                      {logro.titulo}
                    </Badge>
                  ))}
                  {gamingStats.logrosDesbloqueados.length > 3 && (
                    <Badge bg="secondary" className="px-2 py-1" style={{ fontSize: '0.75rem' }}>
                      +{gamingStats.logrosDesbloqueados.length - 3} más
                    </Badge>
                  )}
                </div>
              </Col>
            </Row>
          )}

          {/* Mensaje Motivacional */}
          <Row className="mt-3">
            <Col xs={12}>
              <div className="text-center p-2 rounded motivational-message" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <small className="text-light">
                  {motivationalMessage}
                </small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}, (prevProps, nextProps) => {
  // 🛡️ Comparación profunda personalizada para evitar re-renders del Service Worker
  return (
    prevProps.metricsVisible === nextProps.metricsVisible &&
    prevProps.gamingStats.nivel === nextProps.gamingStats.nivel &&
    prevProps.gamingStats.experiencia === nextProps.gamingStats.experiencia &&
    prevProps.gamingStats.ventasHoy === nextProps.gamingStats.ventasHoy &&
    prevProps.gamingStats.ventasSemana === nextProps.gamingStats.ventasSemana &&
    prevProps.gamingStats.ventasMes === nextProps.gamingStats.ventasMes &&
    prevProps.gamingStats.streakActual === nextProps.gamingStats.streakActual &&
    prevProps.gamingStats.logrosDesbloqueados.length === nextProps.gamingStats.logrosDesbloqueados.length
  );
});

export default ProspectosDashboard;