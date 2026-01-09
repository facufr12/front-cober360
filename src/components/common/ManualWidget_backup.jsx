import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { FaQuestion, FaTimes, FaBook, FaRobot, FaPaperPlane } from 'react-icons/fa';
import { API_URL } from "../config";

// Estilos para el componente
const ManualContainer = styled.div`
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 9999;
`;

const ManualIconButton = styled.button`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6c63ff, #5a52d5);
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
    background: linear-gradient(135deg, #5a52d5, #4c46b8);
  }
`;

const ManualWindow = styled.div`
  position: absolute;
  bottom: 70px;
  left: 0;
  width: 400px;
  height: 600px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 2px solid #6c63ff;
`;

const ManualHeader = styled.div`
  background: linear-gradient(135deg, #6c63ff, #5a52d5);
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
  max-width: 85%;
  padding: 10px 15px;
  border-radius: 15px;
  font-size: 13px;
  line-height: 1.4;
  position: relative;
  white-space: pre-line;
  
  ${props => props.isUser ? `
    align-self: flex-end;
    background: linear-gradient(135deg, #6c63ff, #5a52d5);
    color: white;
    border-bottom-right-radius: 5px;
  ` : `
    align-self: flex-start;
    background-color: #f8f9fa;
    color: #333;
    border-bottom-left-radius: 5px;
    border: 1px solid #e9ecef;
  `}
`;

const ChatInput = styled.div`
  display: flex;
  padding: 10px;
  border-top: 1px solid #dee2e6;
  background-color: #f8f9fa;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 8px 15px;
  border: 1px solid #dee2e6;
  border-radius: 20px;
  font-size: 13px;
  outline: none;
  
  &:focus {
    border-color: #6c63ff;
  }
`;

const SendButton = styled.button`
  background: linear-gradient(135deg, #6c63ff, #5a52d5);
  color: white;
  border: none;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  margin-left: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background: linear-gradient(135deg, #5a52d5, #4c46b8);
    transform: scale(1.05);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const SuggestionChip = styled.button`
  background-color: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
  border-radius: 15px;
  padding: 5px 12px;
  margin: 2px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #bbdefb;
  }
