
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Card, Row, Col, Form, Container, Alert, Badge } from "react-bootstrap";
import { PersonFill, FileEarmarkText, Calendar3, Flag, Building, ShieldCheck, CashCoin, Gift } from "react-bootstrap-icons";
import {  API_URL } from "../../../config";


const PasoDatosPersonales = ({
  datosPersonales,
  handleChange,
  opcionesEstadoCivil,
  opcionesNacionalidad,
  opcionesCondicionIVA,
  opcionesTipoDomicilio,
  cotizacion
}) => {
  const [errorEdad, setErrorEdad] = useState("");
  const [localidades, setLocalidades] = useState([]);
  const [nombreVendedor, setNombreVendedor] = useState("");

  // Obtener el nombre del vendedor desde el localStorage/token
  useEffect(() => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (userInfo && userInfo.first_name && userInfo.last_name) {
        const nombreCompleto = `${userInfo.first_name} ${userInfo.last_name}`;
        setNombreVendedor(nombreCompleto);
        // Auto-completar el campo de asesor si no está lleno
        if (!datosPersonales.asesor || datosPersonales.asesor.trim() === '') {
          handleChange("asesor", nombreCompleto);
        }
      }
    } catch (error) {
      console.log("Error obteniendo nombre del vendedor:", error);
    }
  }, []);

  // ✅ Auto-completar porcentaje de promoción desde cotización
  useEffect(() => {
    if (cotizacion?.porcentaje_promocion && !datosPersonales.porcentaje_promocion) {
      console.log('📊 Auto-completando porcentaje de promoción:', cotizacion.porcentaje_promocion);
      handleChange("porcentaje_promocion", cotizacion.porcentaje_promocion);
    }
  }, [cotizacion?.porcentaje_promocion]);

  // Función para validar que todos los campos obligatorios estén completos
  const validarCamposCompletos = () => {
    const camposObligatorios = [
      'numero_poliza_vendedor',
      'nombre',
      'apellido',
      'dni',
      'cuil',
      'fecha_nacimiento',
      'sexo',
      'estado_civil',
      'nacionalidad',
      'condicion_iva',
      'tipo_domicilio',
      'direccion',
      'numero',
      'cod_postal',
      'localidad'
    ];

    return camposObligatorios.every(campo => 
      datosPersonales[campo] && datosPersonales[campo].toString().trim() !== ''
    ) && !errorEdad;
  };

  // Función para verificar si un campo específico está vacío
  const esCampoVacio = (campo) => {
    return !datosPersonales[campo] || datosPersonales[campo].toString().trim() === '';
  };

   useEffect(() => {
    axios.get(`${API_URL}/localidades/buenos-aires`)
      .then(res => setLocalidades(res.data))
      .catch(() => setLocalidades([]));
  }, []);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Calcula la edad a partir de la fecha de nacimiento
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return "";
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const m = hoy.getMonth() - fechaNac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    return edad;
  };

  // Maneja el cambio de fecha de nacimiento y actualiza la edad
  const handleFechaNacimientoChange = (value) => {
    const edadIngresada = parseInt(datosPersonales.edad, 10);

    if (!value || isNaN(edadIngresada)) {
      setErrorEdad("Ingrese primero la edad y luego la fecha de nacimiento.");
      handleChange("fecha_nacimiento", value);
      return;
    }

    const hoy = new Date();
    const fechaNac = new Date(value);

    // Rango válido: desde (hoy - edadIngresada - 1 año + 1 día) hasta (hoy - edadIngresada años)
    const desde = new Date(hoy.getFullYear() - edadIngresada - 1, hoy.getMonth(), hoy.getDate() + 1);
    const hasta = new Date(hoy.getFullYear() - edadIngresada, hoy.getMonth(), hoy.getDate());

    if (fechaNac >= desde && fechaNac <= hasta) {
      setErrorEdad("");
      handleChange("fecha_nacimiento", value);
    } else {
      setErrorEdad(
        `La fecha no corresponde a una persona de ${edadIngresada} años. Debe estar entre ${desde.toLocaleDateString()} y ${hasta.toLocaleDateString()}.`
      );
      handleChange("fecha_nacimiento", value);
    }
  };

  return (
    <Container fluid>
      {/* Sección de información de la cotización */}
      {cotizacion && (
        <Card className="mb-4 border-0 shadow-sm bg-light">
          <Card.Body className="py-3">
            <Row className="align-items-center">
              <Col md={4}>
                <div className="d-flex align-items-center">
                  <ShieldCheck className="me-2 text-primary" size={24} />
                  <div>
                    <h6 className="mb-0 text-primary">Plan Seleccionado</h6>
                    <p className="mb-0 fw-bold">{cotizacion.plan_nombre || "Plan COBER360"}</p>
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className="d-flex align-items-center">
                  <CashCoin className="me-2 text-success" size={24} />
                  <div>
                    <h6 className="mb-0 text-success">Costo Total</h6>
                    <p className="mb-0 fw-bold fs-5">{formatCurrency(cotizacion.total_final)}</p>
                    {cotizacion.total_bruto && cotizacion.total_final < cotizacion.total_bruto && (
                      <small className="text-muted">
                        <del>{formatCurrency(cotizacion.total_bruto)}</del>
                      </small>
                    )}
                  </div>
                </div>
              </Col>
              <Col md={4}>
                <div className="d-flex align-items-center">
                  <Gift className="me-2 text-warning" size={24} />
                  <div>
                    <h6 className="mb-0 text-warning">Promoción Vigente</h6>
                    {cotizacion.total_descuento_promocion > 0 ? (
                      <div>
                        <Badge bg="success" className="me-1">
                          Descuento: {formatCurrency(cotizacion.total_descuento_promocion)}
                        </Badge>
                        {cotizacion.detalles && cotizacion.detalles.length > 0 && (
                          <p className="mb-0 small">
                            {cotizacion.detalles.find(d => d.promocion_aplicada)?.promocion_aplicada || "Promoción aplicada"}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Badge bg="secondary">Sin promoción</Badge>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
            
            {/* Información adicional del grupo familiar */}
            {cotizacion.detalles && cotizacion.detalles.length > 1 && (
              <Alert variant="info" className="mt-3 mb-0">
                <div className="d-flex align-items-center">
                  <PersonFill className="me-2" size={16} />
                  <span>
                    <strong>Grupo Familiar:</strong> {cotizacion.detalles.length} integrante{cotizacion.detalles.length > 1 ? 's' : ''} 
                    ({cotizacion.detalles.map(d => d.vinculo === 'matrimonio' ? 'cónyuge' : d.vinculo).join(", ")})
                  </span>
                </div>
              </Alert>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Formulario de datos personales */}
      <Card className="mb-4 border-0 shadow-sm poliza-card">
        <Card.Header className="primary-200 text-white">
          <PersonFill className="me-2" size={20} />
          <h6 className="mb-0 d-inline">Datos Personales del Titular</h6>
        </Card.Header>
        <Card.Body>
          {/* Campo de Número de Póliza del Vendedor */}
          <Row className="g-3 mb-4">
            <Col md={12}>
              <div className="alert alert-info d-flex align-items-center mb-3">
                <FileEarmarkText className="me-2" size={20} />
                <div>
                  <h6 className="mb-1">Número de Póliza Oficial</h6>
                  <small>Este será el número de póliza que aparecerá en los documentos oficiales y PDF. Asegúrese de que sea único.</small>
                </div>
              </div>
              <Form.Group>
                <Form.Label>
                  <FileEarmarkText className="me-1" size={16} />
                  Número de Póliza Oficial *
                </Form.Label>
                <Form.Control
                  value={datosPersonales.numero_poliza_vendedor || ''}
                  onChange={e => handleChange("numero_poliza_vendedor", e.target.value)}
                  required
                  className="form-control-lg"
                  placeholder="Ej: POL-2024-001234"
                  isInvalid={esCampoVacio('numero_poliza_vendedor')}
                  style={{
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    color: '#2D3047'
                  }}
                />
                <Form.Text className="text-muted">
                  Este número aparecerá en los documentos oficiales y PDF de la póliza.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {/* Datos del Asesor y Período */}
          <Row className="g-3 mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  <PersonFill className="me-1" size={16} />
                  Asesor/Vendedor
                </Form.Label>
                <Form.Control
                  value={datosPersonales.asesor || nombreVendedor || ''}
                  onChange={e => handleChange("asesor", e.target.value)}
                  className="form-control-lg"
                  placeholder="Nombre del asesor"
                  style={{
                    fontWeight: '500',
                    backgroundColor: '#f8f9fa',
                  }}
                />
                <Form.Text className="text-muted">
                  Se auto-completa con tu nombre. Puedes editarlo si es necesario.
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  <Calendar3 className="me-1" size={16} />
                  Mes de Ingreso
                </Form.Label>
                <Form.Control
                  type="month"
                  value={datosPersonales.mes_ingreso || ''}
                  onChange={e => handleChange("mes_ingreso", e.target.value)}
                  className="form-control-lg"
                />
                <Form.Text className="text-muted">
                  Mes en el cual el afiliado entra en cobertura.
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  <CashCoin className="me-1" size={16} />
                  Próximo Período a Abonar
                </Form.Label>
                <Form.Control
                  type="date"
                  value={datosPersonales.proximo_periodo_abonar || ''}
                  onChange={e => handleChange("proximo_periodo_abonar", e.target.value)}
                  className="form-control-lg"
                  min={new Date().toISOString().split("T")[0]}
                />
                <Form.Text className="text-muted">
                  Selecciona la fecha del próximo período que el afiliado debe abonar.
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  <Building className="me-1" size={16} />
                  Obra Social
                </Form.Label>
                <Form.Select
                  value={datosPersonales.obra_social || ''}
                  onChange={e => handleChange("obra_social", e.target.value)}
                  className="form-control-lg"
                >
                  <option value="">Seleccionar obra social</option>
                  <option value="OSDEPYM">OSDEPYM</option>
                  <option value="OSTVLA">OSTVLA</option>
                  <option value="OSFE">OSFE</option>
                  <option value="Otra">Otra (completar manual)</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  Selecciona la obra social correspondiente.
                </Form.Text>
              </Form.Group>
            </Col>
            {datosPersonales.obra_social === "Otra" && (
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    <Building className="me-1" size={16} />
                    Especificar Obra Social
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={datosPersonales.obra_social_otra || ''}
                    onChange={e => handleChange("obra_social_otra", e.target.value)}
                    className="form-control-lg"
                    placeholder="Nombre de la obra social"
                  />
                  <Form.Text className="text-muted">
                    Completa el nombre de la obra social.
                  </Form.Text>
                </Form.Group>
              </Col>
            )}
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  <Gift className="me-1" size={16} />
                  Porcentaje de Promoción
                </Form.Label>
                <div className="input-group input-group-lg">
                  <Form.Control
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={datosPersonales.porcentaje_promocion || ''}
                    onChange={e => handleChange("porcentaje_promocion", e.target.value)}
                    className="form-control-lg"
                    placeholder="Ej: 55"
                    disabled
                  />
                  <span className="input-group-text">%</span>
                </div>
                <Form.Text className="text-muted">
                  <strong>Campo automático:</strong> Se completa con el porcentaje de la cotización seleccionada.
                  {cotizacion?.porcentaje_promocion && (
                    <span className="text-success d-block mt-1">
                      ✓ Promoción del {cotizacion.porcentaje_promocion}% aplicada
                    </span>
                  )}
                </Form.Text>
                {cotizacion?.total_descuento_promocion > 0 && (
                  <div className="alert alert-info mt-2 p-2 small">
                    <Gift size={14} className="me-1" />
                    <strong>Descuento aplicado:</strong> {formatCurrency(cotizacion.total_descuento_promocion)}
                    {cotizacion.detalles && cotizacion.detalles.length > 0 && (
                      <div className="text-muted small mt-1">
                        {cotizacion.detalles.find(d => d.promocion_aplicada)?.promocion_aplicada || ""}
                      </div>
                    )}
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  <PersonFill className="me-1" size={16} />
                  Nombre *
                </Form.Label>
                <Form.Control
                  value={datosPersonales.nombre}
                  onChange={e => handleChange("nombre", e.target.value)}
                  required
                  className="form-control-lg"
                  isInvalid={esCampoVacio('nombre')}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  <PersonFill className="me-1" size={16} />
                  Apellido *
                </Form.Label>
                <Form.Control
                  value={datosPersonales.apellido}
                  onChange={e => handleChange("apellido", e.target.value)}
                  required
                  className="form-control-lg"
                  isInvalid={esCampoVacio('apellido')}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>
                  <FileEarmarkText className="me-1" size={16} />
                  DNI *
                </Form.Label>
                <Form.Control
                  value={datosPersonales.dni}
                  onChange={e => handleChange("dni", e.target.value)}
                  required
                  className="form-control-lg"
                  isInvalid={esCampoVacio('dni')}
                  placeholder="Ej: 12345678"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>
                  <FileEarmarkText className="me-1" size={16} />
                  CUIL *
                </Form.Label>
                <Form.Control
                  value={datosPersonales.cuil}
                  onChange={e => handleChange("cuil", e.target.value)}
                  required
                  className="form-control-lg"
                  isInvalid={esCampoVacio('cuil')}
                  placeholder="Ej: 20123456789"
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
                  value={datosPersonales.fecha_nacimiento}
                  onChange={e => handleFechaNacimientoChange(e.target.value)}
                  required
                  className="form-control-lg"
                  isInvalid={!!errorEdad}
                  max={new Date().toISOString().split("T")[0]} // No permite fechas futuras
                />
                <Form.Control.Feedback type="invalid">
                  {errorEdad}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Edad</Form.Label>
                <Form.Control
                  value={datosPersonales.edad}
                  disabled
                  className="form-control-lg"
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Sexo *</Form.Label>
                <Form.Select
                  value={datosPersonales.sexo}
                  onChange={e => handleChange("sexo", e.target.value)}
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
            <Col md={6}>
              <Form.Group>
                <Form.Label>Estado Civil *</Form.Label>
                <Form.Select
                  value={datosPersonales.estado_civil}
                  onChange={e => handleChange("estado_civil", e.target.value)}
                  required
                  className="form-control-lg"
                >
                  <option value="">Seleccionar</option>
                  {opcionesEstadoCivil.map(estado => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  <Flag className="me-1" size={16} />
                  Nacionalidad *
                </Form.Label>
                <Form.Select
                  value={datosPersonales.nacionalidad}
                  onChange={e => handleChange("nacionalidad", e.target.value)}
                  required
                  className="form-control-lg"
                >
                  {opcionesNacionalidad.map(nac => (
                    <option key={nac} value={nac}>{nac}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Condición de IVA *</Form.Label>
                <Form.Select
                  value={datosPersonales.condicion_iva}
                  onChange={e => handleChange("condicion_iva", e.target.value)}
                  required
                  className="form-control-lg"
                >
                  {opcionesCondicionIVA.map(condicion => (
                    <option key={condicion} value={condicion}>{condicion}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  <Building className="me-1" size={16} />
                  Tipo de Domicilio *
                </Form.Label>
                <Form.Select
                  value={datosPersonales.tipo_domicilio}
                  onChange={e => handleChange("tipo_domicilio", e.target.value)}
                  required
                  className="form-control-lg"
                >
                  {opcionesTipoDomicilio.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Calle *</Form.Label>
                <Form.Control
                  value={datosPersonales.direccion}
                  onChange={e => handleChange("direccion", e.target.value)}
                  required
                  className="form-control-lg"
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Número *</Form.Label>
                <Form.Control
                  value={datosPersonales.numero}
                  onChange={e => handleChange("numero", e.target.value)}
                  required
                  className="form-control-lg"
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Código Postal *</Form.Label>
                <Form.Control
                  value={datosPersonales.cod_postal}
                  onChange={e => handleChange("cod_postal", e.target.value)}
                  required
                  className="form-control-lg"
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Localidad *</Form.Label>
                <Form.Select
                  value={datosPersonales.localidad}
                  onChange={e => handleChange("localidad", e.target.value)}
                  required
                  className="form-control-lg"
                >
                  <option value="">Selecciona...</option>
                  {localidades.map(loc => (
                    <option key={loc.id} value={loc.nombre}>{loc.nombre}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Mensaje de validación */}
          {!validarCamposCompletos() && (
            <Alert variant="warning" className="mt-3">
              <div className="d-flex align-items-center">
                <FileEarmarkText className="me-2" size={16} />
                <span>
                  <strong>Campos incompletos:</strong> Por favor complete todos los campos marcados con (*) para continuar al siguiente paso.
                </span>
              </div>
            </Alert>
          )}
    
        </Card.Body>
      </Card>
    </Container>
  );
};

// Agregar la función de validación como propiedad del componente
PasoDatosPersonales.validarCamposCompletos = (datosPersonales, errorEdad) => {
  const camposObligatorios = [
    'numero_poliza_vendedor',
    'nombre',
    'apellido',
    'dni',
    'cuil',
    'fecha_nacimiento',
    'sexo',
    'estado_civil',
    'nacionalidad',
    'condicion_iva',
    'tipo_domicilio',
    'direccion',
    'numero',
    'cod_postal',
    'localidad'
  ];

  return camposObligatorios.every(campo => 
    datosPersonales[campo] && datosPersonales[campo].toString().trim() !== ''
  ) && !errorEdad;
};

export default PasoDatosPersonales;