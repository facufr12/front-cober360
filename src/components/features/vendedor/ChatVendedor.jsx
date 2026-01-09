import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal, Button, Form, InputGroup, Badge, Spinner, 
  Card, ListGroup, OverlayTrigger, Tooltip 
} from 'react-bootstrap';
import { 
  FaRobot, FaComments, FaSearch, FaPaperPlane, FaTimes,
  FaHistory, FaChartLine, FaUsers, FaMoneyBillWave,
  FaHospital, FaGift, FaCopy, FaTrash
} from 'react-icons/fa';
import axios from 'axios';
import './ChatVendedor.css';
import { API_URL } from "../../config";



const ChatVendedor = () => {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversacionId, setConversacionId] = useState(null);
  const [conversaciones, setConversaciones] = useState([]);
  const [showHistorial, setShowHistorial] = useState(false);
  
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    if (showChat) {
      fetchConversaciones();
    }
  }, [showChat]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const fetchConversaciones = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/chatbot-vendedor/conversaciones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversaciones(response.data);
    } catch (error) {
      console.error("Error al obtener conversaciones:", error);
    }
  };
  
  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;
    
    const userMessage = {
      id: Date.now(),
      rol: 'user',
      contenido: inputMessage,
      creado_en: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/chatbot-vendedor/mensaje`,
        {
          mensaje: inputMessage,
          conversacionId: conversacionId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const assistantMessage = {
        id: Date.now() + 1,
        rol: 'assistant',
        contenido: response.data.mensaje,
        tipoConsulta: response.data.tipoConsulta,
        datosConsulta: response.data.datosConsulta,
        creado_en: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Guardar ID de conversación
      if (response.data.conversacionId && !conversacionId) {
        setConversacionId(response.data.conversacionId);
        fetchConversaciones(); // Actualizar lista
      }
      
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        rol: 'assistant',
        contenido: 'Lo siento, ha ocurrido un error. Por favor, intenta nuevamente.',
        creado_en: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const nuevaConversacion = () => {
    setMessages([]);
    setConversacionId(null);
    
    // Mensaje inicial
    const welcomeMessage = {
      id: Date.now(),
      rol: 'assistant',
      contenido: `¡Hola! 👋 Soy tu asistente virtual para ventas.

Puedo ayudarte con:

🔍 **Consultas disponibles:**
• "precios para edad 35" - Ver precios por edad
• "promociones activas" - Descuentos vigentes  
• "prestadores en CABA" - Buscar por zona
• "comparar planes edad 40" - Comparar opciones
• "especialistas cardiología" - Buscar especialidades

💡 **Ejemplos rápidos:**
• "Plan Classic vs Wagon para 45 años"
• "Mejores prestadores zona norte"
• "Promociones hasta diciembre"

¿En qué puedo ayudarte?`,
      creado_en: new Date().toISOString()
    };
    
    setMessages([welcomeMessage]);
  };
  
  const cargarConversacion = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/chatbot-vendedor/conversacion/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages(response.data);
      setConversacionId(id);
      setShowHistorial(false);
      
    } catch (error) {
      console.error("Error al cargar conversación:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const copiarMensaje = (contenido) => {
    navigator.clipboard.writeText(contenido);
    // Aquí podrías agregar un toast de confirmación
  };
  
  const getTipoConsultaIcon = (tipo) => {
    switch (tipo) {
      case 'consultar_precios': return <FaMoneyBillWave className="text-success" />;
      case 'obtener_promociones': return <FaGift className="text-warning" />;
      case 'buscar_prestadores': return <FaHospital className="text-info" />;
      case 'comparar_planes': return <FaChartLine className="text-primary" />;
      case 'obtener_planes': return <FaUsers className="text-secondary" />;
      default: return <FaComments className="text-muted" />;
    }
  };
  
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Botón flotante */}
      <div className="chat-vendedor-trigger">
        <OverlayTrigger 
          placement="left" 
          overlay={<Tooltip>Asistente Virtual para Vendedores</Tooltip>}
        >
          <Button
            variant="primary"
            size="lg"
            className="rounded-circle shadow-lg"
            onClick={() => setShowChat(true)}
            style={{
              width: '60px',
              height: '60px',
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              zIndex: 1000
            }}
          >
            <FaRobot size={24} />
          </Button>
        </OverlayTrigger>
      </div>

      {/* Modal del Chat */}
      <Modal 
        show={showChat} 
        onHide={() => setShowChat(false)}
        size="lg"
        className="chat-vendedor-modal"
      >
        <Modal.Header className="bg-primary text-white">
          <div className="d-flex align-items-center">
            <FaRobot className="me-2" />
            <div>
              <Modal.Title className="mb-0">Asistente Virtual</Modal.Title>
              <small>Consultas para vendedores</small>
            </div>
          </div>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-light" 
              size="sm"
              onClick={() => setShowHistorial(!showHistorial)}
            >
              <FaHistory /> Historial
            </Button>
            <Button 
              variant="outline-light" 
              size="sm"
              onClick={nuevaConversacion}
            >
              <FaComments /> Nueva
            </Button>
            <Button variant="link" onClick={() => setShowChat(false)}>
              <FaTimes className="text-white" />
            </Button>
          </div>
        </Modal.Header>

        <Modal.Body className="p-0 d-flex" style={{ height: '500px' }}>
          {/* Sidebar de conversaciones */}
          {showHistorial && (
            <div className="border-end" style={{ width: '250px', overflowY: 'auto' }}>
              <div className="p-3 border-bottom bg-light">
                <small className="text-muted fw-bold">CONVERSACIONES RECIENTES</small>
              </div>
              <ListGroup variant="flush">
                {conversaciones.map(conv => (
                  <ListGroup.Item 
                    key={conv.id}
                    action
                    active={conv.id === conversacionId}
                    onClick={() => cargarConversacion(conv.id)}
                    className="py-3"
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="fw-semibold">{conv.titulo}</div>
                        <small className="text-muted">
                          {formatearFecha(conv.actualizado_en)}
                        </small>
                        <br />
                        <Badge bg="secondary" className="mt-1">
                          {conv.total_mensajes} mensajes
                        </Badge>
                      </div>
                      <Badge bg={conv.estado === 'activa' ? 'success' : 'secondary'}>
                        {conv.estado}
                      </Badge>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}

          {/* Área de mensajes */}
          <div className="flex-grow-1 d-flex flex-column">
            <div className="flex-grow-1 p-3" style={{ overflowY: 'auto' }}>
              {messages.length === 0 && (
                <div className="text-center text-muted mt-5">
                  <FaRobot size={48} className="mb-3" />
                  <p>¡Hola! Soy tu asistente para consultas de venta.</p>
                  <Button variant="outline-primary" onClick={nuevaConversacion}>
                    Iniciar conversación
                  </Button>
                </div>
              )}
              
              {messages.map((message) => (
                <div key={message.id} className={`mb-3 d-flex ${message.rol === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                  <div className={`chat-message ${message.rol === 'user' ? 'user-message' : 'assistant-message'}`}>
                    {message.rol === 'assistant' && (
                      <div className="d-flex align-items-center gap-2 mb-2">
                        {getTipoConsultaIcon(message.tipoConsulta)}
                        <small className="text-muted">
                          {formatearFecha(message.creado_en)}
                        </small>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0"
                          onClick={() => copiarMensaje(message.contenido)}
                        >
                          <FaCopy size={12} />
                        </Button>
                      </div>
                    )}
                    
                    <div 
                      className="chat-content"
                      style={{ whiteSpace: 'pre-line' }}
                    >
                      {message.contenido}
                    </div>
                    
                    {message.rol === 'user' && (
                      <small className="text-muted d-block text-end mt-1">
                        {formatearFecha(message.creado_en)}
                      </small>
                    )}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="d-flex justify-content-start mb-3">
                  <div className="chat-message assistant-message">
                    <Spinner animation="grow" size="sm" className="me-2" />
                    Consultando información...
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensaje */}
            <div className="border-top p-3">
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Consulta precios, promociones, prestadores..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <Button 
                  variant="primary" 
                  onClick={handleSendMessage}
                  disabled={loading || !inputMessage.trim()}
                >
                  <FaPaperPlane />
                </Button>
              </InputGroup>
              
              {/* Sugerencias rápidas */}
              <div className="mt-2 d-flex flex-wrap gap-1">
                {[
                  "promociones activas",
                  "precios edad 30",
                  "prestadores CABA",
                  "comparar planes edad 45"
                ].map(sugerencia => (
                  <Button
                    key={sugerencia}
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setInputMessage(sugerencia)}
                    disabled={loading}
                  >
                    {sugerencia}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ChatVendedor;