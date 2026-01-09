import { useState, useEffect } from "react";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";
import { FaWhatsapp } from "react-icons/fa";
import axios from "axios";
import { API_URL } from "../../config";


const EnviarCotizacionModal = ({ show, onHide, cotizacion, prospecto, onCotizacionEnviada }) => {
  const [telefono, setTelefono] = useState(''); // ✅ Número real del prospecto (no visible al vendedor)
  const [telefonoMostrado, setTelefonoMostrado] = useState(''); // ✅ Número enmascarado que se muestra
  const [telefonoEditado, setTelefonoEditado] = useState(''); // ✅ NUEVO: Número editado por el vendedor
  const [modoEdicion, setModoEdicion] = useState(false); // ✅ NUEVO: Si está editando un número nuevo
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');

  // ✅ MODIFICADO: Autocompletar el teléfono cuando se abra el modal
  useEffect(() => {
    if (show && prospecto?.numero_contacto) {
      setTelefono(prospecto.numero_contacto);
      setTelefonoMostrado(maskPhoneNumber(prospecto.numero_contacto));
      setTelefonoEditado('');
      setModoEdicion(false);
    } else if (!show) {
      // Limpiar el campo cuando se cierre el modal
      setTelefono('');
      setTelefonoMostrado('');
      setTelefonoEditado('');
      setModoEdicion(false);
    }
  }, [show, prospecto?.numero_contacto]);

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

  // ✅ MODIFICADO: Manejar cuando el usuario hace foco en el campo
  const handleFocus = () => {
    // Si hace foco, activar modo edición para permitir ingresar un número nuevo
    setModoEdicion(true);
  };

  // ✅ MODIFICADO: Manejar cuando el usuario sale del campo
  const handleBlur = () => {
    // No cambiar nada al perder el foco, mantener lo que está editando
  };

  // ✅ MODIFICADO: Manejar cambios en el campo de teléfono
  const handleTelefonoChange = (e) => {
    const valor = e.target.value;
    if (modoEdicion) {
      setTelefonoEditado(valor);
    }
  };

  // ✅ NUEVO: Obtener el número a enviar (editado o el original del prospecto)
  const getNumeroParaEnviar = () => {
    return modoEdicion && telefonoEditado.trim() !== '' ? telefonoEditado.trim() : telefono;
  };

  const handleEnviar = async () => {
    const numeroParaEnviar = getNumeroParaEnviar();
    
    if (!numeroParaEnviar || numeroParaEnviar.trim() === '') {
      setMensaje('Por favor ingresa un número de teléfono');
      setTipoMensaje('danger');
      return;
    }

    setEnviando(true);
    setMensaje('');

    try {
      const token = localStorage.getItem("token");
      
      console.log('🟡 Enviando cotización:', { telefono: numeroParaEnviar, cotizacion, prospecto });
      
      await axios.post(
        `${API_URL}/prospectos/enviar-whatsapp`,
        {
          telefono: numeroParaEnviar,
          cotizacion,
          prospecto
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMensaje('¡Cotización enviada por WhatsApp exitosamente! 📱');
      setTipoMensaje('success');
      
      // ✅ Mostrar mensaje informativo para dirigirse a WhatsApp
      setTimeout(() => {
        setMensaje('✅ Cotización enviada correctamente. Para continuar la conversación con el cliente, dirígete a la sección de WhatsApp desde el menú lateral.');
        setTipoMensaje('info');
      }, 2000);
      
      // Cerrar el modal después de 6 segundos
      setTimeout(() => {
        onHide();
        setMensaje('');
      }, 6000);

    } catch (error) {
      console.error('Error enviando cotización:', error);
      setMensaje(
        error.response?.data?.error || 
        'Error al enviar la cotización. Inténtalo nuevamente.'
      );
      setTipoMensaje('danger');
    } finally {
      setEnviando(false);
    }
  };

  const handleClose = () => {
    if (!enviando) {
      setMensaje('');
      setTipoMensaje('');
      setTelefono('');
      setTelefonoMostrado('');
      setTelefonoEditado('');
      setModoEdicion(false);
      onHide();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaWhatsapp className="text-success me-2" />
          Enviar Cotización por WhatsApp
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {cotizacion && (
          <div className="mb-3">
            <h6>Resumen de la Cotización:</h6>
            <div className="bg-light p-3 rounded">
              <p><strong>Plan:</strong> {cotizacion.plan_nombre}</p>
              <p><strong>Grupo Familiar:</strong> {
                cotizacion.detalles && cotizacion.detalles.length > 0 
                  ? cotizacion.detalles.map(d => d.vinculo).join(", ")
                  : "Individual"
              }</p>
              <p><strong>Total Final:</strong> <span className="text-success fw-bold">{formatCurrency(cotizacion.total_final)}</span></p>
            </div>
          </div>
        )}

        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Número de WhatsApp:</Form.Label>
            <Form.Control
              type="tel"
              value={modoEdicion ? telefonoEditado : telefonoMostrado}
              onChange={handleTelefonoChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={modoEdicion ? "Ingresa un número de WhatsApp" : "Haz clic para ingresar número"}
              disabled={enviando}
            />
            <Form.Text className="text-muted">
              {modoEdicion 
                ? "Ingresa el número de WhatsApp donde enviar la cotización" 
                : "Número del prospecto enmascarado por seguridad. Haz clic para usar otro número."
              }
            </Form.Text>
          </Form.Group>
        </Form>

        {mensaje && (
          <Alert variant={tipoMensaje} className="mt-3">
            {mensaje}
          </Alert>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={enviando}>
          Cancelar
        </Button>
        <Button 
          variant="success" 
          onClick={handleEnviar}
          disabled={enviando || (!modoEdicion && !telefono) || (modoEdicion && !telefonoEditado.trim())}
        >
          {enviando ? (
            <>
              <Spinner size="sm" className="me-2" />
              Enviando...
            </>
          ) : (
            <>
              <FaWhatsapp className="me-2" />
              Enviar por WhatsApp
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EnviarCotizacionModal;