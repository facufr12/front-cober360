import { useEffect, useState } from "react";
import { Table, Button, Modal, Badge, Spinner, Card, Row, Col } from "react-bootstrap";
import { FaEye, FaWhatsapp } from "react-icons/fa";
import axios from "axios";
import { API_URL } from "../../config";

const TIPO_AFILIACION = {
  1: "Particular/autónomo",
  2: "Con recibo de sueldo",
  3: "Monotributista",
};


const PLAN_COLORS = {
  "Plan Oro": "warning",
  "Plan Plata": "secondary",
  "Plan Bronce": "info",
};

const getPlanColorClass = (planNombre) => {
  if (!planNombre) return "bg-primary";
  const nombre = planNombre.toLowerCase();
  if (nombre.includes("classic")) return "bg-primary";
  if (nombre.includes("taylored")) return "bg-success";
  if (nombre.includes("wagon")) return "bg-warning";
  if (nombre.includes("cober x")) return "bg-danger";
  return "bg-primary";
};

const CotizacionesPorUsuario = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [cotizacionesUsuario, setCotizacionesUsuario] = useState([]);
  const [usuarioNombre, setUsuarioNombre] = useState("");
  const [showDetallesCotizacion, setShowDetallesCotizacion] = useState({});

  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const toggleDetallesCotizacion = (index) => {
    setShowDetallesCotizacion(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  useEffect(() => {
    axios.get(`${API_URL}/cotizaciones/todas`)
      .then(res => setCotizaciones(res.data))
      .catch(error => {
        console.error("Error al cargar cotizaciones:", error);
        setCotizaciones([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Agrupa cotizaciones por prospecto_id para mostrar el nombre del prospecto
  const cotizacionesPorProspecto = cotizaciones.reduce((acc, cot) => {
    if (!acc[cot.prospecto_id]) {
      acc[cot.prospecto_id] = {
        prospecto_nombre: cot.prospecto_nombre || 'Sin nombre',
        cotizaciones: []
      };
    }
    acc[cot.prospecto_id].cotizaciones.push(cot);
    return acc;
  }, {});

  const handleVerMas = (prospecto_id, prospecto_nombre) => {
    setCotizacionesUsuario(cotizacionesPorProspecto[prospecto_id].cotizaciones);
    setUsuarioNombre(prospecto_nombre);
    setShowDetallesCotizacion({}); // Reset details visibility
    setModalOpen(true);
  };

  if (loading) {
    return <div className="text-center my-5"><Spinner animation="border" /></div>;
  }

  return (
    <>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Prospecto</th>
            <th>Ver Cotizaciones</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(cotizacionesPorProspecto).map(([prospecto_id, data]) => (
            <tr key={prospecto_id}>
              <td>{data.prospecto_nombre}</td>
              <td>
                <Button size="sm" variant="primary" onClick={() => handleVerMas(prospecto_id, data.prospecto_nombre)}>
                  Ver más detalles ({data.cotizaciones.length})
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={modalOpen} onHide={() => setModalOpen(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Cotizaciones de {usuarioNombre}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {cotizacionesUsuario.length === 0 ? (
            <div className="text-muted text-center py-3">Sin cotizaciones disponibles</div>
          ) : (
            <div className="gap-3">
              {cotizacionesUsuario.map((cotizacion, index) => (
                <Card key={cotizacion.id} className="mb-4 shadow-sm border-0 cotizacion-card">
                  <Card.Header className={`d-flex justify-content-between align-items-center text-white ${getPlanColorClass(cotizacion.plan_nombre)}`}>
                    <div>
                      <h6 className="mb-0 fw-bold">{cotizacion.plan_nombre}</h6>
                      <small className="text-black-50">Año: {cotizacion.anio || new Date().getFullYear()}</small>
                    </div>
                    <div className="text-end">
                      <span className="fw-bold fs-5 text-success">{formatCurrency(cotizacion.total_final)}</span>
                      <br />
                      <small className="text-black-50">Total Final</small>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Row className="mb-2">
                      <Col xs={6} md={3}>
                        <div className="text-muted small">Bruto</div>
                        <div className="fw-bold text-info">{formatCurrency(cotizacion.total_bruto)}</div>
                      </Col>
                      <Col xs={6} md={3}>
                        <div className="text-muted small">Descuento</div>
                        <div className="fw-bold text-warning">{formatCurrency(parseFloat(cotizacion.total_descuento_aporte || 0) + parseFloat(cotizacion.total_descuento_promocion || 0))}</div>
                      </Col>
                      <Col xs={6} md={3}>
                        <div className="text-muted small">Personas</div>
                        <div className="fw-bold">{cotizacion.detalles ? cotizacion.detalles.length : 1}</div>
                      </Col>
                      <Col xs={6} md={3}>
                        <div className="text-muted small">Fecha</div>
                        <div className="fw-bold">{new Date(cotizacion.fecha).toLocaleDateString()}</div>
                      </Col>
                    </Row>
                    <div className="d-flex gap-2 mb-2">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => toggleDetallesCotizacion(index)}
                      >
                        <FaEye className="me-1" />
                        {showDetallesCotizacion[index] ? 'Ocultar' : 'Ver'} Detalles
                      </Button>
                    </div>
                    {showDetallesCotizacion[index] && (
                      <div className="mt-3 border-top pt-3">
                        {cotizacion.detalles && cotizacion.detalles.length > 0 ? (
                          <Table size="sm" responsive className="mb-0 table-striped align-middle">
                            <thead>
                              <tr>
                                <th>Persona</th>
                                <th>Vínculo</th>
                                <th>Edad</th>
                                <th>Tipo Afiliación</th>
                                <th>Base</th>
                                <th>Desc. Aporte</th>
                                <th>Desc. Promoción</th>
                                <th>Promoción</th>
                                <th>Final</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cotizacion.detalles.map((detalle, idx) => (
                                <tr key={detalle.id || idx}>
                                  <td>{detalle.persona}</td>
                                  <td>{detalle.vinculo}</td>
                                  <td>{detalle.edad}</td>
                                  <td>{TIPO_AFILIACION[detalle.tipo_afiliacion_id] || detalle.tipo_afiliacion || 'No especificado'}</td>
                                  <td>{formatCurrency(detalle.precio_base)}</td>
                                  <td>
                                    {formatCurrency(detalle.descuento_aporte)}
                                    {parseFloat(detalle.descuento_aporte || 0) > 0 && (
                                      <span className="badge bg-info ms-1">Aporte</span>
                                    )}
                                  </td>
                                  <td>
                                    {formatCurrency(detalle.descuento_promocion)}
                                    {parseFloat(detalle.descuento_promocion || 0) > 0 && (
                                      <span className="badge bg-warning text-dark ms-1">Promoción</span>
                                    )}
                                  </td>
                                  <td>
                                    {detalle.promocion_aplicada
                                      ? <span className="badge bg-warning text-dark">{detalle.promocion_aplicada}</span>
                                      : <span className="text-muted small">Sin promoción</span>
                                    }
                                  </td>
                                  <td className="fw-bold text-success">{formatCurrency(detalle.precio_final)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        ) : (
                          <div className="text-muted">Sin detalles disponibles</div>
                        )}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default CotizacionesPorUsuario;