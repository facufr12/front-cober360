import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form, Button, Row, Col, Card, Container, Modal, Spinner } from "react-bootstrap";
import { ENDPOINTS, API_URL } from "../../config";
import Swal from "sweetalert2";

// Debes traer estos arrays desde tu backend o mantenerlos sincronizados con el dashboard
const categoriasMonotributo = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "A exento", "B exento"
];

const vinculos = [
  { value: "pareja/conyuge", label: "Pareja/Conyuge" },
  { value: "hijo/a", label: "Hijo/a" },
  { value: "familiar a cargo", label: "Familiar a cargo" }
];

// Número de la empresa para contacto
const NUMERO_EMPRESA = "+1 (616) 207-1267";

// Ahora los tipos de afiliación usan ID numérico
const tiposAfiliacion = [
  { id: 1, etiqueta: "Particular/autónomo", requiere_sueldo: 0, requiere_categoria: 0 },
  { id: 2, etiqueta: "Con recibo de sueldo", requiere_sueldo: 1, requiere_categoria: 0 },
  { id: 3, etiqueta: "Monotributista", requiere_sueldo: 0, requiere_categoria: 1 }
];

const FormularioLead = () => {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    edad: "",
    tipo_afiliacion_id: "",
    sueldo_bruto: "",
    categoria_monotributo: "",
    numero_contacto: "",
    correo: "",
    localidad: "",
    familiares: []
  });

  const [familiar, setFamiliar] = useState({
    vinculo: "",
    nombre: "",
    edad: "",
    tipo_afiliacion_id: "",
    sueldo_bruto: "",
    categoria_monotributo: ""
  });
  const [showFamiliar, setShowFamiliar] = useState(false);
  const [localidades, setLocalidades] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false); // 🚀 Estado para prevenir doble envío
  const [lastSubmitTime, setLastSubmitTime] = useState(0); // 🕒 Tiempo del último envío
  const [showPreferenciaModal, setShowPreferenciaModal] = useState(false); // Modal preferencia entrega
  const [prospectoData, setProspectoData] = useState(null); // Datos del prospecto creado

  useEffect(() => {
    axios.get(`${API_URL}/localidades/buenos-aires`)
      .then(res => setLocalidades(res.data))
      .catch(() => setLocalidades([]));
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTipoAfiliacion = e => {
    setForm({
      ...form,
      tipo_afiliacion_id: e.target.value,
      sueldo_bruto: "",
      categoria_monotributo: ""
    });
  };

  const handleFamiliarChange = e => {
    setFamiliar({ ...familiar, [e.target.name]: e.target.value });
  };

  const agregarFamiliar = () => {
    // Validación básica
    if (!familiar.vinculo || !familiar.nombre || !familiar.edad || familiar.edad <= 0 || isNaN(Number(familiar.edad))) {
      alert("Vínculo, nombre y edad válida son obligatorios.");
      return;
    }

    // Validación de tipo de afiliación SOLO para pareja/conyuge
    if (familiar.vinculo === "pareja/conyuge" && !familiar.tipo_afiliacion_id) {
      alert("El tipo de afiliación es obligatorio para pareja/cónyuge");
      return;
    }

    // Validación de campos requeridos según el tipo de afiliación
    if (familiar.tipo_afiliacion_id) {
      const tipoAf = tiposAfiliacion.find(t => t.id === Number(familiar.tipo_afiliacion_id));
      if (tipoAf?.requiere_sueldo === 1 && (!familiar.sueldo_bruto || isNaN(Number(familiar.sueldo_bruto)))) {
        alert("El sueldo bruto es obligatorio para este tipo de afiliación.");
        return;
      }
      if (tipoAf?.requiere_categoria === 1 && !familiar.categoria_monotributo) {
        alert("La categoría monotributo es obligatoria para este tipo de afiliación.");
        return;
      }
    }

    setForm({
      ...form,
      familiares: [...form.familiares, {
        ...familiar,
        edad: Number(familiar.edad),
        sueldo_bruto: familiar.sueldo_bruto ? Number(familiar.sueldo_bruto) : null,
        tipo_afiliacion_id: familiar.tipo_afiliacion_id ? Number(familiar.tipo_afiliacion_id) : null
      }]
    });
    setFamiliar({ vinculo: "", nombre: "", edad: "", tipo_afiliacion_id: "", sueldo_bruto: "", categoria_monotributo: "" });
    setShowFamiliar(false);
  };

  const eliminarFamiliar = idx => {
    setForm({
      ...form,
      familiares: form.familiares.filter((_, i) => i !== idx)
    });
  };

  // 📞 Manejar preferencia de entrega de cotización
  const handleEnviarPorEmail = async () => {
    if (!prospectoData) return;
    
    try {
      await axios.post(`${API_URL}/lead/${prospectoData.prospectoId}/preferencia-entrega`, {
        canal: 'email',
        numero_contacto: prospectoData.numero_contacto,
        correo: prospectoData.correo
      });
      
      Swal.fire({
        title: "✅ Preferencia Registrada",
        text: "El vendedor se comunicará contigo por email",
        icon: "success",
        confirmButtonText: "Entendido",
        timer: 3000
      });
      
      setShowPreferenciaModal(false);
      setProspectoData(null);
    } catch (error) {
      console.error('Error al enviar por email:', error);
      Swal.fire({
        title: "⚠️ Error",
        text: "No se pudo registrar la preferencia. Intenta nuevamente.",
        icon: "warning",
        confirmButtonText: "Aceptar"
      });
    }
  };

  const handleLlamadaTelefonica = async () => {
    if (!prospectoData) return;
    
    try {
      await axios.post(`${API_URL}/lead/${prospectoData.prospectoId}/preferencia-entrega`, {
        canal: 'llamada',
        numero_contacto: prospectoData.numero_contacto
      });
      
      Swal.fire({
        title: "✅ Solicitud Registrada",
        text: "Un agente se comunicará contigo pronto con tu cotización",
        icon: "success",
        confirmButtonText: "Entendido",
        timer: 3000
      });
      
      setShowPreferenciaModal(false);
      setProspectoData(null);
    } catch (error) {
      console.error('Error al registrar llamada:', error);
      Swal.fire({
        title: "⚠️ Error",
        text: "No se pudo registrar la preferencia. Intenta nuevamente.",
        icon: "warning",
        confirmButtonText: "Aceptar"
      });
    }
  };

  const handleWhatsApp = async () => {
    if (!prospectoData) return;
    
    try {
      // Número de la empresa (WhatsApp Business)
      const numeroEmpresa = '16162071267'; // +1 (616) 207-1267 sin caracteres especiales
      
      // Registrar la preferencia (con número del cliente)
      await axios.post(`${API_URL}/lead/${prospectoData.prospectoId}/preferencia-entrega`, {
        canal: 'whatsapp',
        numero_contacto: prospectoData.numero_contacto
      });
      
      // Mensaje predeterminado
      const mensaje = encodeURIComponent("Hola, quiero recibir mi cotización");
      
      // Redirigir a WhatsApp de la empresa
      window.open(`https://wa.me/${numeroEmpresa}?text=${mensaje}`, '_blank');
      
      setShowPreferenciaModal(false);
      setProspectoData(null);
    } catch (error) {
      console.error('Error al registrar WhatsApp:', error);
      // Aún así abrir WhatsApp aunque falle el registro
      const numeroEmpresa = '16162071267'; // +1 (616) 207-1267
      const mensaje = encodeURIComponent("Hola, quiero recibir mi cotización");
      window.open(`https://wa.me/${numeroEmpresa}?text=${mensaje}`, '_blank');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🚀 Prevenir doble envío por estado
    if (loading) {
      console.warn('Formulario ya se está enviando, ignorando click adicional');
      return;
    }
    
    // ⏱️ Prevenir envíos muy rápidos (menos de 5 segundos)
    const now = Date.now();
    if (now - lastSubmitTime < 5000) {
      Swal.fire({
        title: "⏱️ Envío Muy Rápido",
        text: "Por favor espera unos segundos antes de enviar nuevamente.",
        icon: "warning",
        timer: 3000,
        showConfirmButton: false
      });
      return;
    }
    
    setLoading(true);
    setLastSubmitTime(now);
    
    const data = {
      ...form,
      edad: form.edad ? Number(form.edad) : null,
      tipo_afiliacion_id: form.tipo_afiliacion_id ? Number(form.tipo_afiliacion_id) : null,
      sueldo_bruto: form.sueldo_bruto ? Number(form.sueldo_bruto) : null,
      categoria_monotributo: form.categoria_monotributo || null,
      familiares: form.familiares.map(fam => ({
        vinculo: fam.vinculo,
        nombre: fam.nombre,
        edad: fam.edad ? Number(fam.edad) : null,
        tipo_afiliacion_id: fam.tipo_afiliacion_id ? Number(fam.tipo_afiliacion_id) : null,
        sueldo_bruto: fam.sueldo_bruto ? Number(fam.sueldo_bruto) : null,
        categoria_monotributo: fam.categoria_monotributo || null
      }))
    };

    try {
      const response = await axios.post(`${API_URL}/lead`, data);
      const cotizacionesResponse = await axios.get(`${API_URL}/lead/${response.data.prospectoId}/cotizaciones`);
      setCotizaciones(cotizacionesResponse.data);
      
      // Guardar datos del prospecto para el modal de preferencias
      setProspectoData({
        prospectoId: response.data.prospectoId,
        nombre: data.nombre,
        apellido: data.apellido,
        numero_contacto: data.numero_contacto,
        correo: data.correo
      });
      
      // Mostrar solo el modal de preferencias
      setShowPreferenciaModal(true);
      // setShowModal(true); // Comentado: Solo mostrar modal de preferencias
      
      // 🔄 Resetear formulario después del éxito
      setForm({
        nombre: "",
        apellido: "",
        edad: "",
        tipo_afiliacion_id: "",
        sueldo_bruto: "",
        categoria_monotributo: "",
        numero_contacto: "",
        correo: "",
        localidad: "",
        familiares: []
      });
      
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      
      // 🚨 Manejo específico de errores de duplicados y rate limiting
      if (error.response?.status === 429) {
        const errorData = error.response.data;
        
        if (errorData.code === 'DUPLICATE_REQUEST_DETECTED') {
          Swal.fire({
            title: "⚠️ Solicitud Duplicada",
            text: "Has enviado esta información recientemente. Por favor espera unos segundos antes de intentar nuevamente.",
            icon: "warning",
            confirmButtonText: "Entendido",
            timer: 5000
          });
        } else if (errorData.code === 'LEAD_CREATION_RATE_LIMIT_EXCEEDED') {
          Swal.fire({
            title: "🚫 Demasiadas Solicitudes",
            text: `Has creado muchos leads recientemente. Intenta nuevamente en ${Math.ceil(errorData.retryAfter / 60)} minutos.`,
            icon: "warning",
            confirmButtonText: "Entendido"
          });
        } else {
          Swal.fire({
            title: "⏱️ Límite Temporal",
            text: "Demasiadas solicitudes. Por favor intenta nuevamente en unos minutos.",
            icon: "warning",
            confirmButtonText: "Entendido"
          });
        }
        return;
      }
      
      // 🔍 Manejo de errores de duplicados en base de datos
      if (error.response?.status === 409) {
        const errorData = error.response.data;
        
        if (errorData.code === 'DUPLICATE_PHONE_DETECTED') {
          Swal.fire({
            title: "📞 Teléfono Ya Registrado",
            html: `
              <p>Ya existe un lead con este número de teléfono:</p>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <strong>${errorData.existingLead.nombre} ${errorData.existingLead.apellido}</strong><br>
                <small>Registrado: ${new Date(errorData.existingLead.fecha).toLocaleDateString('es-AR')}</small>
              </div>
              <p style="color: #6c757d; font-size: 14px;">${errorData.suggestion}</p>
            `,
            icon: "info",
            confirmButtonText: "Entendido",
            showCancelButton: true,
            cancelButtonText: "Usar Otro Teléfono",
            confirmButtonColor: "#007bff"
          }).then((result) => {
            if (result.dismiss === Swal.DismissReason.cancel) {
              // Enfocar el campo de teléfono para que edite
              document.querySelector('input[name="numero_contacto"]')?.focus();
            }
          });
        } else if (errorData.code === 'DUPLICATE_EMAIL_DETECTED') {
          Swal.fire({
            title: "✉️ Email Ya Registrado",
            html: `
              <p>Ya existe un lead con este email:</p>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <strong>${errorData.existingLead.nombre} ${errorData.existingLead.apellido}</strong><br>
                <small>Registrado: ${new Date(errorData.existingLead.fecha).toLocaleDateString('es-AR')}</small>
              </div>
              <p style="color: #6c757d; font-size: 14px;">${errorData.suggestion}</p>
            `,
            icon: "info",
            confirmButtonText: "Entendido",
            showCancelButton: true,
            cancelButtonText: "Usar Otro Email",
            confirmButtonColor: "#007bff"
          }).then((result) => {
            if (result.dismiss === Swal.DismissReason.cancel) {
              // Enfocar el campo de email para que edite
              document.querySelector('input[name="correo"]')?.focus();
            }
          });
        } else if (errorData.code === 'EXACT_DUPLICATE_DETECTED') {
          Swal.fire({
            title: "🚫 Lead Duplicado",
            html: `
              <p>Este lead ya fue registrado recientemente:</p>
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107;">
                <strong>⚠️ Datos idénticos detectados</strong><br>
                <small>Registrado: ${new Date(errorData.existingLead.fecha).toLocaleDateString('es-AR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</small>
              </div>
              <p style="color: #6c757d; font-size: 14px;">${errorData.suggestion}</p>
            `,
            icon: "warning",
            confirmButtonText: "Revisar Leads Existentes",
            showCancelButton: true,
            cancelButtonText: "Cerrar",
            confirmButtonColor: "#ffc107"
          });
        }
        return;
      }
      
      // 🛠️ Mostrar errores de validación del backend
      if (error.response && error.response.data && error.response.data.errores) {
        const erroresList = error.response.data.errores.map(err => `<li>${err}</li>`).join('');
        Swal.fire({
          title: "❌ Error de Validación",
          html: `<ul style='text-align:left; margin: 0; padding-left: 20px;'>${erroresList}</ul>`,
          icon: "warning",
          confirmButtonText: "Corregir Datos"
        });
      } else {
        // 🔥 Error genérico
        Swal.fire({
          title: "Error", 
          text: error.response?.data?.message || "No se pudo guardar el lead. Por favor intenta nuevamente.", 
          icon: "error",
          confirmButtonText: "Reintentar"
        });
      }
    } finally {
      // 🚀 Siempre liberar el estado de loading
      setLoading(false);
    }
  };

  // Lógica para mostrar campos condicionales
  const tipoSeleccionado = tiposAfiliacion.find(t => t.id === Number(form.tipo_afiliacion_id));

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      {/* 🚀 Overlay de loading para prevenir interacciones */}
      {loading && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
            <div style={{ marginTop: '15px', fontSize: '18px', fontWeight: 'bold' }}>
              Creando Lead...
            </div>
            <div style={{ marginTop: '5px', color: '#6c757d' }}>
              Por favor no cierres esta ventana
            </div>
          </div>
        </div>
      )}
      
      <Card style={{ width: "100%", maxWidth: 600 }} className="shadow">
        <Card.Body>
          <Card.Title className="mb-4 text-center">Formulario de Lead</Card.Title>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control 
                    name="nombre" 
                    value={form.nombre} 
                    onChange={handleChange} 
                    disabled={loading}
                    required 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellido</Form.Label>
                  <Form.Control 
                    name="apellido" 
                    value={form.apellido} 
                    onChange={handleChange} 
                    disabled={loading}
                    required 
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Edad del titular</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="edad" 
                    value={form.edad} 
                    onChange={handleChange} 
                    min={0} 
                    max={120} 
                    disabled={loading}
                    required 
                  />
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de afiliación</Form.Label>
                  <Form.Select 
                    name="tipo_afiliacion_id" 
                    value={form.tipo_afiliacion_id} 
                    onChange={handleTipoAfiliacion} 
                    disabled={loading}
                    required
                  >
                    <option value="">Selecciona...</option>
                    {tiposAfiliacion.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.etiqueta}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            {tipoSeleccionado?.requiere_sueldo === 1 && (
              <Form.Group className="mb-3">
                <Form.Label>Sueldo Bruto</Form.Label>
                <Form.Control
                  type="number"
                  name="sueldo_bruto"
                  value={form.sueldo_bruto}
                  onChange={handleChange}
                  min={0}
                  required
                />
              </Form.Group>
            )}
            {tipoSeleccionado?.requiere_categoria === 1 && (
              <Form.Group className="mb-3">
                <Form.Label>Categoría Monotributo</Form.Label>
                <Form.Select name="categoria_monotributo" value={form.categoria_monotributo} onChange={handleChange} required>
                  <option value="">Selecciona...</option>
                  {categoriasMonotributo.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>WhatsApp</Form.Label>
                  <Form.Control name="numero_contacto" value={form.numero_contacto} onChange={handleChange} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" name="correo" value={form.correo} onChange={handleChange} required />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Localidad</Form.Label>
              <Form.Select
                name="localidad"
                value={form.localidad}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona...</option>
                {localidades.map(loc => (
                  <option key={loc.id} value={loc.nombre}>{loc.nombre}</option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Familiares */}
            <div className="mb-3">
              <Button variant="secondary" onClick={() => setShowFamiliar(!showFamiliar)}>
                {showFamiliar ? "Cancelar" : "Agregar familiar"}
              </Button>
            </div>
            {showFamiliar && (
              <Row className="mb-3">
                <Col md={4}>
                  <Form.Select name="vinculo" value={familiar.vinculo} onChange={handleFamiliarChange}>
                    <option value="">Vínculo</option>
                    {vinculos.map(v => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Control
                    name="nombre"
                    placeholder="Nombre"
                    value={familiar.nombre}
                    onChange={handleFamiliarChange}
                  />
                </Col>
                <Col md={3}>
                  <Form.Control
                    type="number"
                    name="edad"
                    placeholder="Edad"
                    value={familiar.edad}
                    onChange={handleFamiliarChange}
                    min={0}
                    max={120}
                  />
                </Col>
                <Col md={1}>
                  <Button variant="success" onClick={agregarFamiliar}>+</Button>
                </Col>
              </Row>
            )}
            {form.familiares.length > 0 && (
              <div className="mb-3">
                <strong>Familiares agregados:</strong>
                <ul>
                  {form.familiares.map((fam, idx) => (
                    <li key={idx}>
                      {fam.vinculo} - {fam.nombre} ({fam.edad} años)
                      <Button variant="link" size="sm" onClick={() => eliminarFamiliar(idx)}>Eliminar</Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(familiar.vinculo === "pareja/conyuge" || familiar.vinculo === "hijo/a") && (
              <>
                <Col md={12} className="mt-2">
                  <Form.Label>Tipo de Afiliación</Form.Label>
                  <Form.Select
                    name="tipo_afiliacion_id"
                    value={familiar.tipo_afiliacion_id}
                    onChange={handleFamiliarChange}
                    required
                  >
                    <option value="">Selecciona...</option>
                    {tiposAfiliacion.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.etiqueta}</option>
                    ))}
                  </Form.Select>
                </Col>
                {tiposAfiliacion.find(t => t.id === Number(familiar.tipo_afiliacion_id))?.requiere_sueldo === 1 && (
                  <Col md={12} className="mt-2">
                    <Form.Label>Sueldo Bruto</Form.Label>
                    <Form.Control
                      type="number"
                      name="sueldo_bruto"
                      value={familiar.sueldo_bruto}
                      onChange={handleFamiliarChange}
                      min={0}
                      required
                    />
                  </Col>
                )}
                {tiposAfiliacion.find(t => t.id === Number(familiar.tipo_afiliacion_id))?.requiere_categoria === 1 && (
                  <Col md={12} className="mt-2">
                    <Form.Label>Categoría Monotributo</Form.Label>
                    <Form.Select
                      name="categoria_monotributo"
                      value={familiar.categoria_monotributo}
                      onChange={handleFamiliarChange}
                      required
                    >
                      <option value="">Selecciona...</option>
                      {categoriasMonotributo.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </Form.Select>
                  </Col>
                )}
              </>
            )}

            <Button 
              type="submit" 
              variant="primary"
              disabled={loading}
              className="d-flex align-items-center justify-content-center"
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Guardando Lead...
                </>
              ) : (
                'Guardar Lead'
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>


      {/* 🎁 Modal para seleccionar preferencia de entrega de cotización */}
      <Modal show={showPreferenciaModal} onHide={() => {}} centered backdrop="static" keyboard={false}>
        <Modal.Header>
          <Modal.Title>¿Cómo prefieres recibir tu cotización?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '16px', marginBottom: '30px', color: '#333' }}>
              Selecciona tu canal preferido para recibir la cotización
            </p>
            
            <div style={{ display: 'grid', gap: '15px' }}>
              {/* Opción Email */}
              <Button
                onClick={handleEnviarPorEmail}
                style={{
                  padding: '20px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  backgroundColor: '#007bff',
                  border: 'none'
                }}
                className="btn btn-primary"
              >
                <span>📧</span>
                <span>Enviar por Email</span>
              </Button>

              {/* Opción Llamada */}
              <Button
                onClick={handleLlamadaTelefonica}
                style={{
                  padding: '20px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  backgroundColor: '#28a745',
                  border: 'none'
                }}
                className="btn btn-success"
              >
                <span>📞</span>
                <span>Llamada Telefónica</span>
              </Button>

              {/* Opción WhatsApp */}
              <Button
                onClick={handleWhatsApp}
                style={{
                  padding: '20px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  backgroundColor: '#25d366',
                  border: 'none'
                }}
                className="btn"
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Modal para mostrar las cotizaciones */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Cotizaciones</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            {cotizaciones.map((cotizacion, index) => (
              <div className="col-md-6 mb-4" key={index}>
                <div className="card">
                  <div className="card-header text-center">
                    <h5>{cotizacion.plan}</h5>
                  </div>
                  <div className="card-body">
                    <p><strong>Grupo Familiar:</strong> {cotizacion.detalles.map(d => d.vinculo).join(", ")}</p>
                    {cotizacion.detalles.map((detalle, idx) => (
                      <div key={idx} className="mb-2">
                        <p><strong>{detalle.vinculo}:</strong></p>
                        <p>Edad: {detalle.edad}</p>
                        <p>Precio Base: ${detalle.precio_base}</p>
                        <p>Descuento: ${parseFloat(detalle.descuento).toFixed(2)} ({detalle.tipo_afiliacion})</p>
                        {detalle.sueldo_bruto && (
                          <p>Sueldo Bruto: ${detalle.sueldo_bruto}</p>
                        )}
                        <p>Precio Final: ${detalle.precio_final}</p>
                      </div>
                    ))}
                    <hr />
                    <p><strong>Total Bruto:</strong> ${cotizacion.total_bruto}</p>
                    <p><strong>Total Descuento:</strong> ${cotizacion.total_descuento}</p>
                    <p><strong>Total Final:</strong> ${cotizacion.total_final}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default FormularioLead;