import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Badge, ListGroup, InputGroup, Dropdown } from 'react-bootstrap';
import { 
  FaComments, 
  FaPaperPlane, 
  FaEllipsisV, 
  FaPlay, 
  FaPause, 
  FaTimes,
  FaClock,
  FaCheck,
  FaCheckDouble,
  FaWhatsapp,
  FaSync, // ✅ NUEVO: Icono para actualizar
  FaLocationArrow // ✅ NUEVO: Icono de flecha como WhatsApp
} from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../config';
import './WhatsAppChat.css';

// 🔔 Importar el hook de notificaciones
import { useNotifications } from '../../contexts/NotificationContext';

const WhatsAppChat = ({ show, onHide, conversacionId = null, telefono = null, prospecto = null, tipo = null }) => {
  // 🔔 Usar el contexto de notificaciones
  const { refreshNotifications } = useNotifications();

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

  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActual, setConversacionActual] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [plantillas, setPlantillas] = useState({});
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [vista, setVista] = useState('lista'); // 'lista' | 'chat'
  const [estadisticas, setEstadisticas] = useState({});
  const [hayNuevosMensajes, setHayNuevosMensajes] = useState(false); // ✅ NUEVO: Estado para nuevos mensajes
  const [ultimoConteoMensajes, setUltimoConteoMensajes] = useState(0); // ✅ NUEVO: Para detectar cambios
  
  const mensajesRef = useRef(null);
  const intervalRef = useRef(null);

  // 🔄 Cargar datos iniciales
  useEffect(() => {
    if (show) {
      cargarConversaciones();
      cargarPlantillas();
      cargarEstadisticas();
      
      // Auto-refresh cada 5 segundos para tiempo real (optimizado para evitar rate limiting)
      intervalRef.current = setInterval(() => {
        cargarConversaciones();
        if (conversacionActual) {
          cargarMensajes(conversacionActual.id);
        }
      }, 5000); // ✅ OPTIMIZADO: De 2 a 5 segundos para reducir rate limiting
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [show, conversacionActual]); // ✅ AGREGAR: conversacionActual como dependencia

  // ✅ NUEVO: Actualizar cuando la ventana recibe foco
  useEffect(() => {
    const handleFocus = () => {
      if (show && conversacionActual) {
        cargarMensajes(conversacionActual.id);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && show && conversacionActual) {
        cargarMensajes(conversacionActual.id);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [show, conversacionActual]);

  // ✅ NUEVO: Polling intensivo para mensajes cuando hay conversación activa
  useEffect(() => {
    let mensajesInterval = null;
    
    if (show && conversacionActual && vista === 'chat') {
      // Polling cada 3 segundos solo para mensajes cuando estamos en el chat (optimizado)
      mensajesInterval = setInterval(() => {
        cargarMensajes(conversacionActual.id); // Llamada silenciosa para tiempo real
      }, 3000); // ✅ OPTIMIZADO: De 1 a 3 segundos para reducir rate limiting
      
      console.log('🔄 Polling de mensajes iniciado cada 3 segundos');

      // 🔔 NUEVO: Marcar como leídos cuando el usuario abre el chat
      marcarComoLeidos(conversacionActual.id);
    }

    return () => {
      if (mensajesInterval) {
        clearInterval(mensajesInterval);
        console.log('🛑 Polling de mensajes detenido');
      }
    };
  }, [show, conversacionActual, vista]);

  // 📱 Abrir conversación específica
  useEffect(() => {
    if (conversacionId && conversaciones.length > 0) {
      const conv = conversaciones.find(c => c.id === conversacionId);
      if (conv) {
        abrirConversacion(conv);
      }
    }
  }, [conversacionId, conversaciones]);

  // ✅ NUEVO: Buscar conversación por prospecto
  useEffect(() => {
    if (prospecto && conversaciones.length > 0 && !conversacionActual) {
      // Buscar conversación activa del prospecto
      const conv = conversaciones.find(c => 
        c.prospecto_id === prospecto.id && 
        (c.estado === 'activa' || c.estado === 'pendiente')
      );
      
      if (conv) {
        console.log('🔍 Conversación encontrada para prospecto:', conv.numero_conversacion);
        abrirConversacion(conv);
      } else {
        console.log('⚠️ No se encontró conversación activa para el prospecto:', prospecto.id);
        // Mantener la vista de lista para mostrar todas las conversaciones
        setVista('lista');
      }
    }
  }, [prospecto, conversaciones, conversacionActual]);

  // 📜 Auto-scroll al final de mensajes y detectar nuevos mensajes
  useEffect(() => {
    if (mensajesRef.current) {
      // ✅ Auto-scroll suave al final
      const scrollElement = mensajesRef.current;
      const isNearBottom = scrollElement.scrollTop >= scrollElement.scrollHeight - scrollElement.clientHeight - 50;
      
      // Solo hacer scroll automático si el usuario está cerca del final
      if (isNearBottom || mensajes.length > ultimoConteoMensajes) {
        setTimeout(() => {
          scrollElement.scrollTo({
            top: scrollElement.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
      
      // ✅ Detectar nuevos mensajes
      if (mensajes.length > ultimoConteoMensajes && ultimoConteoMensajes > 0) {
        setHayNuevosMensajes(true);
        setTimeout(() => setHayNuevosMensajes(false), 3000); // Ocultar después de 3 segundos
      }
      
      setUltimoConteoMensajes(mensajes.length);
    }
  }, [mensajes, ultimoConteoMensajes]);

  // 📋 Cargar conversaciones
  const cargarConversaciones = async () => {
    try {
      console.log('🔄 Cargando conversaciones...');
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/conversaciones`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50 }
      });

      if (response.data.success) {
        const nuevasConversaciones = response.data.data;
        
        // ✅ OPTIMIZACIÓN: Solo actualizar si hay cambios reales
        if (JSON.stringify(nuevasConversaciones) !== JSON.stringify(conversaciones)) {
          console.log('✅ Conversaciones actualizadas:', nuevasConversaciones.length);
          setConversaciones(nuevasConversaciones);

          // 🔔 Actualizar notificaciones en el contexto global
          refreshNotifications();
        }
      } else {
        console.warn('⚠️ Error en respuesta de conversaciones:', response.data);
      }
    } catch (error) {
      console.error('❌ Error cargando conversaciones:', error);
    }
  };

  // 📝 Cargar plantillas
  const cargarPlantillas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/plantillas`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPlantillas(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando plantillas:', error);
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

  // 💬 Cargar mensajes (optimizada para tiempo real)
  const cargarMensajes = async (conversacionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/conversaciones/${conversacionId}/mensajes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const nuevosMensajes = response.data.data;
        
        // ✅ OPTIMIZACIÓN: Solo actualizar si hay cambios
        if (JSON.stringify(nuevosMensajes) !== JSON.stringify(mensajes)) {
          console.log('� Actualizando mensajes:', nuevosMensajes.length, 'mensajes');
          setMensajes(nuevosMensajes);
          
          // ✅ Marcar mensajes como leídos si hay nuevos mensajes del cliente
          const mensajesNoLeidos = nuevosMensajes.filter(m => 
            m.origen === 'cliente' && 
            m.tipo === 'recibido' && 
            new Date(m.created_at) > new Date(Date.now() - 10000) // Últimos 10 segundos
          );
          
          if (mensajesNoLeidos.length > 0) {
            console.log('📬 Nuevos mensajes detectados:', mensajesNoLeidos.length);
            
            // ✅ DESHABILITADO: Sonido de notificación (causaba estática)
            // TODO: Implementar sonido de notificación más limpio
            console.log('🔇 Sonido de notificación deshabilitado temporalmente');
            /* 
            try {
              // Usar un tono simple y limpio en lugar del archivo base64 corrupto
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              
              oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Tono de 800Hz
              gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Volumen bajo
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
              
              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.3);
            } catch (e) {
              console.log('🔇 Audio no disponible');
            }
            */
            
            marcarComoLeidos(conversacionId);
          }
        }
      } else {
        console.warn('⚠️ Error en respuesta de mensajes:', response.data);
      }
    } catch (error) {
      // ✅ Silenciar errores de red para evitar spam en consola durante polling
      if (!error.response || error.response.status !== 401) {
        console.error('❌ Error cargando mensajes:', error);
      }
    }
  };

  // ✅ NUEVA FUNCIÓN: Marcar mensajes como leídos
  const marcarComoLeidos = async (conversacionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/chat/conversaciones/${conversacionId}/marcar-leidos`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('✅ Mensajes marcados como leídos');
      
      // 🔔 Actualizar notificaciones después de marcar como leídos
      refreshNotifications();
    } catch (error) {
      console.error('❌ Error marcando mensajes como leídos:', error);
    }
  };

  // 🗨️ Abrir conversación
  const abrirConversacion = async (conversacion) => {
    setLoading(true);
    setConversacionActual(conversacion);
    setVista('chat');

    await cargarMensajes(conversacion.id);
    
    // 🔔 NUEVO: Marcar mensajes como leídos cuando se abre la conversación
    await marcarComoLeidos(conversacion.id);
    
    setLoading(false);
  };

  // 📎 Enviar archivo adjunto
  const enviarArchivo = async () => {
    if (!archivoSeleccionado || !conversacionActual) return;

    setEnviando(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('archivo', archivoSeleccionado);
      if (nuevoMensaje && nuevoMensaje.trim()) {
        formData.append('mensaje', nuevoMensaje.trim());
      }

      // Optimistic bubble para archivo
      const optimista = {
        id: `temp-file-${Date.now()}`,
        mensaje: nuevoMensaje?.trim() || 'Archivo enviado',
        tipo: 'enviado',
        origen: 'vendedor',
        estado_entrega: 'enviando',
        created_at: new Date().toISOString(),
        archivo_url: URL.createObjectURL(archivoSeleccionado),
        archivo_tipo: archivoSeleccionado.type,
        archivo_nombre: archivoSeleccionado.name,
        archivo_tamaño: archivoSeleccionado.size
      };
      setMensajes(prev => [...prev, optimista]);
      setNuevoMensaje('');

      await axios.post(
        `${API_URL}/chat/conversaciones/${conversacionActual.id}/mensajes/archivo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Refrescar desde el servidor para obtener URL definitiva y SID
      setTimeout(() => cargarMensajes(conversacionActual.id), 600);
    } catch (error) {
      console.error('❌ Error enviando archivo:', error);
      alert('Error enviando archivo: ' + (error.response?.data?.message || error.message));
    } finally {
      setEnviando(false);
      setArchivoSeleccionado(null);
    }
  };

  const handleSeleccionArchivo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivoSeleccionado(file);
    // Enviar inmediatamente al seleccionar
    enviarArchivo();
  };

  // 🖼️ Renderizar preview/descarga de adjuntos
  const renderAdjunto = (msg) => {
    if (!msg.archivo_url) return null;
    const tipo = (msg.archivo_tipo || '').toLowerCase();
    const url = msg.archivo_url;

    if (tipo.startsWith('image/')) {
      return (
        <a href={url} target="_blank" rel="noreferrer">
          <img src={url} alt={msg.archivo_nombre || 'imagen'} style={{ maxWidth: '100%', borderRadius: 8, marginTop: 6 }} />
        </a>
      );
    }
    if (tipo.startsWith('video/')) {
      return (
        <video src={url} controls style={{ maxWidth: '100%', borderRadius: 8, marginTop: 6 }} />
      );
    }
    if (tipo.startsWith('audio/')) {
      return (
        <audio src={url} controls style={{ width: '100%', marginTop: 6 }} />
      );
    }
    // PDF u otros documentos
    return (
      <a href={url} target="_blank" rel="noreferrer" className="d-inline-block mt-2">
        📎 {msg.archivo_nombre || 'Archivo adjunto'}
      </a>
    );
  };

  // 📤 Enviar mensaje (optimizada para tiempo real)
  const enviarMensaje = async (mensaje = null, plantillaId = null) => {
    if (!mensaje && !nuevoMensaje.trim() && !plantillaId) return;

    const textoMensaje = mensaje || nuevoMensaje;
    setEnviando(true);

    // ✅ OPTIMIZACIÓN: Agregar mensaje inmediatamente (optimistic update)
    const mensajeOptimista = {
      id: `temp-${Date.now()}`,
      mensaje: textoMensaje,
      tipo: 'enviado',
      origen: 'vendedor',
      estado_entrega: 'enviando',
      created_at: new Date().toISOString()
    };

    setMensajes(prev => [...prev, mensajeOptimista]);
    setNuevoMensaje('');

    try {
      const token = localStorage.getItem('token');
      const payload = {};
      
      if (plantillaId) {
        payload.plantilla_id = plantillaId;
      } else {
        payload.mensaje = textoMensaje;
      }

      const response = await axios.post(
        `${API_URL}/chat/conversaciones/${conversacionActual.id}/mensajes`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        console.log('✅ Mensaje enviado exitosamente');
        
        // ✅ Actualizar estado del mensaje optimista
        setMensajes(prev => prev.map(m => 
          m.id === mensajeOptimista.id 
            ? { ...m, estado_entrega: 'enviado', id: response.data.mensaje_id || m.id }
            : m
        ));

        // ✅ Recargar mensajes para obtener la versión real del servidor
        setTimeout(() => {
          cargarMensajes(conversacionActual.id);
        }, 500);
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      
      // ✅ Remover mensaje optimista si falló
      setMensajes(prev => prev.filter(m => m.id !== mensajeOptimista.id));
      
      // ✅ Restaurar texto en el input
      setNuevoMensaje(textoMensaje);
      
      alert('Error enviando mensaje: ' + (error.response?.data?.message || error.message));
    } finally {
      setEnviando(false);
    }
  };

  // 🔄 Cambiar estado de conversación
  const cambiarEstado = async (estado, motivo = '') => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/chat/conversaciones/${conversacionActual.id}/estado`,
        { estado, motivo },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Actualizar estado local
      setConversacionActual(prev => ({ ...prev, estado }));
      cargarConversaciones();
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  // 🎨 Obtener color del estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'activa': return 'success';
      case 'pausada': return 'warning';
      case 'cerrada': return 'secondary';
      default: return 'primary';
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

  // 📱 Renderizar lista de conversaciones
  const renderListaConversaciones = () => (
    <div className="whatsapp-conversaciones p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          <FaWhatsapp className="me-2 text-success" />
          Conversaciones WhatsApp
        </h5>
        <Button 
          variant="outline-primary" 
          size="sm"
          onClick={cargarConversaciones}
        >
          🔄
        </Button>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="row mb-3">
          <div className="col-6">
            <div className="whatsapp-stat">
              <div className="whatsapp-stat-icon">💬</div>
              <div className={`whatsapp-stat-number ${estadisticas.conversaciones_activas > 0 ? 'active' : ''}`}>
                {estadisticas.conversaciones_activas || 0}
              </div>
              <div className="whatsapp-stat-label">Activas</div>
            </div>
          </div>
          <div className="col-6">
            <div className="whatsapp-stat">
              <div className="whatsapp-stat-icon">🔔</div>
              <div className={`whatsapp-stat-number ${estadisticas.mensajes_no_leidos > 0 ? 'unread' : ''}`}>
                {estadisticas.mensajes_no_leidos || 0}
              </div>
              <div className="whatsapp-stat-label">Sin leer</div>
            </div>
          </div>
        </div>
      )}

      {conversaciones.length === 0 ? (
        <div className="text-center text-muted py-5">
          <FaWhatsapp size={48} className="mb-3 opacity-50" />
          <p>No tienes conversaciones activas</p>
          <small>Las conversaciones se crean automáticamente cuando envías cotizaciones o pólizas por WhatsApp</small>
        </div>
      ) : (
        <ListGroup variant="flush">
          {conversaciones.map(conv => (
            <ListGroup.Item 
              key={conv.id}
              action
              onClick={() => abrirConversacion(conv)}
              className="border-start-0 border-end-0"
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong className="fs-6">
                      {conv.prospecto_nombre 
                        ? `${conv.prospecto_nombre} ${conv.prospecto_apellido}`.trim()
                        : maskPhoneNumber(conv.telefono)
                      }
                    </strong>
                    <Badge bg={getEstadoColor(conv.estado)} className="ms-2" style={{
                      background: (() => {
                        switch(conv.estado) {
                          case 'activa': return 'linear-gradient(45deg, #28a745, #1e7e34)';
                          case 'pausada': return 'linear-gradient(45deg, #ffc107, #e0a800)';
                          case 'cerrada': return 'linear-gradient(45deg, #6c757d, #5a6268)';
                          default: return 'linear-gradient(45deg, #007bff, #0056b3)';
                        }
                      })(),
                      border: 'none',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span className="whatsapp-stat-icon" style={{ fontSize: '0.8rem', width: 'auto', margin: 0 }}>
                        {(() => {
                          switch(conv.estado) {
                            case 'activa': return '🟢';
                            case 'pausada': return '⏸️';
                            case 'cerrada': return '🔴';
                            default: return '💬';
                          }
                        })()}
                      </span>
                      {conv.estado}
                    </Badge>
                  </div>
                  
                  <p className="mb-1 text-muted small">
                    {conv.ultimo_mensaje?.substring(0, 60)}
                    {conv.ultimo_mensaje?.length > 60 ? '...' : ''}
                  </p>

                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <Badge 
                        bg={conv.tipo_origen === 'cotizacion' ? 'info' : 'warning'} 
                        className="me-2"
                        style={{ 
                          background: conv.tipo_origen === 'cotizacion' 
                            ? 'linear-gradient(45deg, #17a2b8, #138496)' 
                            : 'linear-gradient(45deg, #ffc107, #e0a800)',
                          border: 'none',
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span className="whatsapp-stat-icon" style={{ fontSize: '0.9rem', width: 'auto', margin: 0 }}>
                          {conv.tipo_origen === 'cotizacion' ? '💰' : '📋'}
                        </span>
                        {conv.tipo_origen === 'cotizacion' ? 'Cotización' : 'Póliza'}
                      </Badge>
                      
                      {conv.mensajes_no_leidos > 0 && (
                        <Badge 
                          bg="danger"
                          style={{
                            background: 'linear-gradient(45deg, #dc3545, #c82333)',
                            border: 'none',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                            animation: 'unreadPulse 2s infinite'
                          }}
                        >
                          {conv.mensajes_no_leidos}
                        </Badge>
                      )}
                    </div>
                    
                    <small className="text-muted">
                      {formatearFecha(conv.ultima_actividad)}
                    </small>
                  </div>
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );

  // 💬 Renderizar chat
  const renderChat = () => (
    <div className="whatsapp-chat d-flex flex-column h-100">
      {/* Header del chat */}
      <div className="chat-header bg-success text-white p-3">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => setVista('lista')}
              className="text-white p-0 me-3"
            >
              ← 
            </Button>
            <div>
              <div className="fw-bold">
                {conversacionActual?.prospecto_nombre 
                  ? `${conversacionActual.prospecto_nombre} ${conversacionActual.prospecto_apellido}`.trim()
                  : conversacionActual?.telefono
                }
              </div>
              <small className="opacity-75">
                {maskPhoneNumber(conversacionActual?.telefono)}
              </small>
            </div>
          </div>

          <div className="d-flex align-items-center">
            <Badge 
              bg="light" 
              text="dark" 
              className="me-2"
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                textShadow: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: '600'
              }}
            >
              <span className="whatsapp-stat-icon" style={{ fontSize: '0.8rem', width: 'auto', margin: 0 }}>
                {(() => {
                  switch(conversacionActual?.estado) {
                    case 'activa': return '🟢';
                    case 'pausada': return '⏸️';
                    case 'cerrada': return '🔴';
                    default: return '💬';
                  }
                })()}
              </span>
              {conversacionActual?.estado}
            </Badge>
            
            {/* ✅ NUEVO: Indicador de nuevos mensajes */}
            {hayNuevosMensajes && (
              <Badge 
                bg="warning" 
                className="me-2 new-message-indicator"
                style={{
                  background: 'linear-gradient(45deg, #ffc107, #e0a800)',
                  border: 'none',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span className="whatsapp-stat-icon" style={{ fontSize: '0.8rem', width: 'auto', margin: 0 }}>💬</span>
                Nuevo mensaje
              </Badge>
            )}
            
            <Dropdown>
              <Dropdown.Toggle variant="link" className="text-white p-0">
                <FaEllipsisV />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => cargarMensajes(conversacionActual.id)}>
                  <FaSync className="me-2" />
                  Actualizar mensajes
                </Dropdown.Item>
                <Dropdown.Divider />
                {conversacionActual?.estado === 'activa' && (
                  <Dropdown.Item onClick={() => cambiarEstado('pausada')}>
                    <FaPause className="me-2" />
                    Pausar conversación
                  </Dropdown.Item>
                )}
                {conversacionActual?.estado === 'pausada' && (
                  <Dropdown.Item onClick={() => cambiarEstado('activa')}>
                    <FaPlay className="me-2" />
                    Reactivar conversación
                  </Dropdown.Item>
                )}
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => cambiarEstado('cerrada')} className="text-danger">
                  <FaTimes className="me-2" />
                  Cerrar conversación
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div 
        ref={mensajesRef}
        className="chat-mensajes flex-grow-1 p-3 overflow-auto bg-light"
        style={{ maxHeight: '400px', backgroundColor: '#e5ddd5' }}
      >
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : mensajes.length === 0 ? (
          <div className="text-center text-muted py-4">
            <FaWhatsapp size={32} className="mb-2 opacity-50" />
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
                className={`message-bubble rounded-3 p-2 shadow-sm ${
                  mensaje.origen === 'vendedor' 
                    ? 'bg-primary text-white' 
                    : 'bg-white'
                }`}
                style={{ maxWidth: '70%' }}
              >
                <div className="message-content" style={{ whiteSpace: 'pre-wrap' }}>
                  {mensaje.mensaje}
                  {renderAdjunto(mensaje)}
                </div>
                <div className="d-flex justify-content-between align-items-center mt-1">
                  <small className={mensaje.origen === 'vendedor' ? 'text-white-50' : 'text-muted'}>
                    {new Date(mensaje.created_at).toLocaleTimeString('es-AR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </small>
                  {mensaje.origen === 'vendedor' && (
                    <span className="ms-2">
                      {mensaje.estado_entrega === 'enviado' && <FaCheck className="text-white-50" />}
                      {mensaje.estado_entrega === 'entregado' && <FaCheckDouble className="text-white-50" />}
                      {mensaje.estado_entrega === 'leido' && <FaCheckDouble className="text-info" />}
                      {mensaje.estado_entrega === 'fallido' && <FaTimes className="text-danger" />}
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
        <div className="chat-input bg-white border-top p-3">
          {/* Plantillas rápidas */}
          {Object.keys(plantillas).length > 0 && (
            <div className="mb-2">
              <Dropdown>
                <Dropdown.Toggle 
                  variant="outline-secondary" 
                  size="sm"
                  style={{
                    background: 'linear-gradient(45deg, rgba(108, 117, 125, 0.1), rgba(90, 98, 104, 0.1))',
                    border: '1px solid rgba(108, 117, 125, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '500'
                  }}
                >
                  <span className="whatsapp-stat-icon" style={{ fontSize: '0.9rem', width: 'auto', margin: 0 }}>📝</span>
                  Respuestas rápidas
                </Dropdown.Toggle>
                <Dropdown.Menu style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {Object.entries(plantillas).map(([categoria, plantillasCategoria]) => (
                    <div key={categoria}>
                      <Dropdown.Header className="text-uppercase fw-bold">
                        {categoria}
                      </Dropdown.Header>
                      {plantillasCategoria.map(plantilla => (
                        <Dropdown.Item 
                          key={plantilla.id}
                          onClick={() => enviarMensaje(null, plantilla.id)}
                          className="text-wrap"
                          style={{ whiteSpace: 'normal' }}
                        >
                          <strong>{plantilla.nombre}</strong>
                          <br />
                          <small className="text-muted">
                            {plantilla.contenido.substring(0, 50)}...
                          </small>
                        </Dropdown.Item>
                      ))}
                      <Dropdown.Divider />
                    </div>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          )}

          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Escribe un mensaje..."
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviarMensaje();
                }
              }}
              disabled={enviando}
            />
            {/* Botón para adjuntar archivos */}
            <Form.Control
              type="file"
              accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,video/*,audio/*"
              onChange={handleSeleccionArchivo}
              style={{ display: 'none' }}
              id="whatsapp-file-input"
            />
            <Button
              variant="outline-secondary"
              onClick={() => document.getElementById('whatsapp-file-input').click()}
              disabled={enviando}
            >
              📎
            </Button>
            <Button 
              variant="success"
              onClick={() => enviarMensaje()}
              disabled={enviando || !nuevoMensaje.trim()}
            >
              {enviando ? (
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Enviando...</span>
                </div>
              ) : (
                <span className="whatsapp-send-icon">➤</span>
              )}
            </Button>
          </InputGroup>
        </div>
      )}
    </div>
  );

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="lg"
      className="whatsapp-modal"
    >
      <Modal.Header closeButton className="bg-success text-white">
        <Modal.Title>
          <FaWhatsapp className="me-2" />
          WhatsApp Business
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ height: '70vh', padding: 0 }}>
        {vista === 'lista' ? renderListaConversaciones() : renderChat()}
      </Modal.Body>
    </Modal>
  );
};

export default WhatsAppChat;
