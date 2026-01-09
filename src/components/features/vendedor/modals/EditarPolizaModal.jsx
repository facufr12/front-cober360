import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner, ProgressBar, Card, Row, Col } from 'react-bootstrap';
import { FaSpinner, FaArrowLeft, FaArrowRight, FaSave } from 'react-icons/fa';
import axios from 'axios';
import Swal from 'sweetalert2';

// ✅ Importar los mismos pasos que usa PolizaForm
import PasoDatosPersonales from '../poliza-form/PasoDatosPersonales';
import PasoDeclaracionJurada from '../poliza-form/PasoDeclaracionJurada';
import PasoIntegrantesDocumentos from '../poliza-form/PasoIntegrantesDocumentos';
import PasoReferencias from '../poliza-form/pasoReferencias';
import PasoSaludTerminos from '../poliza-form/PasoSaludTerminos';

// ✅ Configuración de pasos y opciones (igual que PolizaForm)
const etapas = [
  "Datos Personales",
  "Declaración Jurada", 
  "Integrantes y Documentos",
  "Referencias",
  "Salud y Términos"
];

const preguntasDeclaracionJurada = [
  "¿Algún integrante del grupo toma Medicación?",
  "¿Algún integrante encuentra actualmente bajo Tratamiento médico?",
  "¿Algún integrante del grupo tiene diagnosticada alguna Enfermedad en los últimos 12 meses?",
  "¿Algún integrante del grupo tiene indicado realizarse estudios, análisis y/o prácticas médicas?",
  "¿Algún integrante del grupo ha sido internado/a?",
  "¿Algún integrante del grupo posee alguna de las siguientes enfermedades, patologías y/o diagnósticos?"
];

const enfermedadesPatologias = [
  "Antecedentes Neurológicos / Psiquiátricos",
  "Alteraciones Visuales",
  "Alteraciones de nariz, garganta u oído",
  "Diabetes / Obesidad",
  "Adicciones a drogas o alcohol",
  "Alteraciones de la sangre",
  "Alteraciones Pulmonares",
  "Nódulos, Quistes o Tumores",
  "Alteraciones renales/vejiga/próstata",
  "Alteraciones ginecológicas y/u obstétricas",
  "Embarazo",
  "Afecciones musculares y/o de huesos",
  "Enfermedades congénitas o hereditarias"
];

const opcionesCondicionIVA = [
  "Responsable Inscripto",
  "Responsable No Inscripto", 
  "IVA Exento",
  "Consumidor Final",
  "Responsable Monotributo"
];

const opcionesTipoDomicilio = ["Particular", "Comercial", "Legal"];
const opcionesEstadoCivil = ["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a", "Concubinato", "Separado/a"];
const opcionesNacionalidad = [
  "Argentina", "Boliviana", "Brasileña", "Chilena", "Colombiana", 
  "Ecuatoriana", "Paraguaya", "Peruana", "Uruguaya", "Venezolana", "Otra"
];

