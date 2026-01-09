import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, ProgressBar, Badge, Container } from "react-bootstrap";
import axios from "axios"; // ← Importación faltante
import Swal from 'sweetalert2'; // ← Para mejor UX
import { API_URL } from "../../config";
import {
  ShieldCheck,
  CheckCircleFill, 
  InfoCircleFill
} from "react-bootstrap-icons";

// Importa los pasos modularizados
import PasoDatosPersonales from "./poliza-form/PasoDatosPersonales";
import PasoDeclaracionJurada from "./poliza-form/PasoDeclaracionJurada";
import PasoIntegrantesDocumentos from "./poliza-form/PasoIntegrantesDocumentos";
import PasoReferencias from "./poliza-form/pasoReferencias";
import PasoSaludTerminos from "./poliza-form/PasoSaludTerminos";
import PasoResumen from './poliza-form/PasoResumen';

// Preguntas de declaración jurada actualizadas
const preguntasDeclaracionJurada = [
  "¿Algún integrante del grupo toma Medicación?",
  "¿Algún integrante encuentra actualmente bajo Tratamiento médico?",
  "¿Algún integrante del grupo tiene diagnosticada alguna Enfermedad en los últimos 12 meses?",
  "¿Algún integrante del grupo tiene indicado realizarse estudios, análisis y/o prácticas médicas?",
  "¿Algún integrante del grupo ha sido internado/a?",
  "¿Algún integrante del grupo posee alguna de las siguientes enfermedades, patologías y/o diagnósticos?"
];

// Lista de enfermedades/patologías
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

const opcionesTipoDomicilio = [
  "Particular",
  "Comercial",
  "Legal"
];

const opcionesEstadoCivil = [
  "Soltero/a",
  "Casado/a",
  "Divorciado/a",
  "Viudo/a",
  "Concubinato",
  "Separado/a"
];

const opcionesNacionalidad = [
  "Argentina",
  "Boliviana",
  "Brasileña",
  "Chilena",
  "Colombiana",
  "Ecuatoriana",
  "Paraguaya",
  "Peruana",
  "Uruguaya",
  "Venezolana",
  "Otra"
];

const etapas = [
  "Datos Personales",
  "Declaración Jurada", 
  "Integrantes y Documentos",
  "Referencias",
  "Salud y Términos",
  "Resumen Final"
];

const TIPO_AFILIACION = {
  1: "Particular/autónomo",
  2: "Con recibo de sueldo", 
  3: "Monotributista",
};

