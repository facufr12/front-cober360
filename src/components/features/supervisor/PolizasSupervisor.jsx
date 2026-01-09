import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Badge, Spinner, ButtonGroup, Modal, Alert, Tab, Tabs } from "react-bootstrap";
import { FaEye, FaDownload, FaWhatsapp, FaFilter, FaList, FaThLarge, FaFileAlt, FaUsers, FaMoneyBillWave, FaChartLine, FaFile, FaTrash, FaTimes, FaEdit, FaTimesCircle, FaCheckCircle, FaHourglassHalf, FaCoins, FaCalendarAlt, FaSearch, FaHistory, FaUser, FaComments, FaInfoCircle, FaExchangeAlt } from "react-icons/fa";
import axios from "axios";
import Swal from "sweetalert2";
import { API_URL } from "../../config";
import ModalExportacion from "../../common/ModalExportacion";
import DocumentPreviewModal from "../../common/DocumentPreviewModal";
import CargaMultipleDocumentos from "../../supervisor/CargaMultipleDocumentos";

const PolizasSupervisor = ({ context = 'supervisor' }) => {
  // Determinar la URL base según el contexto
  const getBaseUrl = () => {
    return context === 'backoffice' ? `${API_URL}/backoffice/polizas` : `${API_URL}/supervisor/polizas`;
  };
  const [polizas, setPolizas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    periodo_descripcion: '',
    resumen: {},
    metricas_calculadas: {}
  });
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    vendedor_id: 'todos',
    plan: 'todos',
    desde: '',
    hasta: '',
    buscar: '',
    orden: 'mas_nuevos'
  });
  const [tipoVista, setTipoVista] = useState('tabla');
  const [paginacion, setPaginacion] = useState({
    current_page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0
  });
  const [opcionesFiltro, setOpcionesFiltro] = useState({
    vendedores: [],
    planes: [],
    estados: []
  });
  const [showFiltros, setShowFiltros] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [modalDocumentos, setModalDocumentos] = useState(false);
  const [polizaSeleccionada, setPolizaSeleccionada] = useState(null);
  const [documentos, setDocumentos] = useState({});
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewMime, setPreviewMime] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // ✅ NUEVOS ESTADOS PARA ACTUALIZAR DOCUMENTOS
  const [modalActualizarDoc, setModalActualizarDoc] = useState(false);
  const [documentoActualizar, setDocumentoActualizar] = useState(null);
  const [archivoNuevo, setArchivoNuevo] = useState(null);
  const [loadingActualizacion, setLoadingActualizacion] = useState(false);

  // ✅ AGREGAR ESTADOS ADICIONALES
  const [modalCambiarEstado, setModalCambiarEstado] = useState(false);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
  const [motivoCambio, setMotivoCambio] = useState('');
  const [polizaCambioEstado, setPolizaCambioEstado] = useState(null);
  const [loadingCambioEstado, setLoadingCambioEstado] = useState(false);

  // ✅ NUEVOS ESTADOS PARA EDICIÓN
  const [modalEditarPoliza, setModalEditarPoliza] = useState(false);
  const [polizaEdicion, setPolizaEdicion] = useState(null);
  const [loadingEdicion, setLoadingEdicion] = useState(false);

  // ✅ NUEVOS ESTADOS PARA FILTRO DE MES
  const [filtroMes, setFiltroMes] = useState({ 
    periodo: 'mes', 
    mes: '', 
    anio: '' 
  });
  const [mesesDisponibles, setMesesDisponibles] = useState([]);
  const [loadingMeses, setLoadingMeses] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [motivoEdicion, setMotivoEdicion] = useState('');
  const [showModalExportacion, setShowModalExportacion] = useState(false); // ✅ AGREGAR

  // ✅ NUEVOS ESTADOS PARA CONVERSACIONES WHATSAPP
  const [modalConversaciones, setModalConversaciones] = useState(false);
  const [conversacionesProspecto, setConversacionesProspecto] = useState([]);
  const [prospectoSeleccionado, setProspectoSeleccionado] = useState(null);
  const [loadingConversaciones, setLoadingConversaciones] = useState(false);

  // ✅ NUEVOS ESTADOS PARA CARGA DE DOCUMENTOS
  const [modalCargaDocumentos, setModalCargaDocumentos] = useState(false);
  const [polizaCargaDocumentos, setPolizaCargaDocumentos] = useState(null);

  // ✅ NUEVOS ESTADOS PARA HISTORIAL DE ESTADOS Y COMENTARIOS
  const [modalHistorial, setModalHistorial] = useState(false);
  const [historialEstados, setHistorialEstados] = useState([]);
  const [polizaHistorial, setPolizaHistorial] = useState(null);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    fetchPolizas();
    fetchOpcionesFiltro();
    fetchEstadisticas();
    fetchMesesDisponibles();
  }, []);

  // Recargar cuando cambien los filtros
  useEffect(() => {
    fetchPolizas();
  }, [filtros, paginacion.current_page]);

  // Recargar estadísticas cuando cambie el filtro de mes
  useEffect(() => {
    if (filtroMes.periodo || (filtroMes.mes && filtroMes.anio)) {
      fetchEstadisticas();
    }
  }, [filtroMes]);

  const fetchPolizas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const params = new URLSearchParams({
        page: paginacion.current_page,
        limit: paginacion.per_page,
        ...filtros
      });

      const { data } = await axios.get(
        `${getBaseUrl()}?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPolizas(data.data);
      setPaginacion(prev => ({
        ...prev,
        ...data.pagination
      }));

    } catch (error) {
      console.error("Error cargando pólizas:", error);
      Swal.fire("Error", "No se pudieron cargar las pólizas", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchEstadisticas = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem("token");
      
      // Construir parámetros de consulta para filtro de mes
      const params = new URLSearchParams();
      params.append('periodo', filtroMes.periodo);
      
      if (filtroMes.mes && filtroMes.anio) {
        params.append('mes', filtroMes.mes);
        params.append('anio', filtroMes.anio);
      }

      const { data } = await axios.get(
        `${getBaseUrl()}/estadisticas?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEstadisticas(data.data);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchOpcionesFiltro = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${getBaseUrl()}/filtros`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOpcionesFiltro(data.data);
    } catch (error) {
      console.error("Error cargando opciones de filtro:", error);
    }
  };

  const fetchMesesDisponibles = async () => {
    try {
      setLoadingMeses(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${getBaseUrl()}/estadisticas/meses`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMesesDisponibles(data.data);
    } catch (error) {
      console.error("Error cargando meses disponibles:", error);
    } finally {
      setLoadingMeses(false);
    }
  };

  const handleFiltroMesChange = (campo, valor) => {
    setFiltroMes(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const aplicarFiltroMes = () => {
    fetchEstadisticas();
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
    setPaginacion(prev => ({ ...prev, current_page: 1 }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      estado: 'todos',
      vendedor_id: 'todos',
      plan: 'todos',
      desde: '',
      hasta: '',
      buscar: '',
      orden: 'mas_nuevos'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount || 0);
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  // ✅ ESTADOS DE PÓLIZA ACTUALIZADOS
  const getEstadoBadge = (estado) => {
    const estados = {
      'asesor': { bg: 'info', text: 'Asesor' },
      'supervisor': { bg: 'warning', text: 'Supervisor' },
      'back_office': { bg: 'primary', text: 'Back Office' },
      'venta_cerrada': { bg: 'success', text: 'Venta Cerrada' },
      // Estados legacy para compatibilidad
      'pendiente_revision': { bg: 'info', text: 'Asesor' },
      'cerrada': { bg: 'success', text: 'Venta Cerrada' }
    };
    return estados[estado] || { bg: 'secondary', text: estado };
  };

  const handleDescargarPDF = (poliza) => {
    // ✅ Usar el mismo método que el vendedor con pdf_hash
    if (poliza.pdf_hash) {
      window.open(`${API_URL}/polizas/pdf/${poliza.pdf_hash}`, '_blank');
    } else {
      // Fallback al método anterior si no hay pdf_hash
      window.open(poliza.urls?.pdf || '#', '_blank');
    }
  };

  const handleEnviarWhatsApp = async (poliza) => {
    try {
      if (!poliza.prospecto?.id) {
        Swal.fire("Error", "No se encontró información del prospecto", "error");
        return;
      }

      setProspectoSeleccionado(poliza.prospecto);
      setLoadingConversaciones(true);
      setModalConversaciones(true);

      // Obtener conversaciones del prospecto
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${API_URL}/supervisor/chat/conversaciones/prospecto/${poliza.prospecto.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setConversacionesProspecto(data.data.conversaciones);
      } else {
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

  // ✅ FUNCIONES PARA MANEJAR CONVERSACIONES WHATSAPP
  const handleVerConversacion = (conversacion) => {
    // Aquí puedes abrir el chat completo o redirigir al detalle
    console.log('Ver conversación:', conversacion);
    // Ejemplo: window.open(`/chat/${conversacion.id}`, '_blank');
  };

  const handleNuevaConversacion = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Crear nueva conversación con el prospecto
      const { data } = await axios.post(
        `${API_URL}/supervisor/chat/conversaciones`,
        {
          prospecto_id: prospectoSeleccionado.id,
          tipo_origen: 'manual'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        Swal.fire("Éxito", "Nueva conversación creada", "success");
        // Recargar conversaciones
        handleEnviarWhatsApp({ prospecto: prospectoSeleccionado });
      }

    } catch (error) {
      console.error("Error creando conversación:", error);
      Swal.fire("Error", "No se pudo crear la conversación", "error");
    }
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
      'activa': { color: 'success', texto: 'Activa' },
      'pausada': { color: 'warning', texto: 'Pausada' },
      'cerrada': { color: 'secondary', texto: 'Cerrada' },
      'finalizada': { color: 'dark', texto: 'Finalizada' }
    };
    return estados[estado] || { color: 'secondary', texto: estado };
  };

  const getTipoOrigen = (tipo) => {
    const tipos = {
      'cotizacion': { icon: '📋', texto: 'Cotización' },
      'poliza': { icon: '📄', texto: 'Póliza' },
      'manual': { icon: '✍️', texto: 'Manual' },
      'webhook': { icon: '🔔', texto: 'Automático' }
    };
    return tipos[tipo] || { icon: '❓', texto: tipo };
  };

  const handleVerDocumentos = async (poliza) => {
    try {
      setLoadingDocumentos(true);
      setPolizaSeleccionada(poliza);
      setModalDocumentos(true);

      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${getBaseUrl()}/${poliza.id}/documentos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDocumentos(data.documentos || {});
    } catch (error) {
      console.error("Error cargando documentos:", error);
      Swal.fire("Error", "No se pudieron cargar los documentos", "error");
    } finally {
      setLoadingDocumentos(false);
    }
  };

  const handleDescargarDocumento = async (documentoId, nombreOriginal) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/supervisor/polizas/documentos/${documentoId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Crear URL para descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nombreOriginal);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error descargando documento:", error);
      Swal.fire("Error", "No se pudo descargar el documento", "error");
    }
  };

  const handleEliminarDocumento = async (documentoId) => {
    try {
      const result = await Swal.fire({
        title: '¿Eliminar documento?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        await axios.delete(
          `${API_URL}/supervisor/polizas/documentos/${documentoId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Recargar documentos
        await handleVerDocumentos(polizaSeleccionada);

        Swal.fire("Eliminado", "Documento eliminado correctamente", "success");
      }
    } catch (error) {
      console.error("Error eliminando documento:", error);
      Swal.fire("Error", "No se pudo eliminar el documento", "error");
    }
  };

  const handlePreviewDocumento = async (documentoId, tipoMime) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/supervisor/polizas/documentos/${documentoId}/preview`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data], { type: tipoMime }));
      setPreviewUrl(url);
      setPreviewMime(tipoMime);
      setShowPreview(true);
    } catch (error) {
      Swal.fire("Error", "No se pudo previsualizar el documento", "error");
    }
  };

  // ✅ NUEVA FUNCIÓN: Abrir modal para actualizar documento
  const handleActualizarDocumento = (documento) => {
    setDocumentoActualizar(documento);
    setArchivoNuevo(null);
    setModalActualizarDoc(true);
  };

  // ✅ NUEVA FUNCIÓN: Confirmar actualización de documento
  const confirmarActualizacionDocumento = async () => {
    if (!archivoNuevo || !documentoActualizar) {
      Swal.fire("Error", "Debe seleccionar un archivo", "error");
      return;
    }

    setLoadingActualizacion(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('documento', archivoNuevo);
      formData.append('motivo_actualizacion', 'Documento actualizado por supervisor');

      const response = await axios.put(
        `${API_URL}/supervisor/polizas/documentos/${documentoActualizar.id}/actualizar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        Swal.fire("Éxito", "Documento actualizado correctamente", "success");
        setModalActualizarDoc(false);
        setDocumentoActualizar(null);
        setArchivoNuevo(null);
        // Recargar documentos
        await handleVerDocumentos(polizaSeleccionada);
      } else {
        throw new Error(response.data.message || 'Error actualizando documento');
      }
    } catch (error) {
      console.error("Error actualizando documento:", error);
      Swal.fire("Error", error.response?.data?.message || "No se pudo actualizar el documento", "error");
    } finally {
      setLoadingActualizacion(false);
    }
  };

  // FUNCIÓN AUXILIAR: Formatear tipo de documento
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
      'dni_titular': 'DNI Titular',
      'dni_conyuge': 'DNI Cónyuge',
      'dni_hijo': 'DNI Hijo/a',
      'recibo_sueldo': 'Recibo de Sueldo',
      'monotributo': 'Monotributo',
      'dni_frente': 'DNI Frente',
      'dni_dorso': 'DNI Dorso',
      'poliza_firmada': 'Póliza Firmada',
      'auditoria_medica': 'Auditoría Médica',
      'documento_identidad_adicional': 'Documento de Identidad Adicional',
      'constancia_ingresos': 'Constancia de Ingresos',
      'autorizacion_debito': 'Autorización de Débito',
      'otros': 'Otros'
    };
    return tipos[tipo] || tipo;
  };

  // FUNCIÓN AUXILIAR: Formatear tamaño de archivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ✅ NUEVAS FUNCIONES: Carga de documentos desde modal de documentos
  const handleAbrirCargaDocumentos = (poliza) => {
    setPolizaCargaDocumentos(poliza);
    setModalCargaDocumentos(true);
  };

  // ✅ NUEVA FUNCIÓN: Ver historial de estados y comentarios
  const handleVerHistorial = async (poliza) => {
    try {
      setPolizaHistorial(poliza);
      setModalHistorial(true);
      setLoadingHistorial(true);

      const token = localStorage.getItem('token');
      const response = await axios.get(`${getBaseUrl()}/${poliza.id}/historial`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setHistorialEstados(response.data.data || []);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
      Swal.fire('Error', 'No se pudo cargar el historial de estados', 'error');
      setHistorialEstados([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handleCerrarCargaDocumentos = () => {
    setModalCargaDocumentos(false);
    setPolizaCargaDocumentos(null);
  };

  const handleDocumentosActualizados = async () => {
    // Recargar los documentos de la póliza actual
    if (polizaSeleccionada) {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          `${getBaseUrl()}/${polizaSeleccionada.id}/documentos`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDocumentos(data.documentos || {});
        
        // Mostrar mensaje de éxito
        Swal.fire("Éxito", "Documentos cargados correctamente", "success");
      } catch (error) {
        console.error("Error recargando documentos:", error);
      }
    }
    
    // Cerrar modal de carga
    handleCerrarCargaDocumentos();
  };

  // ✅ AGREGAR esta función antes del return del componente
  const formatearPregunta = (key) => {
    const preguntas = {
      'internacion': '¿Ha tenido internaciones en los últimos 5 años?',
      'internacion_colegiales': '¿Ha tenido internaciones en colegiales médicos?',
      'cirugia': '¿Ha tenido cirugías?',
      'secuelas': '¿Tiene secuelas de accidentes o enfermedades?',
      'accidentes': '¿Ha tenido accidentes graves?',
      'transfusiones': '¿Ha recibido transfusiones de sangre?',
      'estudios_anuales': '¿Se realiza estudios médicos anuales?',
      'indicacion_medica': '¿Tiene indicación médica específica?',
      'psicologico': '¿Ha recibido tratamiento psicológico?',
      'psiquiatrico': '¿Ha recibido tratamiento psiquiátrico?',
      'internacion_mental': '¿Ha tenido internación en institución de salud mental?',
      'diabetes': '¿Padece diabetes?',
      'auditivas': '¿Tiene problemas auditivos?',
      'vista': '¿Tiene problemas de vista?',
      'lentes': '¿Usa lentes o anteojos?',
      'glaucoma': '¿Padece glaucoma?',
      'alergias': '¿Tiene alergias conocidas?',
      'infarto': '¿Ha tenido infarto?',
      'test_embarazo': '¿Se ha realizado test de embarazo recientemente?',
      'sintomas_embarazo': '¿Presenta síntomas de embarazo?',
      'embarazo_actual': '¿Está embarazada actualmente?',
      'aborto': '¿Ha tenido abortos?',
      'partos': '¿Ha tenido partos?',
      'columna': '¿Tiene problemas de columna?',
      'protesis': '¿Usa prótesis?',
      'deporte': '¿Practica deportes regularmente?',
      'deporte_riesgo': '¿Practica deportes de riesgo?',
      'indicacion_protesis': '¿Tiene indicación de prótesis?',
      'neurologicas': '¿Tiene enfermedades neurológicas?',
      'epilepsia': '¿Padece epilepsia?',
      'perdida_conocimiento': '¿Ha tenido pérdidas de conocimiento?',
      'mareos': '¿Sufre mareos frecuentes?',
      'paralisis': '¿Ha tenido parálisis?',
      'cardiacas': '¿Tiene enfermedades cardíacas?',
      'arritmias': '¿Tiene arritmias?',
      'presion': '¿Tiene problemas de presión arterial?',
      'respiratorias': '¿Tiene enfermedades respiratorias?',
      'tuberculosis': '¿Ha tenido tuberculosis?',
      'fiebre_reumatica': '¿Ha tenido fiebre reumática?',
      'hepatitis': '¿Ha tenido hepatitis?',
      'colicos': '¿Sufre cólicos frecuentes?',
      'infecciones_urinarias': '¿Tiene infecciones urinarias recurrentes?',
      'anemia': '¿Padece anemia?',
      'transmision_sexual': '¿Ha tenido enfermedades de transmisión sexual?',
      'infecciosas': '¿Ha tenido enfermedades infecciosas?',
      'tumores': '¿Ha tenido tumores?',
      'tiroides': '¿Tiene problemas de tiroides?',
      'gastritis': '¿Padece gastritis?',
      'alcohol': '¿Consume alcohol regularmente?',
      'drogas': '¿Consume drogas?',
      'oncologico': '¿Ha tenido tratamiento oncológico?',
      'tabaco': '¿Fuma tabaco?',
      'peso': '¿Tiene problemas de peso?',
      'diagnostico_reciente': '¿Ha recibido algún diagnóstico médico reciente?',
      'discapacidad': '¿Tiene alguna discapacidad?'
    };

    return preguntas[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };




  const renderEstadisticas = () => (
    <>
      {/* Filtros de período para estadísticas */}
      <Row className="mb-3">
        <Col xs={12}>
          <Card className="border-info">
            <Card.Header className="bg-light py-2">
              <h6 className="mb-0 text-info">
                <FaCalendarAlt className="me-2" />
                Filtro de Período - Estadísticas
              </h6>
            </Card.Header>
            <Card.Body className="py-2">
              <Row className="align-items-end">
                <Col xs={12} sm={6} md={3} className="mb-2">
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Período</Form.Label>
                    <Form.Select
                      size="sm"
                      value={filtroMes.periodo}
                      onChange={(e) => handleFiltroMesChange('periodo', e.target.value)}
                    >
                      <option value="dia">Hoy</option>
                      <option value="semana">Esta semana</option>
                      <option value="mes">Este mes</option>
                      <option value="año">Este año</option>
                      <option value="todos">Todos los períodos</option>
                      <option value="personalizado">Personalizado</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                {filtroMes.periodo === 'personalizado' && (
                  <>
                    <Col xs={12} sm={6} md={3} className="mb-2">
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Mes/Año</Form.Label>
                        <Form.Select
                          size="sm"
                          value={`${filtroMes.anio}-${filtroMes.mes.toString().padStart(2, '0')}`}
                          onChange={(e) => {
                            const [anio, mes] = e.target.value.split('-');
                            handleFiltroMesChange('anio', anio);
                            handleFiltroMesChange('mes', parseInt(mes));
                          }}
                        >
                          <option value="">Seleccionar período</option>
                          {mesesDisponibles.map(mesData => (
                            <option key={mesData.value} value={mesData.value}>
                              {mesData.label} ({mesData.total_polizas} pólizas)
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={2} className="mb-2">
                      <Button
                        size="sm"
                        variant="info"
                        onClick={aplicarFiltroMes}
                        disabled={loadingStats || (!filtroMes.mes || !filtroMes.anio)}
                      >
                        <FaSearch className="me-1" />
                        Aplicar
                      </Button>
                    </Col>
                  </>
                )}
                <Col xs={12} md={4} className="mb-2">
                  <div className="text-end">
                    {!loadingStats && (
                      <Badge bg="secondary" className="px-2 py-1">
                        {estadisticas.periodo_descripcion || 'Este mes'}
                      </Badge>
                    )}
                    {loadingStats && (
                      <>
                        <Badge bg="info" className="px-2 py-1">
                          <Spinner size="sm" className="me-1" />
                          Cargando estadísticas...
                        </Badge>
                      </>
                    )}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Primera fila - Métricas principales */}
      <Row className="mb-4">
        <Col xs={12} sm={6} lg={4} className="mb-3 mb-lg-0">
          <Card className="text-center h-100 shadow-sm">
            <Card.Body className="py-3">
              <FaFileAlt className="text-primary mb-2" size={20} />
              <h5 className="fw-bold mb-1">{estadisticas.resumen?.total_polizas || 0}</h5>
              <small className="text-muted">Total Pólizas</small>
              {estadisticas.resumen?.poliza_promedio_dia && (
                <div className="mt-1">
                  <small className="text-info">
                    ~{estadisticas.resumen.poliza_promedio_dia}/día
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={4} className="mb-3 mb-lg-0">
          <Card className="text-center h-100 shadow-sm">
            <Card.Body className="py-3">
              <FaHourglassHalf className="text-warning mb-2" size={20} />
              <h5 className="fw-bold mb-1">{estadisticas.resumen?.polizas_en_proceso || 0}</h5>
              <small className="text-muted">En Proceso</small>
              <div className="mt-1">
                <small className="text-muted">
                  Firmadas: {estadisticas.resumen?.polizas_firmadas || 0}
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={4} className="mb-3 mb-lg-0">
          <Card className="text-center h-100 shadow-sm">
            <Card.Body className="py-3">
              <FaCheckCircle className="text-success mb-2" size={20} />
              <h5 className="fw-bold mb-1">{estadisticas.resumen?.polizas_finalizadas || 0}</h5>
              <small className="text-muted">Finalizadas</small>
              {estadisticas.metricas_calculadas?.finalization_rate && (
                <div className="mt-1">
                  <small className="text-success">
                    {estadisticas.metricas_calculadas.finalization_rate} del total
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Segunda fila - Métricas financieras */}
      {/* <Row className="mb-4">
        <Col xs={12} className="d-flex justify-content-center">
          <Card className="text-center shadow-sm" style={{ minWidth: '250px' }}>
            <Card.Body className="py-3">
              <FaMoneyBillWave className="text-success mb-2" size={20} />
              <h6 className="fw-bold mb-1">
                {estadisticas.metricas_calculadas?.facturacion_total_formateada || '$0'}
              </h6>
              <small className="text-muted">Facturación Total</small>
            </Card.Body>
          </Card>
        </Col>
      </Row> */}

      {/* Tercera fila - Distribución por estados (si hay datos) */}
      {estadisticas.distribucion_estados && estadisticas.distribucion_estados.length > 0 && (
        <Row className="mb-4">
          <Col xs={12}>
            <Card className="shadow-sm">
              <Card.Header>
                <h6 className="mb-0">📊 Distribución por Estados</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  {estadisticas.distribucion_estados.slice(0, 6).map((estado, index) => (
                    <Col xs={6} sm={4} md={3} lg={2} key={estado.estado} className="text-center mb-3">
                      <div className="border rounded p-2 h-100">
                        <h6 className="fw-bold">{estado.cantidad}</h6>
                        <small className="text-muted text-capitalize d-block" style={{ fontSize: '0.75rem' }}>
                          {estado.estado.replace('_', ' ')}
                        </small>
                        <div>
                          <small className="text-info">{estado.porcentaje}%</small>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );

  const renderFiltros = () => (
    <Card className="mb-4 shadow-sm">
      <Card.Header className="d-flex flex-column flex-md-row justify-content-between align-items-center">
        <h6 className="mb-2 mb-md-0">🔍 Filtros y Búsqueda</h6>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setShowFiltros(!showFiltros)}
        >
          <FaFilter /> {showFiltros ? 'Ocultar' : 'Mostrar'}
        </Button>
      </Card.Header>
      {showFiltros && (
        <Card.Body>
          <Row>
            <Col xs={12} sm={6} lg={3} className="mb-3">
              <Form.Group>
                <Form.Label className="small fw-semibold">Estado</Form.Label>
                <Form.Select
                  size="sm"
                  value={filtros.estado}
                  onChange={(e) => handleFiltroChange('estado', e.target.value)}
                >
                  <option value="todos">Todos</option>
                  <option value="asesor">Asesor</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="back_office">Back Office</option>
                  <option value="venta_cerrada">Venta Cerrada</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} lg={3} className="mb-3">
              <Form.Group>
                <Form.Label className="small fw-semibold">Vendedor</Form.Label>
                <Form.Select
                  size="sm"
                  value={filtros.vendedor_id}
                  onChange={(e) => handleFiltroChange('vendedor_id', e.target.value)}
                >
                  <option value="todos">Todos</option>
                  {opcionesFiltro.vendedores.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.first_name} {v.last_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} lg={2} className="mb-3">
              <Form.Group>
                <Form.Label className="small fw-semibold">Desde</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={filtros.desde}
                  onChange={(e) => handleFiltroChange('desde', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} lg={2} className="mb-3">
              <Form.Group>
                <Form.Label className="small fw-semibold">Hasta</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={filtros.hasta}
                  onChange={(e) => handleFiltroChange('hasta', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} lg={2} className="mb-3">
              <Form.Group>
                <Form.Label className="small fw-semibold">&nbsp;</Form.Label>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="w-100 d-block"
                  onClick={limpiarFiltros}
                >
                  Limpiar
                </Button>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col xs={12} md={6} className="mb-3">
              <Form.Group>
                <Form.Label className="small fw-semibold">Buscar</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Buscar por póliza, prospecto, vendedor..."
                  value={filtros.buscar}
                  onChange={(e) => handleFiltroChange('buscar', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={3} className="mb-3">
              <Form.Group>
                <Form.Label className="small fw-semibold">Plan</Form.Label>
                <Form.Select
                  size="sm"
                  value={filtros.plan}
                  onChange={(e) => handleFiltroChange('plan', e.target.value)}
                >
                  <option value="todos">Todos</option>
                  {opcionesFiltro.planes.map(plan => (
                    <option key={plan} value={plan}>{plan}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={3} className="mb-3">
              <Form.Group>
                <Form.Label className="small fw-semibold">Ordenar por</Form.Label>
                <Form.Select
                  size="sm"
                  value={filtros.orden || 'mas_nuevos'}
                  onChange={(e) => handleFiltroChange('orden', e.target.value)}
                >
                  <option value="mas_nuevos">📅 Más nuevos primero</option>
                  <option value="mas_antiguos">📅 Más antiguos primero</option>
                  <option value="alfabetico">🔤 A-Z por cliente</option>
                  <option value="alfabetico_desc">🔤 Z-A por cliente</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      )}
    </Card>
  );

  const renderTabla = () => (
    <Card className="shadow-sm">
      <Card.Header className="d-flex flex-column flex-md-row justify-content-between align-items-start align-md-center">
        <div className="mb-2 mb-md-0">
          <h6 className="mb-1">Pólizas ({paginacion.total})</h6>
          <small className="text-muted d-block">
            {filtros.orden === 'mas_nuevos' && '📅 Ordenadas: Más nuevas primero'}
            {filtros.orden === 'mas_antiguos' && '📅 Ordenadas: Más antiguas primero'}
            {filtros.orden === 'alfabetico' && '🔤 Ordenadas: A-Z por cliente'}
            {filtros.orden === 'alfabetico_desc' && '🔤 Ordenadas: Z-A por cliente'}
          </small>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-2">
          <ButtonGroup size="sm">
            <Button
              variant={tipoVista === 'tabla' ? 'primary' : 'outline-primary'}
              onClick={() => setTipoVista('tabla')}
            >
              <FaList className="d-inline d-sm-none" />
              <span className="d-none d-sm-inline">Tabla</span>
            </Button>
            <Button
              variant={tipoVista === 'tarjetas' ? 'primary' : 'outline-primary'}
              onClick={() => setTipoVista('tarjetas')}
            >
              <FaThLarge className="d-inline d-sm-none" />
              <span className="d-none d-sm-inline">Tarjetas</span>
            </Button>
          </ButtonGroup>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <p className="mt-2">Cargando pólizas...</p>
          </div>
        ) : polizas.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted">No se encontraron pólizas</p>
          </div>
        ) : tipoVista === 'tabla' ? (
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th className="text-nowrap">Póliza</th>
                <th className="text-nowrap">Prospecto</th>
                <th className="text-nowrap d-none d-md-table-cell">Plan</th>
                <th className="text-nowrap d-none d-lg-table-cell">Vendedor</th>
                <th className="text-nowrap">Estado</th>
                <th className="text-nowrap d-none d-sm-table-cell">Total</th>
                <th className="text-nowrap d-none d-md-table-cell">Fecha</th>
                <th className="text-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {polizas.map(poliza => {
                const estadoBadge = getEstadoBadge(poliza.estado);
                return (
                  <tr key={poliza.id}>
                    <td>
                      <div>
                        <strong>{poliza.numero_poliza_oficial || poliza.numero_poliza}</strong>
                        {poliza.numero_poliza_oficial && (
                          <>
                            <br />
                            <small className="text-muted">Sistema: {poliza.numero_poliza}</small>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{poliza.prospecto_nombre} {poliza.prospecto_apellido}</strong>
                        <br />
                        <small className="text-muted">{poliza.prospecto_telefono}</small>
                      </div>
                    </td>
                    <td className="d-none d-md-table-cell">
                      <div>
                        <span className="fw-bold">{poliza.plan_nombre}</span>
                        {poliza.anio_plan && (
                          <>
                            <br />
                            <small className="text-muted">Año {poliza.anio_plan}</small>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="d-none d-lg-table-cell">
                      <div>
                        <strong>{poliza.vendedor?.nombre} {poliza.vendedor?.apellido}</strong>
                        <br />
                        <small className="text-muted">{poliza.vendedor?.email}</small>
                      </div>
                    </td>
                    <td>
                      <Badge bg={estadoBadge.bg}>{estadoBadge.text}</Badge>
                    </td>
                    <td className="d-none d-sm-table-cell">
                      <strong className="text-success">
                        {formatCurrency(poliza.total_final)}
                      </strong>
                    </td>
                    <td className="d-none d-md-table-cell">{formatFecha(poliza.created_at)}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {/* ✅ AGREGAR BOTÓN DE EDITAR */}
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleEditarPoliza(poliza)}
                          title="Editar póliza"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => handleCambiarEstado(poliza)}
                          title="Cambiar estado"
                        >
                          <FaExchangeAlt />
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleVerHistorial(poliza)}
                          title="Ver historial de estados"
                        >
                          <FaHistory />
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleVerDocumentos(poliza)}
                          title="Ver documentos"
                        >
                          <FaFile />
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleDescargarPDF(poliza)}
                          title="Descargar PDF"
                          className="d-none d-sm-inline-block"
                        >
                          <FaDownload />
                        </Button>
                        {/* <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleEnviarWhatsApp(poliza)}
                          title="Enviar por WhatsApp"
                          className="d-none d-md-inline-block"
                        >
                          <FaWhatsapp />
                        </Button> */}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <Row className="p-3">
            {polizas.map(poliza => {
              const estadoBadge = getEstadoBadge(poliza.estado);
              return (
                <Col xs={12} sm={6} lg={4} xl={3} key={poliza.id} className="mb-3">
                  <Card className="h-100 shadow-sm">
                    <Card.Header className="pb-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1 text-truncate">{poliza.numero_poliza_oficial || poliza.numero_poliza}</h6>
                          {poliza.numero_poliza_oficial && (
                            <small className="text-muted d-block">Sistema: {poliza.numero_poliza}</small>
                          )}
                        </div>
                        <Badge bg={estadoBadge.bg}>{estadoBadge.text}</Badge>
                      </div>
                    </Card.Header>
                    <Card.Body className="py-2">
                      <h6 className="text-truncate mb-1">{poliza.prospecto_nombre} {poliza.prospecto_apellido}</h6>
                      <p className="text-muted small mb-1">
                        <strong>Plan:</strong> {poliza.plan_nombre}
                      </p>
                      <p className="text-muted small mb-1">
                        <strong>Vendedor:</strong> {poliza.vendedor?.nombre} {poliza.vendedor?.apellido}
                      </p>
                      <div className="d-flex justify-content-between align-items-center">
                        <strong className="text-success">{formatCurrency(poliza.total_final)}</strong>
                        <small className="text-muted">{formatFecha(poliza.created_at)}</small>
                      </div>
                    </Card.Body>
                    <Card.Footer className="pt-2">
                      <div className="d-flex gap-1 flex-wrap">
                        <Button size="sm" variant="outline-primary" onClick={() => handleVerDocumentos(poliza)}>
                          <FaEye />
                        </Button>
                        <Button size="sm" variant="outline-success" onClick={() => handleDescargarPDF(poliza)}>
                          <FaDownload />
                        </Button>
                        <Button size="sm" variant="outline-info" onClick={() => handleEnviarWhatsApp(poliza)}>
                          <FaWhatsapp />
                        </Button>
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card.Body>
    </Card>
  );

  // ✅ FUNCIÓN PARA CAMBIAR ESTADO
  const handleCambiarEstado = (poliza) => {
    setPolizaCambioEstado(poliza);
    setEstadoSeleccionado(poliza.estado);
    setMotivoCambio('');
    setModalCambiarEstado(true);
  };

  const confirmarCambioEstado = async () => {
    if (!estadoSeleccionado || !motivoCambio.trim()) {
      Swal.fire('Error', 'Debe seleccionar un estado y proporcionar un motivo', 'error');
      return;
    }

    // ✅ VALIDAR QUE NO SEA EL MISMO ESTADO
    if (estadoSeleccionado === polizaCambioEstado.estado) {
      Swal.fire('Error', 'El estado seleccionado es el mismo que el actual', 'warning');
      return;
    }

    try {
      setLoadingCambioEstado(true);
      const token = localStorage.getItem("token");

      // ✅ LOGS PARA DEBUG
      console.log('🔄 Enviando cambio de estado:', {
        poliza_id: polizaCambioEstado.id,
        estado_actual: polizaCambioEstado.estado,
        estado_nuevo: estadoSeleccionado,
        motivo: motivoCambio,
        url: `${getBaseUrl()}/${polizaCambioEstado.id}/estado`
      });

      const response = await axios.patch(
        `${getBaseUrl()}/${polizaCambioEstado.id}/estado`,
        {
          estado: estadoSeleccionado,
          motivo_cambio_estado: motivoCambio
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 segundos de timeout
        }
      );

      console.log('✅ Respuesta del servidor:', response.data);

      if (response.data.success) {
        setModalCambiarEstado(false);
        await fetchPolizas(); // Recargar lista

        Swal.fire({
          title: '¡Estado actualizado!',
          html: `
            <div class="text-center">
              <p><strong>Póliza:</strong> ${response.data.data.numero_poliza_oficial}</p>
              <p><strong>Cliente:</strong> ${response.data.data.prospecto}</p>
              <p><strong>Estado anterior:</strong> <span class="text-muted">${response.data.data.estado_anterior}</span></p>
              <p><strong>Estado nuevo:</strong> <span class="text-success">${response.data.data.estado_nuevo}</span></p>
              <p class="text-info">${response.data.data.mensaje}</p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Entendido'
        });
      }

    } catch (error) {
      console.error('❌ Error completo cambiando estado:', error);

      let errorMessage = 'Error de conexión con el servidor';
      let errorDetails = '';

      if (error.response) {
        // El servidor respondió con un error
        errorMessage = error.response.data?.error || 'Error del servidor';
        errorDetails = error.response.data?.razon || error.response.data?.message || '';

        console.error('Error del servidor:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        errorMessage = 'No se pudo conectar con el servidor';
        errorDetails = 'Verifique su conexión a internet';

        console.error('Error de red:', error.request);
      } else {
        // Error en la configuración de la petición
        errorMessage = 'Error configurando la petición';
        errorDetails = error.message;
      }

      Swal.fire({
        title: 'Error',
        html: `
          <div>
            <p><strong>${errorMessage}</strong></p>
            ${errorDetails ? `<p class="text-muted small">${errorDetails}</p>` : ''}
          </div>
        `,
        icon: 'error'
      });
    } finally {
      setLoadingCambioEstado(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Cargar póliza para edición
  const handleEditarPoliza = async (poliza) => {
    try {
      setLoadingEdicion(true);
      setModalEditarPoliza(true);

      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${getBaseUrl()}/${poliza.id}/editar`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPolizaEdicion(data.data);
      setMotivoEdicion('');

    } catch (error) {
      console.error("Error cargando póliza para edición:", error);
      Swal.fire("Error", "No se pudo cargar la póliza para edición", "error");
      setModalEditarPoliza(false);
    } finally {
      setLoadingEdicion(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Guardar cambios de la póliza
  const handleGuardarEdicion = async () => {
    if (!motivoEdicion.trim()) {
      Swal.fire("Error", "Debe proporcionar un motivo para la edición", "error");
      return;
    }

    try {
      setGuardandoEdicion(true);
      const token = localStorage.getItem("token");

      const datosActualizados = {
        datos_personales: polizaEdicion.datos_personales,
        integrantes: polizaEdicion.integrantes,
        documentos_titular: polizaEdicion.documentos_titular,
        documentos_integrantes: polizaEdicion.documentos_integrantes,
        referencias: polizaEdicion.referencias,
        declaracion_salud: polizaEdicion.declaracion_salud,
        cobertura_anterior: polizaEdicion.cobertura_anterior,
        datos_adicionales: polizaEdicion.datos_adicionales,
        observaciones: polizaEdicion.observaciones,
        terminos_aceptados: polizaEdicion.terminos_aceptados,

        // 🆕 AGREGAR LOS CAMPOS QUE FALTABAN
        informacion_afiliado: polizaEdicion.informacion_afiliado || {},
        informacion_facturacion: polizaEdicion.informacion_facturacion || {},
        solicitud_afiliacion: polizaEdicion.solicitud_afiliacion || {},
        datos_comerciales: polizaEdicion.datos_comerciales || {},
        motivo: motivoEdicion
      };

      console.log('📤 Datos que se envían al backend:', datosActualizados);
      console.log('📤 Número de afiliado específico:', datosActualizados.informacion_afiliado?.numero_afiliado_asignado);

      const response = await axios.put(
        `${getBaseUrl()}/${polizaEdicion.id}/actualizar`,
        datosActualizados,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setModalEditarPoliza(false);
        await fetchPolizas(); // Recargar lista

        Swal.fire({
          title: '¡Póliza actualizada!',
          html: `
            <div class="text-center">
              <p><strong>Póliza:</strong> ${response.data.data.numero_poliza_oficial}</p>
              <p class="text-success">Los datos han sido actualizados correctamente</p>
              <p class="small text-muted">Campos modificados: ${response.data.data.campos_actualizados.length}</p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Entendido'
        });
      }

    } catch (error) {
      console.error("Error guardando edición:", error);
      Swal.fire("Error", "No se pudo actualizar la póliza", "error");
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Handle de cambios en campos de edición
  // ✅ ACTUALIZAR handleCampoEdicion para soportar objetos anidados

  // ✅ ACTUALIZAR handleCampoEdicion (ya está en tu código, pero agregar soporte para objetos anidados)
  const handleCampoEdicion = (seccion, campo, valor, index = null) => {
    setPolizaEdicion(prev => {
      const nuevaPoliza = { ...prev };

      // Manejar campo especial observaciones
      if (seccion === 'observaciones') {
        nuevaPoliza.observaciones = valor;
        return nuevaPoliza;
      }

      // Manejar campo especial terminos_aceptados
      if (seccion === 'terminos_aceptados') {
        nuevaPoliza.terminos_aceptados = valor;
        return nuevaPoliza;
      }

      // Manejar campos de declaracion_salud con objetos anidados
      if (seccion === 'declaracion_salud') {
        if (!nuevaPoliza.declaracion_salud) {
          nuevaPoliza.declaracion_salud = {};
        }

        if (campo === 'respuestas') {
          nuevaPoliza.declaracion_salud.respuestas = valor;
        } else if (campo === 'coberturaAnterior') {
          nuevaPoliza.declaracion_salud.coberturaAnterior = valor;
        } else if (campo === 'medicacion') {
          nuevaPoliza.declaracion_salud.medicacion = valor;
        } else {
          nuevaPoliza.declaracion_salud[campo] = valor;
        }
        return nuevaPoliza;
      }

      // Manejar arrays normales
      if (index !== null && Array.isArray(nuevaPoliza[seccion])) {
        nuevaPoliza[seccion] = [...nuevaPoliza[seccion]];
        nuevaPoliza[seccion][index] = {
          ...nuevaPoliza[seccion][index],
          [campo]: valor
        };
      } else {
        // Para objetos simples
        if (!nuevaPoliza[seccion]) {
          nuevaPoliza[seccion] = {};
        }
        nuevaPoliza[seccion] = {
          ...nuevaPoliza[seccion],
          [campo]: valor
        };
      }

      return nuevaPoliza;
    });
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Dashboard de Pólizas</h2>
        <div className="d-flex gap-2">
          {/* <Button
            variant="success"
            onClick={() => setShowModalExportacion(true)}
            className="d-flex align-items-center"
          >
            <FaFile className="me-1" />
            <span className="d-none d-sm-inline">Exportar</span>
          </Button> */}
          <Button
            variant="primary"
            onClick={fetchEstadisticas}
            disabled={loadingStats}
          >
            {loadingStats ? <Spinner size="sm" /> : 'Actualizar'}
          </Button>
        </div>
      </div>

      {renderEstadisticas()}
      {renderFiltros()}
      
      {/* Separador visual entre filtros y tabla */}
      <div className="mb-4"></div>
      
      {renderTabla()}

      {/* Paginación */}
      {paginacion.total_pages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Button
            variant="outline-primary"
            disabled={paginacion.current_page === 1}
            onClick={() => setPaginacion(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
          >
            Anterior
          </Button>
          <span className="mx-3 align-self-center">
            Página {paginacion.current_page} de {paginacion.total_pages}
          </span>
          <Button
            variant="outline-primary"
            disabled={paginacion.current_page === paginacion.total_pages}
            onClick={() => setPaginacion(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* NUEVO MODAL: Documentos de la póliza */}
      <Modal show={modalDocumentos} onHide={() => setModalDocumentos(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Documentos de Póliza N° {polizaSeleccionada?.numero_poliza_oficial || polizaSeleccionada?.numero_poliza}
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
              {Object.keys(documentos).length === 0 ? (
                <div className="text-center text-muted py-4">
                  No hay documentos disponibles para esta póliza
                </div>
              ) : (
                Object.entries(documentos).map(([tipoDoc, docs]) => (
                  <div key={tipoDoc} className="mb-4">
                    <h5 className="border-bottom pb-2">{formatTipoDocumento(tipoDoc)}</h5>
                    <Row className="g-3">
                      {docs.map((documento) => (
                        <Col md={6} lg={4} key={documento.id}>
                          <Card className="h-100">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                {documento.integrante_index !== null && (
                                  <Badge bg="info" className="me-2">
                                    Integrante {documento.integrante_index + 1}
                                  </Badge>
                                )}
                                {formatFileSize(documento.tamaño_bytes)}
                              </small>
                            </Card.Header>
                            <Card.Body>
                              <div className="mb-2">
                                <strong>Archivo:</strong>
                                <br />
                                <small className="text-muted">{documento.nombre_original}</small>
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
                            <Card.Footer>
                              <ButtonGroup size="sm" className="w-100 mb-2">
                                <Button
                                  variant="primary"
                                  onClick={() => handleDescargarDocumento(documento.id, documento.nombre_original)}
                                  title="Descargar"
                                >
                                  <FaDownload />
                                </Button>
                                <Button
                                  variant="info"
                                  onClick={() => handlePreviewDocumento(documento.id, documento.tipo_mime)}
                                  title="Vista previa"
                                >
                                  <FaEye />
                                </Button>
                                <Button
                                  variant="warning"
                                  onClick={() => handleActualizarDocumento(documento)}
                                  title="Actualizar documento"
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="danger"
                                  onClick={() => handleEliminarDocumento(documento.id)}
                                  title="Eliminar"
                                >
                                  <FaTrash />
                                </Button>
                              </ButtonGroup>
                            </Card.Footer>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ))
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between w-100">
            <Button 
              variant="primary" 
              onClick={() => handleAbrirCargaDocumentos(polizaSeleccionada)}
              className="me-2"
            >
              <FaFile className="me-2" />
              Cargar Más Documentos
            </Button>
            <Button variant="secondary" onClick={() => setModalDocumentos(false)}>
              Cerrar
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* NUEVO MODAL: Preview de documento */}
      <DocumentPreviewModal
        show={showPreview}
        onHide={() => {
          setShowPreview(false);
          if (previewUrl) {
            window.URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }
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

      {/* ✅ NUEVO MODAL: Actualizar Documento */}
      <Modal show={modalActualizarDoc} onHide={() => setModalActualizarDoc(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Actualizar Documento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {documentoActualizar && (
            <>
              <Alert variant="info">
                <strong>Documento actual:</strong> {documentoActualizar.nombre_original}
                <br />
                <small className="text-muted">
                  Tipo: {formatTipoDocumento(documentoActualizar.tipo_documento)} | 
                  Tamaño: {formatFileSize(documentoActualizar.tamaño_bytes)}
                </small>
              </Alert>
              
              <Form.Group className="mb-3">
                <Form.Label>Seleccionar nuevo archivo</Form.Label>
                <Form.Control
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setArchivoNuevo(e.target.files[0])}
                />
                <Form.Text className="text-muted">
                  Formatos permitidos: PDF, JPG, PNG, DOC, DOCX (máximo 10MB)
                </Form.Text>
              </Form.Group>

              {archivoNuevo && (
                <Alert variant="success">
                  <strong>Archivo seleccionado:</strong> {archivoNuevo.name}
                  <br />
                  <small>Tamaño: {formatFileSize(archivoNuevo.size)}</small>
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setModalActualizarDoc(false)}
            disabled={loadingActualizacion}
          >
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={confirmarActualizacionDocumento}
            disabled={!archivoNuevo || loadingActualizacion}
          >
            {loadingActualizacion ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                Actualizando...
              </>
            ) : (
              'Actualizar Documento'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL: Cambiar Estado de Póliza */}
      <Modal show={modalCambiarEstado} onHide={() => setModalCambiarEstado(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Cambiar Estado - Póliza N° {polizaCambioEstado?.numero_poliza_oficial || polizaCambioEstado?.numero_poliza}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {polizaCambioEstado && (
            <div>
              <div className="mb-3">
                <strong>Cliente:</strong> {polizaCambioEstado.prospecto_nombre} {polizaCambioEstado.prospecto_apellido}
              </div>
              <div className="mb-3">
                <strong>Estado actual:</strong>
                <Badge bg={getEstadoBadge(polizaCambioEstado.estado).bg} className="ms-2">
                  {getEstadoBadge(polizaCambioEstado.estado).text}
                </Badge>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Nuevo Estado *</Form.Label>
                <Form.Select
                  value={estadoSeleccionado}
                  onChange={(e) => setEstadoSeleccionado(e.target.value)}
                  required
                >
                  <option value="">Seleccionar estado...</option>
                  <option value="asesor">Asesor</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="back_office">Back Office</option>
                  <option value="venta_cerrada">Venta Cerrada</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Motivo del cambio *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={motivoCambio}
                  onChange={(e) => setMotivoCambio(e.target.value)}
                  placeholder="Explique el motivo del cambio de estado..."
                  required
                />
              </Form.Group>

              <Alert variant="info" className="small">
                <strong>Nota:</strong> Este cambio quedará registrado en el historial de la póliza
                y se notificará automáticamente al vendedor responsable.
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalCambiarEstado(false)} disabled={loadingCambioEstado}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={confirmarCambioEstado}
            disabled={loadingCambioEstado || !estadoSeleccionado || !motivoCambio.trim()}
          >
            {loadingCambioEstado ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Actualizando...
              </>
            ) : (
              'Confirmar Cambio'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ✅ NUEVO MODAL: Editar Póliza */}


      {/* ✅ ACTUALIZAR el modal de edición para incluir TODOS los tabs */}
      {/* ✅ REEMPLAZAR el código del modal de edición */}
      <Modal show={modalEditarPoliza} onHide={() => setModalEditarPoliza(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Editar Póliza N° {polizaEdicion?.numero_poliza_oficial || polizaEdicion?.numero_poliza}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingEdicion ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando datos...</span>
              </Spinner>
            </div>
          ) : polizaEdicion ? (


            <Tabs defaultActiveKey="datos-personales" className="mb-3">


              {/* 🆕 TAB: Información del Afiliado (Solo Supervisor) */}
              <Tab eventKey="informacion-afiliado" title="Info. Afiliado">
                <Alert variant="warning" className="mb-4">
                  <strong>Información del Afiliado</strong><br />
                  <small>Campos internos completados por personal de administración central. Solo supervisores pueden editarlos.</small>
                </Alert>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nº de Afiliado Asignado</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.informacion_afiliado?.numero_afiliado_asignado || polizaEdicion.numero_poliza_oficial || ''}
                        onChange={(e) => handleCampoEdicion('informacion_afiliado', 'numero_afiliado_asignado', e.target.value)}
                        placeholder={polizaEdicion.numero_poliza_oficial ? `Auto: ${polizaEdicion.numero_poliza_oficial}` : "Ej: 001234567"}
                      />
                      {polizaEdicion.numero_poliza_oficial && !polizaEdicion.informacion_afiliado?.numero_afiliado_asignado && (
                        <Form.Text className="text-muted">
                          <small>Auto-completado con el número de póliza oficial</small>
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nº de Historia Clínica</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.informacion_afiliado?.numero_historia_clinica || ''}
                        onChange={(e) => handleCampoEdicion('informacion_afiliado', 'numero_historia_clinica', e.target.value)}
                        placeholder="Ej: HC-001234"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>¿Credenciales Realizadas?</Form.Label>
                      <Form.Select
                        value={polizaEdicion.informacion_afiliado?.credenciales_realizadas || ''}
                        onChange={(e) => handleCampoEdicion('informacion_afiliado', 'credenciales_realizadas', e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                        <option value="en_proceso">En Proceso</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>¿Presenta Certificado O.S?</Form.Label>
                      <Form.Select
                        value={polizaEdicion.informacion_afiliado?.presenta_certificado_os || ''}
                        onChange={(e) => handleCampoEdicion('informacion_afiliado', 'presenta_certificado_os', e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                        <option value="pendiente">Pendiente</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Antigüedad en otra prepaga</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.informacion_afiliado?.antiguedad_otra_prepaga || ''}
                        onChange={(e) => handleCampoEdicion('informacion_afiliado', 'antiguedad_otra_prepaga', e.target.value)}
                        placeholder="Ej: 2 años, Sin antigüedad, etc."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Fecha de Proceso</Form.Label>
                      <Form.Control
                        type="date"
                        value={polizaEdicion.informacion_afiliado?.fecha_proceso || ''}
                        onChange={(e) => handleCampoEdicion('informacion_afiliado', 'fecha_proceso', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Firma Responsable</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.informacion_afiliado?.firma_responsable || ''}
                        onChange={(e) => handleCampoEdicion('informacion_afiliado', 'firma_responsable', e.target.value)}
                        placeholder="Nombre del responsable que procesó"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Observaciones Internas</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={polizaEdicion.informacion_afiliado?.observaciones_internas || ''}
                        onChange={(e) => handleCampoEdicion('informacion_afiliado', 'observaciones_internas', e.target.value)}
                        placeholder="Notas internas sobre el proceso de afiliación..."
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Tab>

              {/* 🆕 TAB: Información de Facturación (Solo Supervisor) */}
              <Tab eventKey="informacion-facturacion" title="Info. Facturación">
                <Alert variant="info" className="mb-4">
                  <strong>Información de Facturación</strong><br />
                  <small>Datos de facturación completados por personal interno.</small>
                </Alert>

                <Card className="mb-4">
                  <Card.Header>
                    <h6 className="mb-0">Factura de Afiliación - Al Ingreso de la Solicitud</h6>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nº de Factura</Form.Label>
                          <Form.Control
                            type="text"
                            value={polizaEdicion.informacion_facturacion?.numero_factura || ''}
                            onChange={(e) => handleCampoEdicion('informacion_facturacion', 'numero_factura', e.target.value)}
                            placeholder="Ej: F-001234"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Monto de Factura ($)</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            value={polizaEdicion.informacion_facturacion?.monto_factura || ''}
                            onChange={(e) => handleCampoEdicion('informacion_facturacion', 'monto_factura', e.target.value)}
                            placeholder="0.00"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Fecha de Emisión</Form.Label>
                          <Form.Control
                            type="date"
                            value={polizaEdicion.informacion_facturacion?.fecha_emision || ''}
                            onChange={(e) => handleCampoEdicion('informacion_facturacion', 'fecha_emision', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Período de Facturación</Form.Label>
                          <Form.Control
                            type="text"
                            value={polizaEdicion.informacion_facturacion?.periodo_facturacion || ''}
                            onChange={(e) => handleCampoEdicion('informacion_facturacion', 'periodo_facturacion', e.target.value)}
                            placeholder="Ej: Enero 2025, Primer mes, etc."
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>¿Bonificaciones Cargadas?</Form.Label>
                          <Form.Select
                            value={polizaEdicion.informacion_facturacion?.bonificaciones_cargadas || ''}
                            onChange={(e) => handleCampoEdicion('informacion_facturacion', 'bonificaciones_cargadas', e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="si">Sí</option>
                            <option value="no">No</option>
                            <option value="parcial">Parcial</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>CUIL/CUIT Facturación</Form.Label>
                          <Form.Control
                            type="text"
                            value={polizaEdicion.informacion_facturacion?.cuil_facturacion || polizaEdicion.datos_personales?.dni_cuil || ''}
                            onChange={(e) => handleCampoEdicion('informacion_facturacion', 'cuil_facturacion', e.target.value)}
                            placeholder="CUIL/CUIT para facturación"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Firma Responsable Facturación</Form.Label>
                          <Form.Control
                            type="text"
                            value={polizaEdicion.informacion_facturacion?.firma_responsable_facturacion || ''}
                            onChange={(e) => handleCampoEdicion('informacion_facturacion', 'firma_responsable_facturacion', e.target.value)}
                            placeholder="Responsable de facturación"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab>

              {/* 🆕 TAB: Solicitud de Afiliación */}
              <Tab eventKey="solicitud-afiliacion" title="Solicitud Afiliación">
                <Alert variant="primary" className="mb-4">
                  <strong>Solicitud de Afiliación</strong><br />
                  <small>Información sobre el proceso y tipo de solicitud.</small>
                </Alert>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Asesor Responsable</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.solicitud_afiliacion?.asesor_nombre || ''}
                        onChange={(e) => handleCampoEdicion('solicitud_afiliacion', 'asesor_nombre', e.target.value)}
                        placeholder="Nombre del asesor"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tipo de Solicitud</Form.Label>
                      <div className="d-flex gap-3 mt-2">
                        <Form.Check
                          type="radio"
                          label="Alta"
                          name="tipo_solicitud"
                          value="alta"
                          checked={polizaEdicion.solicitud_afiliacion?.tipo_solicitud === 'alta'}
                          onChange={(e) => handleCampoEdicion('solicitud_afiliacion', 'tipo_solicitud', e.target.value)}
                        />
                        <Form.Check
                          type="radio"
                          label="Modificación"
                          name="tipo_solicitud"
                          value="modificacion"
                          checked={polizaEdicion.solicitud_afiliacion?.tipo_solicitud === 'modificacion'}
                          onChange={(e) => handleCampoEdicion('solicitud_afiliacion', 'tipo_solicitud', e.target.value)}
                        />
                        <Form.Check
                          type="radio"
                          label="Cambio de Plan"
                          name="tipo_solicitud"
                          value="cambio_plan"
                          checked={polizaEdicion.solicitud_afiliacion?.tipo_solicitud === 'cambio_plan'}
                          onChange={(e) => handleCampoEdicion('solicitud_afiliacion', 'tipo_solicitud', e.target.value)}
                        />
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Fecha Solicitud - Día</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="31"
                        value={polizaEdicion.solicitud_afiliacion?.fecha_solicitud_dia || ''}
                        onChange={(e) => handleCampoEdicion('solicitud_afiliacion', 'fecha_solicitud_dia', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Fecha Solicitud - Mes</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="12"
                        value={polizaEdicion.solicitud_afiliacion?.fecha_solicitud_mes || ''}
                        onChange={(e) => handleCampoEdicion('solicitud_afiliacion', 'fecha_solicitud_mes', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Fecha Solicitud - Año</Form.Label>
                      <Form.Control
                        type="number"
                        min="2020"
                        max="2030"
                        value={polizaEdicion.solicitud_afiliacion?.fecha_solicitud_anio || new Date().getFullYear()}
                        onChange={(e) => handleCampoEdicion('solicitud_afiliacion', 'fecha_solicitud_anio', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Afiliado N°</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.solicitud_afiliacion?.numero_afiliado || polizaEdicion.numero_poliza_oficial || ''}
                        onChange={(e) => handleCampoEdicion('solicitud_afiliacion', 'numero_afiliado', e.target.value)}
                        placeholder={polizaEdicion.numero_poliza_oficial ? `Auto: ${polizaEdicion.numero_poliza_oficial}` : "Número de afiliado"}
                      />
                      {polizaEdicion.numero_poliza_oficial && !polizaEdicion.solicitud_afiliacion?.numero_afiliado && (
                        <Form.Text className="text-muted">
                          <small>Auto-completado con el número de póliza oficial</small>
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Vigencia - Mes</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="12"
                        value={polizaEdicion.solicitud_afiliacion?.vigencia_mes || ''}
                        onChange={(e) => handleCampoEdicion('solicitud_afiliacion', 'vigencia_mes', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Vigencia - Año</Form.Label>
                      <Form.Control
                        type="number"
                        min="2020"
                        max="2030"
                        value={polizaEdicion.solicitud_afiliacion?.vigencia_anio || new Date().getFullYear()}
                        onChange={(e) => handleCampoEdicion('solicitud_afiliacion', 'vigencia_anio', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Tab>

              {/* 🆕 TAB: Datos Comerciales */}
              <Tab eventKey="datos-comerciales" title="Datos Comerciales">
                <Alert variant="success" className="mb-4">
                  <strong>Datos Comerciales</strong><br />
                  <small>Información sobre promociones, descuentos y aspectos comerciales de la póliza.</small>
                </Alert>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mes de Ingreso</Form.Label>
                      <Form.Select
                        value={polizaEdicion.datos_comerciales?.mes_ingreso || ''}
                        onChange={(e) => handleCampoEdicion('datos_comerciales', 'mes_ingreso', e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="1">Enero</option>
                        <option value="2">Febrero</option>
                        <option value="3">Marzo</option>
                        <option value="4">Abril</option>
                        <option value="5">Mayo</option>
                        <option value="6">Junio</option>
                        <option value="7">Julio</option>
                        <option value="8">Agosto</option>
                        <option value="9">Septiembre</option>
                        <option value="10">Octubre</option>
                        <option value="11">Noviembre</option>
                        <option value="12">Diciembre</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Plan Contratado</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.datos_comerciales?.plan_contratado || polizaEdicion.plan?.nombre || ''}
                        onChange={(e) => handleCampoEdicion('datos_comerciales', 'plan_contratado', e.target.value)}
                        placeholder="Ej: CLASSIC X"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Valor de Cuota de Ingreso ($)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        value={polizaEdicion.datos_comerciales?.valor_cuota_ingreso || polizaEdicion.cotizacion?.total_final || ''}
                        onChange={(e) => handleCampoEdicion('datos_comerciales', 'valor_cuota_ingreso', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Código de Promoción</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.datos_comerciales?.codigo_promocion || ''}
                        onChange={(e) => handleCampoEdicion('datos_comerciales', 'codigo_promocion', e.target.value)}
                        placeholder="Ej: PROMO2025, Sin promoción"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mes de Vigencia de Promoción</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.datos_comerciales?.mes_vigencia_promocion || ''}
                        onChange={(e) => handleCampoEdicion('datos_comerciales', 'mes_vigencia_promocion', e.target.value)}
                        placeholder="Ej: Enero 2025"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Descuento Presuntivo ($)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        value={polizaEdicion.datos_comerciales?.descuento_presuntivo || ''}
                        onChange={(e) => handleCampoEdicion('datos_comerciales', 'descuento_presuntivo', e.target.value)}
                        placeholder="Solo en caso de desregulación de O.S."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Descuento Válido Hasta</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.datos_comerciales?.descuento_hasta || ''}
                        onChange={(e) => handleCampoEdicion('datos_comerciales', 'descuento_hasta', e.target.value)}
                        placeholder="Fecha límite del descuento"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Próximo Período a Abonar - Mes</Form.Label>
                      <Form.Select
                        value={polizaEdicion.datos_comerciales?.proximo_periodo_mes || ''}
                        onChange={(e) => handleCampoEdicion('datos_comerciales', 'proximo_periodo_mes', e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="1">Enero</option>
                        <option value="2">Febrero</option>
                        <option value="3">Marzo</option>
                        <option value="4">Abril</option>
                        <option value="5">Mayo</option>
                        <option value="6">Junio</option>
                        <option value="7">Julio</option>
                        <option value="8">Agosto</option>
                        <option value="9">Septiembre</option>
                        <option value="10">Octubre</option>
                        <option value="11">Noviembre</option>
                        <option value="12">Diciembre</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mes de Finalización de Promoción</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.datos_comerciales?.mes_fin_promocion || ''}
                        onChange={(e) => handleCampoEdicion('datos_comerciales', 'mes_fin_promocion', e.target.value)}
                        placeholder="Cuándo termina la promoción"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Descripción de la Promoción</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={polizaEdicion.datos_comerciales?.descripcion_promocion || ''}
                        onChange={(e) => handleCampoEdicion('datos_comerciales', 'descripcion_promocion', e.target.value)}
                        placeholder="Detalle completo de la promoción aplicada..."
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Tab>
              {/* ✅ TAB 1: Datos Personales */}
              <Tab eventKey="datos-personales" title="Datos Personales">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nombre *</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.datos_personales?.nombre || ''}
                        onChange={(e) => handleCampoEdicion('datos_personales', 'nombre', e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Apellido *</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.datos_personales?.apellido || ''}
                        onChange={(e) => handleCampoEdicion('datos_personales', 'apellido', e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>DNI/CUIL *</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.datos_personales?.dni_cuil || ''}
                        onChange={(e) => handleCampoEdicion('datos_personales', 'dni_cuil', e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Fecha de Nacimiento</Form.Label>
                      <Form.Control
                        type="date"
                        value={polizaEdicion.datos_personales?.fecha_nacimiento || ''}
                        onChange={(e) => handleCampoEdicion('datos_personales', 'fecha_nacimiento', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Teléfono</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.datos_personales?.telefono || ''}
                        onChange={(e) => handleCampoEdicion('datos_personales', 'telefono', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={polizaEdicion.datos_personales?.email || ''}
                        onChange={(e) => handleCampoEdicion('datos_personales', 'email', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Dirección</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.datos_personales?.direccion || ''}
                        onChange={(e) => handleCampoEdicion('datos_personales', 'direccion', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Localidad</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.datos_personales?.localidad || ''}
                        onChange={(e) => handleCampoEdicion('datos_personales', 'localidad', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Código Postal</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.datos_personales?.cod_postal || ''}
                        onChange={(e) => handleCampoEdicion('datos_personales', 'cod_postal', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nacionalidad</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.datos_personales?.nacionalidad || ''}
                        onChange={(e) => handleCampoEdicion('datos_personales', 'nacionalidad', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Condición IVA</Form.Label>
                      <Form.Select
                        value={polizaEdicion.datos_personales?.condicion_iva || ''}
                        onChange={(e) => handleCampoEdicion('datos_personales', 'condicion_iva', e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="consumidor_final">Consumidor Final</option>
                        <option value="responsable_inscripto">Responsable Inscripto</option>
                        <option value="monotributo">Monotributo</option>
                        <option value="exento">Exento</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Edad</Form.Label>
                      <Form.Control
                        type="number"
                        value={polizaEdicion.datos_personales?.edad || ''}
                        onChange={(e) => handleCampoEdicion('datos_personales', 'edad', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Sexo</Form.Label>
                      <Form.Select
                        value={polizaEdicion.datos_personales?.sexo || ''}
                        onChange={(e) => handleCampoEdicion('datos_personales', 'sexo', e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                        <option value="otro">Otro</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Tab>

              {/* ✅ TAB 2: Integrantes */}
              <Tab eventKey="integrantes" title={`Integrantes (${polizaEdicion.integrantes?.length || 0})`}>
                {polizaEdicion.integrantes && polizaEdicion.integrantes.length > 0 ? (
                  polizaEdicion.integrantes.map((integrante, index) => (
                    <Card key={index} className="mb-3">
                      <Card.Header>
                        <h6 className="mb-0">Integrante {index + 1} - {integrante.vinculo || 'Sin especificar'}</h6>
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={4}>
                            <Form.Group className="mb-3">
                              <Form.Label>Nombre</Form.Label>
                              <Form.Control
                                type="text"
                                value={integrante.nombre || ''}
                                onChange={(e) => handleCampoEdicion('integrantes', 'nombre', e.target.value, index)}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group className="mb-3">
                              <Form.Label>Apellido</Form.Label>
                              <Form.Control
                                type="text"
                                value={integrante.apellido || ''}
                                onChange={(e) => handleCampoEdicion('integrantes', 'apellido', e.target.value, index)}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group className="mb-3">
                              <Form.Label>Vínculo</Form.Label>
                              <Form.Select
                                value={integrante.vinculo || ''}
                                onChange={(e) => handleCampoEdicion('integrantes', 'vinculo', e.target.value, index)}
                              >
                                <option value="">Seleccionar...</option>
                                <option value="conyuge">Cónyuge</option>
                                <option value="hijo">Hijo/a</option>
                                <option value="padre">Padre</option>
                                <option value="madre">Madre</option>
                                <option value="hermano">Hermano/a</option>
                                <option value="otro">Otro</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group className="mb-3">
                              <Form.Label>DNI/CUIL</Form.Label>
                              <Form.Control
                                type="text"
                                value={integrante.dni_cuil || ''}
                                onChange={(e) => handleCampoEdicion('integrantes', 'dni_cuil', e.target.value, index)}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group className="mb-3">
                              <Form.Label>Fecha de Nacimiento</Form.Label>
                              <Form.Control
                                type="date"
                                value={integrante.fecha_nacimiento || ''}
                                onChange={(e) => handleCampoEdicion('integrantes', 'fecha_nacimiento', e.target.value, index)}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group className="mb-3">
                              <Form.Label>Edad</Form.Label>
                              <Form.Control
                                type="number"
                                value={integrante.edad || ''}
                                onChange={(e) => handleCampoEdicion('integrantes', 'edad', e.target.value, index)}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-muted py-4">
                    No hay integrantes adicionales
                  </div>
                )}
              </Tab>

              {/* ✅ TAB 3: Referencias */}
              <Tab eventKey="referencias" title={`Referencias (${polizaEdicion.referencias?.length || 0})`}>
                {polizaEdicion.referencias && polizaEdicion.referencias.length > 0 ? (
                  polizaEdicion.referencias.map((referencia, index) => (
                    <Card key={index} className="mb-3">
                      <Card.Header>
                        <h6 className="mb-0">Referencia {index + 1}</h6>
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={4}>
                            <Form.Group className="mb-3">
                              <Form.Label>Nombre</Form.Label>
                              <Form.Control
                                type="text"
                                value={referencia.nombre || ''}
                                onChange={(e) => handleCampoEdicion('referencias', 'nombre', e.target.value, index)}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group className="mb-3">
                              <Form.Label>Relación</Form.Label>
                              <Form.Control
                                type="text"
                                value={referencia.relacion || ''}
                                onChange={(e) => handleCampoEdicion('referencias', 'relacion', e.target.value, index)}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group className="mb-3">
                              <Form.Label>Teléfono</Form.Label>
                              <Form.Control
                                type="text"
                                value={referencia.telefono || ''}
                                onChange={(e) => handleCampoEdicion('referencias', 'telefono', e.target.value, index)}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-muted py-4">
                    No hay referencias disponibles
                  </div>
                )}
              </Tab>

              {/* ✅ TAB 4: NUEVO - Declaración de Salud (CORREGIDO) */}
              <Tab eventKey="declaracion-salud" title="Declaración de Salud">
                <Alert variant="info" className="mb-4">
                  <strong>Cuestionario de Salud</strong><br />
                  Complete todas las preguntas médicas requeridas.
                </Alert>

                {polizaEdicion.declaracion_salud?.respuestas ? (
                  <div>
                    {/* ✅ VERIFICAR SI HAY RESPUESTAS POR INTEGRANTE O DIRECTAS */}
                    {(() => {
                      const respuestas = polizaEdicion.declaracion_salud.respuestas;
                      const keys = Object.keys(respuestas);
                      
                      // Detectar si es estructura por integrante (keys son números "0", "1", etc.)
                      const esPorIntegrante = keys.every(key => !isNaN(key));
                      
                      if (esPorIntegrante) {
                        // ✅ RENDERIZAR POR INTEGRANTE
                        return keys.map((integranteIndex, idx) => {
                          const respuestasIntegrante = respuestas[integranteIndex];
                          const nombreIntegrante = integranteIndex === "0" 
                            ? "Titular" 
                            : polizaEdicion.integrantes?.[parseInt(integranteIndex) - 1]?.nombre || `Integrante ${parseInt(integranteIndex) + 1}`;
                          
                          return (
                            <Card key={integranteIndex} className="mb-4">
                              <Card.Header className="bg-primary text-white">
                                <h6 className="mb-0">
                                  Declaración de Salud - {nombreIntegrante}
                                  <span className="badge bg-light text-dark ms-2">
                                    {Object.keys(respuestasIntegrante).length} preguntas
                                  </span>
                                </h6>
                              </Card.Header>
                              <Card.Body>
                                <Row>
                                  {Object.entries(respuestasIntegrante).map(([preguntaKey, pregunta], preguntaIdx) => (
                                    <Col md={6} key={`${integranteIndex}-${preguntaKey}`} className="mb-4">
                                      <Card className="h-100 border-light">
                                        <Card.Body>
                                          <Form.Group className="mb-3">
                                            <Form.Label className="fw-bold text-primary">
                                              {formatearPregunta(preguntaKey)}
                                            </Form.Label>
                                            <Form.Select
                                              value={pregunta.respuesta || ''}
                                              onChange={e => {
                                                const nuevasRespuestas = { ...polizaEdicion.declaracion_salud.respuestas };
                                                nuevasRespuestas[integranteIndex] = {
                                                  ...nuevasRespuestas[integranteIndex],
                                                  [preguntaKey]: {
                                                    ...nuevasRespuestas[integranteIndex][preguntaKey],
                                                    respuesta: e.target.value
                                                  }
                                                };
                                                handleCampoEdicion('declaracion_salud', 'respuestas', nuevasRespuestas);
                                              }}
                                              className={pregunta.respuesta === 'si' ? 'border-warning' : ''}
                                            >
                                              <option value="">Seleccionar...</option>
                                              <option value="no">No</option>
                                              <option value="si">Sí</option>
                                            </Form.Select>

                                            {pregunta.respuesta === 'si' && (
                                              <Form.Control
                                                className="mt-2"
                                                as="textarea"
                                                rows={2}
                                                placeholder="Describa los detalles..."
                                                value={pregunta.detalle || ''}
                                                onChange={e => {
                                                  const nuevasRespuestas = { ...polizaEdicion.declaracion_salud.respuestas };
                                                  nuevasRespuestas[integranteIndex] = {
                                                    ...nuevasRespuestas[integranteIndex],
                                                    [preguntaKey]: {
                                                      ...nuevasRespuestas[integranteIndex][preguntaKey],
                                                      detalle: e.target.value
                                                    }
                                                  };
                                                  handleCampoEdicion('declaracion_salud', 'respuestas', nuevasRespuestas);
                                                }}
                                              />
                                            )}
                                          </Form.Group>
                                        </Card.Body>
                                      </Card>
                                    </Col>
                                  ))}
                                </Row>
                              </Card.Body>
                            </Card>
                          );
                        });
                      } else {
                        // ✅ RENDERIZAR ESTRUCTURA SIMPLE (PARA COMPATIBILIDAD)
                        return (
                          <Card className="mb-4">
                            <Card.Header>
                              <h6 className="mb-0">Preguntas Médicas ({Object.keys(respuestas).length})</h6>
                            </Card.Header>
                            <Card.Body>
                              <Row>
                                {Object.entries(respuestas).map(([key, pregunta], idx) => (
                                  <Col md={6} key={key} className="mb-4">
                                    <Card className="h-100 border-light">
                                      <Card.Body>
                                        <Form.Group className="mb-3">
                                          <Form.Label className="fw-bold text-primary">
                                            {formatearPregunta(key)}
                                          </Form.Label>
                                          <Form.Select
                                            value={pregunta.respuesta || ''}
                                            onChange={e => {
                                              const nuevasRespuestas = { ...polizaEdicion.declaracion_salud.respuestas };
                                              nuevasRespuestas[key] = {
                                                ...nuevasRespuestas[key],
                                                respuesta: e.target.value
                                              };
                                              handleCampoEdicion('declaracion_salud', 'respuestas', nuevasRespuestas);
                                            }}
                                            className={pregunta.respuesta === 'si' ? 'border-warning' : ''}
                                          >
                                            <option value="">Seleccionar...</option>
                                            <option value="no">No</option>
                                            <option value="si">Sí</option>
                                          </Form.Select>

                                          {pregunta.respuesta === 'si' && (
                                            <Form.Control
                                              className="mt-2"
                                              as="textarea"
                                              rows={2}
                                              placeholder="Describa los detalles..."
                                              value={pregunta.detalle || ''}
                                              onChange={e => {
                                                const nuevasRespuestas = { ...polizaEdicion.declaracion_salud.respuestas };
                                                nuevasRespuestas[key] = {
                                                  ...nuevasRespuestas[key],
                                                  detalle: e.target.value
                                                };
                                                handleCampoEdicion('declaracion_salud', 'respuestas', nuevasRespuestas);
                                              }}
                                            />
                                          )}
                                        </Form.Group>
                                      </Card.Body>
                                    </Card>
                                  </Col>
                                ))}
                              </Row>
                            </Card.Body>
                          </Card>
                        );
                      }
                    })()}
                  </div>
                ) : (
                  <div className="text-center text-muted py-4">
                    No hay datos de declaración de salud disponibles
                  </div>
                )}

                {/* ✅ SECCIÓN ADICIONAL: Cobertura Anterior y Medicación */}
                {polizaEdicion.declaracion_salud?.coberturaAnterior && (
                  <Card className="mb-4">
                    <Card.Header>
                      <h6 className="mb-0">Cobertura Médica Anterior</h6>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Cobertura Anterior</Form.Label>
                            <Form.Control
                              type="text"
                              value={polizaEdicion.declaracion_salud.coberturaAnterior?.cobertura || ''}
                              onChange={(e) => {
                                const nuevaCobertura = {
                                  ...polizaEdicion.declaracion_salud.coberturaAnterior,
                                  cobertura: e.target.value
                                };
                                handleCampoEdicion('declaracion_salud', 'coberturaAnterior', nuevaCobertura);
                              }}
                              placeholder="Ej: OSDE, Sin cobertura anterior, etc."
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label>Fecha Desde</Form.Label>
                            <Form.Control
                              type="date"
                              value={polizaEdicion.declaracion_salud.coberturaAnterior?.fecha_desde || ''}
                              onChange={(e) => {
                                const nuevaCobertura = {
                                  ...polizaEdicion.declaracion_salud.coberturaAnterior,
                                  fecha_desde: e.target.value
                                };
                                handleCampoEdicion('declaracion_salud', 'coberturaAnterior', nuevaCobertura);
                              }}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label>Fecha Hasta</Form.Label>
                            <Form.Control
                              type="date"
                              value={polizaEdicion.declaracion_salud.coberturaAnterior?.fecha_hasta || ''}
                              onChange={(e) => {
                                const nuevaCobertura = {
                                  ...polizaEdicion.declaracion_salud.coberturaAnterior,
                                  fecha_hasta: e.target.value
                                };
                                handleCampoEdicion('declaracion_salud', 'coberturaAnterior', nuevaCobertura);
                              }}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}

                {polizaEdicion.declaracion_salud?.medicacion && (
                  <Card className="mb-4">
                    <Card.Header>
                      <h6 className="mb-0">Medicación Actual</h6>
                    </Card.Header>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Detalle de Medicación</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={polizaEdicion.declaracion_salud.medicacion?.detalle || ''}
                          onChange={(e) => {
                            const nuevaMedicacion = {
                              ...polizaEdicion.declaracion_salud.medicacion,
                              detalle: e.target.value
                            };
                            handleCampoEdicion('declaracion_salud', 'medicacion', nuevaMedicacion);
                          }}
                          placeholder="Describa la medicación que toma actualmente..."
                        />
                      </Form.Group>
                    </Card.Body>
                  </Card>
                )}

                {/* Renderizar coberturas por integrante si existen */}
                {polizaEdicion?.declaracion_salud?.coberturas_por_integrante && (
                  <Card className="mb-4">
                    <Card.Header>
                      <h5 className="mb-0">Coberturas por Integrante</h5>
                    </Card.Header>
                    <Card.Body>
                      {Object.entries(polizaEdicion.declaracion_salud.coberturas_por_integrante).map(([integranteKey, cobertura]) => (
                        <div key={integranteKey} className="mb-4">
                          <h6 className="text-primary">Integrante {parseInt(integranteKey) + 1}</h6>
                          <div className="row">
                            <div className="col-md-6">
                              <strong>Cobertura:</strong> {cobertura.cobertura || 'No especificada'}
                            </div>
                            <div className="col-md-6">
                              <strong>Fecha:</strong> {cobertura.fecha_cobertura || 'No especificada'}
                            </div>
                          </div>
                          {cobertura.detalle && (
                            <div className="mt-2">
                              <strong>Detalle:</strong> {cobertura.detalle}
                            </div>
                          )}
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                )}
              </Tab>

              {/* ✅ TAB 5: Cobertura Anterior */}
              <Tab eventKey="cobertura-anterior" title="Cobertura Anterior">
                <Alert variant="warning" className="mb-4">
                  <strong>Información sobre Cobertura Médica Anterior</strong><br />
                  Complete los datos de la cobertura médica anterior (si la tuviera).
                </Alert>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>¿Posee cobertura médica actualmente?</Form.Label>
                      <Form.Select
                        value={polizaEdicion.cobertura_anterior?.tiene_cobertura || ''}
                        onChange={(e) => handleCampoEdicion('cobertura_anterior', 'tiene_cobertura', e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="no">No</option>
                        <option value="si">Sí</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {polizaEdicion.cobertura_anterior?.tiene_cobertura === 'si' && (
                    <>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nombre de la Obra Social/Prepaga</Form.Label>
                          <Form.Control
                            type="text"
                            value={polizaEdicion.cobertura_anterior?.nombre_cobertura || ''}
                            onChange={(e) => handleCampoEdicion('cobertura_anterior', 'nombre_cobertura', e.target.value)}
                            placeholder="Ej: OSDE, Swiss Medical, etc."
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Número de Afiliado</Form.Label>
                          <Form.Control
                            type="text"
                            value={polizaEdicion.cobertura_anterior?.numero_afiliado || ''}
                            onChange={(e) => handleCampoEdicion('cobertura_anterior', 'numero_afiliado', e.target.value)}
                            placeholder="Número de afiliado actual"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Fecha de Inicio de Cobertura</Form.Label>
                          <Form.Control
                            type="date"
                            value={polizaEdicion.cobertura_anterior?.fecha_inicio || ''}
                            onChange={(e) => handleCampoEdicion('cobertura_anterior', 'fecha_inicio', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>¿Planea dar de baja la cobertura actual?</Form.Label>
                          <Form.Select
                            value={polizaEdicion.cobertura_anterior?.dara_de_baja || ''}
                            onChange={(e) => handleCampoEdicion('cobertura_anterior', 'dara_de_baja', e.target.value)}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="si">Sí, al activarse la nueva póliza</option>
                            <option value="no">No, mantendrá ambas coberturas</option>
                            <option value="evaluar">A evaluar</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Plan/Tipo de Cobertura Actual</Form.Label>
                          <Form.Control
                            type="text"
                            value={polizaEdicion.cobertura_anterior?.plan_actual || ''}
                            onChange={(e) => handleCampoEdicion('cobertura_anterior', 'plan_actual', e.target.value)}
                            placeholder="Ej: Plan 210, Plan Familiar, etc."
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Observaciones sobre la cobertura anterior</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={polizaEdicion.cobertura_anterior?.observaciones || ''}
                            onChange={(e) => handleCampoEdicion('cobertura_anterior', 'observaciones', e.target.value)}
                            placeholder="Detalles adicionales, motivos de cambio, etc."
                          />
                        </Form.Group>
                      </Col>
                    </>
                  )}
                </Row>
              </Tab>

              {/* ✅ TAB 6: Datos Adicionales */}
              <Tab eventKey="datos-adicionales" title="Datos Adicionales">
                <Alert variant="info" className="mb-4">
                  <strong>Información Complementaria</strong><br />
                  Datos adicionales para el procesamiento de la póliza.
                </Alert>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Profesión/Ocupación del Titular</Form.Label>
                      <Form.Control
                        type="text"
                        value={polizaEdicion.datos_adicionales?.profesion_titular || ''}
                        onChange={(e) => handleCampoEdicion('datos_adicionales', 'profesion_titular', e.target.value)}
                        placeholder="Ej: Contador, Médico, Empleado, etc."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ingresos Mensuales Aproximados</Form.Label>
                      <Form.Select
                        value={polizaEdicion.datos_adicionales?.rango_ingresos || ''}
                        onChange={(e) => handleCampoEdicion('datos_adicionales', 'rango_ingresos', e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="hasta_100k">Hasta $100,000</option>
                        <option value="100k_300k">$100,000 - $300,000</option>
                        <option value="300k_500k">$300,000 - $500,000</option>
                        <option value="500k_1m">$500,000 - $1,000,000</option>
                        <option value="mas_1m">Más de $1,000,000</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Forma de Pago Preferida</Form.Label>
                      <Form.Select
                        value={polizaEdicion.datos_adicionales?.forma_pago_preferida || ''}
                        onChange={(e) => handleCampoEdicion('datos_adicionales', 'forma_pago_preferida', e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="debito_automatico">Débito Automático</option>
                        <option value="transferencia">Transferencia Bancaria</option>
                        <option value="tarjeta_credito">Tarjeta de Crédito</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="cheque">Cheque</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>¿Cómo conoció COBER?</Form.Label>
                      <Form.Select
                        value={polizaEdicion.datos_adicionales?.como_conocio || ''}
                        onChange={(e) => handleCampoEdicion('datos_adicionales', 'como_conocio', e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="recomendacion">Recomendación</option>
                        <option value="internet">Internet/Web</option>
                        <option value="redes_sociales">Redes Sociales</option>
                        <option value="publicidad">Publicidad</option>
                        <option value="vendedor">Contacto de vendedor</option>
                        <option value="otro">Otro</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Comentarios del Vendedor</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={polizaEdicion.datos_adicionales?.comentarios_vendedor || ''}
                        onChange={(e) => handleCampoEdicion('datos_adicionales', 'comentarios_vendedor', e.target.value)}
                        placeholder="Observaciones del vendedor sobre el cliente, la venta, etc."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Fecha de Inicio Deseada</Form.Label>
                      <Form.Control
                        type="date"
                        value={polizaEdicion.datos_adicionales?.fecha_inicio_deseada || ''}
                        onChange={(e) => handleCampoEdicion('datos_adicionales', 'fecha_inicio_deseada', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Prioridad de Procesamiento</Form.Label>
                      <Form.Select
                        value={polizaEdicion.datos_adicionales?.prioridad || ''}
                        onChange={(e) => handleCampoEdicion('datos_adicionales', 'prioridad', e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="normal">Normal</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Cliente requiere contacto telefónico antes de la activación"
                        checked={polizaEdicion.datos_adicionales?.requiere_contacto || false}
                        onChange={(e) => handleCampoEdicion('datos_adicionales', 'requiere_contacto', e.target.checked)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Cliente acepta recibir comunicaciones promocionales"
                        checked={polizaEdicion.datos_adicionales?.acepta_promociones || false}
                        onChange={(e) => handleCampoEdicion('datos_adicionales', 'acepta_promociones', e.target.checked)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Tab>

              {/* ✅ TAB 7: Observaciones */}
              <Tab eventKey="observaciones" title="Observaciones">
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Observaciones Generales</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        value={polizaEdicion.observaciones || ''}
                        onChange={(e) => handleCampoEdicion('observaciones', '', e.target.value)}
                        placeholder="Observaciones o comentarios adicionales sobre la póliza..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Términos y condiciones aceptados"
                        checked={polizaEdicion.terminos_aceptados || false}
                        onChange={(e) => handleCampoEdicion('terminos_aceptados', '', e.target.checked)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Card className="mt-4">
                  <Card.Header>
                    <h6 className="mb-0">Información del Sistema</h6>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <p><strong>Estado actual:</strong> <Badge bg={getEstadoBadge(polizaEdicion.estado).bg}>{getEstadoBadge(polizaEdicion.estado).text}</Badge></p>
                        <p><strong>Creada el:</strong> {formatFecha(polizaEdicion.created_at)}</p>
                        <p><strong>Última actualización:</strong> {formatFecha(polizaEdicion.updated_at)}</p>
                      </Col>
                      <Col md={6}>
                        {polizaEdicion.creador && (
                          <p><strong>Creada por:</strong> {polizaEdicion.creador.nombre} {polizaEdicion.creador.apellido}</p>
                        )}
                        {polizaEdicion.revisor && (
                          <p><strong>Revisada por:</strong> {polizaEdicion.revisor.nombre} {polizaEdicion.revisor.apellido}</p>
                        )}
                        {polizaEdicion.fecha_revision && (
                          <p><strong>Fecha revisión:</strong> {formatFecha(polizaEdicion.fecha_revision)}</p>
                        )}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab>
            </Tabs>
          ) : null}

          {/* ✅ MOTIVO DE EDICIÓN */}
          <div className="mt-4">
            <Form.Group className="mb-3">
              <Form.Label>Motivo de la edición *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={motivoEdicion}
                onChange={(e) => setMotivoEdicion(e.target.value)}
                placeholder="Explique el motivo de la edición de la póliza..."
                required
              />
            </Form.Group>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalEditarPoliza(false)} disabled={guardandoEdicion}>
            Cancelar
          </Button>
          <Button
            variant="success"
            onClick={handleGuardarEdicion}
            disabled={guardandoEdicion || !motivoEdicion.trim()}
          >
            {guardandoEdicion ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ✅ MODAL: Conversaciones WhatsApp */}
      <Modal show={modalConversaciones} onHide={() => setModalConversaciones(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaWhatsapp className="me-2 text-success" />
            Conversaciones WhatsApp
            {prospectoSeleccionado && (
              <div className="mt-1">
                <small className="text-muted">
                  {prospectoSeleccionado.nombre} {prospectoSeleccionado.apellido} - {prospectoSeleccionado.telefono}
                </small>
              </div>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingConversaciones ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando conversaciones...</span>
              </Spinner>
            </div>
          ) : conversacionesProspecto.length === 0 ? (
            <div className="text-center py-4">
              <div className="mb-3">
                <FaWhatsapp size={48} className="text-muted" />
              </div>
              <h6 className="text-muted">No hay conversaciones iniciadas</h6>
              <p className="text-muted">Este prospecto aún no tiene conversaciones de WhatsApp</p>
              <Button variant="success" onClick={handleNuevaConversacion}>
                <FaWhatsapp className="me-2" />
                Iniciar Nueva Conversación
              </Button>
            </div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Conversaciones ({conversacionesProspecto.length})</h6>
                <Button size="sm" variant="outline-success" onClick={handleNuevaConversacion}>
                  <FaWhatsapp className="me-1" />
                  Nueva
                </Button>
              </div>
              
              <div className="conversaciones-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {conversacionesProspecto.map((conv) => {
                  const estadoConv = getEstadoConversacion(conv.estado);
                  const tipoOrigen = getTipoOrigen(conv.tipo_origen);
                  
                  return (
                    <Card key={conv.id} className="mb-3 border-0 shadow-sm">
                      <Card.Body className="py-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-2">
                              <Badge bg={estadoConv.color} className="me-2">
                                {estadoConv.texto}
                              </Badge>
                              <small className="text-muted">
                                {tipoOrigen.icon} {tipoOrigen.texto}
                              </small>
                              {conv.poliza_id && (
                                <small className="text-info ms-2">
                                  📄 Póliza #{conv.numero_poliza}
                                </small>
                              )}
                            </div>
                            
                            <div className="mb-2">
                              <strong>Conversación #{conv.numero_conversacion}</strong>
                              <br />
                              <small className="text-muted">
                                📞 {conv.telefono}
                              </small>
                            </div>

                            {conv.ultimo_mensaje && (
                              <div className="ultimo-mensaje bg-light p-2 rounded">
                                <small>
                                  <strong>Último mensaje:</strong>
                                  <br />
                                  {conv.ultimo_mensaje.contenido.length > 100 
                                    ? `${conv.ultimo_mensaje.contenido.substring(0, 100)}...`
                                    : conv.ultimo_mensaje.contenido
                                  }
                                  <br />
                                  <span className="text-muted">
                                    {formatearFecha(conv.ultimo_mensaje.created_at)}
                                  </span>
                                </small>
                              </div>
                            )}

                            <div className="mt-2">
                              <Row>
                                <Col>
                                  <small className="text-muted">
                                    💬 {conv.total_mensajes} mensajes
                                  </small>
                                </Col>
                                <Col className="text-end">
                                  <small className="text-muted">
                                    🕒 {formatearFecha(conv.ultima_actividad)}
                                  </small>
                                </Col>
                              </Row>
                              {conv.mensajes_no_leidos > 0 && (
                                <Badge bg="danger" className="mt-1">
                                  {conv.mensajes_no_leidos} sin leer
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="ms-3">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => handleVerConversacion(conv)}
                            >
                              <FaEye className="me-1" />
                              Ver Chat
                            </Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalConversaciones(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Exportación */}
      <ModalExportacion
        show={showModalExportacion}
        onHide={() => setShowModalExportacion(false)}
        userRole="supervisor"
      />

      {/* ✅ NUEVO MODAL: Carga múltiple de documentos */}
      <Modal 
        show={modalCargaDocumentos} 
        onHide={handleCerrarCargaDocumentos} 
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFile className="me-2 text-primary" />
            Cargar Documentos - Póliza #{polizaCargaDocumentos?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {polizaCargaDocumentos && (
            <div className="mb-3 p-3 bg-light rounded">
              <h6 className="mb-1">Información de la Póliza:</h6>
              <div className="row">
                <div className="col-md-6">
                  <small><strong>ID:</strong> {polizaCargaDocumentos.id}</small>
                </div>
                <div className="col-md-6">
                  <small><strong>Cliente:</strong> {polizaCargaDocumentos.nombre_prospecto}</small>
                </div>
                <div className="col-md-6">
                  <small><strong>Plan:</strong> {polizaCargaDocumentos.plan_nombre}</small>
                </div>
                <div className="col-md-6">
                  <small><strong>Estado:</strong> <Badge bg={getEstadoBadge(polizaCargaDocumentos.estado).bg}>{getEstadoBadge(polizaCargaDocumentos.estado).text}</Badge></small>
                </div>
              </div>
            </div>
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

      {/* ✅ MODAL SEPARADO: Carga de documentos múltiples */}
      {polizaCargaDocumentos && (
        <CargaMultipleDocumentos 
          polizaId={polizaCargaDocumentos.id}
          show={modalCargaDocumentos}
          onHide={handleCerrarCargaDocumentos}
          onDocumentosActualizados={handleDocumentosActualizados}
        />
      )}

      {/* ✅ MODAL HISTORIAL DE ESTADOS Y COMENTARIOS */}
      <Modal show={modalHistorial} onHide={() => setModalHistorial(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaHistory className="me-2" />
            Historial de Estados
            {polizaHistorial && (
              <Badge bg="primary" className="ms-2">
                {polizaHistorial.numero_poliza_oficial || polizaHistorial.numero_poliza}
              </Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingHistorial ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">Cargando historial...</p>
            </div>
          ) : historialEstados.length === 0 ? (
            <Alert variant="info">
              <FaHistory className="me-2" />
              No hay registros de cambios de estado para esta póliza.
            </Alert>
          ) : (
            <>
              {polizaHistorial && (
                <Alert variant="light" className="mb-3">
                  <Row>
                    <Col md={6}>
                      <small><strong>Cliente:</strong> {polizaHistorial.nombre_prospecto}</small>
                    </Col>
                    <Col md={6}>
                      <small><strong>Estado actual:</strong>{' '}
                        <Badge bg={getEstadoBadge(polizaHistorial.estado).bg}>
                          {getEstadoBadge(polizaHistorial.estado).text}
                        </Badge>
                      </small>
                    </Col>
                  </Row>
                </Alert>
              )}
              
              <div className="historial-timeline">
                {historialEstados.map((item, index) => (
                  <Card key={item.id} className={`mb-3 ${index === 0 ? 'border-primary' : ''}`}>
                    <Card.Header className={`d-flex justify-content-between align-items-center py-2 ${index === 0 ? 'bg-primary text-white' : 'bg-light'}`}>
                      <div className="d-flex align-items-center">
                        <FaExchangeAlt className="me-2" />
                        <span>
                          <Badge bg={getEstadoBadge(item.estado_anterior).bg} className="me-1">
                            {getEstadoBadge(item.estado_anterior).text}
                          </Badge>
                          <span className="mx-1">→</span>
                          <Badge bg={getEstadoBadge(item.estado_nuevo).bg}>
                            {getEstadoBadge(item.estado_nuevo).text}
                          </Badge>
                        </span>
                        {index === 0 && <Badge bg="warning" className="ms-2">Último cambio</Badge>}
                      </div>
                      <small className={index === 0 ? 'text-white-50' : 'text-muted'}>
                        <FaCalendarAlt className="me-1" />
                        {new Date(item.fecha).toLocaleDateString('es-AR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </small>
                    </Card.Header>
                    <Card.Body className="py-2">
                      <Row>
                        <Col md={12}>
                          <div className="mb-2">
                            <FaUser className="me-1 text-muted" />
                            <strong>Realizado por:</strong>{' '}
                            {item.usuario?.nombre} {item.usuario?.apellido}
                            {item.usuario?.email && (
                              <small className="text-muted ms-1">({item.usuario.email})</small>
                            )}
                          </div>
                        </Col>
                      </Row>
                      {item.motivo && (
                        <div className="mt-2 p-2 bg-light rounded">
                          <FaComments className="me-1 text-info" />
                          <strong>Comentario/Motivo:</strong>
                          <p className="mb-0 mt-1 text-dark">{item.motivo}</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                ))}
              </div>
              
              <div className="text-muted small text-center mt-3">
                <FaInfoCircle className="me-1" />
                Se muestran {historialEstados.length} cambios de estado registrados
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalHistorial(false)}>
            Cerrar
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setModalHistorial(false);
              handleCambiarEstado(polizaHistorial);
            }}
          >
            <FaExchangeAlt className="me-1" />
            Cambiar Estado
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};


export default PolizasSupervisor;