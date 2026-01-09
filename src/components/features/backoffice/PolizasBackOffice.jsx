import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Badge, Spinner, ButtonGroup, Alert, Modal, Toast, ToastContainer, Accordion, Nav, Tab, Tabs } from "react-bootstrap";
import { 
  FaEye, FaDownload, FaWhatsapp, FaFilter, FaList, FaThLarge, FaFileAlt, FaUsers, FaMoneyBillWave, 
  FaChartLine, FaFile, FaBuilding, FaUserTie, FaGlobe, FaSearch, FaEdit, FaExchangeAlt, FaComments, 
  FaUpload, FaTimes, FaCheck, FaExclamationTriangle, FaPlus, FaTrash, FaFileUpload, FaHistory,
  FaCalendarAlt, FaHourglassHalf, FaCheckCircle, FaUser, FaFileInvoiceDollar, FaInfoCircle, FaSave, FaCopy
} from "react-icons/fa";
import axios from "axios";
import Swal from "sweetalert2";
import { API_URL } from "../../config";
// import CargaDocumentosModal from '../supervisor/components/CargaDocumentosModal';

const PolizasBackOffice = () => {
  const [polizas, setPolizas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    periodo_descripcion: '',
    resumen: {},
    metricas_calculadas: {},
    por_supervisor: []
  });
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    vendedor_id: 'todos',
    supervisor_id: 'todos', // ✅ Filtro específico de Back Office
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
    supervisores: [], // ✅ Lista completa de supervisores
    planes: [],
    estados: []
  });
  const [showFiltros, setShowFiltros] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);

  // ✅ NUEVOS ESTADOS PARA GESTIÓN DE DOCUMENTOS
  const [modalDocumentos, setModalDocumentos] = useState(false);
  const [polizaSeleccionada, setPolizaSeleccionada] = useState(null);
  const [documentos, setDocumentos] = useState({});
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewMime, setPreviewMime] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // ✅ NUEVOS ESTADOS PARA CAMBIO DE ESTADO
  const [modalCambiarEstado, setModalCambiarEstado] = useState(false);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
  const [motivoCambio, setMotivoCambio] = useState('');
  const [polizaCambioEstado, setPolizaCambioEstado] = useState(null);
  const [loadingCambioEstado, setLoadingCambioEstado] = useState(false);

  // ✅ NUEVOS ESTADOS PARA EDICIÓN
  const [modalEditarPoliza, setModalEditarPoliza] = useState(false);
  const [polizaEdicion, setPolizaEdicion] = useState(null);
  const [loadingEdicion, setLoadingEdicion] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [motivoEdicion, setMotivoEdicion] = useState('');
  const [tabEditarActiva, setTabEditarActiva] = useState('informacion-afiliado');

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

  // ✅ ESTADOS PARA TOAST NOTIFICATIONS
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  // Cargar datos iniciales
  useEffect(() => {
    fetchPolizas();
    fetchOpcionesFiltro();
    fetchEstadisticas();
  }, []);

  // Recargar cuando cambien los filtros
  useEffect(() => {
    fetchPolizas();
  }, [filtros, paginacion.current_page]);

  const fetchPolizas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const params = new URLSearchParams({
        page: paginacion.current_page,
        limit: paginacion.per_page,
        ...filtros
      });

      // ✅ USAR ENDPOINT ESPECÍFICO DE BACK OFFICE
      const { data } = await axios.get(
        `${API_URL}/backoffice/polizas?${params}`,
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
      
      const { data } = await axios.get(
        `${API_URL}/backoffice/polizas/estadisticas`,
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
        `${API_URL}/backoffice/polizas/filtros`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOpcionesFiltro(data.data);
    } catch (error) {
      console.error("Error cargando opciones de filtro:", error);
    }
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
      supervisor_id: 'todos',
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
    if (poliza.pdf_hash) {
      window.open(`${API_URL}/polizas/pdf/${poliza.pdf_hash}`, '_blank');
    } else {
      window.open(poliza.urls?.pdf || '#', '_blank');
    }
  };

  // ✅ NUEVA FUNCIÓN: Ver documentos de la póliza
  const handleVerDocumentos = async (poliza) => {
    try {
      setPolizaSeleccionada(poliza);
      setModalDocumentos(true);
      setLoadingDocumentos(true);

      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/backoffice/polizas/${poliza.id}/documentos`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDocumentos(response.data.documentos || {});
      }
    } catch (error) {
      console.error('Error cargando documentos:', error);
      showToastMessage('Error al cargar documentos', 'danger');
    } finally {
      setLoadingDocumentos(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Descargar documento específico
  const handleDescargarDocumento = async (documentoId, nombreOriginal) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/backoffice/polizas/documentos/${documentoId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreOriginal;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error descargando documento:', error);
      showToastMessage('Error al descargar documento', 'danger');
    }
  };

  // ✅ NUEVA FUNCIÓN: Eliminar documento
  const handleEliminarDocumento = async (documentoId) => {
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
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/backoffice/polizas/documentos/${documentoId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        showToastMessage('Documento eliminado correctamente', 'success');
        // Recargar documentos
        if (polizaSeleccionada) {
          handleVerDocumentos(polizaSeleccionada);
        }
      } catch (error) {
        console.error('Error eliminando documento:', error);
        showToastMessage('Error al eliminar documento', 'danger');
      }
    }
  };

  // ✅ NUEVA FUNCIÓN: Preview de documento
  const handlePreviewDocumento = async (documentoId, tipoMime) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/backoffice/polizas/documentos/${documentoId}/preview`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPreviewMime(tipoMime);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error previsualizando documento:', error);
      showToastMessage('Error al previsualizar documento', 'danger');
    }
  };

  // ✅ NUEVA FUNCIÓN: Cambiar estado de póliza
  const handleCambiarEstado = (poliza) => {
    setPolizaCambioEstado(poliza);
    setEstadoSeleccionado('');
    setMotivoCambio('');
    setModalCambiarEstado(true);
  };

  const confirmarCambioEstado = async () => {
    if (!estadoSeleccionado || !motivoCambio.trim()) {
      showToastMessage('Debe seleccionar un estado y proporcionar un motivo', 'warning');
      return;
    }

    try {
      setLoadingCambioEstado(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.patch(
        `${API_URL}/backoffice/polizas/${polizaCambioEstado.id}/estado`,
        {
          estado: estadoSeleccionado,
          motivo_cambio_estado: motivoCambio
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showToastMessage('Estado actualizado correctamente', 'success');
        setModalCambiarEstado(false);
        fetchPolizas(); // Recargar la lista
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      showToastMessage('Error al cambiar estado', 'danger');
    } finally {
      setLoadingCambioEstado(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Ver conversaciones WhatsApp
  const handleVerConversaciones = async (poliza) => {
    try {
      setProspectoSeleccionado({
        id: poliza.prospecto_id,
        nombre: poliza.prospecto_nombre,
        apellido: poliza.prospecto_apellido,
        telefono: poliza.prospecto_telefono
      });
      setModalConversaciones(true);
      setLoadingConversaciones(true);

      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/backoffice/polizas/prospectos/${poliza.prospecto_id}/conversaciones`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setConversacionesProspecto(response.data.data.conversaciones || []);
      }
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
      showToastMessage('Error al cargar conversaciones', 'danger');
    } finally {
      setLoadingConversaciones(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Editar póliza
  const handleEditarPoliza = async (poliza) => {
    try {
      setLoadingEdicion(true);
      setModalEditarPoliza(true);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/backoffice/polizas/${poliza.id}/editar`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        console.log('🔍 Póliza cargada para edición:', response.data.data);
        setPolizaEdicion(response.data.data);
        setMotivoEdicion('');
      }
    } catch (error) {
      console.error('Error cargando póliza para edición:', error);
      showToastMessage('Error al cargar póliza para edición', 'danger');
      setModalEditarPoliza(false);
    } finally {
      setLoadingEdicion(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Guardar cambios de la póliza
  const handleGuardarEdicion = async () => {
    if (!motivoEdicion.trim()) {
      showToastMessage('Debe proporcionar un motivo para la edición', 'warning');
      return;
    }

    try {
      setGuardandoEdicion(true);
      const token = localStorage.getItem('token');

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
        informacion_afiliado: polizaEdicion.informacion_afiliado || {},
        informacion_facturacion: polizaEdicion.informacion_facturacion || {},
        solicitud_afiliacion: polizaEdicion.solicitud_afiliacion || {},
        datos_comerciales: polizaEdicion.datos_comerciales || {},
        motivo: motivoEdicion
      };

      const response = await axios.put(
        `${API_URL}/backoffice/polizas/${polizaEdicion.id}/actualizar`,
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
              <p class="small text-muted">Campos modificados: ${response.data.data.campos_actualizados?.length || 0}</p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Entendido'
        });
      }
    } catch (error) {
      console.error('Error guardando edición:', error);
      showToastMessage('No se pudo actualizar la póliza', 'danger');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Handle de cambios en campos de edición
  const handleCampoEdicion = (seccion, campo, valor, index = null) => {
    setPolizaEdicion(prev => {
      const nuevaPoliza = { ...prev };

      // Manejar campo especial observaciones
      if (seccion === 'observaciones') {
        nuevaPoliza.observaciones = valor;
        return nuevaPoliza;
      }

      // ✅ Manejar campo especial terminos_aceptados
      if (seccion === 'terminos_aceptados') {
        nuevaPoliza.terminos_aceptados = valor;
        return nuevaPoliza;
      }

      // ✅ Manejar campos de declaracion_salud con objetos anidados
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

      // ✅ Manejar arrays normales
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

  // ✅ NUEVA FUNCIÓN: Ver historial de estados y comentarios
  const handleVerHistorial = async (poliza) => {
    try {
      setPolizaHistorial(poliza);
      setModalHistorial(true);
      setLoadingHistorial(true);

      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/backoffice/polizas/${poliza.id}/historial`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setHistorialEstados(response.data.data || []);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
      showToastMessage('Error al cargar historial de estados', 'danger');
      setHistorialEstados([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Cargar documentos
  const handleAbrirCargaDocumentos = (poliza) => {
    setPolizaCargaDocumentos(poliza);
    setModalCargaDocumentos(true);
  };

  const handleDocumentosActualizados = async () => {
    setModalCargaDocumentos(false);
    showToastMessage('Documentos cargados correctamente', 'success');
    // Recargar documentos si el modal está abierto
    if (modalDocumentos && polizaSeleccionada) {
      handleVerDocumentos(polizaSeleccionada);
    }
  };

  // ✅ FUNCIÓN HELPER: Mostrar toast
  const showToastMessage = (message, variant = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  };

  // ✅ FUNCIÓN HELPER: Formatear preguntas de declaración de salud - COMPLETA
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
      'alcoholismo': '¿Consume alcohol regularmente?',
      'drogas': '¿Consume drogas?',
      'oncologico': '¿Ha tenido tratamiento oncológico?',
      'tabaco': '¿Fuma tabaco?',
      'tabaquismo': '¿Fuma tabaco?',
      'peso': '¿Tiene problemas de peso?',
      'perdida_peso': '¿Ha tenido pérdida de peso significativa?',
      'diagnostico_reciente': '¿Ha recibido algún diagnóstico médico reciente?',
      'discapacidad': '¿Tiene alguna discapacidad?'
    };

    return preguntas[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // ✅ FUNCIÓN HELPER: Obtener todas las preguntas disponibles
  const obtenerTodasLasPreguntas = () => {
    return [
      'internacion', 'internacion_colegiales', 'cirugia', 'secuelas', 'accidentes', 
      'transfusiones', 'estudios_anuales', 'indicacion_medica', 'psicologico', 
      'psiquiatrico', 'internacion_mental', 'diabetes', 'auditivas', 'vista', 
      'lentes', 'glaucoma', 'alergias', 'infarto', 'test_embarazo', 'sintomas_embarazo', 
      'embarazo_actual', 'aborto', 'partos', 'columna', 'protesis', 'deporte', 
      'deporte_riesgo', 'indicacion_protesis', 'neurologicas', 'epilepsia', 
      'perdida_conocimiento', 'mareos', 'paralisis', 'cardiacas', 'arritmias', 
      'presion', 'respiratorias', 'tuberculosis', 'fiebre_reumatica', 'hepatitis', 
      'colicos', 'infecciones_urinarias', 'anemia', 'transmision_sexual', 
      'infecciosas', 'tumores', 'tiroides', 'gastritis', 'alcohol', 'alcoholismo', 
      'drogas', 'oncologico', 'tabaco', 'tabaquismo', 'peso', 'perdida_peso', 
      'diagnostico_reciente', 'discapacidad'
    ];
  };

  // ✅ FUNCIONES AUXILIARES
  const formatTipoDocumento = (tipo) => {
    const tipos = {
      // Nuevos tipos de documentos adicionales
      'codem': 'CODEM',
      'formulario_f152': 'Formulario F152',
      'formulario_f184': 'Formulario F184',
      'constancia_inscripcion': 'Constancia de Inscripción',
      'comprobante_pago_cuota': 'Comprobante de Pago',
      'estudios_medicos': 'Estudios Médicos',
      // Tipos existentes
      'poliza_firmada': 'Póliza Firmada',
      'auditoria_medica': 'Auditoría Médica',
      'documento_identidad_adicional': 'Doc. Identidad',
      'comprobante_ingresos': 'Comp. Ingresos',
      'autorizacion_debito': 'Autorización Débito',
      'documento_adicional': 'Doc. Adicional',
      'dni_frente': 'DNI Frente',
      'dni_dorso': 'DNI Dorso',
      'recibo_sueldo': 'Recibo de Sueldo',
      'constancia_ingresos': 'Constancia de Ingresos'
    };
    return tipos[tipo] || tipo;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoConversacion = (estado) => {
    const estados = {
      'activa': { bg: 'success', text: 'Activa' },
      'pausada': { bg: 'warning', text: 'Pausada' },
      'cerrada': { bg: 'secondary', text: 'Cerrada' }
    };
    return estados[estado] || { bg: 'primary', text: estado };
  };

  const renderEstadisticasGlobales = () => (
    <>
      {/* ✅ ALERTA INDICANDO ACCESO COMPLETO */}
    
      {/* Estadísticas Principales */}
      {/* <Row className="mb-3 mb-md-4">
        <Col xs={6} sm={6} lg={3} className="mb-3">
          <Card className="text-center h-100 shadow-sm border-primary metric-card">
            <Card.Body className="py-2 py-sm-3">
              <FaFileAlt className="text-primary mb-2" size={20} />
              <h4 className="fw-bold mb-1">{estadisticas.resumen?.total_polizas || 0}</h4>
              <small className="text-muted d-block">Total Pólizas</small>
              <div className="mt-1 d-none d-sm-block">
                <small className="text-info">
                  <FaGlobe className="me-1" />
                  Toda la organización
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={6} lg={3} className="mb-3">
          <Card className="text-center h-100 shadow-sm border-warning metric-card">
            <Card.Body className="py-2 py-sm-3">
              <FaChartLine className="text-warning mb-2" size={20} />
              <h4 className="fw-bold mb-1">{estadisticas.resumen?.polizas_en_proceso || 0}</h4>
              <small className="text-muted d-block">En Proceso</small>
              <div className="mt-1 d-none d-sm-block">
                <small className="text-warning">Requieren atención</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} sm={6} lg={3} className="mb-3">
          <Card className="text-center h-100 shadow-sm border-success metric-card">
            <Card.Body className="py-2 py-sm-3">
              <FaUsers className="text-success mb-2" size={20} />
              <h4 className="fw-bold mb-1">{estadisticas.resumen?.polizas_activas || 0}</h4>
              <small className="text-muted d-block">Activas</small>
              <div className="mt-1 d-none d-sm-block">
                <small className="text-success">Vigentes</small>
              </div>
            </Card.Body>
          </Card>
        </Col> */}
        {/* <Col xs={6} sm={6} lg={3} className="mb-3">
          <Card className="text-center h-100 shadow-sm border-info metric-card">
            <Card.Body className="py-2 py-sm-3">
              <FaMoneyBillWave className="text-success mb-2" size={20} />
              <h4 className="fw-bold mb-1">
                {estadisticas.metricas_calculadas?.facturacion_total_formateada || '$0'}
              </h4>
              <small className="text-muted d-block">Facturación Total</small>
              <div className="mt-1 d-none d-sm-block">
                <small className="text-info">Sistema completo</small>
              </div>
            </Card.Body>
          </Card>
        </Col> */}
      {/* </Row> */}

      {/* ✅ ESTADÍSTICAS POR SUPERVISOR */}
      {estadisticas.por_supervisor && estadisticas.por_supervisor.length > 0 && (
        <Row className="mb-3 mb-md-4">
          <Col xs={12}>
            {/* <Card className="shadow-sm">
              <Card.Header className="bg-light">
                <h6 className="mb-0">
                  <FaUserTie className="me-2" />
                  <span className="d-none d-sm-inline">Rendimiento por Supervisor - Vista Global</span>
                  <span className="d-sm-none">Supervisores - Global</span>
                </h6>
              </Card.Header>
              <Card.Body>
                <Row className="estadisticas-supervisor">
                  {estadisticas.por_supervisor.slice(0, 6).map((sup, index) => (
                    <Col xs={12} sm={6} lg={4} xl={2} key={sup.supervisor_id} className="mb-3">
                      <Card className="h-100 border-start border-primary border-3">
                        <Card.Body className="py-2">
                          <div className="d-flex align-items-center mb-2">
                            <FaUserTie className="text-primary me-2 flex-shrink-0" size={16} />
                            <h6 className="fw-bold mb-0 text-truncate" title={`${sup.supervisor_nombre} ${sup.supervisor_apellido}`}>
                              {sup.supervisor_nombre} {sup.supervisor_apellido}
                            </h6>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <small className="text-muted">Vendedores:</small>
                            <strong className="text-info">{sup.vendedores_activos || 0}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <small className="text-muted">Pólizas:</small>
                            <strong>{sup.total_polizas || 0}</strong>
                          </div>
                          <div className="d-flex justify-content-between">
                            <small className="text-muted">Facturación:</small>
                            <strong className="text-success small">
                              {formatCurrency(sup.facturacion_total || 0)}
                            </strong>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card> */}
          </Col>
        </Row>
      )}
    </>
  );

  const renderFiltrosGlobales = () => (
    <Card className="mb-3 mb-md-4 shadow-sm">
      <Card.Header className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-sm-center">
        <div className="mb-2 mb-sm-0">
          <h6 className="mb-1">
            <FaFilter className="me-2" />
            <span className="d-none d-sm-inline">Filtros Avanzados - Back Office</span>
            <span className="d-sm-none">Filtros</span>
          </h6>
          <small className="text-muted d-block">
            <FaGlobe className="me-1" />
            <span className="d-none d-md-inline">Acceso a todos los supervisores y vendedores del sistema</span>
            <span className="d-md-none">Acceso global</span>
          </small>
        </div>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setShowFiltros(!showFiltros)}
        >
          {showFiltros ? 'Ocultar' : 'Mostrar'}
        </Button>
      </Card.Header>
      {showFiltros && (
        <Card.Body className="pb-2">
          <Row>
            <Col xs={6} sm={6} lg={2} className="mb-3">
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
            <Col xs={6} sm={6} lg={2} className="mb-3">
              <Form.Group>
                <Form.Label className="small fw-semibold">
                  <FaUserTie className="me-1" />
                  <span className="d-none d-lg-inline">Supervisor</span>
                  <span className="d-lg-none">Superv.</span>
                </Form.Label>
                <Form.Select
                  size="sm"
                  value={filtros.supervisor_id}
                  onChange={(e) => handleFiltroChange('supervisor_id', e.target.value)}
                >
                  <option value="todos">Todos ({opcionesFiltro.supervisores.length})</option>
                  {opcionesFiltro.supervisores.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                      <span className="d-none d-xl-inline"> ({s.vendedores_count})</span>
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={6} sm={6} lg={2} className="mb-3">
              <Form.Group>
                <Form.Label className="small fw-semibold">
                  <FaUsers className="me-1" />
                  <span className="d-none d-lg-inline">Vendedor</span>
                  <span className="d-lg-none">Vend.</span>
                </Form.Label>
                <Form.Select
                  size="sm"
                  value={filtros.vendedor_id}
                  onChange={(e) => handleFiltroChange('vendedor_id', e.target.value)}
                >
                  <option value="todos">Todos ({opcionesFiltro.vendedores.length})</option>
                  {opcionesFiltro.vendedores.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.first_name} {v.last_name}
                      <span className="d-none d-xl-inline">
                        {v.supervisor_nombre && ` → ${v.supervisor_nombre}`}
                      </span>
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={6} sm={6} lg={2} className="mb-3">
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
            <Col xs={6} sm={6} lg={2} className="mb-3">
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
            <Col xs={6} sm={6} lg={2} className="mb-3">
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
          </Row>
          <Row>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group>
                <Form.Label className="small fw-semibold">
                  <FaSearch className="me-1" />
                  <span className="d-none d-sm-inline">Búsqueda Global</span>
                  <span className="d-sm-none">Buscar</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Buscar póliza, cliente, vendedor..."
                  value={filtros.buscar}
                  onChange={(e) => handleFiltroChange('buscar', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={4} md={3} className="mb-3">
              <Form.Group>
                <Form.Label className="small fw-semibold">Ordenar por</Form.Label>
                <Form.Select
                  size="sm"
                  value={filtros.orden || 'mas_nuevos'}
                  onChange={(e) => handleFiltroChange('orden', e.target.value)}
                >
                  <option value="mas_nuevos">Más nuevos</option>
                  <option value="mas_antiguos">Más antiguos</option>
                  <option value="alfabetico">A-Z cliente</option>
                  <option value="alfabetico_desc">Z-A cliente</option>
                  <option value="supervisor">Por supervisor</option>
                  <option value="monto_desc">Mayor monto</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} sm={2} md={2} className="mb-3">
              <Form.Group>
                <Form.Label className="small fw-semibold d-none d-sm-block">&nbsp;</Form.Label>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="w-100"
                  onClick={limpiarFiltros}
                >
                  <span className="d-none d-sm-inline">Limpiar</span>
                  <span className="d-sm-none">Limpiar Filtros</span>
                </Button>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      )}
    </Card>
  );

  const renderTablaGlobal = () => (
    <Card className="shadow-sm card-no-border">
      <Card.Header className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-sm-center">
        <div className="mb-2 mb-sm-0">
          <h6 className="mb-1">
            <FaBuilding className="me-2" />
            <span className="d-none d-md-inline">Pólizas del Sistema Completo ({paginacion.total})</span>
            <span className="d-md-none">Pólizas ({paginacion.total})</span>
          </h6>
          <small className="text-muted d-block">
            <FaGlobe className="me-1" />
            <span className="d-none d-lg-inline">Vista global: {opcionesFiltro.supervisores.length} supervisores, {opcionesFiltro.vendedores.length} vendedores</span>
            <span className="d-lg-none">Global: {opcionesFiltro.supervisores.length} sup, {opcionesFiltro.vendedores.length} vend</span>
          </small>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-2 align-items-end align-sm-center">
          <ButtonGroup size="sm">
            <Button
              variant={tipoVista === 'tabla' ? 'primary' : 'outline-primary'}
              onClick={() => setTipoVista('tabla')}
            >
              <FaList className="me-1 d-sm-none" />
              <span className="d-none d-sm-inline">Tabla</span>
            </Button>
            <Button
              variant={tipoVista === 'tarjetas' ? 'primary' : 'outline-primary'}
              onClick={() => setTipoVista('tarjetas')}
            >
              <FaThLarge className="me-1 d-sm-none" />
              <span className="d-none d-sm-inline">Tarjetas</span>
            </Button>
          </ButtonGroup>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <p className="mt-2">Cargando pólizas del sistema...</p>
          </div>
        ) : polizas.length === 0 ? (
          <div className="text-center py-4">
            <FaFileAlt size={48} className="text-muted mb-3" />
            <p className="text-muted">No se encontraron pólizas con los filtros aplicados</p>
            <Button variant="outline-primary" size="sm" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          </div>
        ) : tipoVista === 'tabla' ? (
          <div className="table-scroll-mobile">
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th className="text-nowrap">Póliza</th>
                  <th className="text-nowrap cliente-column">Cliente</th>
                  <th className="text-nowrap d-none d-md-table-cell">Plan</th>
                  <th className="text-nowrap d-none d-lg-table-cell vendedor-column">Vendedor</th>
                  <th className="text-nowrap d-none d-xl-table-cell">Supervisor</th>
                  <th className="text-nowrap">Estado</th>
                  <th className="text-nowrap d-none d-sm-table-cell">Total</th>
                  <th className="text-nowrap d-none d-md-table-cell">Fecha</th>
                  <th className="text-nowrap actions-column">Acciones</th>
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
                            <small className="text-muted">#{poliza.numero_poliza}</small>
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
                    <td className="d-none d-xl-table-cell">
                      <div>
                        <FaUserTie className="text-primary me-1" />
                        <strong className="text-primary">
                          {poliza.supervisor?.nombre} {poliza.supervisor?.apellido}
                        </strong>
                        <br />
                        <small className="text-muted">{poliza.supervisor?.email}</small>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        <Badge bg={estadoBadge.bg}>{estadoBadge.text}</Badge>
                        {poliza.requiere_auditoria_medica === 1 && (
                          <Badge bg="danger" title="Requiere auditoría médica por IMC elevado">
                            🏥 Auditoría
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="d-none d-sm-table-cell">
                      <strong className="text-success">
                        {formatCurrency(poliza.total_final)}
                      </strong>
                    </td>
                    <td className="d-none d-md-table-cell">{formatFecha(poliza.created_at)}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleDescargarPDF(poliza)}
                          title="Descargar PDF"
                        >
                          <FaDownload />
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleVerDocumentos(poliza)}
                          title="Ver documentos"
                        >
                          <FaFileAlt />
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
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleVerHistorial(poliza)}
                          title="Ver historial de estados"
                        >
                          <FaHistory />
                        </Button>
                        <Button
                          variant="outline-dark"
                          size="sm"
                          onClick={() => handleEditarPoliza(poliza)}
                          title="Editar póliza"
                        >
                          <FaEdit />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          </div>
        ) : (
          <Row className="p-2 p-md-3 vista-tarjetas">
            {polizas.map(poliza => {
              const estadoBadge = getEstadoBadge(poliza.estado);
              return (
                <Col xs={12} sm={6} lg={4} xl={3} key={poliza.id} className="mb-3">
                  <Card className="h-100 shadow-sm">
                    <Card.Header className="pb-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1 me-2">
                          <h6 className="mb-1 text-truncate" title={poliza.numero_poliza_oficial || poliza.numero_poliza}>
                            {poliza.numero_poliza_oficial || poliza.numero_poliza}
                          </h6>
                          {poliza.numero_poliza_oficial && (
                            <small className="text-muted d-block">#{poliza.numero_poliza}</small>
                          )}
                        </div>
                        <div className="d-flex flex-column gap-1 flex-shrink-0">
                          <Badge bg={estadoBadge.bg}>
                            <span className="d-none d-sm-inline">{estadoBadge.text}</span>
                            <span className="d-sm-none">{estadoBadge.text.substring(0, 8)}</span>
                          </Badge>
                          {poliza.requiere_auditoria_medica === 1 && (
                            <Badge bg="danger" title="Requiere auditoría médica por IMC elevado">
                              🏥 Auditoría
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Body className="py-2">
                      <h6 className="text-truncate mb-1" title={`${poliza.prospecto_nombre} ${poliza.prospecto_apellido}`}>
                        {poliza.prospecto_nombre} {poliza.prospecto_apellido}
                      </h6>
                      <p className="text-muted small mb-1">
                        <strong>Plan:</strong> <span className="text-truncate d-inline-block" style={{maxWidth: '120px'}} title={poliza.plan_nombre}>{poliza.plan_nombre}</span>
                      </p>
                      <p className="text-muted small mb-1 d-none d-lg-block">
                        <FaUsers className="me-1" />
                        <strong>Vendedor:</strong> 
                        <span className="text-truncate d-inline-block" style={{maxWidth: '100px'}} title={`${poliza.vendedor?.nombre} ${poliza.vendedor?.apellido}`}>
                          {poliza.vendedor?.nombre} {poliza.vendedor?.apellido}
                        </span>
                      </p>
                      <p className="text-muted small mb-1 d-none d-xl-block">
                        <FaUserTie className="me-1 text-primary" />
                        <strong>Supervisor:</strong> 
                        <span className="text-primary text-truncate d-inline-block" style={{maxWidth: '100px'}} title={`${poliza.supervisor?.nombre} ${poliza.supervisor?.apellido}`}>
                          {poliza.supervisor?.nombre} {poliza.supervisor?.apellido}
                        </span>
                      </p>
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <strong className="text-success">{formatCurrency(poliza.total_final)}</strong>
                        <small className="text-muted d-none d-sm-inline">{formatFecha(poliza.created_at)}</small>
                      </div>
                    </Card.Body>
                    <Card.Footer className="pt-2">
                      <div className="d-flex gap-1 justify-content-center flex-wrap">
                        <Button 
                          size="sm" 
                          variant="outline-success" 
                          onClick={() => handleDescargarPDF(poliza)}
                          title="Descargar PDF"
                        >
                          <FaDownload />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline-secondary" 
                          onClick={() => handleVerDocumentos(poliza)}
                          title="Ver documentos"
                        >
                          <FaFileAlt />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline-warning" 
                          onClick={() => handleCambiarEstado(poliza)}
                          title="Cambiar estado"
                        >
                          <FaExchangeAlt />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline-info" 
                          onClick={() => handleVerHistorial(poliza)}
                          title="Ver historial"
                        >
                          <FaHistory />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline-dark" 
                          onClick={() => handleEditarPoliza(poliza)}
                          title="Editar póliza"
                        >
                          <FaEdit />
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

  return (
    <Container fluid className="py-3 py-md-4 polizas-backoffice">
      {/* <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-sm-center mb-3 mb-md-4">
        <div className="mb-2 mb-sm-0">
          <h2 className="mb-1">
            <FaBuilding className="me-2 text-primary" />
            <span className="d-none d-md-inline">Gestión de Pólizas - Back Office</span>
            <span className="d-md-none">Pólizas - Back Office</span>
          </h2>
          <p className="text-muted mb-0">
            <FaGlobe className="me-1" />
            <span className="d-none d-sm-inline">Vista completa de todas las pólizas del sistema</span>
            <span className="d-sm-none">Vista completa del sistema</span>
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={fetchEstadisticas}
            disabled={loadingStats}
          >
            {loadingStats ? <Spinner size="sm" /> : 'Actualizar'}
          </Button>
        </div>
      </div> */}

      {renderEstadisticasGlobales()}
      {renderFiltrosGlobales()}
      
      <div className="mb-4"></div>
      
      {renderTablaGlobal()}

      {/* Paginación */}
      {paginacion.total_pages > 1 && (
        <div className="d-flex justify-content-center mt-3 mt-md-4 pagination-controls">
          <Button
            variant="outline-primary"
            size="sm"
            disabled={paginacion.current_page === 1}
            onClick={() => setPaginacion(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
          >
            <span className="d-none d-sm-inline">Anterior</span>
            <span className="d-sm-none">‹</span>
          </Button>
          <span className="mx-2 mx-sm-3 align-self-center small">
            <span className="d-none d-sm-inline">Página {paginacion.current_page} de {paginacion.total_pages}</span>
            <span className="d-sm-none">{paginacion.current_page}/{paginacion.total_pages}</span>
          </span>
          <Button
            variant="outline-primary"
            size="sm"
            disabled={paginacion.current_page === paginacion.total_pages}
            onClick={() => setPaginacion(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
          >
            <span className="d-none d-sm-inline">Siguiente</span>
            <span className="d-sm-none">›</span>
          </Button>
        </div>
      )}

      {/* ✅ MODALES */}
      
      {/* Modal Documentos */}
      <Modal show={modalDocumentos} onHide={() => setModalDocumentos(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFileAlt className="me-2" />
            Documentos de Póliza
            {polizaSeleccionada && (
              <Badge bg="primary" className="ms-2">
                {polizaSeleccionada.numero_poliza_oficial || polizaSeleccionada.numero_poliza}
              </Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingDocumentos ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">Cargando documentos...</p>
            </div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6>Total de documentos: {Object.values(documentos).flat().length}</h6>
             
              </div>
              
              {Object.keys(documentos).length === 0 ? (
                <Alert variant="info">
                  <FaFileAlt className="me-2" />
                  No hay documentos cargados para esta póliza
                </Alert>
              ) : (
                <Accordion>
                  {Object.entries(documentos).map(([tipo, docs], index) => (
                    <Accordion.Item eventKey={index.toString()} key={tipo}>
                      <Accordion.Header>
                        <strong>{formatTipoDocumento(tipo)}</strong>
                        <Badge bg="secondary" className="ms-2">{docs.length}</Badge>
                      </Accordion.Header>
                      <Accordion.Body>
                        <Row>
                          {docs.map(doc => (
                            <Col xs={12} md={6} lg={4} key={doc.id} className="mb-3">
                              <Card className="h-100">
                                <Card.Body className="p-2">
                                  <h6 className="text-truncate" title={doc.nombre_original}>
                                    {doc.nombre_original}
                                  </h6>
                                  <p className="small text-muted mb-1">
                                    Tamaño: {formatFileSize(doc.tamaño_bytes)}
                                  </p>
                                  <p className="small text-muted mb-2">
                                    Subido: {formatearFecha(doc.fecha_subida)}
                                  </p>
                                  <div className="d-flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline-primary"
                                      onClick={() => handleDescargarDocumento(doc.id, doc.nombre_original)}
                                    >
                                      <FaDownload />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline-info"
                                      onClick={() => handlePreviewDocumento(doc.id, doc.tipo_mime)}
                                    >
                                      <FaEye />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline-danger"
                                      onClick={() => handleEliminarDocumento(doc.id)}
                                    >
                                      <FaTrash />
                                    </Button>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal Cambiar Estado */}
      <Modal show={modalCambiarEstado} onHide={() => setModalCambiarEstado(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaExchangeAlt className="me-2" />
            Cambiar Estado de Póliza
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {polizaCambioEstado && (
            <>
              <Alert variant="info">
                <strong>Póliza:</strong> {polizaCambioEstado.numero_poliza_oficial || polizaCambioEstado.numero_poliza}<br />
                <strong>Cliente:</strong> {polizaCambioEstado.prospecto_nombre} {polizaCambioEstado.prospecto_apellido}<br />
                <strong>Estado actual:</strong> <Badge bg={getEstadoBadge(polizaCambioEstado.estado).bg}>
                  {getEstadoBadge(polizaCambioEstado.estado).text}
                </Badge>
              </Alert>
              
              <Form.Group className="mb-3">
                <Form.Label>Nuevo Estado</Form.Label>
                <Form.Select
                  value={estadoSeleccionado}
                  onChange={(e) => setEstadoSeleccionado(e.target.value)}
                >
                  <option value="">Seleccionar estado...</option>
                  <option value="asesor">Asesor</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="back_office">Back Office</option>
                  <option value="venta_cerrada">Venta Cerrada</option>
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Motivo del Cambio</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={motivoCambio}
                  onChange={(e) => setMotivoCambio(e.target.value)}
                  placeholder="Describa el motivo del cambio de estado..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalCambiarEstado(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={confirmarCambioEstado}
            disabled={loadingCambioEstado || !estadoSeleccionado || !motivoCambio.trim()}
          >
            {loadingCambioEstado ? <Spinner size="sm" className="me-1" /> : null}
            Cambiar Estado
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Conversaciones */}
      <Modal show={modalConversaciones} onHide={() => setModalConversaciones(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaComments className="me-2" />
            Conversaciones WhatsApp
            {prospectoSeleccionado && (
              <Badge bg="success" className="ms-2">
                {prospectoSeleccionado.nombre} {prospectoSeleccionado.apellido}
              </Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingConversaciones ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">Cargando conversaciones...</p>
            </div>
          ) : conversacionesProspecto.length === 0 ? (
            <Alert variant="info">
              <FaComments className="me-2" />
              No hay conversaciones registradas para este prospecto
            </Alert>
          ) : (
            <div className="conversaciones-list">
              {conversacionesProspecto.map(conv => (
                <Card key={conv.id} className="mb-3">
                  <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{conv.numero_conversacion}</strong>
                        <Badge bg={getEstadoConversacion(conv.estado).bg} className="ms-2">
                          {getEstadoConversacion(conv.estado).text}
                        </Badge>
                      </div>
                      <small className="text-muted">
                        {formatearFecha(conv.created_at)}
                      </small>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <p className="mb-1">
                      <strong>Teléfono:</strong> {conv.telefono_cliente}
                    </p>
                    <p className="mb-1">
                      <strong>Mensajes:</strong> {conv.total_mensajes} 
                      {conv.mensajes_no_leidos > 0 && (
                        <Badge bg="warning" className="ms-1">
                          {conv.mensajes_no_leidos} sin leer
                        </Badge>
                      )}
                    </p>
                    {conv.ultimo_mensaje && (
                      <p className="mb-1">
                        <strong>Último mensaje:</strong> {conv.ultimo_mensaje.contenido?.substring(0, 100)}...
                      </p>
                    )}
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal Preview Documento */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Preview Documento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewUrl && (
            <div className="text-center">
              {previewMime?.includes('image') ? (
                <img src={previewUrl} alt="Preview" className="img-fluid" />
              ) : previewMime?.includes('pdf') ? (
                <iframe src={previewUrl} width="100%" height="500px" />
              ) : (
                <Alert variant="info">
                  No se puede previsualizar este tipo de archivo
                </Alert>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal Carga de Documentos */}
      <Modal show={modalCargaDocumentos} onHide={() => setModalCargaDocumentos(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFileUpload className="me-2" />
            Cargar Documentos
            {polizaCargaDocumentos && (
              <Badge bg="primary" className="ms-2">
                {polizaCargaDocumentos.numero_poliza_oficial || polizaCargaDocumentos.numero_poliza}
              </Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <FaExclamationTriangle className="me-2" />
            Funcionalidad de carga de documentos disponible próximamente.
            Por ahora puede gestionar documentos desde el sistema de gestión de documentos.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalCargaDocumentos(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

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
                      <small><strong>Cliente:</strong> {polizaHistorial.prospecto_nombre} {polizaHistorial.prospecto_apellido}</small>
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

      {/* ✅ MODAL EDITAR PÓLIZA - COMPLETO COMO SUPERVISOR */}
      <Modal show={modalEditarPoliza} onHide={() => setModalEditarPoliza(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEdit className="me-2" />
            Editar Póliza
            {polizaEdicion && (
              <Badge bg="primary" className="ms-2">
                {polizaEdicion.numero_poliza_oficial || polizaEdicion.numero_poliza}
              </Badge>
            )}
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
            <>
              <Tabs defaultActiveKey="informacion-afiliado" className="mb-3">
                
                {/* TAB: Información del Afiliado */}
                <Tab eventKey="informacion_afiliado" title="Info. Afiliado">
                  <Alert variant="warning" className="mb-4">
                    <strong>Información del Afiliado</strong><br />
                    <small>Campos internos completados por personal de Back Office. Información administrativa del afiliado.</small>
                  </Alert>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Nº de Afiliado Asignado
                          {polizaEdicion.numero_poliza_oficial && (
                            <Badge bg="info" className="ms-2" style={{ fontSize: '0.7rem' }}>
                              Sugerido: {polizaEdicion.numero_poliza_oficial}
                            </Badge>
                          )}
                        </Form.Label>
                        <div className="d-flex">
                          <Form.Control
                            type="text"
                            value={polizaEdicion.informacion_afiliado?.numero_afiliado_asignado || ''}
                            onChange={(e) => handleCampoEdicion('informacion_afiliado', 'numero_afiliado_asignado', e.target.value)}
                            placeholder="Ej: 001234567"
                          />
                          {polizaEdicion.numero_poliza_oficial && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="ms-2"
                              onClick={() => handleCampoEdicion('informacion_afiliado', 'numero_afiliado_asignado', polizaEdicion.numero_poliza_oficial)}
                              title="Usar número oficial de póliza"
                            >
                              <FaCopy />
                            </Button>
                          )}
                        </div>
                        {polizaEdicion.numero_poliza_oficial && (
                          <Form.Text className="text-muted">
                            <small>Sugerido: {polizaEdicion.numero_poliza_oficial}</small>
                          </Form.Text>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Nº de Historia Clínica</Form.Label>
                        <div className="d-flex">
                          <Form.Control
                            type="text"
                            value={polizaEdicion.informacion_afiliado?.numero_historia_clinica || ''}
                            onChange={(e) => handleCampoEdicion('informacion_afiliado', 'numero_historia_clinica', e.target.value)}
                            placeholder="Ej: HC-001234"
                          />
                          {polizaEdicion.numero_poliza_oficial && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="ms-2"
                              onClick={() => handleCampoEdicion('informacion_afiliado', 'numero_historia_clinica', `HC-${polizaEdicion.numero_poliza_oficial}`)}
                              title="Generar usando número oficial de póliza"
                            >
                              <FaCopy />
                            </Button>
                          )}
                        </div>
                        {polizaEdicion.numero_poliza_oficial && (
                          <Form.Text className="text-muted">
                            <small>Sugerido: HC-{polizaEdicion.numero_poliza_oficial}</small>
                          </Form.Text>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Credenciales Realizadas</Form.Label>
                        <Form.Control
                          type="text"
                          value={polizaEdicion.informacion_afiliado?.credenciales_realizadas || ''}
                          onChange={(e) => handleCampoEdicion('informacion_afiliado', 'credenciales_realizadas', e.target.value)}
                          placeholder="Ej: Sí / No / Pendiente"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Fecha de Afiliación Efectiva</Form.Label>
                        <Form.Control
                          type="date"
                          value={polizaEdicion.informacion_afiliado?.fecha_afiliacion || ''}
                          onChange={(e) => handleCampoEdicion('informacion_afiliado', 'fecha_afiliacion', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Notas Internas del Afiliado</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={polizaEdicion.informacion_afiliado?.notas_afiliacion || ''}
                          onChange={(e) => handleCampoEdicion('informacion_afiliado', 'notas_afiliacion', e.target.value)}
                          placeholder="Observaciones internas sobre el proceso de afiliación..."
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab>

                {/* TAB: Información de Facturación */}
                <Tab eventKey="informacion_facturacion" title="Info. Facturación">
                  <Alert variant="info" className="mb-4">
                    <strong>Información de Facturación</strong><br />
                    <small>Control interno de facturación y pagos. Solo Back Office puede gestionar estos campos.</small>
                  </Alert>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Número de Factura</Form.Label>
                        <Form.Control
                          type="text"
                          value={polizaEdicion.informacion_facturacion?.numero_factura || ''}
                          onChange={(e) => handleCampoEdicion('informacion_facturacion', 'numero_factura', e.target.value)}
                          placeholder="Ej: F-001234"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Monto de Factura ($)</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={polizaEdicion.informacion_facturacion?.monto_factura || ''}
                          onChange={(e) => handleCampoEdicion('informacion_facturacion', 'monto_factura', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Fecha de Facturación</Form.Label>
                        <Form.Control
                          type="date"
                          value={polizaEdicion.informacion_facturacion?.fecha_facturacion || ''}
                          onChange={(e) => handleCampoEdicion('informacion_facturacion', 'fecha_facturacion', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Estado de Pago</Form.Label>
                        <Form.Select
                          value={polizaEdicion.informacion_facturacion?.estado_pago || ''}
                          onChange={(e) => handleCampoEdicion('informacion_facturacion', 'estado_pago', e.target.value)}
                        >
                          <option value="">-- Seleccionar Estado --</option>
                          <option value="pendiente">Pendiente</option>
                          <option value="pagado">Pagado</option>
                          <option value="vencido">Vencido</option>
                          <option value="anulado">Anulado</option>
                          <option value="refinanciado">Refinanciado</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Observaciones de Facturación</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={polizaEdicion.informacion_facturacion?.observaciones_facturacion || ''}
                          onChange={(e) => handleCampoEdicion('informacion_facturacion', 'observaciones_facturacion', e.target.value)}
                          placeholder="Observaciones sobre el proceso de facturación..."
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab>

                {/* TAB: Solicitud de Afiliación */}
                <Tab eventKey="solicitud_afiliacion" title="Solicitud Afiliación">
                  <Alert variant="secondary" className="mb-4">
                    <strong>Datos de la Solicitud de Afiliación</strong><br />
                    <small>Información del proceso de solicitud y canales de ingreso.</small>
                  </Alert>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Canal de Ingreso</Form.Label>
                        <Form.Select
                          value={polizaEdicion.solicitud_afiliacion?.canal_ingreso || ''}
                          onChange={(e) => handleCampoEdicion('solicitud_afiliacion', 'canal_ingreso', e.target.value)}
                        >
                          <option value="">-- Seleccionar Canal --</option>
                          <option value="web">Página Web</option>
                          <option value="telefono">Teléfono</option>
                          <option value="presencial">Presencial</option>
                          <option value="vendedor">Vendedor</option>
                          <option value="referido">Referido</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Fecha de Solicitud Original</Form.Label>
                        <Form.Control
                          type="date"
                          value={polizaEdicion.solicitud_afiliacion?.fecha_solicitud || ''}
                          onChange={(e) => handleCampoEdicion('solicitud_afiliacion', 'fecha_solicitud', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Observaciones de la Solicitud</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          value={polizaEdicion.solicitud_afiliacion?.observaciones || ''}
                          onChange={(e) => handleCampoEdicion('solicitud_afiliacion', 'observaciones', e.target.value)}
                          placeholder="Detalles adicionales sobre la solicitud de afiliación..."
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab>

                {/* TAB: Datos Comerciales */}
                <Tab eventKey="datos_comerciales" title="Datos Comerciales">
                  <Alert variant="success" className="mb-4">
                    <strong>Información Comercial</strong><br />
                    <small>Datos relacionados con vendedores, comisiones y aspectos comerciales.</small>
                  </Alert>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Comisión del Vendedor (%)</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={polizaEdicion.datos_comerciales?.comision_vendedor || ''}
                          onChange={(e) => handleCampoEdicion('datos_comerciales', 'comision_vendedor', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Estado Comisión</Form.Label>
                        <Form.Select
                          value={polizaEdicion.datos_comerciales?.estado_comision || ''}
                          onChange={(e) => handleCampoEdicion('datos_comerciales', 'estado_comision', e.target.value)}
                        >
                          <option value="">-- Seleccionar Estado --</option>
                          <option value="pendiente">Pendiente</option>
                          <option value="calculada">Calculada</option>
                          <option value="pagada">Pagada</option>
                          <option value="retenida">Retenida</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Observaciones Comerciales</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={polizaEdicion.datos_comerciales?.observaciones_comerciales || ''}
                          onChange={(e) => handleCampoEdicion('datos_comerciales', 'observaciones_comerciales', e.target.value)}
                          placeholder="Observaciones sobre aspectos comerciales de la póliza..."
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab>

                {/* TAB: Datos Personales */}
                <Tab eventKey="datos_personales" title="Datos Personales">
                  <Alert variant="primary" className="mb-4">
                    <strong>Datos Personales del Titular</strong><br />
                    <small>Información personal y de contacto del titular de la póliza.</small>
                  </Alert>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control
                          type="text"
                          value={polizaEdicion.datos_personales?.nombre || ''}
                          onChange={(e) => handleCampoEdicion('datos_personales', 'nombre', e.target.value)}
                          placeholder="Nombre del titular"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Apellido</Form.Label>
                        <Form.Control
                          type="text"
                          value={polizaEdicion.datos_personales?.apellido || ''}
                          onChange={(e) => handleCampoEdicion('datos_personales', 'apellido', e.target.value)}
                          placeholder="Apellido del titular"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>DNI/CUIL</Form.Label>
                        <Form.Control
                          type="text"
                          value={polizaEdicion.datos_personales?.dni_cuil || ''}
                          onChange={(e) => handleCampoEdicion('datos_personales', 'dni_cuil', e.target.value)}
                          placeholder="Sin puntos ni espacios"
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
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Sexo</Form.Label>
                        <Form.Select
                          value={polizaEdicion.datos_personales?.sexo || ''}
                          onChange={(e) => handleCampoEdicion('datos_personales', 'sexo', e.target.value)}
                        >
                          <option value="">-- Seleccionar --</option>
                          <option value="masculino">Masculino</option>
                          <option value="femenino">Femenino</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Estado Civil</Form.Label>
                        <Form.Select
                          value={polizaEdicion.datos_personales?.estado_civil || ''}
                          onChange={(e) => handleCampoEdicion('datos_personales', 'estado_civil', e.target.value)}
                        >
                          <option value="">-- Seleccionar --</option>
                          <option value="Soltero/a">Soltero/a</option>
                          <option value="Casado/a">Casado/a</option>
                          <option value="Divorciado/a">Divorciado/a</option>
                          <option value="Viudo/a">Viudo/a</option>
                          <option value="Concubinato">Concubinato</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          value={polizaEdicion.datos_personales?.email || ''}
                          onChange={(e) => handleCampoEdicion('datos_personales', 'email', e.target.value)}
                          placeholder="ejemplo@email.com"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Teléfono</Form.Label>
                        <Form.Control
                          type="tel"
                          value={polizaEdicion.datos_personales?.telefono || ''}
                          onChange={(e) => handleCampoEdicion('datos_personales', 'telefono', e.target.value)}
                          placeholder="Ej: 1155965549"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Celular</Form.Label>
                        <Form.Control
                          type="tel"
                          value={polizaEdicion.datos_personales?.celular || ''}
                          onChange={(e) => handleCampoEdicion('datos_personales', 'celular', e.target.value)}
                          placeholder="Número de celular"
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
                          placeholder="Ej: Argentina"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Dirección</Form.Label>
                        <Form.Control
                          type="text"
                          value={polizaEdicion.datos_personales?.direccion || ''}
                          onChange={(e) => handleCampoEdicion('datos_personales', 'direccion', e.target.value)}
                          placeholder="Calle"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Número</Form.Label>
                        <Form.Control
                          type="text"
                          value={polizaEdicion.datos_personales?.numero || ''}
                          onChange={(e) => handleCampoEdicion('datos_personales', 'numero', e.target.value)}
                          placeholder="Número de casa/depto"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Piso</Form.Label>
                        <Form.Control
                          type="text"
                          value={polizaEdicion.datos_personales?.piso || ''}
                          onChange={(e) => handleCampoEdicion('datos_personales', 'piso', e.target.value)}
                          placeholder="Piso (opcional)"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Departamento</Form.Label>
                        <Form.Control
                          type="text"
                          value={polizaEdicion.datos_personales?.dpto || ''}
                          onChange={(e) => handleCampoEdicion('datos_personales', 'dpto', e.target.value)}
                          placeholder="Depto (opcional)"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Código Postal</Form.Label>
                        <Form.Control
                          type="text"
                          value={polizaEdicion.datos_personales?.cod_postal || ''}
                          onChange={(e) => handleCampoEdicion('datos_personales', 'cod_postal', e.target.value)}
                          placeholder="CP"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Localidad</Form.Label>
                        <Form.Control
                          type="text"
                          value={polizaEdicion.datos_personales?.localidad || ''}
                          onChange={(e) => handleCampoEdicion('datos_personales', 'localidad', e.target.value)}
                          placeholder="Localidad"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Tipo de Afiliación</Form.Label>
                        <Form.Select
                          value={polizaEdicion.datos_personales?.tipo_afiliacion || ''}
                          onChange={(e) => handleCampoEdicion('datos_personales', 'tipo_afiliacion', e.target.value)}
                        >
                          <option value="">-- Seleccionar --</option>
                          <option value="Particular/autónomo">Particular/autónomo</option>
                          <option value="Con recibo de sueldo">Con recibo de sueldo</option>
                          <option value="Monotributista">Monotributista</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Peso (kg)</Form.Label>
                        <Form.Control
                          type="number"
                          value={polizaEdicion.datos_personales?.peso || ''}
                          onChange={(e) => handleCampoEdicion('datos_personales', 'peso', e.target.value)}
                          placeholder="Peso en kg"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Altura (cm)</Form.Label>
                        <Form.Control
                          type="number"
                          value={polizaEdicion.datos_personales?.altura || ''}
                          onChange={(e) => handleCampoEdicion('datos_personales', 'altura', e.target.value)}
                          placeholder="Altura en cm"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Condición IVA</Form.Label>
                        <Form.Select
                          value={polizaEdicion.datos_personales?.condicion_iva || ''}
                          onChange={(e) => handleCampoEdicion('datos_personales', 'condicion_iva', e.target.value)}
                        >
                          <option value="">-- Seleccionar --</option>
                          <option value="Consumidor Final">Consumidor Final</option>
                          <option value="Responsable Inscripto">Responsable Inscripto</option>
                          <option value="Monotributista">Monotributista</option>
                          <option value="Exento">Exento</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab>

                {/* TAB: Integrantes */}
                <Tab eventKey="integrantes" title="Integrantes (0)">
                  <Alert variant="secondary" className="mb-4">
                    <strong>Integrantes del Grupo Familiar</strong><br />
                    <small>Información de los integrantes que forman parte de la póliza familiar.</small>
                  </Alert>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6>Lista de Integrantes</h6>
                    <Button variant="primary" size="sm">
                      <FaPlus className="me-1" />
                      Agregar Integrante
                    </Button>
                  </div>

                  {(!polizaEdicion.integrantes || polizaEdicion.integrantes.length === 0) ? (
                    <Alert variant="info">
                      <FaUsers className="me-2" />
                      No hay integrantes adicionales registrados en esta póliza
                    </Alert>
                  ) : (
                    <div className="integrantes-list">
                      {polizaEdicion.integrantes.map((integrante, index) => (
                        <Card key={index} className="mb-3">
                          <Card.Header>
                            <div className="d-flex justify-content-between align-items-center">
                              <strong>Integrante {index + 1}</strong>
                              <Button variant="outline-danger" size="sm">
                                <FaTrash />
                              </Button>
                            </div>
                          </Card.Header>
                          <Card.Body>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Nombre Completo</Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={integrante.nombre_completo || ''}
                                    onChange={(e) => handleCampoEdicion('integrantes', 'nombre_completo', e.target.value, index)}
                                    placeholder="Nombre y apellido"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Parentesco</Form.Label>
                                  <Form.Select
                                    value={integrante.parentesco || ''}
                                    onChange={(e) => handleCampoEdicion('integrantes', 'parentesco', e.target.value, index)}
                                  >
                                    <option value="">-- Seleccionar --</option>
                                    <option value="cónyuge">Cónyuge</option>
                                    <option value="hijo">Hijo/a</option>
                                    <option value="padre">Padre</option>
                                    <option value="madre">Madre</option>
                                    <option value="hermano">Hermano/a</option>
                                    <option value="otro">Otro</option>
                                  </Form.Select>
                                </Form.Group>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  )}
                </Tab>

                {/* TAB: Referencias */}
                <Tab eventKey="referencias" title="Referencias (1)">
                  <Alert variant="info" className="mb-4">
                    <strong>Referencias Personales</strong><br />
                    <small>Personas de referencia proporcionadas por el titular de la póliza.</small>
                  </Alert>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6>Referencias Registradas</h6>
                    <Button variant="primary" size="sm">
                      <FaPlus className="me-1" />
                      Agregar Referencia
                    </Button>
                  </div>

                  {(!polizaEdicion.referencias || polizaEdicion.referencias.length === 0) ? (
                    <Alert variant="warning">
                      <FaUser className="me-2" />
                      No hay referencias registradas para esta póliza
                    </Alert>
                  ) : (
                    <div className="referencias-list">
                      {polizaEdicion.referencias.map((referencia, index) => (
                        <Card key={index} className="mb-3">
                          <Card.Header>
                            <div className="d-flex justify-content-between align-items-center">
                              <strong>Referencia {index + 1}</strong>
                              <Button variant="outline-danger" size="sm">
                                <FaTrash />
                              </Button>
                            </div>
                          </Card.Header>
                          <Card.Body>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Nombre Completo</Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={referencia.nombre || ''}
                                    onChange={(e) => handleCampoEdicion('referencias', 'nombre', e.target.value, index)}
                                    placeholder="Nombre y apellido de la referencia"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Teléfono</Form.Label>
                                  <Form.Control
                                    type="tel"
                                    value={referencia.telefono || ''}
                                    onChange={(e) => handleCampoEdicion('referencias', 'telefono', e.target.value, index)}
                                    placeholder="Teléfono de contacto"
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                            <Row>
                              <Col md={12}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Relación con el Titular</Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={referencia.relacion || ''}
                                    onChange={(e) => handleCampoEdicion('referencias', 'relacion', e.target.value, index)}
                                    placeholder="Ej: Amigo, Compañero de trabajo, Familiar, etc."
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  )}
                </Tab>

                {/* ✅ TAB 4: NUEVO - Declaración de Salud (IGUAL AL SUPERVISOR) */}
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
                          // ✅ RENDERIZAR POR INTEGRANTE - MOSTRANDO TODAS LAS PREGUNTAS
                          return keys.map((integranteIndex, idx) => {
                            const respuestasIntegrante = respuestas[integranteIndex] || {};
                            const nombreIntegrante = integranteIndex === "0" 
                              ? "Titular" 
                              : polizaEdicion.integrantes?.[parseInt(integranteIndex) - 1]?.nombre || `Integrante ${parseInt(integranteIndex) + 1}`;
                            
                            // ✅ Obtener TODAS las preguntas posibles, no solo las que tienen datos
                            const todasLasPreguntas = obtenerTodasLasPreguntas();
                            
                            return (
                              <Card key={integranteIndex} className="mb-4">
                                <Card.Header className="bg-primary text-white">
                                  <h6 className="mb-0">
                                    Declaración de Salud - {nombreIntegrante}
                                    <span className="badge bg-light text-dark ms-2">
                                      {todasLasPreguntas.length} preguntas
                                    </span>
                                  </h6>
                                </Card.Header>
                                <Card.Body>
                                  <Row>
                                    {todasLasPreguntas.map((preguntaKey, preguntaIdx) => {
                                      const pregunta = respuestasIntegrante[preguntaKey] || { respuesta: '', detalle: '' };
                                      
                                      return (
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
                                                    if (!nuevasRespuestas[integranteIndex]) {
                                                      nuevasRespuestas[integranteIndex] = {};
                                                    }
                                                    nuevasRespuestas[integranteIndex] = {
                                                      ...nuevasRespuestas[integranteIndex],
                                                      [preguntaKey]: {
                                                        ...nuevasRespuestas[integranteIndex][preguntaKey],
                                                        respuesta: e.target.value,
                                                        detalle: pregunta.detalle || ''
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
                                                      if (!nuevasRespuestas[integranteIndex]) {
                                                        nuevasRespuestas[integranteIndex] = {};
                                                      }
                                                      nuevasRespuestas[integranteIndex] = {
                                                        ...nuevasRespuestas[integranteIndex],
                                                        [preguntaKey]: {
                                                          ...nuevasRespuestas[integranteIndex][preguntaKey],
                                                          respuesta: pregunta.respuesta || '',
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
                                      );
                                    })}
                                  </Row>
                                </Card.Body>
                              </Card>
                            );
                          });
                        } else {
                          // ✅ RENDERIZAR ESTRUCTURA SIMPLE - MOSTRANDO TODAS LAS PREGUNTAS
                          const todasLasPreguntas = obtenerTodasLasPreguntas();
                          
                          return (
                            <Card className="mb-4">
                              <Card.Header>
                                <h6 className="mb-0">Preguntas Médicas ({todasLasPreguntas.length})</h6>
                              </Card.Header>
                              <Card.Body>
                                <Row>
                                  {todasLasPreguntas.map((key, idx) => {
                                    const pregunta = respuestas[key] || { respuesta: '', detalle: '' };
                                    
                                    return (
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
                                                    respuesta: e.target.value,
                                                    detalle: pregunta.detalle || ''
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
                                                      respuesta: pregunta.respuesta || '',
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
                                    );
                                  })}
                                </Row>
                              </Card.Body>
                            </Card>
                          );
                        }
                      })()}
                    </div>
                  ) : (
                    <div>
                      {/* ✅ Si no hay datos, mostrar formulario editable vacío */}
                      <Card className="mb-4">
                        <Card.Header className="bg-primary text-white">
                          <h6 className="mb-0">
                            Declaración de Salud - Titular
                            <span className="badge bg-light text-dark ms-2">
                              {obtenerTodasLasPreguntas().length} preguntas
                            </span>
                          </h6>
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            {obtenerTodasLasPreguntas().map((preguntaKey, idx) => {
                              const pregunta = { respuesta: '', detalle: '' };
                              
                              return (
                                <Col md={6} key={`titular-${preguntaKey}`} className="mb-4">
                                  <Card className="h-100 border-light">
                                    <Card.Body>
                                      <Form.Group className="mb-3">
                                        <Form.Label className="fw-bold text-primary">
                                          {formatearPregunta(preguntaKey)}
                                        </Form.Label>
                                        <Form.Select
                                          value={pregunta.respuesta || ''}
                                          onChange={e => {
                                            const nuevasRespuestas = {
                                              ...polizaEdicion.declaracion_salud?.respuestas,
                                              "0": {
                                                ...polizaEdicion.declaracion_salud?.respuestas?.["0"],
                                                [preguntaKey]: {
                                                  respuesta: e.target.value,
                                                  detalle: ''
                                                }
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
                                              const nuevasRespuestas = {
                                                ...polizaEdicion.declaracion_salud?.respuestas,
                                                "0": {
                                                  ...polizaEdicion.declaracion_salud?.respuestas?.["0"],
                                                  [preguntaKey]: {
                                                    respuesta: pregunta.respuesta || '',
                                                    detalle: e.target.value
                                                  }
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
                              );
                            })}
                          </Row>
                        </Card.Body>
                      </Card>
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

                {/* TAB: Cobertura Anterior */}
                <Tab eventKey="cobertura_anterior" title="Cobertura Anterior">
                  <Alert variant="secondary" className="mb-4">
                    <strong>Cobertura de Salud Anterior</strong><br />
                    <small>Información sobre coberturas médicas previas del titular y beneficiarios.</small>
                  </Alert>

                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>¿Tuvo cobertura médica anterior?</Form.Label>
                        <Form.Select
                          value={polizaEdicion.cobertura_anterior?.tuvo_cobertura || ''}
                          onChange={(e) => handleCampoEdicion('cobertura_anterior', 'tuvo_cobertura', e.target.value)}
                        >
                          <option value="">-- Seleccionar --</option>
                          <option value="si">Sí</option>
                          <option value="no">No</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  {polizaEdicion.cobertura_anterior?.tuvo_cobertura === 'si' && (
                    <>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Nombre de la Obra Social/Prepaga</Form.Label>
                            <Form.Control
                              type="text"
                              value={polizaEdicion.cobertura_anterior?.nombre_cobertura || ''}
                              onChange={(e) => handleCampoEdicion('cobertura_anterior', 'nombre_cobertura', e.target.value)}
                              placeholder="Ej: OSDE, Swiss Medical, IOMA, etc."
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Número de Afiliado Anterior</Form.Label>
                            <Form.Control
                              type="text"
                              value={polizaEdicion.cobertura_anterior?.numero_afiliado_anterior || ''}
                              onChange={(e) => handleCampoEdicion('cobertura_anterior', 'numero_afiliado_anterior', e.target.value)}
                              placeholder="Número de afiliado de la cobertura anterior"
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Fecha de Baja</Form.Label>
                            <Form.Control
                              type="date"
                              value={polizaEdicion.cobertura_anterior?.fecha_baja || ''}
                              onChange={(e) => handleCampoEdicion('cobertura_anterior', 'fecha_baja', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Motivo de Baja</Form.Label>
                            <Form.Select
                              value={polizaEdicion.cobertura_anterior?.motivo_baja || ''}
                              onChange={(e) => handleCampoEdicion('cobertura_anterior', 'motivo_baja', e.target.value)}
                            >
                              <option value="">-- Seleccionar --</option>
                              <option value="voluntaria">Baja Voluntaria</option>
                              <option value="falta_pago">Falta de Pago</option>
                              <option value="cambio_trabajo">Cambio de Trabajo</option>
                              <option value="mejor_oferta">Mejor Oferta</option>
                              <option value="otro">Otro</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                    </>
                  )}

                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Observaciones sobre Cobertura Anterior</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={polizaEdicion.cobertura_anterior?.observaciones || ''}
                          onChange={(e) => handleCampoEdicion('cobertura_anterior', 'observaciones', e.target.value)}
                          placeholder="Información adicional sobre la cobertura anterior..."
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab>

                {/* TAB: Datos Adicionales */}
                <Tab eventKey="datos_adicionales" title="Datos Adicionales">
                  <Alert variant="light" className="mb-4">
                    <strong>Información Adicional</strong><br />
                    <small>Campos adicionales y datos complementarios de la póliza.</small>
                  </Alert>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Profesión/Ocupación</Form.Label>
                        <Form.Control
                          type="text"
                          value={polizaEdicion.datos_adicionales?.profesion || ''}
                          onChange={(e) => handleCampoEdicion('datos_adicionales', 'profesion', e.target.value)}
                          placeholder="Profesión u ocupación principal"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Ingresos Mensuales</Form.Label>
                        <Form.Select
                          value={polizaEdicion.datos_adicionales?.rango_ingresos || ''}
                          onChange={(e) => handleCampoEdicion('datos_adicionales', 'rango_ingresos', e.target.value)}
                        >
                          <option value="">-- Seleccionar --</option>
                          <option value="hasta_100000">Hasta $100.000</option>
                          <option value="100000_200000">$100.000 - $200.000</option>
                          <option value="200000_300000">$200.000 - $300.000</option>
                          <option value="300000_500000">$300.000 - $500.000</option>
                          <option value="mas_500000">Más de $500.000</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Estado Civil</Form.Label>
                        <Form.Select
                          value={polizaEdicion.datos_adicionales?.estado_civil || ''}
                          onChange={(e) => handleCampoEdicion('datos_adicionales', 'estado_civil', e.target.value)}
                        >
                          <option value="">-- Seleccionar --</option>
                          <option value="soltero">Soltero/a</option>
                          <option value="casado">Casado/a</option>
                          <option value="divorciado">Divorciado/a</option>
                          <option value="viudo">Viudo/a</option>
                          <option value="concubinato">Concubinato</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Cantidad de Hijos</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          value={polizaEdicion.datos_adicionales?.cantidad_hijos || ''}
                          onChange={(e) => handleCampoEdicion('datos_adicionales', 'cantidad_hijos', parseInt(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Cómo se enteró de nuestros servicios?</Form.Label>
                        <Form.Select
                          value={polizaEdicion.datos_adicionales?.como_se_entero || ''}
                          onChange={(e) => handleCampoEdicion('datos_adicionales', 'como_se_entero', e.target.value)}
                        >
                          <option value="">-- Seleccionar --</option>
                          <option value="recomendacion">Recomendación</option>
                          <option value="internet">Internet</option>
                          <option value="publicidad">Publicidad</option>
                          <option value="vendedor">Vendedor</option>
                          <option value="redes_sociales">Redes Sociales</option>
                          <option value="otro">Otro</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Información Adicional</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          value={polizaEdicion.datos_adicionales?.informacion_adicional || ''}
                          onChange={(e) => handleCampoEdicion('datos_adicionales', 'informacion_adicional', e.target.value)}
                          placeholder="Cualquier información adicional relevante..."
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab>

                {/* TAB: Observaciones Generales */}
                <Tab eventKey="observaciones" title="Observaciones">
                  <Form.Group className="mb-3">
                    <Form.Label>Observaciones Generales de la Póliza</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={8}
                      value={polizaEdicion.observaciones || ''}
                      onChange={(e) => handleCampoEdicion('observaciones', '', e.target.value)}
                      placeholder="Ingrese observaciones generales sobre la póliza..."
                    />
                  </Form.Group>

                  <Alert variant="info">
                    <FaInfoCircle className="me-2" />
                    Las observaciones serán registradas en el historial de la póliza y serán visibles para todo el equipo.
                  </Alert>
                </Tab>

              </Tabs>

              {/* Motivo de edición */}
              <Card className="mt-4">
                <Card.Header>
                  <FaExclamationTriangle className="me-2 text-warning" />
                  Motivo de la Edición
                </Card.Header>
                <Card.Body>
                  <Form.Group>
                    <Form.Label>Describa el motivo de esta edición *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={motivoEdicion}
                      onChange={(e) => setMotivoEdicion(e.target.value)}
                      placeholder="Ingrese el motivo por el cual está editando esta póliza..."
                      className={!motivoEdicion.trim() ? 'border-warning' : ''}
                    />
                    {!motivoEdicion.trim() && (
                      <Form.Text className="text-warning">
                        <FaExclamationTriangle className="me-1" />
                        El motivo de edición es obligatorio
                      </Form.Text>
                    )}
                  </Form.Group>
                </Card.Body>
              </Card>
            </>
          
          ) : (
            <Alert variant="danger">
              Error al cargar los datos de la póliza
            </Alert>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setModalEditarPoliza(false)}
            disabled={guardandoEdicion}
          >
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleGuardarEdicion}
            disabled={guardandoEdicion || !motivoEdicion.trim()}
          >
            {guardandoEdicion ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Guardando...
              </>
            ) : (
              <>
                <FaSave className="me-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={4000} autohide>
          <Toast.Header>
            <strong className="me-auto">
              {toastVariant === 'success' ? '✅ Éxito' : 
               toastVariant === 'danger' ? '❌ Error' : 
               toastVariant === 'warning' ? '⚠️ Advertencia' : 'ℹ️ Información'}
            </strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

export default PolizasBackOffice;