const PolizaForm = ({ show, onHide, cotizacion, prospecto, onPolizaCreada }) => {
  if (!cotizacion || !prospecto) {
    console.warn("PolizaForm: cotizacion o prospecto son undefined");
    return null;
  }

  const promocionAplicada = cotizacion?.promocion_aplicada || 
    (cotizacion?.detalles && cotizacion.detalles.length > 0 
      ? cotizacion.detalles.find(d => d.promocion_aplicada)?.promocion_aplicada 
      : null) || 
    "Sin promoción";

  const descuentoPromocion = cotizacion?.descuento_promocion || 
    (cotizacion?.detalles && cotizacion.detalles.length > 0 
      ? cotizacion.detalles.find(d => d.descuento_promocion)?.descuento_promocion 
      : 0);

  const [step, setStep] = useState(0);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const formRef = useRef();

  const tipoAfiliacionLabel = TIPO_AFILIACION[prospecto?.tipo_afiliacion_id] || 
    cotizacion?.tipo_afiliacion || 
    "Sin datos";

  // ✅ TODOS LOS ESTADOS
  const [form, setForm] = useState({
    datos_personales: {
      numero_poliza_oficial: "", // ← Nuevo campo para número de póliza oficial
      numero_poliza: "",
      nombre: prospecto?.nombre || "",
      apellido: prospecto?.apellido || "",
      dni: "",
      cuil: "",
      fecha_nacimiento: prospecto?.fecha_nacimiento || "",
      edad: prospecto?.edad || "",
      sexo: prospecto?.sexo || "",
      email: prospecto?.correo || "",
      telefono: prospecto?.numero_contacto || "",
      celular: "",
      direccion: "",
      numero: "",
      piso: "",
      dpto: "",
      localidad: prospecto?.localidad || "",
      cod_postal: "",
      tipo_afiliacion: tipoAfiliacionLabel,
      estado_civil: "",
      nacionalidad: "Argentina",
      condicion_iva: "Consumidor Final",
      tipo_domicilio: "Particular",
      asesor: "", // ← Nombre del vendedor/asesor (auto-completado)
      mes_ingreso: "", // ← Mes de ingreso
      proximo_periodo_abonar: "", // ← Próximo período a abonar
      obra_social: "", // ← Obra social seleccionada
      obra_social_otra: "", // ← Obra social manual si es "Otra"
      porcentaje_promocion: "" // ← Porcentaje de promoción manual
    },
    declaracion_jurada: {
      datos_fisicos: {
        titular_peso: "",
        titular_altura: "",
        integrantes: (cotizacion?.detalles?.filter(d => d.vinculo !== 'Titular') || []).map(familiar => ({
          nombre: familiar.persona?.split(' ')[0] || "",
          apellido: familiar.persona?.split(' ').slice(1).join(' ') || "",
          peso: "",
          altura: ""
        }))
      },
      preguntas: preguntasDeclaracionJurada.map(p => ({ 
        pregunta: p, 
        respuesta: "no", 
        detalle: "" 
      })),
      enfermedades_seleccionadas: [],
      detalle_enfermedades: "",
      acepta_terminos: false,
      requiere_auditoria_medica: false // ✅ NUEVO: Flag para auditoría médica
    },
    integrantes: (cotizacion?.detalles?.filter(d => d.vinculo !== 'Titular') || []).map(familiar => ({
      ...familiar,
      nombre: familiar.persona?.split(' ')[0] || "",
      apellido: familiar.persona?.split(' ').slice(1).join(' ') || "",
      dni: "",
      cuil: "",
      email: "",
      fecha_nacimiento: "",
      edad: familiar.edad || "",
      sexo: "",
      nacionalidad: "Argentina",
      documentos: {
        dni_frente: null,
        dni_dorso: null,
        recibo_sueldo: null
      }
    })),
    documentos_titular: {
      dni_frente: null,
      dni_dorso: null,
      recibo_sueldo: null
    },
    referencias: [{ nombre: "", relacion: "", telefono: "" }],
    documentos: [],
    preferencias: {},
    saludTerminos: {
      respuestas: {},
      coberturaAnterior: {},
      medicacion: {},
      datosAdicionales: {}
    },
    documentos_subidos: [], // ❌ ELIMINAR si solo se usaba para temporales
  });

  // ✅ FUNCIÓN PARA ACTUALIZAR PÓLIZA TEMPORAL CUANDO CAMBIE EL FORMULARIO
  const actualizarPolizaTemporal = async (datosActualizados) => {
    if (!form.poliza_temp_id) return;

    try {
      const token = localStorage.getItem("token");
      
      await axios.put(
        `${API_URL}/polizas/${form.poliza_temp_id}/temporal`,
        {
          form: datosActualizados
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('✅ Póliza temporal actualizada');
    } catch (error) {
      console.error('❌ Error actualizando póliza temporal:', error);
    }
  };

  useEffect(() => {
    if (!show) return;
    const addCustomStyles = () => {
      const existingStyles = document.getElementById('poliza-form-styles');
      if (existingStyles) existingStyles.remove();
      const styleSheet = document.createElement('style');
      styleSheet.id = 'poliza-form-styles';
      styleSheet.textContent = `
        .poliza-modal .modal-dialog { max-width: 95% !important; height: 95vh !important; }
        .poliza-modal .modal-content { height: 100% !important; display: flex !important; flex-direction: column !important; }
        .poliza-modal .modal-body { flex: 1 !important; overflow: hidden !important; padding: 0 !important; }
        .bg-gradient-primary { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%) !important; }
        .form-control-lg:focus, .form-select:focus { border-color: #0056b3 !important; box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25) !important; }
        .poliza-card { transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; }
        .poliza-card:hover { transform: translateY(-2px); box-shadow: 0 4px 25px rgba(0, 0, 0, 0.1) !important; }
        .bg-info-light { background-color: rgba(13, 202, 240, 0.1) !important; }
        .progress-bar { transition: width 0.3s ease-in-out !important; }
        .poliza-modal .step-indicator { transition: all 0.3s ease-in-out; }
        .poliza-modal .step-indicator.active { transform: scale(1.1); }
        @media (max-width: 768px) {
          .poliza-modal .modal-dialog { max-width: 98% !important; height: 98vh !important; margin: 1% !important; }
          .poliza-modal .modal-footer { flex-direction: column !important; gap: 0.5rem !important; }
          .poliza-modal .modal-footer .d-flex { width: 100% !important; justify-content: center !important; }
        }
      `;
      document.head.appendChild(styleSheet);
    };
    addCustomStyles();
    return () => {
      const existingStyles = document.getElementById('poliza-form-styles');
      if (existingStyles) existingStyles.remove();
    };
  }, [show]);

  // Manejo de cambios
  const handleChange = (section, field, value) => {
    setForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Handler para cambios en datos personales
  const handlePersonalChange = (field, value) => {
    setForm(prev => {
      const newDatos = { ...prev.datos_personales, [field]: value };
      // Quitar el cálculo automático de edad aquí
      return { ...prev, datos_personales: newDatos };
    });
  };

  const handleNext = () => {
    if (step < etapas.length - 1 && validarPaso()) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleDeclaracionChange = (field, value, index = null, subField = null) => {
    setForm(prev => {
      const newDeclaracion = { ...prev.declaracion_jurada };
      let newIntegrantes = [...prev.integrantes];
      
      if (field === 'datos_fisicos') {
        if (subField === 'integrante') {
          newDeclaracion.datos_fisicos.integrantes[index] = {
            ...newDeclaracion.datos_fisicos.integrantes[index],
            [value.field]: value.value
          };
          
          // ✅ SINCRONIZAR: Si cambia nombre o apellido en declaración jurada, actualizar también en integrantes
          if (value.field === 'nombre' || value.field === 'apellido') {
            newIntegrantes[index] = {
              ...newIntegrantes[index],
              [value.field]: value.value
            };
          }
        } else {
          newDeclaracion.datos_fisicos[subField] = value;
        }
      } else if (field === 'preguntas') {
        newDeclaracion.preguntas[index][subField] = value;
      } else if (field === 'enfermedades') {
        if (newDeclaracion.enfermedades_seleccionadas.includes(value)) {
          newDeclaracion.enfermedades_seleccionadas = newDeclaracion.enfermedades_seleccionadas.filter(e => e !== value);
        } else {
          newDeclaracion.enfermedades_seleccionadas.push(value);
        }
      } else {
        newDeclaracion[field] = value;
      }
      return { ...prev, declaracion_jurada: newDeclaracion, integrantes: newIntegrantes };
    });
  };

  // Reemplazar la función handleFileUpload existente
  const handleFileUpload = (tipo, integranteIndex, file) => {
    setForm(prev => {
      if (integranteIndex !== null) {
        const newIntegrantes = [...prev.integrantes];
        if (!newIntegrantes[integranteIndex].documentos) newIntegrantes[integranteIndex].documentos = {};
        newIntegrantes[integranteIndex].documentos[tipo] = file;
        return { ...prev, integrantes: newIntegrantes };
      } else {
        return {
          ...prev,
          documentos_titular: { ...prev.documentos_titular, [tipo]: file }
        };
      }
    });
  };

  // Reemplazar la función handleRemoveFile existente
  const handleRemoveFile = (tipo, integranteIndex = null) => {
    setForm(prev => {
      if (integranteIndex !== null) {
        const newIntegrantes = [...prev.integrantes];
        if (newIntegrantes[integranteIndex]?.documentos) {
          delete newIntegrantes[integranteIndex].documentos[tipo];
        }
        return { ...prev, integrantes: newIntegrantes };
      } else {
        const newDocumentosTitular = { ...prev.documentos_titular };
        delete newDocumentosTitular[tipo];
        return { ...prev, documentos_titular: newDocumentosTitular };
      }
    });
  };

  const handleIntegranteChange = (index, field, value) => {
    setForm(prev => {
      const newIntegrantes = [...prev.integrantes];
      
      // Calcular edad automáticamente si cambia la fecha de nacimiento
      if (field === 'fecha_nacimiento') {
        const hoy = new Date();
        const nacimiento = new Date(value);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const m = hoy.getMonth() - nacimiento.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
          edad--;
        }
        newIntegrantes[index].edad = edad;
      }
      
      newIntegrantes[index][field] = value;
      return { ...prev, integrantes: newIntegrantes };
    });
  };

  const handleReferenciaChange = (index, field, value) => {
    setForm(prev => {
      const newReferencias = [...prev.referencias];
      newReferencias[index][field] = value;
      return { ...prev, referencias: newReferencias };
    });
  };

  const agregarReferencia = () => {
    if (form.referencias.length < 3) {
      setForm(prev => ({
        ...prev,
        referencias: [...prev.referencias, { nombre: "", relacion: "", telefono: "" }]
      }));
    }
  };

  const eliminarReferencia = (index) => {
    if (form.referencias.length > 1) {
      setForm(prev => ({
        ...prev,
        referencias: prev.referencias.filter((_, i) => i !== index)
      }));
    }
  };

  // ✅ Validaciones mejoradas
  const validarPaso = () => {
    switch (step) {
      case 0: // Datos Personales
        return PasoDatosPersonales.validarCamposCompletos(form.datos_personales, false);
      
      case 1: // Declaración Jurada
        return PasoDeclaracionJurada.validarCamposCompletos(form.declaracion_jurada, form.integrantes);
      
      case 2: // Integrantes y Documentos
        // Verificar documentos del titular
        const docsRequeridosTitular = ['dni_frente', 'dni_dorso'];
        const titularCompleto = docsRequeridosTitular.every(doc => 
          !!form.documentos_titular?.[doc]
        );

        const integrantesCompletos = form.integrantes.every(integrante => 
          docsRequeridosTitular.every(doc => 
            !!integrante.documentos?.[doc]
          )
        );
        
        return titularCompleto && integrantesCompletos;
      
      case 3: // Referencias
        return form.referencias.length >= 1 && 
               form.referencias.every(ref => 
                 ref.nombre?.trim() && ref.relacion?.trim() && ref.telefono?.trim()
               );
      
      case 4: // Salud y Términos
        return aceptaTerminos && Object.keys(form.saludTerminos?.respuestas || {}).length > 0;
      
      case 5: // Resumen Final
        return aceptaTerminos;
      
      default:
        return true;
    }
  };

  // ✅ Manejo de errores mejorado
  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < etapas.length - 1 && validarPaso()) {
      setStep(step + 1);
    }
    // No crear póliza aquí
  };

  // ✅ RenderStep con todos los casos
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <PasoDatosPersonales
            datosPersonales={form.datos_personales}
            handleChange={handlePersonalChange}
            opcionesEstadoCivil={opcionesEstadoCivil}
            opcionesNacionalidad={opcionesNacionalidad}
            opcionesCondicionIVA={opcionesCondicionIVA}
            opcionesTipoDomicilio={opcionesTipoDomicilio}
            cotizacion={cotizacion}
          />
        );
      
      case 1:
        return (
          <PasoDeclaracionJurada
            datosPersonales={form.datos_personales}
            declaracionJurada={form.declaracion_jurada}
            integrantes={form.integrantes}
            preguntasDeclaracionJurada={preguntasDeclaracionJurada}
            enfermedadesPatologias={enfermedadesPatologias}
            handleDeclaracionChange={handleDeclaracionChange}
          />
        );
      
      case 2:
        return (
          <PasoIntegrantesDocumentos
            integrantes={form.integrantes}
            documentosTitular={form.documentos_titular}
            datosPersonales={form.datos_personales}
            handleIntegranteChange={handleIntegranteChange}
            opcionesNacionalidad={opcionesNacionalidad}
            handleFileUpload={handleFileUpload}
            handleRemoveFile={handleRemoveFile}
          />
        );
      
      case 3:
        return (
          <PasoReferencias
            referencias={form.referencias}
            handleReferenciaChange={handleReferenciaChange}
            agregarReferencia={agregarReferencia}
            eliminarReferencia={eliminarReferencia}
          />
        );
      
      case 4:
        return (
          <PasoSaludTerminos
            saludTerminos={form.saludTerminos}
            setSaludTerminos={(data) => setForm(prev => ({ ...prev, saludTerminos: data }))}
            aceptaTerminos={aceptaTerminos}
            setAceptaTerminos={setAceptaTerminos}
            // ✅ PASAR DATOS NECESARIOS
            datosPersonales={form.datos_personales}
            integrantes={form.integrantes}
          />
        );
      
      case 5: // ✅ PASO RESUMEN FINAL
        return (
          <PasoResumen
            form={form}
            cotizacion={cotizacion}
            detallesCotizacion={cotizacion.detalles}
            prospecto={prospecto}
            aceptaTerminos={aceptaTerminos}
            setAceptaTerminos={setAceptaTerminos}
            onPolizaCreada={(poliza) => {
              console.log('🎯 PolizaForm: Póliza creada, ejecutando callback hacia ProspectoDetalle...', poliza);
              
              // No necesitamos limpiar el form aquí porque el modal se va a cerrar
              // Solo propagar el callback hacia arriba
              onPolizaCreada?.(poliza);
              
              // El onHide se manejará desde ProspectoDetalle después de actualizar el estado
              console.log('✅ PolizaForm: Callback propagado');
            }}
          />
        );
      
      default:
        return (
          <div className="text-center py-5">
            <h5>Error en el paso {step + 1}</h5>
            <p className="text-muted">Paso no reconocido.</p>
          </div>
        );
    }
  };

  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  if (!show) return null;

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      centered 
      backdrop="static" 
      className="poliza-modal"
    >
      <Modal.Header closeButton className="primary-300 text-white">
        <Modal.Title className="d-flex align-items-center">
          <ShieldCheck className="me-2" size={24} />
          Solicitud de Afiliación - COBER360
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        {/* Barra de progreso y encabezado */}
        <div className="bg-light p-3 border-bottom">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0 text-primary fw-bold">
              Paso {step + 1} de {etapas.length}: {etapas[step]}
            </h6>
            <Badge bg="primary" pill>
              {Math.round(((step + 1) / etapas.length) * 100)}% Completado
            </Badge>
          </div>
          <ProgressBar 
            now={((step + 1) / etapas.length) * 100} 
            variant="primary"
            style={{ height: '8px' }}
            className="mb-2"
          />
          {/* Indicadores de pasos */}
          <div className="d-flex justify-content-between">
            {etapas.map((etapa, index) => (
              <div key={index} className="text-center flex-fill">
                <div 
                  className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-1 ${
                    index <= step 
                      ? 'bg-primary text-white' 
                      : 'bg-light text-muted border'
                  }`}
                  style={{ width: '30px', height: '30px', fontSize: '12px' }}
                >
                  {index < step ? (
                    <CheckCircleFill size={16} />
                  ) : (
                    index + 1
                  )}
                </div>
                <div 
                  className={`small ${
                    index <= step ? 'text-primary fw-bold' : 'text-muted'
                  }`}
                  style={{ fontSize: '10px' }}
                >
                  {etapa.split(' ')[0]}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Contenido del paso */}
        <div ref={formRef} className="p-4" style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
          <Form onSubmit={handleSubmit}>
            {renderStep()}
          </Form>
        </div>
      </Modal.Body>
      <Modal.Footer className="bg-light border-top-0">
        <div className="d-flex justify-content-between w-100 align-items-center">
          <div className="text-muted small">
            <InfoCircleFill className="me-1" size={14} />
            {step === 0 && "Complete los datos personales básicos"}
            {step === 1 && "Responda la declaración jurada de salud"}
            {step === 2 && "Cargue documentos y datos de familiares"}
            {step === 3 && "Agregue referencias personales"}
            {step === 4 && "Acepte términos adicionales de salud"}
            {step === 5 && "Revise y confirme toda la información"}
          </div>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-secondary" 
              onClick={handlePrev} 
              disabled={step === 0}
              className="d-flex align-items-center"
            >
              <i className="bi bi-arrow-left me-1"></i> 
              Anterior
            </Button>
            {step < etapas.length - 1 && (
              <Button 
                variant="primary" 
                onClick={handleNext} 
                disabled={!validarPaso()}
                className="d-flex align-items-center"
              >
                Siguiente 
                <i className="bi bi-arrow-right ms-1"></i>
              </Button>
            )}
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

// ✅ SOLO EXPORT AL FINAL
export default PolizaForm;