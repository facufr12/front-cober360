import { useState, useEffect } from "react";
import { Container, Table, Spinner, Badge, Button, Row, Col, Card } from "react-bootstrap";
import { FaFile, FaEye, FaWhatsapp, FaList, FaThLarge, FaEdit } from "react-icons/fa";
import { API_URL } from "../../config";

const PolizasDashboard = ({
  polizas,
  loadingPolizas,
  formatCurrency,
  formatFecha,
  getEstadoPoliza,
  handleVerDocumentos,
  handleEnviarPolizaPorWhatsApp,
  handleVerDetallePoliza,
  handleEditarPoliza,
  tipoVista,
  setTipoVista
}) => {
  // ✅ Validar que polizas sea un array
  const polizasArray = Array.isArray(polizas) ? polizas : [];

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

  // ✅ NUEVA: Función para enmascarar correos electrónicos
  const maskEmail = (email) => {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    if (!domain) return email; // Si no tiene @, devolver tal como está
    
    if (localPart.length <= 2) {
      return `**@${domain}`;
    }
    
    // Mostrar los primeros 2 caracteres y enmascarar el resto hasta @
    const maskedLocal = localPart.substring(0, 2) + '*'.repeat(localPart.length - 2);
    return `${maskedLocal}@${domain}`;
  };

  return (
    <>
      {/* Contenido de pólizas */}
      <Container fluid className="p-0">
        {loadingPolizas ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Cargando pólizas...</span>
            </Spinner>
          </div>
        ) : (
          <>
            {/* Vista de tabla para pólizas */}
            {tipoVista === "tabla" && (
              <div className="bg-white rounded shadow-sm p-3 mb-4">
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>N° Póliza</th>
                      <th>Prospecto</th>
                      <th>Plan</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Fecha Creación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {polizasArray.map((poliza) => {
                      const estadoInfo = getEstadoPoliza(poliza.estado);
                      return (
                        <tr key={poliza.id}>
                          <td className="fw-bold">{poliza.numero_poliza_oficial || poliza.numero_poliza}</td>
                          <td>
                            {poliza.prospecto_nombre || 'Sin nombre'} {poliza.prospecto_apellido || 'Sin apellido'}
                          </td>
                          <td>{poliza.plan_nombre || 'Plan no especificado'}</td>
                          <td className="fw-bold text-success">
                            {formatCurrency(poliza.total_final || 0)}
                          </td>
                          <td>
                            <div className="d-flex gap-1 flex-wrap">
                              <Badge bg={estadoInfo.bg}>{estadoInfo.text}</Badge>
                              {poliza.requiere_auditoria_medica && (
                                <Badge bg="danger" title="Requiere auditoría médica por IMC elevado">
                                  🏥 Auditoría Médica
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td>{formatFecha(poliza.created_at)}</td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button
                                size="sm"
                                variant="warning"
                                title="Editar póliza"
                                onClick={() => handleEditarPoliza(poliza)}
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                title="Descargar PDF"
                                onClick={() => window.open(`${API_URL}/polizas/pdf/${poliza.pdf_hash}`, '_blank')}
                              >
                                <FaFile />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                title="Ver documentos"
                                onClick={() => handleVerDocumentos(poliza)}
                              >
                                <FaEye />
                              </Button>
                              <Button
                                size="sm"
                                variant="success"
                                title="Enviar por WhatsApp"
                                onClick={() => handleEnviarPolizaPorWhatsApp(poliza)}
                              >
                                <FaWhatsapp />
                              </Button>
                              {/* <Button
                                size="sm"
                                variant="info"
                                title="Ver detalles"
                                onClick={() => handleVerDetallePoliza(poliza)}
                              >
                                <FaEye />
                              </Button> */}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
                {polizasArray.length === 0 && (
                  <div className="text-center py-5">
                    <p className="text-muted">No tienes pólizas generadas aún.</p>
                  </div>
                )}
              </div>
            )}

            {/* Vista de tarjetas para pólizas */}
            {tipoVista === "tarjetas" && (
              <Row>
                {polizasArray.map((poliza) => {
                  const estadoInfo = getEstadoPoliza(poliza.estado);
                  return (
                    <Col lg={4} md={6} sm={12} key={poliza.id} className="mb-3">
                      <Card className="h-100 shadow-sm">
                        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap">
                          <span className="fw-bold">
                            Póliza N° {poliza.numero_poliza_oficial || poliza.numero_poliza}
                          </span>
                          <div className="d-flex gap-1 flex-wrap">
                            <Badge bg={estadoInfo.bg}>{estadoInfo.text}</Badge>
                            {poliza.requiere_auditoria_medica && (
                              <Badge bg="danger" title="Requiere auditoría médica por IMC elevado">
                                🏥 Auditoría
                              </Badge>
                            )}
                          </div>
                        </Card.Header>
                        <Card.Body>
                          {/* Datos del prospecto */}
                          <div className="mb-3">
                            <small className="text-muted d-block mb-1">Prospecto:</small>
                            <div className="fw-bold">
                              {poliza.prospecto_nombre || 'Sin nombre'} {poliza.prospecto_apellido || 'Sin apellido'}
                            </div>
                            {poliza.prospecto_edad && (
                              <small className="text-muted">({poliza.prospecto_edad} años)</small>
                            )}
                          </div>
                          
                          {/* Datos del plan */}
                          <div className="mb-3">
                            <small className="text-muted d-block mb-1">Plan:</small>
                            <div className="fw-bold">{poliza.plan_nombre || 'Plan no especificado'}</div>
                          </div>
                          
                          {/* Total */}
                          <div className="mb-3">
                            <small className="text-muted d-block mb-1">Total:</small>
                            <div className="fw-bold text-success fs-5">
                              {formatCurrency(poliza.total_final || 0)}
                            </div>
                          </div>
                          
                          {/* Contacto del prospecto */}
                          {poliza.prospecto_telefono && (
                            <div className="mb-3">
                              <small className="text-muted d-block mb-1">Contacto:</small>
                              <div>{maskPhoneNumber(poliza.prospecto_telefono)}</div>
                            </div>
                          )}
                          
                          {/* Localidad */}
                          {poliza.prospecto_localidad && (
                            <div className="mb-3">
                              <small className="text-muted d-block mb-1">Localidad:</small>
                              <div>{poliza.prospecto_localidad}</div>
                            </div>
                          )}
                          
                          {/* Email */}
                          {poliza.prospecto_email && (
                            <div className="mb-3">
                              <small className="text-muted d-block mb-1">Email:</small>
                              <div>{maskEmail(poliza.prospecto_email)}</div>
                            </div>
                          )}
                          
                          {/* Fecha */}
                          <div className="mb-3">
                            <small className="text-muted d-block mb-1">Fecha:</small>
                            <div>{formatFecha(poliza.created_at)}</div>
                          </div>
                        </Card.Body>
                        <Card.Footer className="d-flex justify-content-between">
                          <div>
                            <small className="text-muted">ID: {poliza.id}</small>
                          </div>
                          <div className="d-flex gap-1">
                            <Button
                              size="sm"
                              variant="warning"
                              title="Editar póliza"
                              onClick={() => handleEditarPoliza(poliza)}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              title="Descargar PDF"
                              onClick={() => window.open(`${API_URL}/polizas/pdf/${poliza.pdf_hash}`, '_blank')}
                            >
                              <FaFile />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              title="Ver documentos"
                              onClick={() => handleVerDocumentos(poliza)}
                            >
                              <FaEye />
                            </Button>
                            <Button
                              size="sm"
                              variant="success"
                              title="Enviar por WhatsApp"
                              onClick={() => handleEnviarPolizaPorWhatsApp(poliza)}
                            >
                              <FaWhatsapp />
                            </Button>
                            {/* <Button
                              size="sm"
                              variant="info"
                              title="Ver detalles"
                              onClick={() => handleVerDetallePoliza(poliza)}
                            >
                              <FaEye />
                            </Button> */}
                          </div>
                        </Card.Footer>
                      </Card>
                    </Col>
                  );
                })}
                {polizasArray.length === 0 && (
                  <Col className="text-center py-5">
                    <p className="text-muted">No tienes pólizas generadas aún.</p>
                  </Col>
                )}
              </Row>
            )}
          </>
        )}
      </Container>
    </>
  );
};

export default PolizasDashboard;