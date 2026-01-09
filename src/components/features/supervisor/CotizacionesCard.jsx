import { useEffect, useState } from "react";
import { Card, Row, Col, Container, Button, Badge } from "react-bootstrap";
import axios from "axios";
import { API_URL } from "../../config";

const TIPO_AFILIACION = {
  1: "Particular/autónomo",
  2: "Con recibo de sueldo",
  3: "Monotributista",
};


const CotizacionesCards = () => {
  const [cotizaciones, setCotizaciones] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/cotizaciones`).then(res => setCotizaciones(res.data));
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  return (
    <Container className="my-4">
      <h4>Cotizaciones</h4>
      <Row xs={1} md={2} lg={3} className="g-4">
        {cotizaciones.map(cot => (
          <Col key={cot.id}>
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-primary text-white text-center">
                <h5 className="mb-0">{cot.plan_nombre}</h5>
              </Card.Header>
              <Card.Body>
                <Card.Title className="text-primary">
                  {cot.prospecto_nombre}
                </Card.Title>
                
                {/* Información financiera */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Total Bruto:</span>
                    <span className="fw-bold">{formatCurrency(cot.total_bruto)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Descuento:</span>
                    <span className="text-warning fw-bold">{formatCurrency(cot.descuento_aporte || cot.total_descuento)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 border-top pt-1">
                    <span className="fw-bold">Total Final:</span>
                    <span className="fw-bold text-success fs-5">{formatCurrency(cot.total_final)}</span>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="mb-3">
                  <div className="mb-2">
                    <small className="text-muted">Fecha:</small>
                    <div>{new Date(cot.fecha).toLocaleDateString()}</div>
                  </div>
                  
                  {/* Mostrar tipo de afiliación si está disponible */}
                  {cot.detalles && cot.detalles.length > 0 && (
                    <div className="mb-2">
                      <small className="text-muted d-block">Tipo de Afiliación:</small>
                      <div className="d-flex flex-wrap gap-1">
                        {[...new Set(cot.detalles.map(det => det.tipo_afiliacion_id).filter(Boolean))].map(tipoId => (
                          <Badge key={tipoId} bg="info" className="small">
                            {TIPO_AFILIACION[tipoId] || `Tipo ${tipoId}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Número de personas cubiertas */}
                  {cot.detalles && cot.detalles.length > 0 && (
                    <div className="mb-2">
                      <small className="text-muted">Personas cubiertas:</small>
                      <div>
                        <Badge bg="secondary">{cot.detalles.length} persona{cot.detalles.length > 1 ? 's' : ''}</Badge>
                      </div>
                    </div>
                  )}
                </div>

                <Button size="sm" variant="info" className="w-100">
                  Ver Detalle
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default CotizacionesCards;