`;

const SuggestionsContainer = styled.div`
  padding: 10px 15px;
  border-top: 1px solid #e9ecef;
  background-color: #f8f9fa;
  max-height: 100px;
  overflow-y: auto;
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 15px;
  font-size: 12px;
  color: #6c757d;
  
  &::after {
    content: '';
    width: 16px;
    height: 16px;
    margin-left: 8px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #6c63ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ManualWidget = ({ userRole = 'supervisor' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Sugerencias rápidas según el rol
  const quickSuggestions = {
    supervisor: [
      "¿Cómo ver las métricas de un vendedor?",
      "¿Cómo reasignar prospectos?",
      "¿Cómo interpretar el dashboard?",
      "¿Cómo deshabilitar un vendedor?",
      "¿Qué significan los estados de póliza?"
    ],
    vendedor: [
      "¿Cómo crear un nuevo prospecto?",
      "¿Cómo funciona el panel de prospectos?",
      "¿Cómo enviar una cotización por WhatsApp?",
      "¿Cómo usar el módulo Mis Pólizas?",
      "¿Qué significan los estados de póliza?"
    ]
  };
  
  // Auto-scroll al último mensaje
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Inicializar chat cuando se abre
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: 1,
        role: 'assistant',
        content: `¡Hola! 👋 Soy tu asistente de manual interactivo para ${userRole === 'supervisor' ? 'supervisores' : 'vendedores'}. 

Puedo ayudarte con:
${userRole === 'supervisor' ? 
`📊 Gestión de vendedores y equipos
📈 Interpretación de métricas y dashboards  
👥 Administración de prospectos y pólizas
🔍 Uso de filtros y herramientas avanzadas` :
`➕ Crear nuevos prospectos (botón Nuevo Prospecto)
📋 Panel de prospectos (formato cards)
🟣 Sección "Ver Detalles" con cotizaciones
📱 Envío de cotizaciones por WhatsApp
🎁 Aplicación de promociones y descuentos
📊 Cálculo de Ley 19032 (aporte presuntivo)
💬 Seguimiento desde Sidebar WhatsApp
📁 Módulo "Mis Pólizas" completo`}

¿En qué puedo ayudarte hoy? 🤔

También puedes usar las sugerencias rápidas que aparecen abajo 👇`
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, userRole, messages.length]);
  
  const toggleManual = () => {
    setIsOpen(!isOpen);
  };
  
  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    handleSendMessage(suggestion);
  };
  
  const handleSendMessage = async (messageText = null) => {
    const textToSend = messageText || inputMessage;
    if (textToSend.trim() === '') return;
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: textToSend
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    
    // Modo fallback prioritario para respuestas rápidas
    const USE_FALLBACK_ONLY = true; // Cambiar a false para usar API
    
    if (USE_FALLBACK_ONLY) {
      // Respuesta inmediata usando el manual local
      setTimeout(() => {
        const fallbackResponse = generateFallbackResponse(textToSend);
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: fallbackResponse
        };
        setMessages(prev => [...prev, assistantMessage]);
        setLoading(false);
      }, 500); // Simular pequeño delay para UX
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || 1;
      
      // Contexto más conciso para reducir latencia
      const manualContext = `Manual Cober360 - Rol: ${userRole}. Responde de forma práctica y concisa.`;
      
      // Configuración con timeout más agresivo
      const response = await axios.post(
        `${API_URL}/chatbot/mensaje`,
        {
          mensaje: textToSend, // Enviar solo la pregunta
          conversacionId: conversationId,
          usuarioId: userId,
          tipo: 'manual_interactivo',
          rol: userRole,
          contexto: manualContext // Contexto separado y más pequeño
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000 // Timeout de 10 segundos
        }
      );
      
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.mensaje || response.data.respuesta || 'Lo siento, no pude procesar tu consulta.'
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Guardar ID de conversación si es nuevo
      if (response.data.conversacionId && !conversationId) {
        setConversationId(response.data.conversacionId);
      }
      
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      
      // Si hay timeout o error de red, usar fallback inmediatamente
      const isTimeoutOrNetworkError = error.code === 'ECONNABORTED' || error.message.includes('timeout') || !navigator.onLine;
      
      if (isTimeoutOrNetworkError) {
        console.log('Usando respuesta fallback por timeout/red');
      }
      
      // Respuesta de fallback con contenido del manual estático
      const fallbackResponse = generateFallbackResponse(textToSend);
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: fallbackResponse
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  // Función de respuesta de fallback basada en el manual estático
  const generateFallbackResponse = (question) => {
    const q = question.toLowerCase();
    
    if (userRole === 'supervisor') {
      if (q.includes('vendedor') && (q.includes('deshabilitar') || q.includes('eliminar'))) {
        return `🚫 **Para deshabilitar un vendedor:**

1. Ve a la sección "Vendedores" 📋
2. Busca al vendedor en la lista
3. **IMPORTANTE**: Primero reasigna sus prospectos activos 🔄
4. Haz clic en el botón de "Gestionar"
5. Selecciona "Deshabilitar vendedor" ⚠️

⚠️ **Importante**: Siempre reasigna los prospectos antes de deshabilitar para no perder leads.

💡 **Tip**: Puedes usar filtros para ver qué prospectos tiene asignados antes de proceder.`;
      }
      
      if (q.includes('reasignar') || (q.includes('prospecto') && q.includes('vendedor'))) {
        return `🔄 **Para reasignar prospectos:**

1. Accede a "Gestión de Vendedores" 👥
2. Selecciona el vendedor origen
3. Ve sus prospectos asignados 📋
4. Marca los que quieres reasignar ☑️
5. Elige el vendedor destino 🎯
6. Confirma la reasignación ✅

📊 **Casos de uso:**
• Balancear cargas de trabajo
• Cuando un vendedor se da de baja
• Especialización por tipo de cliente
• Redistribución por performance

💡 **Tip**: Puedes reasignar múltiples prospectos a la vez usando checkboxes.`;
      }
      
      if (q.includes('dashboard') || q.includes('métrica') || q.includes('estadística')) {
        return `📊 **Dashboard del Supervisor:**

**Tarjetas principales:**
• 👥 Total Prospectos: Leads en el sistema
• 🎯 Vendedores Activos: Equipo habilitado
• ✅ Ventas Confirmadas: Estado "Venta"
• 📋 Pólizas Generadas: Documentos creados
• 💰 Total Facturado: Valor de ventas

**Gráfica de tendencias:**
📈 Evolución mensual de prospectos, vendedores, ventas y pólizas

**Resumen ejecutivo:**
• Tasa de conversión
• Promedio por venta
• Prospectos por vendedor
• Progreso de meta mensual

💡 **Tip**: Usa estas métricas para identificar tendencias y tomar decisiones estratégicas.`;
      }
    } else {
      if (q.includes('crear') && (q.includes('prospecto') || q.includes('nuevo'))) {
        return `➕ **Crear Nuevo Prospecto (Sidebar):**

**📍 Ubicación:**
Sidebar Izquierdo → Botón **"Nuevo Prospecto"** ➕

**📋 Formulario de Creación:**

**Datos del Prospecto Principal:**
• 📝 **Nombre**: Nombre del prospecto
• 📝 **Apellido**: Apellido del prospecto  
• 🎂 **Edad**: Edad del prospecto
• 📋 **Tipo de Afiliación**: Dropdown con opciones disponibles
• 📞 **Número de contacto**: Teléfono principal
• 📧 **Correo**: Email de contacto
• 📍 **Localidad**: Dropdown con localidades disponibles
• 💭 **Comentario**: Campo libre para observaciones sobre el prospecto

**👨‍👩‍👧‍👦 Sección de Familiares:**
Para cada familiar puedes agregar:
• 🔗 **Vínculo**: Dropdown (Cónyuge, Hijo/a, Padre/Madre, etc.)
• 📝 **Nombre**: Nombre del familiar
• 🎂 **Edad**: Edad del familiar

**⚙️ Proceso de creación:**
1. Haz clic en **"Nuevo Prospecto"** en el sidebar ➕
2. Completa todos los **datos obligatorios** del prospecto principal
3. Agrega los **familiares** que correspondan usando el formulario
4. Revisa que la **localidad** y **tipo de afiliación** sean correctos
5. Agrega **comentarios** relevantes para futuros seguimientos
6. Haz clic en **"Crear Prospecto"** para guardarlo ✅

💡 **Tip**: Una vez creado, el prospecto aparecerá en tu panel principal y podrás generar cotizaciones inmediatamente.`;
      }
      
      if (q.includes('prospecto') || q.includes('gestión') || q.includes('panel')) {
        return `👥 **Gestión de Prospectos - Panel del Vendedor:**

**Al ingresar al panel verás:**
📋 Tus prospectos asignados en formato de tarjetas (cards)
👤 Información básica de cada prospecto

**Acciones disponibles en cada card (5 botones):**

1. **🔄 Cambiar Estado**: 
   • Modifica el estado del prospecto
   • El botón de guardado se pone **verde** ✅ para confirmar
   • Estados: Nuevo, Contactado, Interesado, Cotizado, etc.

2. **👁️ Ver Historial**: 
   • Muestra todo el historial de interacciones
   • Registro completo de contactos y seguimientos

3. **📱 WhatsApp**: 
   • Verifica si hay conversaciones en curso
   • Accede al chat integrado con el prospecto

4. **🟣 Ver Detalles** (botón morado): 
   • Accede a información completa del prospecto
   • **Aquí encuentras las cotizaciones** 💰
   • Datos familiares y documentación

5. **⚙️ Gestionar**: 
   • Opciones adicionales del prospecto

💡 **Flujo recomendado**: Revisa el estado → Ve el historial → Accede a detalles para cotizar → Usa WhatsApp para comunicarte`;
      }
      
      if (q.includes('detalle') || q.includes('ver detalle') || q.includes('botón morado')) {
        return `🟣 **Sección "Ver Detalles" (Botón Morado):**

**¿Qué encontrarás aquí?**
💰 **Todas las cotizaciones del prospecto** con diferentes planes
📊 **Detalle completo de cada cotización** con descuentos aplicados
🎁 **Panel de aplicación de promociones**
📱 **Inicio de conversación con envío de cotización**
📋 **Opción para generar póliza** (cuando el lead está calificado)

**Vista detallada de cotizaciones:**
Verás una tabla con:
• 👤 **Persona**: Nombre del afiliado
• 🔗 **Vínculo**: Titular/Cónyuge/Hijo/etc.
• 🎂 **Edad**: Años del afiliado
• 📝 **Tipo Afiliación**: Categoría de cobertura
• 💰 **Base**: Precio original
• 📉 **Desc. Aporte**: Descuento por Ley 19032
• 🎁 **Desc. Promoción**: Descuento aplicado
• 🏷️ **Promoción**: Nombre de la promo
• ✅ **Final**: Precio final con descuentos

**🚀 Iniciar conversación:**
• Selecciona el plan que quieres enviar
• Haz clic en "Enviar Cotización por WhatsApp"
• **La conversación se inicia automáticamente** 💬
• El prospecto recibe la cotización seleccionada

💡 **Ejemplo**: Ale At (Titular, 40 años) - Base: $141.285,58 → Final: $84.771,35`;
      }
      
      if (q.includes('cotización') || q.includes('cotizar') || q.includes('enviar cotización')) {
        return `💰 **Para generar y enviar una cotización:**

**📋 Proceso de generación:**
1. En el panel de prospectos, haz clic en el **botón morado** 🟣 "Ver Detalles"
2. Accede a la sección de cotizaciones dentro del detalle
3. Verifica datos del cliente y familiares 👨‍👩‍👧‍👦
4. Selecciona tipos de afiliación para cada persona ✅
5. Aplica promociones disponibles 🎁
6. Haz clic en "Generar Cotización" 💰
7. Revisa precios y descuentos aplicados

**📱 Envío e inicio de conversación:**
8. **Selecciona el plan** que quieres enviar al prospecto
9. Haz clic en **"Enviar Cotización por WhatsApp"** 📤
10. **¡La conversación se inicia automáticamente!** ✅
11. El cliente recibe la cotización del plan seleccionado
12. Puedes hacer seguimiento desde el **Sidebar WhatsApp** 📱

**Tipos de planes disponibles:**
🔵 **CLASSIC**: Cobertura básica
🟢 **TAYLORED**: Personalizada
🟡 **WAGON**: Familiar completa  
🔴 **COBER X**: Premium

💡 **Tip**: Puedes enviar diferentes planes al mismo prospecto para que compare opciones.`;
      }
      
      if (q.includes('estado') || q.includes('cambiar estado')) {
        return `🔄 **Para cambiar el estado de un prospecto:**

1. En el panel principal, localiza la card del prospecto 📋
2. Haz clic en el botón **"Cambiar Estado"** 🔄
3. Selecciona el nuevo estado apropiado 📝
4. **¡Importante!** El botón de guardado se pondrá **VERDE** ✅
5. Confirma haciendo clic en el botón verde para guardar

**Estados comunes:**
🆕 **Nuevo**: Prospecto recién asignado
☎️ **Contactado**: Ya se estableció comunicación  
🤔 **Interesado**: Muestra interés en el producto
💰 **Cotizado**: Se envió cotización
✅ **Venta**: Confirma la compra
❌ **No Interesado**: Rechaza el producto

⚠️ **Importante**: Siempre confirma con el botón verde para que se guarde el cambio.`;
      }
      
      if (q.includes('whatsapp') || q.includes('conversación') || q.includes('chat') || q.includes('sidebar')) {
        return `📱 **WhatsApp Integrado - Sistema Completo:**

**💬 Iniciar conversación (desde Ver Detalles):**
1. En la sección "Ver Detalles" del prospecto 🟣
2. Selecciona el plan/cotización que quieres enviar
3. Haz clic en **"Enviar Cotización por WhatsApp"** 📤
4. **La conversación se inicia automáticamente** ✅
5. El prospecto recibe la cotización del plan seleccionado

**📋 Seguimiento (desde el panel de prospectos):**
1. Localiza la card del prospecto 📋
2. Haz clic en el botón de **WhatsApp** 📱
3. El sistema te mostrará si hay **conversaciones en curso** 💬
4. Accede al chat integrado desde ahí

**🔧 Seguimiento avanzado (Sidebar WhatsApp):**
1. Ve al **Sidebar** y selecciona **"WhatsApp"** 📱
2. Verás **todas las conversaciones activas**
3. Filtra por estado: Activas, Pendientes, etc.
4. Haz seguimiento completo de todas tus conversaciones
5. Gestiona múltiples chats desde un solo lugar

**Funciones disponibles:**
✅ Iniciar conversaciones con cotizaciones
✅ Ver conversaciones existentes
✅ Gestionar múltiples chats simultáneamente
✅ Compartir documentos y archivos
✅ Historial completo de mensajes
✅ Seguimiento centralizado desde sidebar

**Estados del chat:**
🟢 **Activo**: Conversación en curso
🟡 **Pendiente**: Esperando respuesta del cliente
⚫ **Sin actividad**: No hay conversaciones recientes

💡 **Flujo recomendado**: Ver Detalles → Enviar Cotización → Seguimiento por Sidebar WhatsApp`;
      }
      
      if (q.includes('promoción') || q.includes('descuento') || q.includes('aplicar promoción')) {
        return `🎁 **Para aplicar promociones (en Ver Detalles):**

**En la parte superior encontrarás "Aplicar Promoción":**

**Promociones disponibles:**
1. **🎯 Promo General**
   • Descuento general del 40%
   • Aplicable a todos los planes

2. **🏦 Promo Débito Automático**
   • Descuento del 55% por débito automático
   • Requiere autorización de débito

3. **💰 Promo Pago Adelantado**
   • Descuento del 60% por pago adelantado
   • 12 cuotas con cuota congelada

**Proceso:**
1. Haz clic en "Aplicar Promoción" 🎁
2. Selecciona la promoción apropiada del dropdown
3. Verifica el porcentaje de descuento mostrado
4. **El precio total final se actualiza automáticamente** ✅
5. Verifica que se aplique a todas las personas elegibles

💡 **Tip**: El sistema calcula automáticamente el nuevo precio final cuando seleccionas una promoción.`;
      }
      
      if (q.includes('ley 19032') || q.includes('aporte presuntivo') || q.includes('recibo de sueldo')) {
        return `📊 **Ley 19032 - Aporte Presuntivo:**

**¿Cuándo aplicar?**
✅ Cuando el prospecto tiene **recibo de sueldo**
✅ Aparece la opción "Aplicar Ley 19032 - Aporte Presuntivo"

**Información que verás:**
• 📋 **Cotizaciones encontradas**: Cantidad total
• 👥 **Personas con recibo de sueldo**: Cuántas califican
• 📝 **Detalles por cotización**: Breakdown por plan

**Ejemplo del sistema:**
"Cotizaciones encontradas: 4
Total de personas con recibo de sueldo: 4
• CLASSIC X - $50.750,48 - Gabriel Perez (Titular)
• TAYLORED - $71.730,33 - Gabriel Perez (Titular)
• WAGON - $99.004,97 - Gabriel Perez (Titular)
• COBER X - $134.462,73 - Gabriel Perez (Titular)"

**Cálculo automático:**
🧮 **Fórmula**: (Ley 19032 ÷ 0.03) × 0.06732 = Aporte Presuntivo
📝 **Input requerido**: Importe exacto del recibo de sueldo
💼 **Ejemplo**: Si el recibo muestra 53831.54, ingresar exactamente ese valor

⚠️ **Importante**: Se aplicará automáticamente a todas las cotizaciones con personas que tengan recibo de sueldo.`;
      }
      
      if (q.includes('póliza') || q.includes('generar póliza') || q.includes('mis pólizas') || q.includes('módulo pólizas')) {
        return `📋 **Gestión Completa de Pólizas:**

**🟣 PASO 1: Generar Póliza (desde Ver Detalles)**
**¿Cuándo está disponible?**
✅ Cuando el lead ya está **calificado**
✅ Después de aplicar promociones y descuentos
✅ Con cotización finalizada

**Proceso de generación:**
1. **Verificar datos**: Toda la información del prospecto
2. **Completar formularios**: Datos relevantes para la póliza
3. **Documentación requerida**: Subir archivos necesarios
4. **Revisión final**: Confirmar todos los datos
5. **Generar póliza**: Crear documento oficial

**📁 PASO 2: Módulo "Mis Pólizas" (Sidebar Izquierdo)**
Una vez generada la póliza, ve al **Sidebar Izquierdo** → **"Mis Pólizas"** 📋

**En este módulo podrás:**
👀 **Ver todas las pólizas generadas** por ti
📊 **Revisar estados** (manejados por el supervisor)
📥 **Descargar la póliza** en PDF
📂 **Visualizar documentos** adjuntos
📱 **Enviar póliza por WhatsApp** al cliente

**Estados de póliza (gestionados por supervisor):**
🟡 **Pendiente**: Falta documentación
🔵 **En Proceso**: En revisión por supervisor
🟢 **Activa**: Aprobada y vigente
🔴 **Cancelada**: Anulada por supervisor

**Documentos requeridos:**
• 📝 Formulario de solicitud firmado
• 🆔 Copia de cédula de identidad
• 💼 Recibo de sueldo (si aplica)
• 📊 Comprobante monotributo (si aplica)
• 🏥 Certificado médico (según plan)

💡 **Flujo completo**: Generar póliza → Ir a "Mis Pólizas" → Descargar/Enviar → Seguimiento de estado`;
      }
      
      if (q.includes('sidebar') && q.includes('póliza')) {
        return `📁 **Módulo "Mis Pólizas" (Sidebar Izquierdo):**

**📍 Ubicación:**
Sidebar Izquierdo → Sección **"Mis Pólizas"** 📋

**🔍 ¿Qué verás aquí?**
• **Lista completa** de todas las pólizas que has generado
• **Estado actual** de cada póliza (manejado por supervisor)
• **Información básica** del cliente y plan
• **Fecha de generación** y últimas actualizaciones

**⚙️ Acciones disponibles:**
1. **📥 Descargar Póliza**: 
   • Descarga el documento PDF oficial
   • Listo para imprimir o enviar

2. **📂 Ver Documentos**: 
   • Visualiza todos los documentos adjuntos
   • Revisa la documentación completa del cliente

3. **📱 Enviar por WhatsApp**: 
   • Envía la póliza directamente al cliente
   • Integrado con el sistema de chat

4. **👁️ Ver Estado**: 
   • Monitorea el progreso de aprobación
   • Estados controlados por el supervisor

**📊 Estados posibles:**
🟡 **Pendiente**: Esperando documentación adicional
🔵 **En Proceso**: Supervisor revisando
🟢 **Activa**: Aprobada y vigente
🔴 **Cancelada**: Rechazada o anulada

💡 **Tip**: Revisa regularmente este módulo para hacer seguimiento del estado de tus pólizas y actuar según las indicaciones del supervisor.`;
      }
      
      if (q.includes('documento')) {
        return `📋 **Gestión de Documentos:**

**Estados de póliza:**
🟡 **Pendiente**: Falta documentación
🔵 **En Proceso**: En revisión
🟢 **Activa**: Aprobada y vigente
🔴 **Cancelada**: Anulada

**Documentos requeridos:**
• 📝 Formulario de solicitud firmado
• 🆔 Copia de cédula de identidad
• 💼 Recibo de sueldo (si aplica)
• 📊 Comprobante monotributo (si aplica)
• 🏥 Certificado médico (según plan)

**Para subir documentos:**
• Formatos: PDF, JPG, PNG
• Máximo: 10MB por archivo
• Verificar legibilidad

💡 **Tip**: Mantén al cliente informado del progreso y ayúdalo con dudas sobre formularios.`;
      }
    }
    
    return `Lo siento, no pude procesar tu consulta específica en este momento. 😅

Puedes intentar con preguntas más específicas sobre:
${userRole === 'supervisor' ? 
`📊 Gestión de vendedores
📈 Métricas del dashboard  
👥 Administración de prospectos
📋 Supervisión de pólizas` :
`➕ Crear nuevos prospectos
💰 Generación de cotizaciones
🎁 Aplicación de promociones
📋 Gestión de pólizas
📱 Comunicación con clientes`}

O usa las sugerencias rápidas que aparecen abajo. 💡`;
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  return (
    <ManualContainer>
      {isOpen && (
        <ManualWindow>
          <ManualHeader>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FaRobot style={{ marginRight: '10px' }} />
              <h4 style={{ margin: 0 }}>Manual Interactivo</h4>
            </div>
            <FaTimes 
              style={{ cursor: 'pointer' }} 
              onClick={toggleManual} 
            />
          </ManualHeader>
          
          <ChatMessages>
            {messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                isUser={msg.role === 'user'}
              >
                {msg.content}
              </MessageBubble>
            ))}
            {loading && (
              <LoadingIndicator>
                Pensando...
              </LoadingIndicator>
            )}
            <div ref={messagesEndRef} />
          </ChatMessages>
          
          {quickSuggestions[userRole] && (
            <SuggestionsContainer>
              <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '5px' }}>
                💡 Sugerencias rápidas:
              </div>
              {quickSuggestions[userRole].map((suggestion, index) => (
                <SuggestionChip
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </SuggestionChip>
              ))}
            </SuggestionsContainer>
          )}
          
          <ChatInput>
            <MessageInput
              type="text"
              placeholder={loading ? "Espera un momento..." : "Pregúntame sobre el sistema..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <SendButton 
              onClick={() => handleSendMessage()}
              disabled={loading || inputMessage.trim() === ''}
            >
              <FaPaperPlane />
            </SendButton>
          </ChatInput>
        </ManualWindow>
      )}
      
      <ManualIconButton onClick={toggleManual}>
        {isOpen ? <FaTimes /> : <FaQuestion />}
      </ManualIconButton>
    </ManualContainer>
  );
};

export default ManualWidget;
