import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Badge, Spinner } from 'react-bootstrap';
import { FaFileExcel, FaFileCsv, FaDownload, FaCog, FaChartBar } from 'react-icons/fa';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_URL } from "../config";


const ModalExportacion = ({ show, onHide, userRole = 'vendedor' }) => {
  const [configuracion, setConfiguracion] = useState({
    formato: 'excel',
    incluir_polizas: true,
    incluir_documentos: true,
    incluir_familiares: false,
    fecha_desde: '',
    fecha_hasta: '',
    estado_prospecto: 'todos',
    vendedor_id: 'todos'
  });

  const [estadisticas, setEstadisticas] = useState(null);
  const [vendedores, setVendedores] = useState([]);
  const [exportando, setExportando] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  const estadosProspecto = [
    'Lead', '1º Contacto', 'Calificado Cotización', 'Calificado Póliza', 
    'Calificado Pago', 'Venta', 'Fuera de zona', 'Fuera de edad',
    'Preexistencia', 'Reafiliación', 'No contesta', 'prueba interna', 'Ya es socio',
    'Busca otra Cobertura', 'Teléfono erróneo', 'No le interesa (económico)',
    'No le interesa cartilla', 'No busca cobertura médica'
  ];

  useEffect(() => {
    if (show) {
      cargarEstadisticas();
      if (userRole === 'supervisor') {
        cargarVendedores();
      }
    }
  }, [show, userRole]);

  const cargarEstadisticas = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get(
        `${API_URL}/export/estadisticas`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEstadisticas(data.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const cargarVendedores = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(
        `${API_URL}/supervisor/vendedores`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVendedores(data.data || []);
    } catch (error) {
      console.error('Error cargando vendedores:', error);
    }
  };

  const handleConfigChange = (campo, valor) => {
    setConfiguracion(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleExportar = async () => {
    try {
      setExportando(true);

      const token = localStorage.getItem('token');
      const params = new URLSearchParams(configuracion);

      // Realizar la solicitud de exportación
      const response = await fetch(
        `${API_URL}/export/prospectos?${params}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error en la exportación');
      }

      // Obtener el archivo como blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Crear enlace de descarga
      const link = document.createElement('a');
      link.href = url;
      
      const filename = configuracion.formato === 'excel' 
        ? `prospectos_export_${new Date().getTime()}.xlsx`
        : `prospectos_export_${new Date().getTime()}.csv`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: '¡Exportación exitosa!',
        text: `El archivo ${filename} se ha descargado correctamente.`
      });

      onHide();

    } catch (error) {
      console.error('Error en exportación:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error en la exportación',
        text: 'No se pudo exportar el archivo. Intente nuevamente.'
      });
    } finally {
      setExportando(false);
    }
  };

  const getTamañoEstimado = () => {
    if (!estadisticas) return 'Calculando...';
    
    let filas = estadisticas.total_prospectos;
    if (configuracion.incluir_polizas) filas += estadisticas.total_polizas;
    if (configuracion.incluir_documentos) filas += estadisticas.total_documentos;
    
    return `~${Math.round(filas / 100)} KB`;
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FaDownload className="me-2" />
          Exportar Prospectos
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {/* Estadísticas */}
        {loadingStats ? (
          <div className="text-center mb-4">
            <Spinner animation="border" size="sm" />
            <span className="ms-2">Cargando estadísticas...</span>
          </div>
        ) : estadisticas && (
          <Alert variant="info" className="mb-4">
            <FaChartBar className="me-2" />
            <strong>Datos disponibles:</strong>
            <Row className="mt-2">
              <Col md={3}>
                <Badge bg="primary" className="me-2">{estadisticas.total_prospectos}</Badge>
                Prospectos
              </Col>
              <Col md={3}>
                <Badge bg="success" className="me-2">{estadisticas.total_polizas}</Badge>
                Pólizas
              </Col>
              <Col md={3}>
                <Badge bg="warning" className="me-2">{estadisticas.total_documentos}</Badge>
                Documentos
              </Col>
              <Col md={3}>
                <small className="text-muted">
                  Tamaño estimado: {getTamañoEstimado()}
                </small>
              </Col>
            </Row>
          </Alert>
        )}

        <Form>
          {/* Formato de exportación */}
          <Row className="mb-3">
            <Col md={12}>
              <Form.Label><strong>Formato de archivo</strong></Form.Label>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  id="formato-excel"
                  name="formato"
                  checked={configuracion.formato === 'excel'}
                  onChange={() => handleConfigChange('formato', 'excel')}
                  label={
                    <span>
                      <FaFileExcel className="text-success me-1" />
                      Excel (.xlsx)
                    </span>
                  }
                />
                <Form.Check
                  type="radio"
                  id="formato-csv"
                  name="formato"
                  checked={configuracion.formato === 'csv'}
                  onChange={() => handleConfigChange('formato', 'csv')}
                  label={
                    <span>
                      <FaFileCsv className="text-info me-1" />
                      CSV (.csv)
                    </span>
                  }
                />
              </div>
            </Col>
          </Row>

          {/* Configuración de contenido - simplificada */}
          <Row className="mb-3">
            <Col md={12}>
              <Alert variant="success" className="mb-3">
                <strong>📋 Contenido del reporte:</strong>
                <ul className="mb-0 mt-2">
                  <li>✅ Información básica de prospectos</li>
                  <li>✅ Información de pólizas con URLs públicas (acceso directo con hash)</li>
                  <li>✅ Documentos con URLs públicas (acceso directo con hash)</li>
                  <li>❌ URLs privadas (no incluidas)</li>
                </ul>
              </Alert>
              
              <Form.Check
                type="checkbox"
                id="incluir-familiares"
                checked={configuracion.incluir_familiares}
                onChange={(e) => handleConfigChange('incluir_familiares', e.target.checked)}
                label="Incluir información de grupo familiar"
                className="mb-2"
              />
            </Col>
          </Row>

          {/* Filtros */}
          <Row className="mb-3">
            <Col md={12}>
              <Form.Label><strong>Filtros</strong></Form.Label>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>Fecha desde</Form.Label>
                <Form.Control
                  type="date"
                  value={configuracion.fecha_desde}
                  onChange={(e) => handleConfigChange('fecha_desde', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>Fecha hasta</Form.Label>
                <Form.Control
                  type="date"
                  value={configuracion.fecha_hasta}
                  onChange={(e) => handleConfigChange('fecha_hasta', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>Estado del prospecto</Form.Label>
                <Form.Select
                  value={configuracion.estado_prospecto}
                  onChange={(e) => handleConfigChange('estado_prospecto', e.target.value)}
                >
                  <option value="todos">Todos los estados</option>
                  {estadosProspecto.map(estado => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            {userRole === 'supervisor' && (
              <Col md={6}>
                <Form.Group className="mb-2">
                  <Form.Label>Vendedor</Form.Label>
                  <Form.Select
                    value={configuracion.vendedor_id}
                    onChange={(e) => handleConfigChange('vendedor_id', e.target.value)}
                  >
                    <option value="todos">Todos los vendedores</option>
                    {vendedores.map(vendedor => (
                      <option key={vendedor.id} value={vendedor.id}>
                        {vendedor.first_name} {vendedor.last_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
          </Row>

          {/* Información adicional */}
          <Alert variant="light" className="small">
            <FaCog className="me-2" />
            <strong>Información importante:</strong>
            <ul className="mb-0 mt-2">
              <li>Los archivos Excel incluyen formato y colores para mejor visualización</li>
              <li>Los archivos CSV son compatibles con cualquier programa de hojas de cálculo</li>
              <li>Se incluyen solo URLs públicas con hash único para acceso directo sin autenticación</li>
              <li>Los filtros de fecha se aplican a la fecha de creación del prospecto</li>
              <li>Los estados se obtienen de la tabla de asignaciones</li>
            </ul>
          </Alert>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleExportar}
          disabled={exportando || !estadisticas}
        >
          {exportando ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Exportando...
            </>
          ) : (
            <>
              <FaDownload className="me-2" />
              Exportar {configuracion.formato.toUpperCase()}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalExportacion;
