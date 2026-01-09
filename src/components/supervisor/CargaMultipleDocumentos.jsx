import React, { useState, useEffect } from 'react';
import { Button, Form, Alert, Card, Badge, ProgressBar, Modal, Row, Col } from 'react-bootstrap';
import { Upload, FileText, AlertCircle, CheckCircle, Eye, Download, X, Plus } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

/**
 * Componente para cargar documentos adicionales con segmentación por tipo
 * Específico para supervisores
 */
const CargaMultipleDocumentos = ({ polizaId, onDocumentosActualizados, show, onHide }) => {
  const [documentosExistentes, setDocumentosExistentes] = useState({});
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewMime, setPreviewMime] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // ✅ Estado para archivos por tipo de documento
  const [archivosPorTipo, setArchivosPorTipo] = useState({
    codem: [],
    formulario_f152: [],
    formulario_f184: [],
    constancia_inscripcion: [],
    comprobante_pago_cuota: [],
    estudios_medicos: []
  });

  // ✅ Configuración de tipos de documentos con límites
  const TIPOS_DOCUMENTOS = [
    { 
      key: 'codem', 
      label: 'CODEM', 
      icon: '📋', 
      maxFiles: 1, 
      description: 'Certificado de Discapacidad y/o Enfermedad Médica',
      color: '#6f42c1'
    },
    { 
      key: 'formulario_f152', 
      label: 'Formulario F152', 
      icon: '📝', 
      maxFiles: 1, 
      description: 'Formulario de solicitud de afiliación',
      color: '#0d6efd'
    },
    { 
      key: 'formulario_f184', 
      label: 'Formulario F184', 
      icon: '📋', 
      maxFiles: 1, 
      description: 'Formulario de opción de cambio',
      color: '#198754'
    },
    { 
      key: 'constancia_inscripcion', 
      label: 'Constancia de Inscripción', 
      icon: '✅', 
      maxFiles: 1, 
      description: 'Constancia de inscripción en AFIP',
      color: '#20c997'
    },
    { 
      key: 'comprobante_pago_cuota', 
      label: 'Comprobantes de Pago', 
      icon: '💳', 
      maxFiles: 12, 
      description: 'Comprobantes de pago de cuotas (máx. 12)',
      color: '#fd7e14'
    },
    { 
      key: 'estudios_medicos', 
      label: 'Estudios Médicos', 
      icon: '🏥', 
      maxFiles: 20, 
      description: 'Estudios, análisis y/o informes médicos (máx. 20)',
      color: '#dc3545'
    }
  ];

  // Cargar datos iniciales
  useEffect(() => {
    if (show && polizaId) {
      cargarDatos();
      // Limpiar archivos al abrir
      setArchivosPorTipo({
        codem: [],
        formulario_f152: [],
        formulario_f184: [],
        constancia_inscripcion: [],
        comprobante_pago_cuota: [],
        estudios_medicos: []
      });
      setError('');
      setSuccess('');
    }
  }, [show, polizaId]);

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [estadisticasRes, documentosRes] = await Promise.all([
        axios.get(`${API_URL}/supervisor/polizas/${polizaId}/documentos/estadisticas`, { headers }).catch(() => ({ data: { data: {} } })),
        axios.get(`${API_URL}/supervisor/polizas/${polizaId}/documentos`, { headers }).catch(() => ({ data: { documentos: {} } }))
      ]);

      setEstadisticas(estadisticasRes.data.data || {});
      setDocumentosExistentes(documentosRes.data.documentos || {});
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error cargando información de documentos');
    }
  };

  // ✅ Manejar selección de archivo por tipo específico
  const handleFileSelect = (tipo, e) => {
    const files = Array.from(e.target.files);
    const tipoConfig = TIPOS_DOCUMENTOS.find(t => t.key === tipo);
    
    if (!tipoConfig) return;

    // Verificar límite de archivos
    const existentes = documentosExistentes[tipo]?.length || 0;
    const pendientes = archivosPorTipo[tipo]?.length || 0;
    const disponibles = tipoConfig.maxFiles - existentes - pendientes;

    if (files.length > disponibles) {
      setError(`Solo puede agregar ${disponibles} archivo(s) más para ${tipoConfig.label}`);
      return;
    }

    // Verificar tamaño
    const archivosGrandes = files.filter(file => file.size > 10 * 1024 * 1024);
    if (archivosGrandes.length > 0) {
      setError('Algunos archivos son mayores a 10MB');
      return;
    }

    // Verificar tipos de archivo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const archivosInvalidos = files.filter(file => !tiposPermitidos.includes(file.type));
    
    if (archivosInvalidos.length > 0) {
      setError('Solo se permiten archivos JPG, PNG, PDF, DOC y DOCX');
      return;
    }

    setError('');
    setArchivosPorTipo(prev => ({
      ...prev,
      [tipo]: [...prev[tipo], ...files.map(file => ({
        archivo: file,
        nombre: file.name,
        tamaño: file.size
      }))]
    }));

    // Limpiar input
    e.target.value = '';
  };

  // ✅ Eliminar archivo pendiente
  const eliminarArchivoPendiente = (tipo, index) => {
    setArchivosPorTipo(prev => ({
      ...prev,
      [tipo]: prev[tipo].filter((_, i) => i !== index)
    }));
  };

  // ✅ Contar total de archivos a subir
  const getTotalArchivos = () => {
    return Object.values(archivosPorTipo).reduce((acc, arr) => acc + arr.length, 0);
  };

  // ✅ Subir todos los documentos
  const subirDocumentos = async () => {
    const totalArchivos = getTotalArchivos();
    if (totalArchivos === 0) {
      setError('Seleccione al menos un archivo');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      let archivosSubidos = 0;
      let errores = [];

      // Subir archivos por tipo
      for (const [tipo, archivos] of Object.entries(archivosPorTipo)) {
        for (const item of archivos) {
          try {
            const formData = new FormData();
            formData.append('documentos', item.archivo);
            formData.append('tipos_documento', JSON.stringify([tipo]));

            await axios.post(
              `${API_URL}/supervisor/polizas/${polizaId}/documentos/multiple`,
              formData,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'multipart/form-data'
                }
              }
            );

            archivosSubidos++;
            setUploadProgress(Math.round((archivosSubidos / totalArchivos) * 100));
          } catch (err) {
            errores.push(`Error subiendo ${item.nombre}: ${err.response?.data?.message || err.message}`);
          }
        }
      }

      if (errores.length > 0) {
        setError(errores.join('\n'));
      }

      if (archivosSubidos > 0) {
        setSuccess(`✅ ${archivosSubidos} documento(s) cargado(s) exitosamente`);
        
        // Limpiar archivos pendientes
        setArchivosPorTipo({
          codem: [],
          formulario_f152: [],
          formulario_f184: [],
          constancia_inscripcion: [],
          comprobante_pago_cuota: [],
          estudios_medicos: []
        });
        
        // Actualizar datos
        await cargarDatos();
        
        // Notificar al componente padre
        if (onDocumentosActualizados) {
          onDocumentosActualizados();
        }

        // Cerrar modal después de 2 segundos si no hay errores
        if (errores.length === 0) {
          setTimeout(() => {
            setSuccess('');
            onHide();
          }, 2000);
        }
      }

    } catch (error) {
      console.error('Error subiendo documentos:', error);
      setError(error.response?.data?.message || 'Error subiendo documentos. Intente nuevamente.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const formatearTamaño = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const previewDocumento = async (documentoId, tipoMime) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/supervisor/polizas/documentos/${documentoId}/preview`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data], { type: tipoMime }));
      setPreviewUrl(url);
      setPreviewMime(tipoMime);
      setShowPreview(true);
    } catch (err) {
      console.error('Error en preview:', err);
      alert('No se pudo previsualizar el documento');
    }
  };

  // ✅ Renderizar sección de tipo de documento
  const renderSeccionTipo = (tipoConfig) => {
    const { key, label, icon, maxFiles, description, color } = tipoConfig;
    const existentes = documentosExistentes[key] || [];
    const pendientes = archivosPorTipo[key] || [];
    const disponibles = maxFiles - existentes.length - pendientes.length;
    const puedeAgregar = disponibles > 0;

    return (
      <Card key={key} className="mb-3" style={{ borderLeft: `4px solid ${color}` }}>
        <Card.Header className="d-flex justify-content-between align-items-center py-2" style={{ backgroundColor: `${color}10` }}>
          <div className="d-flex align-items-center">
            <span className="me-2" style={{ fontSize: '1.5rem' }}>{icon}</span>
            <div>
              <h6 className="mb-0" style={{ color }}>{label}</h6>
              <small className="text-muted">{description}</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Badge bg={existentes.length > 0 ? 'success' : 'secondary'}>
              {existentes.length} cargado{existentes.length !== 1 ? 's' : ''}
            </Badge>
            {pendientes.length > 0 && (
              <Badge bg="warning" text="dark">
                {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}
              </Badge>
            )}
            <Badge bg={puedeAgregar ? 'info' : 'danger'}>
              {disponibles} disponible{disponibles !== 1 ? 's' : ''}
            </Badge>
          </div>
        </Card.Header>
        
        <Card.Body className="py-2">
          {/* Documentos existentes */}
          {existentes.length > 0 && (
            <div className="mb-2">
              <small className="text-muted fw-bold">Documentos cargados:</small>
              {existentes.map(doc => (
                <div key={doc.id} className="d-flex justify-content-between align-items-center py-1 border-bottom">
                  <div className="d-flex align-items-center">
                    <FileText size={16} className="me-2 text-success" />
                    <span className="small">{doc.nombre_original}</span>
                    <small className="text-muted ms-2">({formatearTamaño(doc.tamaño_bytes)})</small>
                  </div>
                  <div>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 me-2"
                      onClick={() => previewDocumento(doc.id, doc.tipo_mime)}
                      title="Ver documento"
                    >
                      <Eye size={16} className="text-primary" />
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0"
                      onClick={() => {
                        if (doc.urls?.download) {
                          window.open(doc.urls.download, '_blank');
                        }
                      }}
                      title="Descargar"
                    >
                      <Download size={16} className="text-secondary" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Archivos pendientes de subir */}
          {pendientes.length > 0 && (
            <div className="mb-2">
              <small className="text-warning fw-bold">Pendientes de subir:</small>
              {pendientes.map((item, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center py-1 border-bottom bg-warning bg-opacity-10">
                  <div className="d-flex align-items-center">
                    <FileText size={16} className="me-2 text-warning" />
                    <span className="small">{item.nombre}</span>
                    <small className="text-muted ms-2">({formatearTamaño(item.tamaño)})</small>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 text-danger"
                    onClick={() => eliminarArchivoPendiente(key, index)}
                    title="Quitar"
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Botón para agregar archivo */}
          {puedeAgregar && (
            <div className="mt-2">
              <Form.Group>
                <Form.Label 
                  htmlFor={`file-${key}`}
                  className="btn btn-outline-primary btn-sm d-inline-flex align-items-center"
                  style={{ cursor: 'pointer' }}
                >
                  <Plus size={16} className="me-1" />
                  Agregar {maxFiles > 1 ? 'archivo(s)' : 'archivo'}
                </Form.Label>
                <Form.Control
                  type="file"
                  id={`file-${key}`}
                  multiple={maxFiles > 1}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  onChange={(e) => handleFileSelect(key, e)}
                  className="d-none"
                  disabled={loading}
                />
              </Form.Group>
            </div>
          )}

          {!puedeAgregar && existentes.length === 0 && pendientes.length === 0 && (
            <div className="text-center py-2">
              <small className="text-muted">Sin documentos</small>
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered scrollable>
        <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa' }}>
          <Modal.Title>
            📎 Cargar Documentos Adicionales
            {estadisticas?.numero_poliza && (
              <Badge bg="primary" className="ms-2">Póliza #{estadisticas.numero_poliza}</Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Estadísticas resumidas */}
          {estadisticas && (
            <Alert variant="info" className="mb-3 py-2">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <span>
                  <strong>📊 Total documentos:</strong> {estadisticas.total_documentos || 0}
                </span>
                <span>
                  <strong>💾 Tamaño total:</strong> {estadisticas.tamaño_total_mb || 0} MB
                </span>
                <span>
                  <strong>📤 Pendientes:</strong> {getTotalArchivos()}
                </span>
              </div>
            </Alert>
          )}

          {/* Mensajes de error/éxito */}
          {error && (
            <Alert variant="danger" className="mb-3" dismissible onClose={() => setError('')}>
              <AlertCircle size={16} className="me-2" />
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="mb-3">
              <CheckCircle size={16} className="me-2" />
              {success}
            </Alert>
          )}

          {/* Progreso de subida */}
          {loading && uploadProgress > 0 && (
            <Card className="mb-3 border-primary">
              <Card.Body className="py-2">
                <div className="d-flex justify-content-between mb-1">
                  <small className="fw-bold">Subiendo documentos...</small>
                  <small>{uploadProgress}%</small>
                </div>
                <ProgressBar now={uploadProgress} animated variant="primary" />
              </Card.Body>
            </Card>
          )}

          {/* Instrucciones */}
          <Alert variant="light" className="mb-3 border">
            <h6 className="mb-2">📋 Instrucciones:</h6>
            <ul className="mb-0 small">
              <li>Seleccione los archivos para cada tipo de documento</li>
              <li>Formatos permitidos: JPG, PNG, PDF, DOC, DOCX</li>
              <li>Tamaño máximo por archivo: 10MB</li>
              <li>Los documentos se subirán todos juntos al presionar "Cargar"</li>
            </ul>
          </Alert>

          {/* Secciones por tipo de documento */}
          <Row>
            <Col md={6}>
              {TIPOS_DOCUMENTOS.slice(0, 3).map(tipo => renderSeccionTipo(tipo))}
            </Col>
            <Col md={6}>
              {TIPOS_DOCUMENTOS.slice(3, 6).map(tipo => renderSeccionTipo(tipo))}
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-between" style={{ backgroundColor: '#f8f9fa' }}>
          <div>
            {getTotalArchivos() > 0 && (
              <Badge bg="warning" text="dark" className="fs-6">
                {getTotalArchivos()} archivo(s) pendiente(s) de subir
              </Badge>
            )}
          </div>
          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={onHide} disabled={loading}>
              Cerrar
            </Button>
            <Button 
              variant="primary" 
              onClick={subirDocumentos}
              disabled={loading || getTotalArchivos() === 0}
              className="d-flex align-items-center"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload size={16} className="me-2" />
                  Cargar {getTotalArchivos()} Documento{getTotalArchivos() !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Modal de preview */}
      <Modal show={showPreview} onHide={() => {
        setShowPreview(false);
        if (previewUrl) {
          window.URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
      }} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Vista Previa</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: '60vh', overflow: 'auto' }}>
          {previewMime?.startsWith('image/') ? (
            <img src={previewUrl} style={{ width: '100%' }} alt="Preview" />
          ) : previewMime === 'application/pdf' ? (
            <iframe src={previewUrl} style={{ width: '100%', height: '100%' }} title="PDF Preview" />
          ) : (
            <div className="text-center py-4">
              <p>Formato no soportado para previsualización</p>
              <Button onClick={() => window.open(previewUrl, '_blank')}>Descargar</Button>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default CargaMultipleDocumentos;
