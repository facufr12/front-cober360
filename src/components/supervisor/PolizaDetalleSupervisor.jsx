import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Table, Alert } from 'react-bootstrap';
import { FileEarmarkPlus, Eye, Download, Upload, CheckCircle, XCircle } from 'react-bootstrap-icons';
import CargaMultipleDocumentos from '../components/supervisor/CargaMultipleDocumentos';
import axios from 'axios';

const PolizaDetalleSupervisor = ({ polizaId }) => {
  const [poliza, setPoliza] = useState(null);
  const [documentos, setDocumentos] = useState({});
  const [estadisticas, setEstadisticas] = useState(null);
  const [showModalCarga, setShowModalCarga] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (polizaId) {
      cargarDatosPoliza();
    }
  }, [polizaId]);

  const cargarDatosPoliza = async () => {
    try {
      setLoading(true);
      const [polizaRes, documentosRes, estadisticasRes] = await Promise.all([
        axios.get(`/api/supervisor/polizas/${polizaId}`),
        axios.get(`/api/supervisor/polizas/${polizaId}/documentos`),
        axios.get(`/api/supervisor/polizas/${polizaId}/documentos/estadisticas`)
      ]);

      setPoliza(polizaRes.data.data);
      setDocumentos(documentosRes.data.documentos || {});
      setEstadisticas(estadisticasRes.data.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error cargando información de la póliza');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentosActualizados = () => {
    // Recargar datos después de cargar documentos
    cargarDatosPoliza();
  };

  const previewDocumento = (documentoId) => {
    window.open(`/api/supervisor/polizas/documentos/${documentoId}/preview`, '_blank');
  };

  const downloadDocumento = (documentoId) => {
    window.open(`/api/supervisor/polizas/documentos/${documentoId}/download`, '_blank');
  };

  const formatearTamaño = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const obtenerIconoTipo = (tipo) => {
    const iconos = {
      poliza_firmada: '📄',
      auditoria_medica: '🏥',
      documento_identidad_adicional: '🆔',
      comprobante_ingresos: '💰',
      autorizacion_debito: '💳',
      documento_adicional: '📎'
    };
    return iconos[tipo] || '📄';
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p>Cargando información de la póliza...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger">
          <XCircle className="me-2" />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid>
      {/* Header de la póliza */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <Row className="align-items-center">
                <Col>
                  <h5 className="mb-0">
                    📋 Póliza #{poliza?.numero_poliza}
                  </h5>
                  <small>{poliza?.prospecto_nombre} {poliza?.prospecto_apellido}</small>
                </Col>
                <Col xs="auto">
                  <Button 
                    variant="light" 
                    size="sm"
                    onClick={() => setShowModalCarga(true)}
                  >
                    <FileEarmarkPlus className="me-2" />
                    Cargar Documentos
                  </Button>
                </Col>
              </Row>
            </Card.Header>
          </Card>
        </Col>
      </Row>

      {/* Estadísticas de documentos */}
      {estadisticas && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <h4 className="text-primary">{estadisticas.total_documentos}</h4>
                <small className="text-muted">Total Documentos</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <h4 className="text-info">{estadisticas.tamaño_total_mb} MB</h4>
                <small className="text-muted">Tamaño Total</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <h4 className="text-warning">{estadisticas.limite_documentos.restantes}</h4>
                <small className="text-muted">Disponibles</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                {estadisticas.documentos_completos ? (
                  <CheckCircle className="text-success" size={32} />
                ) : (
                  <XCircle className="text-warning" size={32} />
                )}
                <div className="mt-2">
                  <small className="text-muted">
                    {estadisticas.documentos_completos ? 'Completo' : 'Faltan Documentos'}
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Estado de documentos requeridos */}
      {estadisticas && !estadisticas.documentos_completos && (
        <Row className="mb-4">
          <Col>
            <Alert variant="warning">
              <div className="d-flex align-items-center">
                <XCircle className="me-2 flex-shrink-0" />
                <div>
                  <strong>Documentos Requeridos Faltantes:</strong>
                  <ul className="mb-0 mt-2">
                    {!estadisticas.documentos_requeridos.poliza_firmada && (
                      <li>📄 Póliza Firmada por Cliente</li>
                    )}
                    {!estadisticas.documentos_requeridos.auditoria_medica && (
                      <li>🏥 Auditoría Médica</li>
                    )}
                  </ul>
                </div>
              </div>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Lista de documentos existentes */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h6 className="mb-0">📎 Documentos de la Póliza</h6>
            </Card.Header>
            <Card.Body>
              {Object.keys(documentos).length === 0 ? (
                <div className="text-center py-5">
                  <FileEarmarkPlus size={48} className="text-muted mb-3" />
                  <p className="text-muted">No hay documentos cargados para esta póliza</p>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowModalCarga(true)}
                  >
                    <Upload className="me-2" />
                    Cargar Primeros Documentos
                  </Button>
                </div>
              ) : (
                Object.entries(documentos).map(([tipo, docs]) => (
                  <div key={tipo} className="mb-4">
                    <h6 className="border-bottom pb-2 mb-3">
                      {obtenerIconoTipo(tipo)} {tipo.replace(/_/g, ' ').toUpperCase()}
                      <Badge bg="secondary" className="ms-2">{docs.length}</Badge>
                    </h6>
                    
                    <Table hover responsive>
                      <thead>
                        <tr>
                          <th>Nombre del Archivo</th>
                          <th>Tamaño</th>
                          <th>Fecha de Subida</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {docs.map(doc => (
                          <tr key={doc.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <FileEarmarkPlus className="me-2 text-primary" size={16} />
                                {doc.nombre_original}
                              </div>
                            </td>
                            <td>{formatearTamaño(doc.tamaño_bytes)}</td>
                            <td>
                              {new Date(doc.fecha_subida).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => previewDocumento(doc.id)}
                                  title="Vista previa"
                                >
                                  <Eye size={14} />
                                </Button>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => downloadDocumento(doc.id)}
                                  title="Descargar"
                                >
                                  <Download size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de carga múltiple */}
      <CargaMultipleDocumentos
        polizaId={polizaId}
        show={showModalCarga}
        onHide={() => setShowModalCarga(false)}
        onDocumentosActualizados={handleDocumentosActualizados}
      />
    </Container>
  );
};

export default PolizaDetalleSupervisor;
