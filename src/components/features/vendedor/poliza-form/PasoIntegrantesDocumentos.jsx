import React, { useState } from "react";
import { Card, Row, Col, Form, Button, Alert, Container, Badge } from "react-bootstrap";
import {
  PeopleFill,
  PersonFill,
  FileEarmarkText,
  Calendar3,
  Flag,
  CloudUploadFill,
  FileEarmarkImageFill,
  FileEarmarkPdfFill,
  CardImage,
  CreditCard2BackFill,
  CheckCircle,
  Trash3Fill,
  PersonCheckFill,
  EnvelopeFill
} from "react-bootstrap-icons";

const FileUploadComponent = ({ tipo, label, integranteIndex = null, currentFile, required = true, handleFileUpload, handleRemoveFile }) => {
  const inputId = `file-${tipo}-${integranteIndex ?? 'titular'}`;
  return (
    <div className="mb-3">
      <Form.Label className="fw-bold">
        {tipo === 'dni_frente' && <CardImage className="me-1" size={16} />}
        {tipo === 'dni_dorso' && <CreditCard2BackFill className="me-1" size={16} />}
        {tipo === 'recibo_sueldo' && <FileEarmarkPdfFill className="me-1" size={16} />}
        {label} {required && <span className="text-danger">*</span>}
      </Form.Label>
      {!currentFile ? (
        <div className="border-2 border-dashed border-primary rounded p-3 text-center">
          <CloudUploadFill className="text-primary mb-2" size={32} />
          <div>
            <Form.Control
              type="file"
              id={inputId}
              accept={tipo === 'recibo_sueldo' ? '.pdf,image/*' : 'image/*,.pdf'}
              onChange={e => handleFileUpload(tipo, integranteIndex, e.target.files[0])}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => document.getElementById(inputId).click()}
            >
              Seleccionar Archivo
            </button>
          </div>
          <small className="text-muted d-block mt-1">
            {tipo === 'recibo_sueldo' 
              ? 'Formatos: PDF, JPG, PNG (Máx. 5MB)'
              : 'Formatos: JPG, PNG, PDF (Máx. 5MB)'
            }
          </small>
        </div>
      ) : (
        <div className="border rounded p-3 bg-light">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <CheckCircle className="text-success me-2" size={20} />
              <div>
                <div className="fw-bold">{currentFile.name}</div>
                <small className="text-muted">
                  {(currentFile.size / 1024 / 1024).toFixed(2)} MB
                </small>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => handleRemoveFile(tipo, integranteIndex)}
            >
              <Trash3Fill size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const PasoIntegrantesDocumentos = ({
  integrantes,
  documentosTitular,
  datosPersonales,
  handleIntegranteChange,
  opcionesNacionalidad,
  handleFileUpload,
  handleRemoveFile
}) => {
  const [erroresEdad, setErroresEdad] = useState({});

  // ✅ NUEVA FUNCIÓN: Determinar si un integrante es cónyuge con recibo de sueldo
  const esConyugeConRecibo = (integrante) => {
    if (!integrante) return false;
    
    // Verificar si es cónyuge (diferentes variaciones posibles)
    const esConyuge = integrante.vinculo?.toLowerCase() === 'matrimonio' || 
                      integrante.vinculo?.toLowerCase() === 'cónyuge' ||
                      integrante.vinculo?.toLowerCase().includes('conyugal');
    
    // Verificar si tiene tipo de afiliación con recibo de sueldo
    const tieneReciboSueldo = integrante.tipo_afiliacion_id === 2 || 
                              integrante.tipo_afiliacion?.toLowerCase?.()?.includes('recibo de sueldo') ||
                              integrante.tipo_afiliacion?.toLowerCase?.()?.includes('con recibo');
    
    return esConyuge && tieneReciboSueldo;
  };

  // Copia exacta de la validación de PasoDatosPersonales
  const handleFechaNacimientoChange = (i, value) => {
    const prevAge = integrantes[i].edad    // 1) guardo la edad que estaba
    // 2) actualizo sólo la fecha
    handleIntegranteChange(i, "fecha_nacimiento", value)

    // valido rangos igual que en PasoDatosPersonales
    const edadIngresada = parseInt(prevAge, 10)
    if (!value || isNaN(edadIngresada)) {
      setErroresEdad(prev => ({ 
        ...prev, 
        [i]: "Ingrese primero la edad y luego la fecha de nacimiento." 
      }))
    } else {
      const hoy = new Date()
      const fechaNac = new Date(value)
      const desde = new Date(hoy.getFullYear() - edadIngresada - 1, hoy.getMonth(), hoy.getDate() + 1)
      const hasta = new Date(hoy.getFullYear() - edadIngresada, hoy.getMonth(), hoy.getDate())
      if (fechaNac >= desde && fechaNac <= hasta) {
        setErroresEdad(prev => { const e = { ...prev }; delete e[i]; return e })
      } else {
        setErroresEdad(prev => ({
          ...prev,
          [i]: `La fecha no corresponde a una persona de ${edadIngresada} años. Debe estar entre ${desde.toLocaleDateString()} y ${hasta.toLocaleDateString()}.`
        }))
      }
    }

    // 3) fuerza que la edad permanezca como antes
    handleIntegranteChange(i, "edad", prevAge)
  };

  return (
    <Container fluid>
      {/* Sección del Titular */}
      <Card className="mb-4 border-0 shadow-sm poliza-card">
        <Card.Header className="primary-200 text-white">
          <PersonCheckFill className="me-2" size={20} />
          <h6 className="mb-0 d-inline">Documentación del Titular</h6>
          <Badge bg="success" className="ms-2">Titular</Badge>
        </Card.Header>
        <Card.Body>
          <Alert variant="info" className="mb-4">
            <PersonCheckFill className="me-2" size={16} />
            <strong>Titular:</strong> {datosPersonales.nombre} {datosPersonales.apellido} - 
            DNI: <strong>{datosPersonales.dni || "No especificado"}</strong> CUIL: <strong>{datosPersonales.cuil || "No especificado"}</strong> - 
            Edad: {datosPersonales.edad} años
          </Alert>
          
          <h6 className="mb-3 text-primary">Documentación Requerida</h6>
          <Row className="g-4">
            <Col md={4}>
              <FileUploadComponent
                tipo="dni_frente"
                label="DNI Frente"
                integranteIndex={null}
                currentFile={documentosTitular?.dni_frente}
                handleFileUpload={handleFileUpload}
                handleRemoveFile={handleRemoveFile}
              />
            </Col>
            <Col md={4}>
              <FileUploadComponent
                tipo="dni_dorso"
                label="DNI Dorso"
                integranteIndex={null}
                currentFile={documentosTitular?.dni_dorso}
                handleFileUpload={handleFileUpload}
                handleRemoveFile={handleRemoveFile}
              />
            </Col>
            <Col md={4}>
              <FileUploadComponent
                tipo="recibo_sueldo"
                label="Recibo de Sueldo"
                integranteIndex={null}
                currentFile={documentosTitular?.recibo_sueldo}
                required={false}
                handleFileUpload={handleFileUpload}
                handleRemoveFile={handleRemoveFile}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Sección de Integrantes */}
      {integrantes.length > 0 ? (
        <Card className="border-0 shadow-sm poliza-card">
          <Card.Header className=" primary-200 text-white">
            <PeopleFill className="me-2" size={20} />
            <h6 className="mb-0 d-inline">Integrantes del Grupo Familiar</h6>
            <Badge bg="secondary" className="ms-2">
              {integrantes.length} integrante{integrantes.length !== 1 ? 's' : ''}
            </Badge>
          </Card.Header>
          <Card.Body>
            {integrantes.map((integrante, index) => (
              <Card key={index} className="mb-4 border-0 bg-light">
                <Card.Header className="text-dark primary-200 ">
                  <PersonFill className="me-2" size={16} />
                  <strong>Integrante {index + 1}: {integrante.nombre} {integrante.apellido}</strong>
                  <Badge bg="info" className="ms-2">{integrante.vinculo}</Badge>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Nombre *</Form.Label>
                        <Form.Control
                          value={integrante.nombre}
                          onChange={e => handleIntegranteChange(index, "nombre", e.target.value)}
                          required
                          className="form-control-lg"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Apellido *</Form.Label>
                        <Form.Control
                          value={integrante.apellido}
                          onChange={e => handleIntegranteChange(index, "apellido", e.target.value)}
                          required
                          className="form-control-lg"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>
                          <FileEarmarkText className="me-1" size={16} />
                          DNI *
                        </Form.Label>
                        <Form.Control
                          value={integrante.dni || ""}
                          onChange={e => handleIntegranteChange(index, "dni", e.target.value)}
                          required
                          className="form-control-lg"
                          placeholder="12345678"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>
                          <FileEarmarkText className="me-1" size={16} />
                          CUIL *
                        </Form.Label>
                        <Form.Control
                          value={integrante.cuil || ""}
                          onChange={e => handleIntegranteChange(index, "cuil", e.target.value)}
                          required
                          className="form-control-lg"
                          placeholder="20123456789"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>
                          <Calendar3 className="me-1" size={16} />
                          Fecha de Nacimiento *
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={integrante.fecha_nacimiento}
                          onChange={e => handleFechaNacimientoChange(index, e.target.value)}
                          required
                          className="form-control-lg"
                          isInvalid={!!erroresEdad[index]}
                          max={new Date().toISOString().split("T")[0]}
                        />
                        <Form.Control.Feedback type="invalid">
                          {erroresEdad[index]}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    {/* CAMBIO: edad ya NO se edita, solo se muestra */}
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label>Edad</Form.Label>
                        <Form.Control
                          value={integrante.edad}
                          disabled
                          className="form-control-lg"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label>Sexo *</Form.Label>
                        <Form.Select
                          value={integrante.sexo}
                          onChange={e => handleIntegranteChange(index, "sexo", e.target.value)}
                          required
                          className="form-control-lg"
                        >
                          <option value="">Seleccionar</option>
                          <option value="masculino">Masculino</option>
                          <option value="femenino">Femenino</option>
                          <option value="otro">Otro</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>
                          <Flag className="me-1" size={16} />
                          Nacionalidad *
                        </Form.Label>
                        <Form.Select
                          value={integrante.nacionalidad}
                          onChange={e => handleIntegranteChange(index, "nacionalidad", e.target.value)}
                          required
                          className="form-control-lg"
                        >
                          <option value="">Seleccionar</option>
                          {opcionesNacionalidad.map(nac => (
                            <option key={nac} value={nac}>{nac}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <EnvelopeFill className="me-1" size={16} />
                          Correo Electrónico
                        </Form.Label>
                        <Form.Control
                          type="email"
                          value={integrante.email || ""}
                          onChange={e => handleIntegranteChange(index, "email", e.target.value)}
                          className="form-control-lg"
                          placeholder="correo@ejemplo.com"
                        />
                        <Form.Text className="text-muted">
                          Correo de contacto del integrante (opcional).
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <h6 className="mb-3 text-primary">Documentación del Integrante</h6>
                  <Row className="g-4">
                    <Col md={6}>
                      <FileUploadComponent
                        tipo="dni_frente"
                        label="DNI Frente"
                        integranteIndex={index}
                        currentFile={integrante.documentos?.dni_frente}
                        handleFileUpload={handleFileUpload}
                        handleRemoveFile={handleRemoveFile}
                      />
                    </Col>
                    <Col md={6}>
                      <FileUploadComponent
                        tipo="dni_dorso"
                        label="DNI Dorso"
                        integranteIndex={index}
                        currentFile={integrante.documentos?.dni_dorso}
                        handleFileUpload={handleFileUpload}
                        handleRemoveFile={handleRemoveFile}
                      />
                    </Col>
                    {/* ✅ NUEVA VALIDACIÓN: Mostrar recibo de sueldo si es cónyuge con tipo de afiliación con recibo */}
                    {esConyugeConRecibo(integrante) && (
                      <Col md={6}>
                        <FileUploadComponent
                          tipo="recibo_sueldo"
                          label="Recibo de Sueldo"
                          integranteIndex={index}
                          currentFile={integrante.documentos?.recibo_sueldo}
                          required={true}
                          handleFileUpload={handleFileUpload}
                          handleRemoveFile={handleRemoveFile}
                        />
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>
            ))}
          </Card.Body>
        </Card>
      ) : (
        <Alert variant="info" className="mt-4">
          <PeopleFill className="me-2" size={16} />
          No hay integrantes adicionales en el grupo familiar. Solo se requiere la documentación del titular.
        </Alert>
      )}
    </Container>
  );
};

export default PasoIntegrantesDocumentos;