// ✅ Función helper para formatear nombres de preguntas médicas (igual que supervisor)
const formatearPregunta = (key) => {
  const mapeo = {
    internacion: "¿Ha sido internado/a en los últimos 12 meses?",
    internacion_colegiales: "¿Ha sido internado/a en Colegiales?",
    cirugia: "¿Ha sido sometido/a a alguna cirugía?",
    secuelas: "¿Padece secuelas de accidentes o enfermedades?",
    accidentes: "¿Ha tenido accidentes graves?",
    transfusiones: "¿Ha recibido transfusiones de sangre?",
    estudios_anuales: "¿Se realiza estudios médicos anuales?",
    indicacion_medica: "¿Tiene indicación médica pendiente?",
    psicologico: "¿Ha recibido tratamiento psicológico?",
    psiquiatrico: "¿Ha recibido tratamiento psiquiátrico?",
    internacion_mental: "¿Ha sido internado/a en institución mental?",
    diabetes: "¿Padece diabetes?",
    auditivas: "¿Tiene problemas auditivos?",
    vista: "¿Tiene problemas de vista?",
    lentes: "¿Usa lentes o anteojos?",
    glaucoma: "¿Padece glaucoma?",
    alergias: "¿Tiene alergias?",
    infarto: "¿Ha sufrido infarto?",
    test_embarazo: "¿Se ha realizado test de embarazo?",
    sintomas_embarazo: "¿Presenta síntomas de embarazo?",
    embarazo_actual: "¿Se encuentra embarazada actualmente?",
    aborto: "¿Ha tenido abortos?",
    partos: "¿Ha tenido partos?",
    columna: "¿Tiene problemas de columna?",
    protesis: "¿Usa prótesis?",
    deporte: "¿Practica deportes?",
    deporte_riesgo: "¿Practica deportes de riesgo?",
    indicacion_protesis: "¿Tiene indicación de prótesis?",
    neurologicas: "¿Padece enfermedades neurológicas?",
    epilepsia: "¿Padece epilepsia?",
    respiratorias: "¿Padece enfermedades respiratorias?",
    tuberculosis: "¿Ha padecido tuberculosis?",
    fiebre_reumatica: "¿Ha padecido fiebre reumática?",
    hepatitis: "¿Ha padecido hepatitis?",
    colicos: "¿Padece cólicos frecuentes?",
    infecciones_urinarias: "¿Padece infecciones urinarias frecuentes?",
    anemia: "¿Padece anemia?",
    transmision_sexual: "¿Ha padecido enfermedades de transmisión sexual?",
    infecciosas: "¿Ha padecido enfermedades infecciosas?",
    tumores: "¿Ha padecido tumores?",
    tiroides: "¿Tiene problemas de tiroides?",
    gastritis: "¿Padece gastritis?",
    tabaquismo: "¿Fuma o ha fumado?",
    alcoholismo: "¿Consume alcohol en exceso?",
    drogas: "¿Ha consumido drogas?",
    perdida_peso: "¿Ha tenido pérdida de peso significativa?",
    diagnostico_reciente: "¿Tiene algún diagnóstico médico reciente?",
    discapacidad: "¿Tiene alguna discapacidad?"
  };
  
  return mapeo[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const EditarPolizaModal = ({ 
  show, 
  onHide, 
  poliza, 
  onActualizar 
}) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    datos_personales: {},
    declaracion_jurada: {},
    integrantes: [],
    documentos_titular: {},
    referencias: [],
    saludTerminos: {}
  });
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  // Cargar datos de la póliza cuando se abre el modal
  useEffect(() => {
    if (show && poliza?.id) {
      cargarDatosParaEditar();
    }
  }, [show, poliza?.id]);

  const cargarDatosParaEditar = async () => {
    try {
      setLoading(true);
      setError(null);
      setStep(0); // Reiniciar al paso 1
      
      const response = await axios.get(
        `/api/polizas/vendedor/${poliza.id}/editar`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success && response.data.data) {
        const polizaData = response.data.data;
        
        // ✅ Parsear todos los datos JSON de la póliza
        const datosPersonales = typeof polizaData.datos_personales === 'string' 
          ? JSON.parse(polizaData.datos_personales) 
          : polizaData.datos_personales || {};

        const declaracionJurada = typeof polizaData.declaracion_salud === 'string'
          ? JSON.parse(polizaData.declaracion_salud)
          : polizaData.declaracion_salud || { preguntas: [], enfermedades_seleccionadas: [], datos_fisicos: {} };

        console.log('📋 Declaración salud cargada desde BD:', declaracionJurada);

        const integrantes = typeof polizaData.integrantes === 'string'
          ? JSON.parse(polizaData.integrantes)
          : polizaData.integrantes || [];

        const documentosTitular = typeof polizaData.documentos_titular === 'string'
          ? JSON.parse(polizaData.documentos_titular)
          : polizaData.documentos_titular || {};

        const referencias = typeof polizaData.referencias === 'string'
          ? JSON.parse(polizaData.referencias)
          : polizaData.referencias || [{ nombre: "", relacion: "", telefono: "" }];

        const saludTerminos = typeof polizaData.datos_comerciales === 'string'
          ? JSON.parse(polizaData.datos_comerciales)
          : polizaData.datos_comerciales || {};

        // ✅ Cargar en el estado del formulario
        setFormData({
          datos_personales: datosPersonales,
          declaracion_jurada: declaracionJurada,
          integrantes: integrantes,
          documentos_titular: documentosTitular,
          referencias: referencias.length > 0 ? referencias : [{ nombre: "", relacion: "", telefono: "" }],
          saludTerminos: saludTerminos
        });
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError(err.response?.data?.message || 'Error al cargar los datos de la póliza');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handlers para cada tipo de cambio (igual que PolizaForm)
  const handlePersonalChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      datos_personales: {
        ...prev.datos_personales,
        [field]: value
      }
    }));
  };

  const handleDeclaracionChange = (field, value, index = null, subField = null) => {
    console.log('🔄 Declaración cambiada:', { field, value, index, subField });
    
    setFormData(prev => {
      let newDeclaracionJurada = { ...prev.declaracion_jurada };
      
      // ✅ CORRECCIÓN: Solo actualizar el campo específico que se está editando
      // NO intentar mapear preguntas → respuestas["0"] porque son estructuras diferentes
      
      if (field === 'preguntas' && index !== null && subField) {
        // Actualizar array de preguntas
        newDeclaracionJurada.preguntas = (prev.declaracion_jurada.preguntas || []).map((item, i) => 
          i === index ? { ...item, [subField]: value } : item
        );
        
        console.log(`✅ Actualizado preguntas[${index}].${subField}:`, value);
      } 
      // Para datos_fisicos con integrantes (estructura especial)
      else if (field === 'datos_fisicos' && index !== null && subField === 'integrante') {
        if (!newDeclaracionJurada.datos_fisicos) {
          newDeclaracionJurada.datos_fisicos = { titular_peso: '', titular_altura: '', integrantes: [] };
        }
        if (!newDeclaracionJurada.datos_fisicos.integrantes) {
          newDeclaracionJurada.datos_fisicos.integrantes = [];
        }
        if (!newDeclaracionJurada.datos_fisicos.integrantes[index]) {
          newDeclaracionJurada.datos_fisicos.integrantes[index] = { peso: '', altura: '' };
        }
        newDeclaracionJurada.datos_fisicos.integrantes[index][value.field] = value.value;
      }
      // Para datos_fisicos del titular
      else if (field === 'datos_fisicos' && subField) {
        if (!newDeclaracionJurada.datos_fisicos) {
          newDeclaracionJurada.datos_fisicos = { titular_peso: '', titular_altura: '', integrantes: [] };
        }
        newDeclaracionJurada.datos_fisicos[subField] = value;
      }
      // Para arrays con índice
      else if (index !== null && subField) {
        newDeclaracionJurada[field] = (prev.declaracion_jurada[field] || []).map((item, i) => 
          i === index ? { ...item, [subField]: value } : item
        );
      } 
      // Para campos simples
      else {
        newDeclaracionJurada[field] = value;
      }
      
      console.log('📋 Nueva declaración jurada completa:', newDeclaracionJurada);
      
      return {
        ...prev,
        declaracion_jurada: newDeclaracionJurada
      };
    });
  };

  const handleIntegranteChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      integrantes: prev.integrantes.map((integrante, i) =>
        i === index ? { ...integrante, [field]: value } : integrante
      )
    }));
  };

  const handleFileUpload = (tipo, integranteIndex, file) => {
    if (integranteIndex === null) {
      setFormData(prev => ({
        ...prev,
        documentos_titular: {
          ...prev.documentos_titular,
          [tipo]: file
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        integrantes: prev.integrantes.map((integrante, i) =>
          i === integranteIndex
            ? {
                ...integrante,
                documentos: {
                  ...integrante.documentos,
                  [tipo]: file
                }
              }
            : integrante
        )
      }));
    }
  };

  const handleRemoveFile = (tipo, integranteIndex = null) => {
    if (integranteIndex === null) {
      setFormData(prev => ({
        ...prev,
        documentos_titular: {
          ...prev.documentos_titular,
          [tipo]: null
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        integrantes: prev.integrantes.map((integrante, i) =>
          i === integranteIndex
            ? {
                ...integrante,
                documentos: {
                  ...integrante.documentos,
                  [tipo]: null
                }
              }
            : integrante
        )
      }));
    }
  };

  const handleReferenciaChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      referencias: prev.referencias.map((ref, i) =>
        i === index ? { ...ref, [field]: value } : ref
      )
    }));
  };

  const agregarReferencia = () => {
    if (formData.referencias.length < 3) {
      setFormData(prev => ({
        ...prev,
        referencias: [...prev.referencias, { nombre: "", relacion: "", telefono: "" }]
      }));
    }
  };

  const eliminarReferencia = (index) => {
    if (formData.referencias.length > 1) {
      setFormData(prev => ({
        ...prev,
        referencias: prev.referencias.filter((_, i) => i !== index)
      }));
    }
  };

  // ✅ Navegación entre pasos
  const handleNext = () => {
    if (step < etapas.length - 1) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  // ✅ Guardar cambios (actualiza todos los pasos)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      console.log('📦 Estado completo del formulario:', formData);
      console.log('📋 Declaración jurada a enviar:', formData.declaracion_jurada);
      console.log('🔍 RESPUESTAS["0"] específicas:', formData.declaracion_jurada?.respuestas?.['0']);
      console.log('🔍 PREGUNTAS array:', formData.declaracion_jurada?.preguntas);

      // ✅ Preparar datos completos para enviar
      const datosActualizados = {
        // Datos personales (se aplanan para compatibilidad con backend)
        ...formData.datos_personales,
        // Datos de otros pasos (se envían como objetos)
        declaracion_jurada: formData.declaracion_jurada,
        integrantes: formData.integrantes,
        documentos_titular: formData.documentos_titular,
        referencias: formData.referencias,
        saludTerminos: formData.saludTerminos
      };

      console.log('📤 Enviando datos actualizados:', datosActualizados);
      console.log('📤 Declaración jurada en datosActualizados:', datosActualizados.declaracion_jurada);

      const response = await axios.put(
        `/api/polizas/vendedor/${poliza.id}/actualizar`,
        datosActualizados,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        
        // ✅ Mostrar SweetAlert de éxito
        await Swal.fire({
          title: '¡Póliza actualizada!',
          html: `
            <div class="text-center">
              <p><strong>Póliza:</strong> ${poliza?.numero_poliza}</p>
              <p class="text-success">Los cambios han sido guardados correctamente</p>
              ${response.data.data?.campos_actualizados ? 
                `<p class="small text-muted">Campos actualizados: ${response.data.data.campos_actualizados.length}</p>` 
                : ''}
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#28a745'
        });

        // Cerrar modal y actualizar lista
        onActualizar();
        onHide();
        setSuccess(false);
        setStep(0);
      }
    } catch (err) {
      console.error('Error actualizando póliza:', err);
      setError(err.response?.data?.message || 'Error al actualizar la póliza');
      
      // ✅ Mostrar SweetAlert de error
      Swal.fire({
        title: 'Error al guardar',
        text: err.response?.data?.message || 'No se pudieron guardar los cambios. Por favor intente nuevamente.',
        icon: 'error',
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Renderizar paso actual
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <PasoDatosPersonales
            datosPersonales={formData.datos_personales}
            handleChange={handlePersonalChange}
            opcionesEstadoCivil={opcionesEstadoCivil}
            opcionesNacionalidad={opcionesNacionalidad}
            opcionesCondicionIVA={opcionesCondicionIVA}
            opcionesTipoDomicilio={opcionesTipoDomicilio}
            cotizacion={null} // No necesario en edición
          />
        );
      
      case 1:
        return (
          <PasoDeclaracionJurada
            datosPersonales={formData.datos_personales}
            declaracionJurada={formData.declaracion_jurada}
            integrantes={formData.integrantes}
            preguntasDeclaracionJurada={preguntasDeclaracionJurada}
            enfermedadesPatologias={enfermedadesPatologias}
            handleDeclaracionChange={handleDeclaracionChange}
          />
        );
      
      case 2:
        return (
          <PasoIntegrantesDocumentos
            integrantes={formData.integrantes}
            documentosTitular={formData.documentos_titular}
            datosPersonales={formData.datos_personales}
            handleIntegranteChange={handleIntegranteChange}
            opcionesNacionalidad={opcionesNacionalidad}
            handleFileUpload={handleFileUpload}
            handleRemoveFile={handleRemoveFile}
          />
        );
      
      case 3:
        return (
          <PasoReferencias
            referencias={formData.referencias}
            handleReferenciaChange={handleReferenciaChange}
            agregarReferencia={agregarReferencia}
            eliminarReferencia={eliminarReferencia}
          />
        );
      
      case 4:
        return (
          <>
            {/* ✅ Sección 1: Cobertura Médica Anterior */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-info text-white">
                <h6 className="mb-0">🏥 Cobertura Médica Anterior</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>¿Tiene cobertura médica anterior?</Form.Label>
                      <Form.Select
                        value={formData.declaracion_jurada?.coberturaAnterior?.tiene || 'no'}
                        onChange={e => {
                          setFormData(prev => ({
                            ...prev,
                            declaracion_jurada: {
                              ...prev.declaracion_jurada,
                              coberturaAnterior: {
                                ...prev.declaracion_jurada?.coberturaAnterior,
                                tiene: e.target.value
                              }
                            }
                          }));
                        }}
                      >
                        <option value="no">No</option>
                        <option value="si">Sí</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {formData.declaracion_jurada?.coberturaAnterior?.tiene === 'si' && (
                    <>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nombre de la cobertura</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.declaracion_jurada?.coberturaAnterior?.nombre || ''}
                            onChange={e => {
                              setFormData(prev => ({
                                ...prev,
                                declaracion_jurada: {
                                  ...prev.declaracion_jurada,
                                  coberturaAnterior: {
                                    ...prev.declaracion_jurada?.coberturaAnterior,
                                    nombre: e.target.value
                                  }
                                }
                              }));
                            }}
                            placeholder="Ej: OSDE, Swiss Medical, etc."
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Detalles adicionales</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={formData.declaracion_jurada?.coberturaAnterior?.detalle || ''}
                            onChange={e => {
                              setFormData(prev => ({
                                ...prev,
                                declaracion_jurada: {
                                  ...prev.declaracion_jurada,
                                  coberturaAnterior: {
                                    ...prev.declaracion_jurada?.coberturaAnterior,
                                    detalle: e.target.value
                                  }
                                }
                              }));
                            }}
                            placeholder="Plan, número de afiliado, etc."
                          />
                        </Form.Group>
                      </Col>
                    </>
                  )}
                </Row>
              </Card.Body>
            </Card>

            {/* ✅ Sección 2: Medicación */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-warning text-dark">
                <h6 className="mb-0">💊 Medicación</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>¿Toma medicación actualmente?</Form.Label>
                      <Form.Select
                        value={formData.declaracion_jurada?.medicacion?.toma || 'no'}
                        onChange={e => {
                          setFormData(prev => ({
                            ...prev,
                            declaracion_jurada: {
                              ...prev.declaracion_jurada,
                              medicacion: {
                                ...prev.declaracion_jurada?.medicacion,
                                toma: e.target.value
                              }
                            }
                          }));
                        }}
                      >
                        <option value="no">No</option>
                        <option value="si">Sí</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {formData.declaracion_jurada?.medicacion?.toma === 'si' && (
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Detalle la medicación</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={formData.declaracion_jurada?.medicacion?.detalle || ''}
                          onChange={e => {
                            setFormData(prev => ({
                              ...prev,
                              declaracion_jurada: {
                                ...prev.declaracion_jurada,
                                medicacion: {
                                  ...prev.declaracion_jurada?.medicacion,
                                  detalle: e.target.value
                                }
                              }
                            }));
                          }}
                          placeholder="Nombre del medicamento, dosis, frecuencia y motivo..."
                        />
                      </Form.Group>
                    </Col>
                  )}
                </Row>
              </Card.Body>
            </Card>

            {/* ✅ Sección 3: Información Adicional */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-secondary text-white">
                <h6 className="mb-0">📝 Información Adicional</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group>
                  <Form.Label>Observaciones o información relevante</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.saludTerminos?.informacion_adicional || ''}
                    onChange={e => {
                      setFormData(prev => ({
                        ...prev,
                        saludTerminos: {
                          ...prev.saludTerminos,
                          informacion_adicional: e.target.value
                        }
                      }));
                    }}
                    placeholder="Cualquier información médica adicional que considere relevante..."
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* ✅ Sección 4: Cuestionario Médico Detallado (48 preguntas de respuestas["0"]) */}
            {formData.declaracion_jurada?.respuestas && (
              <Card className="mt-4 mb-4 border-0 shadow-sm">
                <Card.Header className="bg-primary text-white">
                  <h6 className="mb-0">
                    📋 Cuestionario Médico Detallado
                    <span className="badge bg-light text-dark ms-2">
                      {Object.keys(formData.declaracion_jurada.respuestas["0"] || {}).length} preguntas
                    </span>
                  </h6>
                </Card.Header>
                <Card.Body>
                  {(() => {
                    const respuestas = formData.declaracion_jurada.respuestas;
                    const keys = Object.keys(respuestas);
                    
                    // Detectar si es estructura por integrante
                    const esPorIntegrante = keys.every(key => !isNaN(key));
                    
                    if (esPorIntegrante) {
                      // Renderizar por integrante (igual que supervisor)
                      return keys.map((integranteIndex) => {
                        const respuestasIntegrante = respuestas[integranteIndex];
                        const nombreIntegrante = integranteIndex === "0" 
                          ? "Titular" 
                          : formData.integrantes?.[parseInt(integranteIndex) - 1]?.nombre || `Integrante ${parseInt(integranteIndex) + 1}`;
                        
                        return (
                          <div key={integranteIndex} className="mb-4">
                            <h6 className="text-primary border-bottom pb-2 mb-3">
                              {nombreIntegrante}
                            </h6>
                            <Row>
                              {Object.entries(respuestasIntegrante).map(([preguntaKey, pregunta]) => (
                                <Col md={6} key={`${integranteIndex}-${preguntaKey}`} className="mb-3">
                                  <Card className="h-100 border-light">
                                    <Card.Body>
                                      <Form.Group>
                                        <Form.Label className="fw-bold small text-primary">
                                          {formatearPregunta(preguntaKey)}
                                        </Form.Label>
                                        <Form.Select
                                          size="sm"
                                          value={pregunta.respuesta || ''}
                                          onChange={e => {
                                            const nuevasRespuestas = { 
                                              ...formData.declaracion_jurada.respuestas 
                                            };
                                            nuevasRespuestas[integranteIndex] = {
                                              ...nuevasRespuestas[integranteIndex],
                                              [preguntaKey]: {
                                                ...nuevasRespuestas[integranteIndex][preguntaKey],
                                                respuesta: e.target.value
                                              }
                                            };
                                            
                                            // Actualizar formData
                                            setFormData(prev => ({
                                              ...prev,
                                              declaracion_jurada: {
                                                ...prev.declaracion_jurada,
                                                respuestas: nuevasRespuestas
                                              }
                                            }));
                                          }}
                                          className={pregunta.respuesta === 'si' ? 'border-warning' : ''}
                                        >
                                          <option value="">Seleccionar...</option>
                                          <option value="no">No</option>
                                          <option value="si">Sí</option>
                                        </Form.Select>

                                        {pregunta.respuesta === 'si' && (
                                          <Form.Control
                                            className="mt-2"
                                            as="textarea"
                                            rows={2}
                                            size="sm"
                                            placeholder="Describa los detalles..."
                                            value={pregunta.detalle || ''}
                                            onChange={e => {
                                              const nuevasRespuestas = { 
                                                ...formData.declaracion_jurada.respuestas 
                                              };
                                              nuevasRespuestas[integranteIndex] = {
                                                ...nuevasRespuestas[integranteIndex],
                                                [preguntaKey]: {
                                                  ...nuevasRespuestas[integranteIndex][preguntaKey],
                                                  detalle: e.target.value
                                                }
                                              };
                                              
                                              // Actualizar formData
                                              setFormData(prev => ({
                                                ...prev,
                                                declaracion_jurada: {
                                                  ...prev.declaracion_jurada,
                                                  respuestas: nuevasRespuestas
                                                }
                                              }));
                                            }}
                                          />
                                        )}
                                      </Form.Group>
                                    </Card.Body>
                                  </Card>
                                </Col>
                              ))}
                            </Row>
                          </div>
                        );
                      });
                    }
                  })()}
                </Card.Body>
              </Card>
            )}

            {/* ✅ Aceptación de términos */}
            <Card className="border-danger">
              <Card.Body>
                <Form.Check
                  type="checkbox"
                  id="aceptar-terminos"
                  checked={aceptaTerminos}
                  onChange={e => setAceptaTerminos(e.target.checked)}
                  label={
                    <span>
                      Acepto que la información proporcionada es correcta y completa. 
                      <strong className="text-danger"> *</strong>
                    </span>
                  }
                  required
                />
              </Card.Body>
            </Card>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" backdrop="static" fullscreen="lg-down">
      <Modal.Header closeButton>
        <Modal.Title>
          Editar Póliza #{poliza?.numero_poliza}
          <small className="text-muted ms-2">
            Paso {step + 1} de {etapas.length}: {etapas[step]}
          </small>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert variant="success">✅ Póliza actualizada correctamente</Alert>}

        {/* Barra de progreso */}
        <ProgressBar 
          now={((step + 1) / etapas.length) * 100} 
          label={`${step + 1}/${etapas.length}`}
          className="mb-4"
          style={{ height: '25px' }}
        />

        {loading && !formData.datos_personales?.nombre ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
            <p className="mt-3">Cargando datos de la póliza...</p>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            {renderStep()}
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <Button 
          variant="secondary" 
          onClick={onHide}
          disabled={loading}
        >
          Cancelar
        </Button>

        <div>
          {step > 0 && (
            <Button 
              variant="outline-secondary" 
              onClick={handlePrev}
              disabled={loading}
              className="me-2"
            >
              <FaArrowLeft className="me-1" />
              Anterior
            </Button>
          )}
          
          {step < etapas.length - 1 ? (
            <Button 
              variant="primary" 
              onClick={handleNext}
              disabled={loading}
            >
              Siguiente
              <FaArrowRight className="ms-1" />
            </Button>
          ) : (
            <Button 
              variant="success" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="me-2" style={{ animation: 'spin 1s linear infinite' }} />
                  Guardando...
                </>
              ) : (
                <>
                  <FaSave className="me-1" />
                  Guardar Cambios
                </>
              )}
            </Button>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default EditarPolizaModal;
