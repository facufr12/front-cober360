import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import { FaDownload, FaExternalLinkAlt, FaMobileAlt, FaDesktop } from 'react-icons/fa';
import useDeviceDetection from '../../hooks/useDeviceDetection';
import './DocumentPreviewModal.css';

const DocumentPreviewModal = ({ 
  show, 
  onHide, 
  previewUrl, 
  previewMime, 
  documentName = 'Documento',
  onDownload,
  documentId = null // Agregar ID del documento para mejor manejo
}) => {
  const [loadingPDF, setLoadingPDF] = useState(false);
  const { isMobile, isTablet, isIOS, isAndroid, orientation } = useDeviceDetection();

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (previewUrl) {
      // Fallback download
      const link = document.createElement('a');
      link.href = previewUrl;
      
      // Generar nombre de archivo basado en el tipo y fecha
      const extension = previewMime === 'application/pdf' ? '.pdf' : 
                       previewMime.startsWith('image/') ? `.${previewMime.split('/')[1]}` : '';
      const fileName = documentName ? 
                      `${documentName.replace(/[^a-zA-Z0-9]/g, '_')}${extension}` :
                      `documento_${Date.now()}${extension}`;
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const renderPreviewContent = () => {
    if (!previewUrl || !previewMime) {
      return (
        <div className="text-center py-4">
          <Alert variant="warning">
            No se pudo cargar el documento para previsualización.
          </Alert>
        </div>
      );
    }

    // Para imágenes
    if (previewMime.startsWith("image/")) {
      return (
        <div className="text-center">
          <img 
            src={previewUrl} 
            alt={documentName}
            style={{ 
              width: "100%", 
              height: "auto",
              maxHeight: isMobile ? "60vh" : "70vh",
              objectFit: "contain"
            }} 
          />
        </div>
      );
    }

    // Para PDFs
    if (previewMime === "application/pdf") {
      // En móviles, mostrar opciones alternativas
      if (isMobile) {
        return (
          <div className="text-center py-4">
            <div className="mb-4">
              <FaMobileAlt size={48} className="text-primary mb-3" />
              <h5>Vista de Documento PDF</h5>
              <p className="text-muted mb-4">
                En dispositivos móviles, recomendamos descargar o abrir el PDF en una nueva pestaña para una mejor experiencia.
              </p>
            </div>

            <div className="d-grid gap-3">
              <Button 
                variant="primary" 
                size="lg"
                onClick={handleDownload}
                className="d-flex align-items-center justify-content-center gap-2"
              >
                <FaDownload />
                Descargar PDF
              </Button>
              
              <Button 
                variant="outline-primary" 
                size="lg"
                onClick={handleOpenInNewTab}
                className="d-flex align-items-center justify-content-center gap-2"
              >
                <FaExternalLinkAlt />
                Abrir en Nueva Pestaña
              </Button>
            </div>

            <div className="mt-4">
              <Alert variant="info" className="small">
                <FaMobileAlt className="me-2" />
                <strong>Consejo para {isIOS ? 'iOS' : isAndroid ? 'Android' : 'móvil'}:</strong> 
                {isIOS ? ' Toca "Descargar" y el PDF se abrirá en Safari, desde donde podrás guardarlo o compartirlo.' :
                 isAndroid ? ' Toca "Descargar" para abrir con tu app de PDF favorita.' :
                 ' Si descargas el PDF, podrás abrirlo con tu aplicación de PDF favorita.'}
              </Alert>
            </div>

            {/* Vista previa reducida en móvil (opcional) */}
            <div className="mt-4">
              <details>
                <summary className="btn btn-sm btn-outline-secondary">
                  <FaDesktop className="me-2" />
                  Ver vista previa (puede ser lenta)
                </summary>
                <div className="mt-3" style={{ height: "40vh", border: "1px solid #ddd", borderRadius: "4px" }}>
                  {loadingPDF && (
                    <div className="d-flex justify-content-center align-items-center h-100">
                      <Spinner animation="border" />
                    </div>
                  )}
                  <iframe 
                    src={previewUrl} 
                    title="PDF"
                    style={{ 
                      width: "100%", 
                      height: "100%",
                      border: "none",
                      display: loadingPDF ? "none" : "block"
                    }}
                    onLoad={() => setLoadingPDF(false)}
                    onLoadStart={() => setLoadingPDF(true)}
                  />
                </div>
              </details>
            </div>
          </div>
        );
      }

      // En desktop, mostrar iframe normal
      return (
        <div style={{ position: "relative" }}>
          {loadingPDF && (
            <div className="position-absolute top-50 start-50 translate-middle">
              <Spinner animation="border" />
              <div className="mt-2 small text-muted">Cargando PDF...</div>
            </div>
          )}
          <iframe 
            src={previewUrl} 
            title="PDF"
            style={{ 
              width: "100%", 
              height: "70vh",
              border: "1px solid #ddd",
              borderRadius: "4px",
              display: loadingPDF ? "none" : "block"
            }}
            onLoad={() => setLoadingPDF(false)}
            onLoadStart={() => setLoadingPDF(true)}
          />
          
          {/* Botones de acción para desktop */}
          <div className="d-flex gap-2 mt-3 justify-content-center">
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleDownload}
              className="d-flex align-items-center gap-2"
            >
              <FaDownload />
              Descargar
            </Button>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={handleOpenInNewTab}
              className="d-flex align-items-center gap-2"
            >
              <FaExternalLinkAlt />
              Nueva Pestaña
            </Button>
          </div>
        </div>
      );
    }

    // Para otros tipos de archivo
    return (
      <div className="text-center py-4">
        <Alert variant="warning">
          <strong>Tipo de archivo no soportado para previsualización.</strong>
          <br />
          <small>Tipo MIME: {previewMime}</small>
        </Alert>
        <Button 
          variant="primary"
          onClick={handleDownload}
          className="d-flex align-items-center gap-2 mx-auto"
        >
          <FaDownload />
          Descargar Archivo
        </Button>
      </div>
    );
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      centered
      className={isMobile ? "mobile-document-modal" : ""}
    >
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          {isMobile ? <FaMobileAlt /> : <FaDesktop />}
          Previsualización: {documentName}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body 
        style={{ 
          minHeight: isMobile ? "50vh" : "70vh",
          maxHeight: isMobile ? "80vh" : "85vh",
          overflowY: "auto"
        }}
      >
        {renderPreviewContent()}
      </Modal.Body>
      
      <Modal.Footer className="d-flex justify-content-between">
        <div className="small text-muted">
          {isMobile ? `📱 ${isIOS ? 'iOS' : isAndroid ? 'Android' : 'Móvil'}${isTablet ? ' Tablet' : ''}` : "🖥️ Escritorio"} 
          {orientation && isMobile ? ` • ${orientation === 'landscape' ? '🔄 Horizontal' : '📱 Vertical'}` : ''}
          {previewMime && ` • ${previewMime}`}
        </div>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DocumentPreviewModal;
