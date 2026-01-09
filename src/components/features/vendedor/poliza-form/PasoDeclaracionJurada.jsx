import React from "react";
import { Card, Row, Col, Form, Alert, Container, Badge } from "react-bootstrap";
import {
  Activity,
  PeopleFill,
  PersonFill,
  InfoCircleFill,
  Clipboard2PlusFill,
  ShieldFillCheck,
  CheckSquare,
  ExclamationTriangleFill,
  BodyText,
  ExclamationCircleFill
} from "react-bootstrap-icons";

const PasoDeclaracionJurada = ({
  datosPersonales,
  declaracionJurada,
  integrantes,
  preguntasDeclaracionJurada,
  enfermedadesPatologias,
  handleDeclaracionChange
}) => {
  // ✅ NUEVA: Función para calcular IMC
  const calcularIMC = (peso, altura) => {
    if (!peso || !altura) return null;
    // peso en kg, altura en cm
    const alturaEnMetros = altura / 100;
    return (peso / (alturaEnMetros * alturaEnMetros)).toFixed(1);
  };

  // ✅ NUEVA: Función para verificar si hay IMC elevado
  const verificarIMCElevado = () => {
    const imcTitular = calcularIMC(
      declaracionJurada.datos_fisicos.titular_peso,
      declaracionJurada.datos_fisicos.titular_altura
    );
    
    const imcIntegrantes = (declaracionJurada.datos_fisicos?.integrantes || []).map(integrante =>
      calcularIMC(integrante.peso, integrante.altura)
    );

    const tieneIMCElevado = (imcTitular && imcTitular > 30) || 
                            imcIntegrantes.some(imc => imc && imc > 30);
    
    return tieneIMCElevado;
  };

  // ✅ NUEVA: Función para verificar si hay respuestas afirmativas en declaración jurada
  const verificarRespuestasAfirmativas = () => {
    return declaracionJurada.preguntas.some(p => p.respuesta === 'si') ||
           declaracionJurada.enfermedades_seleccionadas.length > 0;
  };

  // ✅ NUEVA: Función para obtener detalles de IMC elevado
  const obtenerDetallesIMC = () => {
    const detalles = [];
    
    const imcTitular = calcularIMC(
      declaracionJurada.datos_fisicos.titular_peso,
      declaracionJurada.datos_fisicos.titular_altura
    );
    
    if (imcTitular && imcTitular > 30) {
      detalles.push(`Titular: IMC ${imcTitular}`);
    }

    (declaracionJurada.datos_fisicos?.integrantes || []).forEach((integrante, idx) => {
      const imc = calcularIMC(integrante.peso, integrante.altura);
      if (imc && imc > 30) {
        detalles.push(`${integrante.nombre || `Integrante ${idx + 1}`}: IMC ${imc}`);
      }
    });

    return detalles;
  };

  // Función para validar que todos los campos obligatorios estén completos
  const validarCamposCompletos = () => {
    // Validar datos físicos del titular
    if (!declaracionJurada.datos_fisicos.titular_peso || !declaracionJurada.datos_fisicos.titular_altura) {
      return false;
    }

    // Validar datos físicos de integrantes
    if (integrantes && integrantes.length > 0) {
      for (let i = 0; i < integrantes.length; i++) {
        const integranteDatos = declaracionJurada.datos_fisicos?.integrantes?.[i];
        if (!integranteDatos?.peso || !integranteDatos?.altura) {
          return false;
        }
      }
    }

    // Validar que todas las preguntas tengan respuesta
    if (!declaracionJurada.preguntas.every(p => p.respuesta === 'si' || p.respuesta === 'no')) {
      return false;
    }

    // Validar que las preguntas con respuesta "sí" tengan detalle (excepto la pregunta 6)
    for (let i = 0; i < declaracionJurada.preguntas.length - 1; i++) {
      const pregunta = declaracionJurada.preguntas[i];
      if (pregunta.respuesta === 'si' && (!pregunta.detalle || pregunta.detalle.trim() === '')) {
        return false;
      }
    }

    // Validar pregunta 6 (enfermedades)
    const pregunta6 = declaracionJurada.preguntas[5];
    if (pregunta6?.respuesta === 'si') {
      if (declaracionJurada.enfermedades_seleccionadas.length === 0) {
        return false;
      }
      if (!declaracionJurada.detalle_enfermedades || declaracionJurada.detalle_enfermedades.trim() === '') {
        return false;
      }
    }

    // Validar aceptación de términos
    if (!declaracionJurada.acepta_terminos) {
      return false;
    }

    return true;
  };

  // Función para verificar si un campo específico está vacío
  const esCampoVacio = (campo, index = null, subCampo = null) => {
    if (campo === 'titular_peso') {
      return !declaracionJurada.datos_fisicos.titular_peso;
    }
    if (campo === 'titular_altura') {
      return !declaracionJurada.datos_fisicos.titular_altura;
    }
    if (campo === 'integrante_peso') {
      return !declaracionJurada.datos_fisicos?.integrantes?.[index]?.peso;
    }
    if (campo === 'integrante_altura') {
      return !declaracionJurada.datos_fisicos?.integrantes?.[index]?.altura;
    }
    if (campo === 'acepta_terminos') {
      return !declaracionJurada.acepta_terminos;
    }
    return false;
  };

  return (
  <Container fluid>
    {/* Datos Físicos del Titular */}
    <Card className="mb-4 border-0 shadow-sm poliza-card">
      <Card.Header className=" text-white">
        <Activity className="me-2" size={20} />
        <h6 className="mb-0 d-inline">Datos Físicos del Titular</h6>
      </Card.Header>
      <Card.Body>
        <Row className="g-3">
          <Col md={3}>
            <Form.Group>
              <Form.Label>
                <BodyText className="me-1" size={16} />
                Peso (kg) *
              </Form.Label>
              <Form.Control
                type="number"
                step="0.1"
                min="1"
                max="300"
                value={declaracionJurada.datos_fisicos.titular_peso}
                onChange={e => handleDeclaracionChange('datos_fisicos', e.target.value, null, 'titular_peso')}
                placeholder="Ej: 70.5"
                required
                className="form-control-lg"
                isInvalid={esCampoVacio('titular_peso')}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>
                <BodyText className="me-1" size={16} />
                Altura (cm) *
              </Form.Label>
              <Form.Control
                type="number"
                min="50"
                max="250"
                value={declaracionJurada.datos_fisicos.titular_altura}
                onChange={e => handleDeclaracionChange('datos_fisicos', e.target.value, null, 'titular_altura')}
                placeholder="Ej: 175"
                required
                className="form-control-lg"
                isInvalid={esCampoVacio('titular_altura')}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <div className="d-flex align-items-center h-100">
              <Alert variant="info" className="mb-0 w-100">
                <InfoCircleFill className="me-2" size={16} />
                <strong>Titular:</strong> {datosPersonales.nombre} {datosPersonales.apellido}
              </Alert>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>

    {/* Datos Físicos de Integrantes del Grupo Familiar */}
    {integrantes && integrantes.length > 0 && (
      <div className="mb-4">
        <h6 className="fw-bold">Datos físicos de integrantes</h6>
        {integrantes.map((integrante, idx) => (
          <Card key={idx} className="mb-3 border-0 bg-light">
            <Card.Body className="p-3">
              <Alert variant="info" className="mb-3">
                <PersonFill className="me-2" size={16} />
                <strong>Integrante {idx + 1}:</strong> {integrante.nombre} {integrante.apellido}
              </Alert>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Peso (kg) *</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.1"
                      min={0}
                      max="300"
                      value={declaracionJurada.datos_fisicos?.integrantes?.[idx]?.peso || ""}
                      onChange={e =>
                        handleDeclaracionChange(
                          "datos_fisicos",
                          { field: "peso", value: e.target.value },
                          idx,
                          "integrante"
                        )
                      }
                      placeholder="Ej: 70.5"
                      isInvalid={esCampoVacio('integrante_peso', idx)}
                      className="form-control-lg"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Altura (cm) *</Form.Label>
                    <Form.Control
                      type="number"
                      min={0}
                      max="250"
                      value={declaracionJurada.datos_fisicos?.integrantes?.[idx]?.altura || ""}
                      onChange={e =>
                        handleDeclaracionChange(
                          "datos_fisicos",
                          { field: "altura", value: e.target.value },
                          idx,
                          "integrante"
                        )
                      }
                      placeholder="Ej: 170"
                      isInvalid={esCampoVacio('integrante_altura', idx)}
                      className="form-control-lg"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))}
      </div>
    )}

    {/* Preguntas de Declaración Jurada */}
    <Card className="mb-4 border-0 shadow-sm poliza-card">
      <Card.Header className=" text-dark">
        <Clipboard2PlusFill className="me-2" size={20} />
        <h6 className="mb-0 d-inline">Declaración Jurada de Salud</h6>
      </Card.Header>
      <Card.Body>
        <Alert variant="info" className="mb-4">
          <InfoCircleFill className="me-2" size={16} />
          <strong>Importante:</strong> Responda todas las preguntas con sinceridad. La información proporcionada será verificada y cualquier falsedad invalidará la afiliación.
        </Alert>

        {declaracionJurada.preguntas.map((pregunta, index) => (
          <div key={index} className="mb-4">
            {index < 5 ? (
              // Preguntas simples SI/NO
              <Card className="border-0 bg-light">
                <Card.Body className="p-3">
                  <h6 className="mb-3">{index + 1}. {pregunta.pregunta}</h6>
                  <Row className="g-2">
                    <Col md={2}>
                      <div className="d-flex gap-3">
                        <Form.Check
                          type="radio"
                          id={`pregunta-${index}-si`}
                          name={`pregunta-${index}`}
                          label="SÍ"
                          value="si"
                          checked={pregunta.respuesta === "si"}
                          onChange={e => handleDeclaracionChange('preguntas', e.target.value, index, 'respuesta')}
                          className="text-danger fw-bold"
                        />
                        <Form.Check
                          type="radio"
                          id={`pregunta-${index}-no`}
                          name={`pregunta-${index}`}
                          label="NO"
                          value="no"
                          checked={pregunta.respuesta === "no"}
                          onChange={e => handleDeclaracionChange('preguntas', e.target.value, index, 'respuesta')}
                          className="text-success fw-bold"
                        />
                      </div>
                    </Col>
                    <Col md={10}>
                      {pregunta.respuesta === "si" && (
                        <Form.Group>
                          <Form.Label className="small text-muted">Detalle la información:</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={pregunta.detalle}
                            onChange={e => handleDeclaracionChange('preguntas', e.target.value, index, 'detalle')}
                            placeholder="Proporcione detalles específicos..."
                          />
                        </Form.Group>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ) : (
              // Pregunta 6: Enfermedades específicas
              <Card className="border-0 bg-light">
                <Card.Body className="p-3">
                  <h6 className="mb-3">{index + 1}. {pregunta.pregunta}</h6>
                  <Row className="g-2 mb-3">
                    <Col md={2}>
                      <div className="d-flex gap-3">
                        <Form.Check
                          type="radio"
                          id={`pregunta-${index}-si`}
                          name={`pregunta-${index}`}
                          label="SÍ"
                          value="si"
                          checked={pregunta.respuesta === "si"}
                          onChange={e => handleDeclaracionChange('preguntas', e.target.value, index, 'respuesta')}
                          className="text-danger fw-bold"
                        />
                        <Form.Check
                          type="radio"
                          id={`pregunta-${index}-no`}
                          name={`pregunta-${index}`}
                          label="NO"
                          value="no"
                          checked={pregunta.respuesta === "no"}
                          onChange={e => handleDeclaracionChange('preguntas', e.target.value, index, 'respuesta')}
                          className="text-success fw-bold"
                        />
                      </div>
                    </Col>
                  </Row>
                  {pregunta.respuesta === "si" && (
                    <div className="mt-3">
                      <p className="small text-muted mb-2">Seleccione las enfermedades, patologías o diagnósticos que apliquen:</p>
                      <Row className="g-2">
                        {enfermedadesPatologias.map((enfermedad, enfIndex) => (
                          <Col md={6} key={enfIndex}>
                            <Form.Check
                              type="checkbox"
                              id={`enfermedad-${enfIndex}`}
                              label={enfermedad}
                              checked={declaracionJurada.enfermedades_seleccionadas.includes(enfermedad)}
                              onChange={() => handleDeclaracionChange('enfermedades', enfermedad)}
                              className="small"
                            />
                          </Col>
                        ))}
                      </Row>
                      {declaracionJurada.enfermedades_seleccionadas.length > 0 && (
                        <Form.Group className="mt-3">
                          <Form.Label className="small text-muted">Detalle las enfermedades seleccionadas:</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={declaracionJurada.detalle_enfermedades}
                            onChange={e => handleDeclaracionChange('detalle_enfermedades', e.target.value)}
                            placeholder="Proporcione detalles específicos sobre las enfermedades, tratamientos, medicaciones, etc..."
                          />
                        </Form.Group>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
          </div>
        ))}
      </Card.Body>
    </Card>

    {/* Términos y Condiciones */}
    {/* ✅ ALERTA DE IMC ELEVADO Y/O RESPUESTAS AFIRMATIVAS */}
    {(verificarIMCElevado() || verificarRespuestasAfirmativas()) && (
      <Card className="border-0 shadow-sm mb-4 border-warning">
        <Card.Header className="bg-warning text-dark">
          <ExclamationCircleFill className="me-2" size={20} />
          <h6 className="mb-0 d-inline">Auditoría Médica Requerida</h6>
        </Card.Header>
        <Card.Body>
          <Alert variant="warning" className="mb-3">
            <ExclamationCircleFill className="me-2" size={16} />
            <div>
              <strong>Se ha detectado que requiere revisión médica por:</strong>
              <ul className="mt-2 mb-0">
                {verificarIMCElevado() && (
                  <>
                    <li><strong>Índice de Masa Corporal (IMC) elevado:</strong></li>
                    <ul>
                      {obtenerDetallesIMC().map((detalle, idx) => (
                        <li key={idx}>{detalle}</li>
                      ))}
                    </ul>
                  </>
                )}
                {verificarRespuestasAfirmativas() && (
                  <li><strong>Respuestas afirmativas en declaración de salud</strong> - Se requiere evaluación médica de los datos reportados</li>
                )}
              </ul>
            </div>
          </Alert>
          <p className="text-muted small mb-3">
            Esta póliza será marcada para <strong>revisión y autorización médica</strong> antes de su activación. Esto es un procedimiento normal para garantizar la cobertura adecuada basada en el perfil de salud del afiliado.
          </p>
          <p className="text-muted small mb-0">
            <strong>Puede continuar con el proceso.</strong> Un especialista médico revisará su solicitud en breve.
          </p>
        </Card.Body>
      </Card>
    )}

    <Card className="border-0 shadow-sm poliza-card">
      <Card.Header className="primary-200 text-white">
        <ShieldFillCheck className="me-2" size={20} />
        <h6 className="mb-0 d-inline">Términos y Condiciones</h6>
      </Card.Header>
      <Card.Body>
        <div className="p-3 bg-light rounded mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          <h6 className="text-primary mb-2">TÉRMINOS Y CONDICIONES DE PRE-AFILIACIÓN</h6>
          <p className="small mb-2">
            <strong>El presente formulario es una solicitud de pre-afiliación a COBER</strong>, el mismo queda sujeto a aprobación del departamento de afiliaciones de COBER, para completar la solicitud el interesado se compromete a presentar la documentación requerida, hasta tanto esto no suceda no se dará curso a la afiliación del interesado y/o su grupo familiar a COBER.
          </p>
          <p className="small mb-2">
            <strong>El suscripto declara bajo juramento</strong> que toda la información precedente suministrada es verdadera y toma conocimiento de que cualquier falseamiento, omisión o inexactitud de la misma, deliberada o no, invalidará la condición de afiliado.
          </p>
          <p className="small mb-0">
            <strong>Seguir leyendo términos y condiciones...</strong> Para acceder a los términos completos, visite nuestro sitio web o solicite una copia en nuestras oficinas.
          </p>
        </div>
        <Form.Check
          type="checkbox"
          id="acepta-terminos"
          checked={declaracionJurada.acepta_terminos}
          onChange={e => handleDeclaracionChange('acepta_terminos', e.target.checked)}
          className="fs-6"
          isInvalid={esCampoVacio('acepta_terminos')}
          label={
            <span>
              <strong>ACEPTO</strong> los términos y condiciones de pre-afiliación mencionados anteriormente. 
              Declaro bajo juramento que toda la información suministrada es veraz y completa.
            </span>
          }
          required
        />
        {!declaracionJurada.acepta_terminos && (
          <Alert variant="warning" className="mt-3 mb-0">
            <ExclamationTriangleFill className="me-2" size={16} />
            Debe aceptar los términos y condiciones para continuar con la solicitud.
          </Alert>
        )}

        {/* Mensaje de validación general */}
        {!validarCamposCompletos() && (
          <Alert variant="warning" className="mt-3 mb-0">
            <InfoCircleFill className="me-2" size={16} />
            <span>
              <strong>Campos incompletos:</strong> Por favor complete todos los campos obligatorios para continuar al siguiente paso.
            </span>
          </Alert>
        )}
      </Card.Body>
    </Card>
  </Container>
  );
};

// Agregar la función de validación como propiedad del componente
PasoDeclaracionJurada.validarCamposCompletos = (declaracionJurada, integrantes) => {
  // Validar datos físicos del titular
  if (!declaracionJurada.datos_fisicos.titular_peso || !declaracionJurada.datos_fisicos.titular_altura) {
    return false;
  }

  // Validar datos físicos de integrantes
  if (integrantes && integrantes.length > 0) {
    for (let i = 0; i < integrantes.length; i++) {
      const integranteDatos = declaracionJurada.datos_fisicos?.integrantes?.[i];
      if (!integranteDatos?.peso || !integranteDatos?.altura) {
        return false;
      }
    }
  }

  // Validar que todas las preguntas tengan respuesta
  if (!declaracionJurada.preguntas.every(p => p.respuesta === 'si' || p.respuesta === 'no')) {
    return false;
  }

  // Validar que las preguntas con respuesta "sí" tengan detalle (excepto la pregunta 6)
  for (let i = 0; i < declaracionJurada.preguntas.length - 1; i++) {
    const pregunta = declaracionJurada.preguntas[i];
    if (pregunta.respuesta === 'si' && (!pregunta.detalle || pregunta.detalle.trim() === '')) {
      return false;
    }
  }

  // Validar pregunta 6 (enfermedades)
  const pregunta6 = declaracionJurada.preguntas[5];
  if (pregunta6?.respuesta === 'si') {
    if (declaracionJurada.enfermedades_seleccionadas.length === 0) {
      return false;
    }
    if (!declaracionJurada.detalle_enfermedades || declaracionJurada.detalle_enfermedades.trim() === '') {
      return false;
    }
  }

  // Validar aceptación de términos
  if (!declaracionJurada.acepta_terminos) {
    return false;
  }

  return true;
};

export default PasoDeclaracionJurada;