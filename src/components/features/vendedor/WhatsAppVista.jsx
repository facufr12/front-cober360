import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, ListGroup, InputGroup, Dropdown, Alert } from 'react-bootstrap';
import { 
  FaWhatsapp, 
  FaPaperPlane, 
  FaArrowLeft,
  FaSearch,
  FaUser,
  FaBars,
  FaSync,
  FaEnvelope,
  FaCheck,
  FaCheckDouble,
  FaPaperclip,
  FaFile,
  FaTimes,
  FaImage,
  FaFilePdf,
  FaDownload
} from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../../config.js';
import { useNotifications } from '../../../contexts/NotificationContext';
import './WhatsAppVista.css';

const WhatsAppVista = ({ onOpenSidebar }) => {
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActual, setConversacionActual] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [plantillas, setPlantillas] = useState({});
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [vista, setVista] = useState('lista'); // 'lista' | 'chat'
  const [estadisticas, setEstadisticas] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [hayNuevosMensajes, setHayNuevosMensajes] = useState(false);
  const [ultimoConteoMensajes, setUltimoConteoMensajes] = useState(0);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  
  const mensajesRef = useRef(null);
  const intervalRef = useRef(null);
  const fileInputRef = useRef(null);

  // 🔔 Usar el contexto de notificaciones para actualizar navbar en tiempo real
  const { refreshNotifications, updateWhatsappUnread } = useNotifications();

  // 🔍 LOG: Verificar que onOpenSidebar se recibe correctamente
  useEffect(() => {
    console.log('📱 WhatsAppVista montado');
    console.log('📊 onOpenSidebar recibido:', typeof onOpenSidebar, onOpenSidebar);
  }, [onOpenSidebar]);

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

  // 🔄 Cargar datos iniciales con sincronización de notificaciones
  useEffect(() => {
    cargarConversaciones();
    cargarPlantillas();
    cargarEstadisticas();
    
    // Auto-refresh cada 5 segundos
    intervalRef.current = setInterval(() => {
      cargarConversaciones(); // Esto actualizará automáticamente las notificaciones
      if (conversacionActual) {
        cargarMensajes(conversacionActual.id);
      }
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [conversacionActual]);

  // 📜 Auto-scroll al final de mensajes
  useEffect(() => {
    if (mensajesRef.current) {
      const scrollElement = mensajesRef.current;
      const isNearBottom = scrollElement.scrollTop >= scrollElement.scrollHeight - scrollElement.clientHeight - 50;
      
      if (isNearBottom || mensajes.length > ultimoConteoMensajes) {
        setTimeout(() => {
          scrollElement.scrollTo({
            top: scrollElement.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
      
      if (mensajes.length > ultimoConteoMensajes && ultimoConteoMensajes > 0) {
        setHayNuevosMensajes(true);
        setTimeout(() => setHayNuevosMensajes(false), 3000);
      }
      
      setUltimoConteoMensajes(mensajes.length);
    }
  }, [mensajes, ultimoConteoMensajes]);

  // 📋 Cargar conversaciones con actualización de notificaciones
  const cargarConversaciones = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/conversaciones`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50, busqueda }
      });

      if (response.data.success) {
        const nuevasConversaciones = response.data.data;
        if (JSON.stringify(nuevasConversaciones) !== JSON.stringify(conversaciones)) {
          setConversaciones(nuevasConversaciones);
          
          // 🔔 ACTUALIZAR NOTIFICACIONES EN NAVBAR EN TIEMPO REAL
          const totalNoLeidos = nuevasConversaciones.reduce((sum, conv) => sum + (conv.mensajes_no_leidos || 0), 0);
          updateWhatsappUnread(totalNoLeidos);
          console.log('🔔 Notificaciones WhatsApp actualizadas:', totalNoLeidos);
        }
      }
    } catch (error) {
      console.error('❌ Error cargando conversaciones:', error);
    }
  };

    // 📝 Cargar plantillas
  const cargarPlantillas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/whatsapp/plantillas`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.plantillas) {
        setPlantillas(response.data.plantillas);
      } else {
        // Si no hay plantillas en la respuesta, usar fallback solo con plantillas habilitadas
        console.log('No se encontraron plantillas en la respuesta, usando fallback');
        // Fallback con plantillas predeterminadas
      setPlantillas({
        saludo_inicial: {
          id: 'saludo_inicial',
          nombre: 'Saludo Inicial',
          descripcion: '👋 ¡Hola! Soy {{vendedor}} de COBER. ¿Cómo estás? 😊 ¿Tenés alguna consulta sobre tu cotización o póliza 📄❓'
        },
        seguimiento_cotizacion: {
          id: 'seguimiento_cotizacion',
          nombre: 'Seguimiento Cotización',
          descripcion: '👋 Hola {{1}}, ¿Pudiste revisar la cotización que te envié 📄? Si tenés alguna duda o consulta, estoy acá para ayudarte 😊✨'
        },
        seguimiento_poliza: {
          id: 'seguimiento_poliza',
          nombre: 'Seguimiento Póliza',
          descripcion: '👋 Hola {{1}}, ¿Recibiste correctamente tu póliza 📄✅? Si necesitás ayuda con algo, estoy disponible para acompañarte 🤝✨'
        },
        informacion_adicional: {
          id: 'informacion_adicional',
          nombre: 'Información Adicional',
          descripcion: '💙 Si necesitás más información sobre tu plan de salud 🩺, no dudes en consultarme. Estoy acá para ayudarte 🙌✨'
        },
        cierre_conversacion: {
          id: 'cierre_conversacion',
          nombre: 'Cierre Conversación',
          descripcion: '✅ Perfecto, cualquier otra consulta no dudes en escribirme 📩. ✨ ¡Que tengas un excelente día! 🌞'
        }
      });
      }
    } catch (error) {
      console.error('Error cargando plantillas:', error);
      // Fallback: usar solo plantillas habilitadas para chat manual
      setPlantillas({
        saludo_inicial: {
          id: 'saludo_inicial',
          nombre: 'Saludo Inicial',
          descripcion: 'Primer contacto personalizado',
          variables: ['vendedor']
        },
        seguimiento_cotizacion: {
          id: 'seguimiento_cotizacion',
          nombre: 'Seguimiento Cotización',
          descripcion: 'Seguimiento post-cotización',
          variables: ['cliente']
        },
        seguimiento_poliza: {
          id: 'seguimiento_poliza',
          nombre: 'Seguimiento Póliza',
          descripcion: 'Verificar recepción póliza',
          variables: ['cliente']
        },
        informacion_adicional: {
          id: 'informacion_adicional',
          nombre: 'Información Adicional',
          descripcion: 'Info sobre plan de salud',
          variables: []
        },
        cierre_conversacion: {
          id: 'cierre_conversacion',
          nombre: 'Cierre Conversación',
          descripcion: 'Despedida cortés',
          variables: []
        }
      });
    }
  };

  // 📊 Cargar estadísticas
  const cargarEstadisticas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/estadisticas`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setEstadisticas(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // 💬 Cargar mensajes
  const cargarMensajes = async (conversacionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/conversaciones/${conversacionId}/mensajes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const nuevosMensajes = response.data.data;
        if (JSON.stringify(nuevosMensajes) !== JSON.stringify(mensajes)) {
          setMensajes(nuevosMensajes);
        }
      }
    } catch (error) {
      if (!error.response || error.response.status !== 401) {
        console.error('❌ Error cargando mensajes:', error);
      }
    }
  };

  // 🗨️ Abrir conversación
  const abrirConversacion = async (conversacion) => {
    setLoading(true);
    setConversacionActual(conversacion);
    setVista('chat');
    await cargarMensajes(conversacion.id);
    await marcarComoLeidos(conversacion.id);
    setLoading(false);
  };

  // 📤 Enviar mensaje con actualización automática de notificaciones
  const enviarMensaje = async (mensaje = null, plantillaId = null) => {
    if (!mensaje && !nuevoMensaje.trim() && !plantillaId) return;

    const textoMensaje = mensaje || nuevoMensaje;
    setEnviando(true);

    // Optimistic update
    const mensajeOptimista = {
      id: `temp-${Date.now()}`,
      mensaje: plantillaId ? `Enviando plantilla: ${plantillas?.[plantillaId]?.nombre || plantillaId}` : textoMensaje,
      tipo: 'enviado',
      origen: 'vendedor',
      estado_entrega: 'enviando',
      created_at: new Date().toISOString()
    };

    setMensajes(prev => [...prev, mensajeOptimista]);
    setNuevoMensaje('');

    try {
      const token = localStorage.getItem('token');
      let response;

      if (plantillaId) {
        // Enviar plantilla usando la nueva API de WhatsApp
        const userData = JSON.parse(localStorage.getItem('user'));
        const nombreVendedor = userData?.nombre || 'tu asesor';
        const nombreCliente = conversacionActual?.prospecto_nombre || 'estimado cliente';

        switch (plantillaId) {
          case 'saludo_inicial':
            response = await axios.post(
              `${API_URL}/api/whatsapp/saludo-inicial`,
              { 
                telefono: conversacionActual.telefono,
                nombreVendedor: nombreVendedor
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            break;
          
          case 'seguimiento_cotizacion':
            response = await axios.post(
              `${API_URL}/api/whatsapp/seguimiento-cotizacion`,
              { 
                telefono: conversacionActual.telefono,
                nombreCliente: nombreCliente
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            break;
          
          case 'seguimiento_poliza':
            response = await axios.post(
              `${API_URL}/api/whatsapp/seguimiento-poliza`,
              { 
                telefono: conversacionActual.telefono,
                nombreCliente: nombreCliente
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            break;
          
          case 'informacion_adicional':
            response = await axios.post(
              `${API_URL}/api/whatsapp/informacion-adicional`,
              { 
                telefono: conversacionActual.telefono
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            break;
          
          case 'cierre_conversacion':
            response = await axios.post(
              `${API_URL}/api/whatsapp/cierre-conversacion`,
              { 
                telefono: conversacionActual.telefono
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            break;
          
          default:
            throw new Error('Plantilla no reconocida');
        }
      } else {
        // Enviar mensaje de texto normal
        response = await axios.post(
          `${API_URL}/chat/conversaciones/${conversacionActual.id}/mensajes`,
          { mensaje: textoMensaje },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        // Recargar mensajes para obtener el estado real
        await cargarMensajes(conversacionActual.id);
        
        // 🔔 ACTUALIZAR NOTIFICACIONES DESPUÉS DE ENVIAR MENSAJE
        setTimeout(() => {
          cargarConversaciones(); // Actualizar contador en navbar
        }, 1000);
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      
      setMensajes(prev => prev.map(m => 
        m.id === mensajeOptimista.id 
          ? { ...m, estado_entrega: 'fallido' }
          : m
      ));
      
      alert('Error enviando mensaje: ' + (error.response?.data?.message || error.message));
    } finally {
      setEnviando(false);
    }
  };

  // 🔄 Enviar plantilla de recontacto
  const enviarPlantillaRecontacto = async (tipoPlantilla) => {
    if (!conversacionActual) {
      alert('No hay una conversación activa');
      return;
    }

    setEnviando(true);

    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      const nombreVendedor = userData?.nombre || 'tu asesor';
      const nombreCliente = conversacionActual?.prospecto_nombre || 'estimado cliente';

      console.log('📱 Enviando plantilla:', tipoPlantilla);
      console.log('📞 Teléfono:', conversacionActual.telefono);
      console.log('👤 Vendedor:', nombreVendedor);

      let response;

      switch (tipoPlantilla) {
        case 'saludo_inicial':
          response = await axios.post(
            `${API_URL}/api/whatsapp/saludo-inicial`,
            { 
              telefono: conversacionActual.telefono,
              nombreVendedor: nombreVendedor
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
        
        case 'seguimiento_cotizacion':
          response = await axios.post(
            `${API_URL}/api/whatsapp/seguimiento-cotizacion`,
            { 
              telefono: conversacionActual.telefono,
              nombreCliente: nombreCliente
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
        
        case 'seguimiento_poliza':
          response = await axios.post(
            `${API_URL}/api/whatsapp/seguimiento-poliza`,
            { 
              telefono: conversacionActual.telefono,
              nombreCliente: nombreCliente
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
        
        case 'informacion_adicional':
          response = await axios.post(
            `${API_URL}/api/whatsapp/informacion-adicional`,
            { 
              telefono: conversacionActual.telefono
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
        
        case 'cierre_conversacion':
          response = await axios.post(
            `${API_URL}/api/whatsapp/cierre-conversacion`,
            { 
              telefono: conversacionActual.telefono
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
        
        default:
          throw new Error('Tipo de plantilla no reconocido');
      }

      if (response.data.success) {
        console.log('✅ Plantilla enviada exitosamente');
        
        // Recargar mensajes para ver el nuevo mensaje
        setTimeout(() => {
          cargarMensajes(conversacionActual.id);
          cargarConversaciones();
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Error enviando plantilla:', error);
      alert('Error al enviar plantilla: ' + (error.response?.data?.message || error.message));
    } finally {
      setEnviando(false);
    }
  };

  // ✅ Marcar mensajes como leídos con actualización de notificaciones
  const marcarComoLeidos = async (conversacionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/chat/conversaciones/${conversacionId}/marcar-leidos`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // 🔔 ACTUALIZAR CONVERSACIONES Y NOTIFICACIONES DESPUÉS DE MARCAR COMO LEÍDOS
      setTimeout(() => {
        cargarConversaciones(); // Esto actualizará las notificaciones automáticamente
      }, 500);
      
    } catch (error) {
      console.error('❌ Error marcando mensajes como leídos:', error);
    }
  };

  // 📎 Manejar selección de archivo
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (100 MB máximo)
      if (file.size > 100 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Tamaño máximo: 100MB');
        return;
      }
      
      // Validar tipo de archivo
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'video/mp4', 'video/3gpp',
        'audio/mpeg', 'audio/ogg', 'audio/aac', 'audio/amr'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert('Tipo de archivo no permitido');
        return;
      }
      
      setArchivoSeleccionado(file);
    }
  };

  // 📎 Enviar mensaje con archivo
  const enviarMensajeConArchivo = async () => {
    if (!archivoSeleccionado && !nuevoMensaje.trim()) {
      return;
    }

    // Si no hay archivo, enviar mensaje normal
    if (!archivoSeleccionado) {
      return enviarMensaje();
    }

    setEnviando(true);

    try {
      const formData = new FormData();
      formData.append('archivo', archivoSeleccionado);
      formData.append('mensaje', nuevoMensaje || 'Archivo adjunto');

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/chat/conversaciones/${conversacionActual.id}/mensajes/archivo`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setNuevoMensaje('');
        setArchivoSeleccionado(null);
        await cargarMensajes(conversacionActual.id);
        await cargarConversaciones();
        
        // Limpiar input de archivo
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('❌ Error enviando archivo:', error);
      alert('Error al enviar el archivo: ' + (error.response?.data?.message || error.message));
    } finally {
      setEnviando(false);
    }
  };

  // 📎 Obtener icono según tipo de archivo
  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return <FaImage className="text-info" />;
    } else if (ext === 'pdf') {
      return <FaFilePdf className="text-danger" />;
    } else {
      return <FaFile className="text-secondary" />;
    }
  };

  // 📥 Descargar archivo directamente
  const descargarArchivo = async (url, nombreArchivo) => {
    try {
      // Fetch el archivo
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Crear un enlace temporal y hacer clic en él
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = nombreArchivo || 'archivo_whatsapp';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar el objeto URL
      window.URL.revokeObjectURL(link.href);
      
      console.log('✅ Archivo descargado:', nombreArchivo);
    } catch (error) {
      console.error('❌ Error descargando archivo:', error);
      // Fallback: abrir en nueva pestaña si falla la descarga
      window.open(url, '_blank');
    }
  };

  // ⏰ Formatear fecha
  const formatearFecha = (fecha) => {
    const ahora = new Date();
    const fechaMsg = new Date(fecha);
    const diffHoras = (ahora - fechaMsg) / (1000 * 60 * 60);

    if (diffHoras < 1) {
      return 'Hace unos minutos';
    } else if (diffHoras < 24) {
      return `Hace ${Math.floor(diffHoras)} hora${Math.floor(diffHoras) > 1 ? 's' : ''}`;
    } else {
      return fechaMsg.toLocaleDateString('es-AR');
    }
  };

  // Filtrar conversaciones por búsqueda
  const conversacionesFiltradas = conversaciones.filter(conv => 
    conv.prospecto_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    conv.telefono?.includes(busqueda) ||
    conv.ultimo_mensaje?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // 📱 Renderizar lista de conversaciones
  const renderListaConversaciones = () => (
    <div className="whatsapp-vista">
      <Container fluid className="h-100">
        <Row className="h-100">
          <Col xs={12} className="h-100">
            <Card className=" card-no-border h-100 border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom shadow-sm">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    {/* Botón de sidebar para mobile - MEJORADO */}
                    <Button 
                      variant="light" 
                      size="lg"
                      className="d-md-none me-3 sidebar-toggle-btn"
                      onClick={() => {
                        console.log('🔥 Botón hamburguesa clickeado (Lista)');
                        console.log('📊 onOpenSidebar existe:', !!onOpenSidebar);
                        if (typeof onOpenSidebar === 'function') {
                          console.log('✅ Llamando a onOpenSidebar...');
                          onOpenSidebar();
                        } else {
                          console.error('❌ onOpenSidebar no es una función:', onOpenSidebar);
                        }
                      }}
                      title="Abrir menú"
                      style={{
                        padding: '0.5rem 0.75rem',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      <FaBars />
                    </Button>
                    <h5 className="mb-0 text-white d-flex align-items-center">
                      <FaWhatsapp className="me-2" size={24} />
                      WhatsApp
                    </h5>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {/* Badge de mensajes sin leer */}
                    {estadisticas?.mensajes_no_leidos > 0 && (
                      <span className="unread-badge">
                        <FaEnvelope size={14} />
                        {estadisticas.mensajes_no_leidos}
                      </span>
                    )}
                    <Button 
                      variant="outline-light" 
                      size="sm"
                      onClick={cargarConversaciones}
                    >
                      <FaSync size={14} />
                    </Button>
                  </div>
                </div>
              </Card.Header>

              <Card.Body className="p-0 h-100">
                {/* Buscador */}
                <div className="p-3 border-bottom bg-white">
                  <InputGroup>
                    <InputGroup.Text className="bg-white border-end-0">
                      <FaSearch className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Buscar conversaciones..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="border-start-0 search-input"
                      style={{ borderLeft: 'none' }}
                    />
                  </InputGroup>
                </div>

                {/* Lista de conversaciones */}
                <div className="flex-grow-1 overflow-auto" style={{ height: 'calc(100vh - 300px)' }}>
                  {conversacionesFiltradas.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <FaWhatsapp size={48} className="mb-3 opacity-50" />
                      <p>No hay conversaciones</p>
                      {busqueda && <small>Intenta con otro término de búsqueda</small>}
                    </div>
                  ) : (
                    <ListGroup variant="flush">
                      {conversacionesFiltradas.map(conv => (
                        <ListGroup.Item 
                          key={conv.id}
                          action
                          onClick={() => abrirConversacion(conv)}
                          className="border-start-0 border-end-0 py-3"
                          style={{ cursor: 'pointer' }}
                        >
                          <Row className="align-items-center">
                            <Col xs={2} md={1}>
                              <div className="avatar-circle">
                                <FaUser size={18} />
                              </div>
                            </Col>
                            <Col xs={10} md={11}>
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <strong className="fs-6 text-truncate" style={{ maxWidth: '200px' }}>
                                      {conv.prospecto_nombre 
                                        ? `${conv.prospecto_nombre} ${conv.prospecto_apellido}`.trim()
                                        : maskPhoneNumber(conv.telefono)
                                      }
                                    </strong>
                                    {conv.mensajes_no_leidos > 0 && (
                                      <Badge bg="danger" pill>
                                        {conv.mensajes_no_leidos}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <p className="mb-1 text-muted small text-truncate" style={{ maxWidth: '250px' }}>
                                    {conv.ultimo_mensaje || 'Sin mensajes'}
                                  </p>

                                  <div className="d-flex justify-content-between align-items-center">
                                    <small className="text-muted">
                                      {formatearFecha(conv.ultima_actividad)}
                                    </small>
                                  </div>
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );

  // 💬 Renderizar chat
  const renderChat = () => (
    <div className="whatsapp-vista">
      <Container fluid className="h-100">
        <Row className="h-100">
          <Col xs={12} className="h-100">
            <Card className="h-100 border-0 shadow-sm card-no-border">
              {/* Header del chat */}
              <Card.Header className="bg-white border-bottom shadow-sm">
                <div className="d-flex justify-content-between align-items-center w-100">
                  <div className="d-flex align-items-center flex-grow-1">
                    <Button 
                      variant="outline-light" 
                      size="sm" 
                      onClick={() => setVista('lista')}
                      className="me-5"
                      style={{ minWidth: '36px', marginLeft: '-1.5rem' }}
                    >
                      <FaArrowLeft />
                    </Button>
                    <div className="ms-1">
                      <div className="fw-bold text-dark">
                        {conversacionActual?.prospecto_nombre 
                          ? `${conversacionActual.prospecto_nombre} ${conversacionActual.prospecto_apellido}`.trim()
                          : maskPhoneNumber(conversacionActual?.telefono)
                        }
                      </div>
                      <small className="text-muted">
                        {maskPhoneNumber(conversacionActual?.telefono)}
                      </small>
                    </div>
                  </div>

                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => cargarMensajes(conversacionActual.id)}
                    style={{ minWidth: '36px' }}
                  >
                    <FaSync />
                  </Button>
                </div>
              </Card.Header>

              {/* Área de mensajes */}
              <Card.Body className="p-0 d-flex flex-column h-100">
                <div 
                  ref={mensajesRef}
                  className="flex-grow-1 overflow-auto p-3 chat-messages"
                >
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status" style={{ color: 'var(--primary-purple)' }}>
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                    </div>
                  ) : mensajes.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <FaWhatsapp size={48} className="mb-2 opacity-50" />
                      <p className="mb-0">No hay mensajes aún</p>
                      <small>Inicia la conversación con el cliente</small>
                    </div>
                  ) : (
                    mensajes.map(mensaje => (
                      <div 
                        key={mensaje.id}
                        className={`d-flex mb-3 ${mensaje.origen === 'vendedor' ? 'justify-content-end' : 'justify-content-start'}`}
                      >
                        <div 
                          className={`message-bubble ${
                            mensaje.origen === 'vendedor' 
                              ? 'bg-primary text-white' 
                              : 'bg-white'
                          }`}
                        >
                          {/* Mostrar archivo adjunto si existe */}
                          {mensaje.archivo_url && (
                            <div className="mb-2">
                              {mensaje.archivo_tipo?.startsWith('image/') ? (
                                <div 
                                  onClick={() => descargarArchivo(mensaje.archivo_url, mensaje.archivo_nombre)}
                                  style={{ cursor: 'pointer' }}
                                  title="Haz clic para descargar"
                                >
                                  <img 
                                    src={mensaje.archivo_url} 
                                    alt={mensaje.archivo_nombre}
                                    style={{ 
                                      maxWidth: '200px', 
                                      maxHeight: '200px', 
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      transition: 'opacity 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                                  />
                                  <div className="text-center mt-1">
                                    <small className={mensaje.origen === 'vendedor' ? 'text-white-50' : 'text-muted'}>
                                      <FaDownload size={10} className="me-1" />
                                      Clic para descargar
                                    </small>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => descargarArchivo(mensaje.archivo_url, mensaje.archivo_nombre)}
                                  className={`d-flex align-items-center gap-2 p-2 rounded ${
                                    mensaje.origen === 'vendedor' ? 'bg-white text-dark' : 'bg-light'
                                  }`}
                                  style={{ 
                                    textDecoration: 'none', 
                                    maxWidth: '250px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = mensaje.origen === 'vendedor' ? '#ffffff' : '#f8f9fa'}
                                  title="Haz clic para descargar"
                                >
                                  {getFileIcon(mensaje.archivo_nombre)}
                                  <div className="flex-grow-1">
                                    <div className="small text-truncate">{mensaje.archivo_nombre}</div>
                                    {mensaje.archivo_tamaño && (
                                      <div style={{ fontSize: '0.7rem', color: '#6c757d' }}>
                                        {(mensaje.archivo_tamaño / 1024 / 1024).toFixed(2)} MB
                                      </div>
                                    )}
                                  </div>
                                  <FaDownload size={14} className="text-primary" />
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="message-content" style={{ whiteSpace: 'pre-wrap' }}>
                            {mensaje.mensaje}
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-2">
                            <small className={mensaje.origen === 'vendedor' ? 'text-white-50' : 'text-muted'}>
                              {new Date(mensaje.created_at).toLocaleTimeString('es-AR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </small>
                            {mensaje.origen === 'vendedor' && (
                              <span className="ms-2 message-status">
                                {mensaje.estado_entrega === 'enviado' && <FaCheck size={12} />}
                                {mensaje.estado_entrega === 'entregado' && <FaCheckDouble size={12} />}
                                {mensaje.estado_entrega === 'leido' && <FaCheckDouble size={12} className="text-info" />}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input de mensaje */}
                {conversacionActual?.estado !== 'cerrada' && (
                  <div className="chat-input">
                    {/* Preview del archivo seleccionado */}
                    {archivoSeleccionado && (
                      <div className="archivo-preview mb-2 p-2 bg-light rounded d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          {getFileIcon(archivoSeleccionado.name)}
                          <div>
                            <div className="small fw-bold">{archivoSeleccionado.name}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {(archivoSeleccionado.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="link" 
                          size="sm" 
                          onClick={() => {
                            setArchivoSeleccionado(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="text-danger"
                        >
                          <FaTimes />
                        </Button>
                      </div>
                    )}

                    {/* Dropdown de recontacto */}
                    <div className="mb-2">
                      <Dropdown>
                        <Dropdown.Toggle 
                          variant="outline-secondary" 
                          size="sm"
                          style={{
                            background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.15) 0%, rgba(25, 135, 84, 0.1) 100%)',
                            border: '1px solid rgba(37, 211, 102, 0.4)',
                            color: '#198754',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.375rem 0.75rem',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span style={{ fontSize: '1rem' }}></span>
                          Recontactar
                        </Dropdown.Toggle>

                        <Dropdown.Menu style={{ maxHeight: '300px', overflowY: 'auto', minWidth: '280px' }}>
                          {/* Plantilla: Saludo Inicial */}
                          <Dropdown.Item 
                            onClick={() => enviarPlantillaRecontacto('saludo_inicial')}
                            disabled={enviando}
                          >
                            <div>
                              <div className="fw-bold" style={{ fontSize: '0.9rem' }}>Saludo Inicial</div>
                              <div className="text-muted small" style={{ fontSize: '0.8rem' }}>
                                👋 ¡Hola! Soy tu asesor de COBER. ¿Cómo estás? �
                              </div>
                            </div>
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>

                    <InputGroup>
                      {/* Botón para adjuntar archivo */}
                      <Button 
                        variant="outline-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={enviando}
                        title="Adjuntar archivo"
                      >
                        <FaPaperclip />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        hidden
                        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.mp4,.3gpp,.mp3,.ogg,.aac,.amr"
                        onChange={handleFileSelect}
                      />
                      
                      <Form.Control
                        type="text"
                        placeholder="Escribe un mensaje..."
                        value={nuevoMensaje}
                        onChange={(e) => setNuevoMensaje(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            archivoSeleccionado ? enviarMensajeConArchivo() : enviarMensaje();
                          }
                        }}
                        disabled={enviando}
                      />
                      <Button 
                        variant="primary"
                        onClick={() => archivoSeleccionado ? enviarMensajeConArchivo() : enviarMensaje()}
                        disabled={enviando || (!nuevoMensaje.trim() && !archivoSeleccionado)}
                      >
                        {enviando ? (
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Enviando...</span>
                          </div>
                        ) : (
                          <FaPaperPlane size={16} />
                        )}
                      </Button>
                    </InputGroup>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );

  return (
    <div className="whatsapp-vista-container">
      {vista === 'lista' ? renderListaConversaciones() : renderChat()}
    </div>
  );
};

export default WhatsAppVista;
