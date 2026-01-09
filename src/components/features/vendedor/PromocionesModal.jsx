import { useState, useEffect } from "react";
import { Modal, Button, Form, Card, Alert } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2"; // Añadir esta importación
import { API_URL } from "../../config";


const PromocionesModal = ({ prospectoId, show, onClose, onPromocionAplicada }) => {
  const [promociones, setPromociones] = useState([]);
  const [selectedPromocion, setSelectedPromocion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [promocionActual, setPromocionActual] = useState(null);

  useEffect(() => {
    if (show) {
      fetchPromociones();
      fetchPromocionActual();
    }
  }, [show, prospectoId]);

  const fetchPromociones = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${API_URL}/vendedor/promociones`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPromociones(data);
    } catch (error) {
      setError("Error al cargar promociones");
      console.error("Error al obtener promociones:", error);
    }
  };

  const fetchPromocionActual = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${API_URL}/vendedor/prospectos/${prospectoId}/promocion-actual`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data && data.promocion) {
        setPromocionActual(data.promocion);
      } else {
        setPromocionActual(null);
      }
    } catch (error) {
      console.error("Error al obtener promoción actual:", error);
    }
  };

  const handleSelectPromocion = (promocion) => {
    setSelectedPromocion(promocion);
  };

  const handleAplicarPromocion = async () => {
    if (!selectedPromocion) {
      setError("Por favor selecciona una promoción");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/vendedor/prospectos/${prospectoId}/aplicar-promocion`,
        { promocionId: selectedPromocion.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPromocionActual(selectedPromocion);

      // Cerrar modal inmediatamente
      onClose();
      setSelectedPromocion(null);

      // Actualizar las cotizaciones en el componente padre
      if (onPromocionAplicada) {
        onPromocionAplicada();
      }

      // Mostrar SweetAlert de éxito
      Swal.fire({
        title: '¡Promoción aplicada!',
        text: `La promoción "${selectedPromocion.nombre || selectedPromocion.titulo}" con ${selectedPromocion.descuento_porcentaje || selectedPromocion.descuento}% de descuento se ha aplicado correctamente.`,
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#28a745'
      });
      
    } catch (error) {
      setError("Error al aplicar la promoción");
      console.error("Error al aplicar promoción:", error);
      
      // Mostrar SweetAlert de error
      Swal.fire({
        title: 'Error',
        text: 'No se pudo aplicar la promoción. Por favor, inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Aplicar Promoción</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {promocionActual && (
          <Alert variant="info">
            <h5>Promoción actual aplicada:</h5>
            <p>
              <strong>{promocionActual.nombre || promocionActual.titulo}</strong> -{" "}
              {promocionActual.descuento_porcentaje || promocionActual.descuento}%
            </p>
            <p>{promocionActual.descripcion}</p>
          </Alert>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        <Form>
          <Form.Group>
            <Form.Label>Selecciona una promoción:</Form.Label>
            <div className="row">
              {promociones.map((promocion) => (
                <div key={promocion.id} className="col-md-6 mb-3">
                  <Card
                    className={`h-100 ${
                      selectedPromocion?.id === promocion.id 
                        ? "border-primary border-3 shadow-lg promocion-selected" 
                        : "border-light promocion-hover"
                    }`}
                    onClick={() => handleSelectPromocion(promocion)}
                    style={{ 
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      transform: selectedPromocion?.id === promocion.id ? "scale(1.02)" : "scale(1)",
                      backgroundColor: selectedPromocion?.id === promocion.id ? "#f8f9ff" : "white"
                    }}
                  >
                    <Card.Body className="position-relative">
                      {selectedPromocion?.id === promocion.id && (
                        <div className="position-absolute top-0 end-0 m-2">
                          <div 
                            className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: "30px", height: "30px" }}
                          >
                            ✓
                          </div>
                        </div>
                      )}
                      <Card.Title className={selectedPromocion?.id === promocion.id ? "text-primary fw-bold" : ""}>
                        {promocion.nombre || promocion.titulo}
                      </Card.Title>
                      <Card.Text className={selectedPromocion?.id === promocion.id ? "text-dark" : "text-muted"}>
                        {promocion.descripcion}
                      </Card.Text>
                      <Card.Text className={`fw-bold ${selectedPromocion?.id === promocion.id ? "text-success fs-5" : "text-primary"}`}>
                        🎯 Descuento: {promocion.descuento_porcentaje || promocion.descuento}%
                      </Card.Text>
                      {promocion.fecha_vencimiento && (
                        <Card.Text className="text-muted small">
                          📅 Válido hasta:{" "}
                          {new Date(promocion.fecha_vencimiento).toLocaleDateString()}
                        </Card.Text>
                      )}
                      {selectedPromocion?.id === promocion.id && (
                        <div className="mt-2">
                          <small className="text-success fw-bold">
                            ✅ Promoción seleccionada
                          </small>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleAplicarPromocion}
          disabled={loading || !selectedPromocion}
        >
          {loading ? "Aplicando..." : "Aplicar Promoción"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PromocionesModal;

// Estilos CSS para mejorar la experiencia visual
const style = document.createElement('style');
style.textContent = `
  .promocion-hover:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
    border-color: #007bff !important;
  }

  .promocion-selected {
    animation: pulseSelection 2s ease-in-out;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25) !important;
  }

  @keyframes pulseSelection {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.4);
    }
    50% {
      transform: scale(1.02);
      box-shadow: 0 0 0 10px rgba(0, 123, 255, 0);
    }
    100% {
      transform: scale(1.02);
      box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
    }
  }

  .promocion-selected .card-title {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;
document.head.appendChild(style);