// Esta es una versión corregida del componente con mejoras de responsividad
// Voy a copiar las partes buenas y arreglar las rotas

import React from 'react';

// Este será un componente temporal para mostrar las mejoras de responsividad
const PolizasSupervisorFixed = ({ context = 'supervisor' }) => {
  
  // Función para renderizar tabla responsiva
  const renderTablaResponsiva = () => (
    <Card className="shadow-sm">
      <Card.Header className="d-flex flex-column flex-md-row justify-content-between align-items-start align-md-center">
        <div className="mb-2 mb-md-0">
          <h6 className="mb-1">Pólizas ({paginacion.total})</h6>
          <small className="text-muted d-block">
            {filtros.orden === 'mas_nuevos' && '📅 Ordenadas: Más nuevas primero'}
            {filtros.orden === 'mas_antiguos' && '📅 Ordenadas: Más antiguas primero'}
            {filtros.orden === 'alfabetico' && '🔤 Ordenadas: A-Z por cliente'}
            {filtros.orden === 'alfabetico_desc' && '🔤 Ordenadas: Z-A por cliente'}
          </small>
        </div>
        <div className="d-flex gap-2">
          <ButtonGroup size="sm">
            <Button
              variant={tipoVista === 'tabla' ? 'primary' : 'outline-primary'}
              onClick={() => setTipoVista('tabla')}
            >
              <FaList className="d-inline d-sm-none" />
              <span className="d-none d-sm-inline">Tabla</span>
            </Button>
            <Button
              variant={tipoVista === 'tarjetas' ? 'primary' : 'outline-primary'}
              onClick={() => setTipoVista('tarjetas')}
            >
              <FaThLarge className="d-inline d-sm-none" />
              <span className="d-none d-sm-inline">Tarjetas</span>
            </Button>
          </ButtonGroup>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <p className="mt-2">Cargando pólizas...</p>
          </div>
        ) : polizas.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted">No se encontraron pólizas</p>
          </div>
        ) : tipoVista === 'tabla' ? (
          // Tabla responsiva mejorada
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th className="text-nowrap">Póliza</th>
                  <th className="text-nowrap">Prospecto</th>
                  <th className="text-nowrap d-none d-md-table-cell">Plan</th>
                  <th className="text-nowrap d-none d-lg-table-cell">Vendedor</th>
                  <th className="text-nowrap">Estado</th>
                  <th className="text-nowrap d-none d-sm-table-cell">Total</th>
                  <th className="text-nowrap d-none d-md-table-cell">Fecha</th>
                  <th className="text-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {polizas.map(poliza => (
                  <tr key={poliza.id}>
                    <td className="text-nowrap">
                      <strong>{poliza.numero_poliza_oficial || poliza.numero_poliza}</strong>
                    </td>
                    <td className="text-nowrap">
                      <div>
                        <div>{poliza.prospecto_nombre} {poliza.prospecto_apellido}</div>
                        <small className="text-muted d-md-none">
                          {poliza.plan_nombre || 'No especificado'}
                        </small>
                      </div>
                    </td>
                    <td className="text-nowrap d-none d-md-table-cell">
                      {poliza.plan_nombre || 'No especificado'}
                    </td>
                    <td className="text-nowrap d-none d-lg-table-cell">
                      {poliza.vendedor_nombre} {poliza.vendedor_apellido}
                    </td>
                    <td>
                      {getEstadoBadge(poliza.estado)}
                    </td>
                    <td className="text-nowrap d-none d-sm-table-cell">
                      <strong className="text-success">{formatCurrency(poliza.total)}</strong>
                    </td>
                    <td className="text-nowrap d-none d-md-table-cell">
                      {formatFecha(poliza.created_at)}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button size="sm" variant="outline-primary" onClick={() => handleVerDocumentos(poliza)}>
                          <FaEye />
                        </Button>
                        <Button size="sm" variant="outline-success" onClick={() => handleDescargarPDF(poliza)}>
                          <FaDownload />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline-info" 
                          className="d-none d-sm-inline-block"
                          onClick={() => handleEnviarWhatsApp(poliza)}
                        >
                          <FaWhatsapp />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          // Vista de tarjetas responsiva mejorada
          <Row className="p-3">
            {polizas.map(poliza => (
              <Col xs={12} sm={6} lg={4} xl={3} key={poliza.id} className="mb-3">
                <Card className="h-100 shadow-sm">
                  <Card.Header className="pb-2">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1 text-truncate">{poliza.numero_poliza_oficial || poliza.numero_poliza}</h6>
                        <small className="text-muted">{formatFecha(poliza.created_at)}</small>
                      </div>
                      {getEstadoBadge(poliza.estado)}
                    </div>
                  </Card.Header>
                  <Card.Body className="py-2">
                    <h6 className="text-truncate mb-1">{poliza.prospecto_nombre} {poliza.prospecto_apellido}</h6>
                    <p className="text-muted small mb-1">Plan: {poliza.plan_nombre || 'No especificado'}</p>
                    <p className="text-muted small mb-1">Vendedor: {poliza.vendedor_nombre} {poliza.vendedor_apellido}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <strong className="text-success">{formatCurrency(poliza.total)}</strong>
                    </div>
                  </Card.Body>
                  <Card.Footer className="pt-2">
                    <div className="d-flex gap-1 flex-wrap">
                      <Button size="sm" variant="outline-primary" onClick={() => handleVerDocumentos(poliza)}>
                        <FaEye />
                      </Button>
                      <Button size="sm" variant="outline-success" onClick={() => handleDescargarPDF(poliza)}>
                        <FaDownload />
                      </Button>
                      <Button size="sm" variant="outline-info" onClick={() => handleEnviarWhatsApp(poliza)}>
                        <FaWhatsapp />
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card.Body>
    </Card>
  );

  return renderTablaResponsiva();
};

export default PolizasSupervisorFixed;
