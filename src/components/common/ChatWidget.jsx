import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { FaWhatsapp, FaTimes, FaPaperPlane } from 'react-icons/fa';
import { API_URL } from "../config";

// Estilos para el componente
const ChatContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
`;

const ChatIconButton = styled.button`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #25D366;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const ChatWindow = styled.div`
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 350px;
  height: 500px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ChatHeader = styled.div`
  background-color: #075E54;
  color: white;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 10px 15px;
  border-radius: 15px;
  font-size: 14px;
  position: relative;
  
  ${props => props.isUser ? `
    align-self: flex-end;
    background-color: #DCF8C6;
    border-bottom-right-radius: 5px;
  ` : `
    align-self: flex-start;
    background-color: #F1F0F0;
    border-bottom-left-radius: 5px;
  `}
`;

const ChatInput = styled.div`
  display: flex;
  padding: 10px;
  border-top: 1px solid #ECECEC;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ECECEC;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
`;

const SendButton = styled.button`
  background-color: #25D366;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-left: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Cargar conversación existente o iniciar una nueva
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Inicializamos los mensajes con un saludo
      setMessages([
        { id: 1, role: 'assistant', content: '¡Hola! Soy tu asistente virtual de cotizaciones de salud. ¿En qué puedo ayudarte hoy?' }
      ]);
    }
  }, [isOpen, messages.length]);
  
  // Auto-scroll al último mensaje
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };
  
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };
  
  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    
    try {
      // Obtener el token del localStorage
      const token = localStorage.getItem('token');
      
      // Enviar mensaje al backend
      const response = await axios.post(
        `${API_URL}/chatbot/mensaje`,
        {
          mensaje: inputMessage,
          conversacionId: conversationId,
          usuarioId: 1 // Deberías obtener el ID del usuario actual
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Añadir respuesta del asistente
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.mensaje
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Guardar ID de conversación
      if (response.data.conversacionId && !conversationId) {
        setConversationId(response.data.conversacionId);
      }
      
      // Si hay cotización, mostrarla
      if (response.data.cotizacion) {
        // Crear un mensaje más informativo sobre la cotización
        let cotizacionInfo = "";
        if (response.data.cotizacion && response.data.cotizacion.length > 0) {
          const planEconomico = response.data.cotizacion.reduce((prev, current) => 
            prev.total_final < current.total_final ? prev : current, response.data.cotizacion[0]);
          
          cotizacionInfo = `
            📋 Cotización generada con éxito!
            
            Plan más económico: ${planEconomico.plan_nombre}
            Precio final: $${planEconomico.total_final.toFixed(2)}
            
            También puedes consultar otros planes disponibles.
            Un asesor se pondrá en contacto contigo pronto.
          `;
        } else {
          cotizacionInfo = "¡Cotización generada con éxito! Un asesor se pondrá en contacto contigo.";
        }

        const cotizacionMessage = {
          id: Date.now() + 2,
          role: 'assistant',
          content: cotizacionInfo
        };
        
        setMessages(prev => [...prev, cotizacionMessage]);
      }
      
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      
      // Mensaje de error
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Lo siento, ha ocurrido un error. Por favor, intenta nuevamente más tarde.'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  return (
    <ChatContainer>
      {isOpen && (
        <ChatWindow>
          <ChatHeader>
            <h4 style={{ margin: 0 }}>Asistente de Cotizaciones</h4>
            <FaTimes 
              style={{ cursor: 'pointer' }} 
              onClick={toggleChat} 
            />
          </ChatHeader>
          
          <ChatMessages>
            {messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                isUser={msg.role === 'user'}
              >
                {msg.content}
              </MessageBubble>
            ))}
            <div ref={messagesEndRef} />
          </ChatMessages>
          
          <ChatInput>
            <MessageInput
              type="text"
              placeholder={loading ? "Espera un momento..." : "Escribe tu mensaje..."}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <SendButton 
              onClick={handleSendMessage}
              disabled={loading || inputMessage.trim() === ''}
            >
              <FaPaperPlane />
            </SendButton>
          </ChatInput>
        </ChatWindow>
      )}
      
      <ChatIconButton onClick={toggleChat}>
        {isOpen ? <FaTimes /> : <FaWhatsapp />}
      </ChatIconButton>
    </ChatContainer>
  );
};

export default ChatWidget;