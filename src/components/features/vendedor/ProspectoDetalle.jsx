import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, Row, Col, Card, Badge, Table, Button, Offcanvas, ListGroup, Spinner, OverlayTrigger, Tooltip, Modal, Form, Alert } from "react-bootstrap";
import { FaUserFriends, FaMoneyBillWave, FaUserCheck, FaChevronLeft, FaTachometerAlt, FaUserPlus, FaSignOutAlt, FaBars, FaArrowLeft, FaWhatsapp, FaEye, FaTimes, FaCreditCard, FaEdit, FaUser, FaCalendarAlt, FaPhone, FaEnvelope, FaMapMarkerAlt, FaFlag, FaComments } from "react-icons/fa";
import Swal from "sweetalert2";
import { API_URL } from "../../config";
import PromocionesModal from "./PromocionesModal";
import PolizaForm from "./PolizaForm";
import EnviarCotizacionModal from "./EnviarCotizacionModal";
import Ley19032Modal from "./Ley19032Modal";
import VendedorSidebar from "../../layout/VendedorSidebar"; // Importar el nuevo sidebar

const TIPO_AFILIACION = {
  1: "Particular/autónomo",
  2: "Con recibo de sueldo",
  3: "Monotributista",
};

const tiposAfiliacion = [
  { id: 1, etiqueta: "Particular/autónomo", requiere_sueldo: 0, requiere_categoria: 0 },
  { id: 2, etiqueta: "Con recibo de sueldo", requiere_sueldo: 1, requiere_categoria: 0 },
  { id: 3, etiqueta: "Monotributista", requiere_sueldo: 0, requiere_categoria: 1 }
];

const categoriasMonotributo = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "A exento", "B exento"
];

const vinculos = [
  { value: "pareja/conyuge", label: "Pareja/Conyuge" },
  { value: "hijo/a", label: "Hijo/a" },
  { value: "familiar a cargo", label: "Familiar a cargo" }
];

const ProspectoDetalle = () => {
  const { id } = useParams();
  const [prospecto, setProspecto] = useState(null);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPromocionesModal, setShowPromocionesModal] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [showPolizaForm, setShowPolizaForm] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [showEnviarCotizacion, setShowEnviarCotizacion] = useState(false);
  const [cotizacionParaEnviar, setCotizacionParaEnviar] = useState(null);
  const [showDetallesCotizacion, setShowDetallesCotizacion] = useState({});
  const [showLey19032Modal, setShowLey19032Modal] = useState(false);
  const [polizasGeneradas, setPolizasGeneradas] = useState([]);
  const [loadingPolizas, setLoadingPolizas] = useState(false);
  const [generandoCupon, setGenerandoCupon] = useState(false);
  const [cuponesGenerados, setCuponesGenerados] = useState({});
  const [showEditarProspectoModal, setShowEditarProspectoModal] = useState(false);
  const [prospectoEditando, setProspectoEditando] = useState(null);
  const [familiares, setFamiliares] = useState([]);
  const [editandoProspecto, setEditandoProspecto] = useState(false);
  const [localidades, setLocalidades] = useState([]);
  const [nuevoFamiliar, setNuevoFamiliar] = useState({
    vinculo: '',
    nombre: '',
    edad: '',
    tipo_afiliacion_id: '',
    sueldo_bruto: '',
    categoria_monotributo: ''
  });
  const [showAgregarFamiliar, setShowAgregarFamiliar] = useState(false);

  const navigate = useNavigate();  useEffect(() => {
    fetchProspecto();
    fetchCotizaciones();
    fetchPromociones();
    fetchPolizasGeneradas();
  }, [id]);

  // ✅ NUEVO: Actualizar cuando cambie el estado de pólizas generadas
  useEffect(() => {
    console.log('🔄 Estado de pólizas generadas actualizado:', polizasGeneradas.length);
  }, [polizasGeneradas]);

  const fetchProspecto = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/prospectos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProspecto(data);
    } catch (error) {
      console.error("Error al obtener el prospecto:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCotizaciones = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/lead/${id}/cotizaciones?detalles=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(data) && data.length > 0 && data[0].plan_nombre) {
        setCotizaciones(data);
      } else {
        const cotizacionesAgrupadas = data.reduce((acc, cotizacion) => {
          const planId = cotizacion.plan_id;
          if (!acc[planId]) {
            acc[planId] = {
              plan_nombre: cotizacion.plan_nombre,
              tipo_afiliacion_nombre: cotizacion.tipo_afiliacion_nombre,
              total_bruto: cotizacion.total_bruto,
              total_descuento_aporte: cotizacion.total_descuento_aporte || 0,
              total_descuento_promocion: cotizacion.total_descuento_promocion || 0,
              total_final: cotizacion.total_final,
              detalles: [],
            };
          }
          acc[planId].detalles.push({
            persona: cotizacion.persona,
            vinculo: cotizacion.vinculo,
            edad: cotizacion.edad,
            tipo_afiliacion_id: cotizacion.tipo_afiliacion_id,
            tipo_afiliacion: cotizacion.tipo_afiliacion_nombre || TIPO_AFILIACION[cotizacion.tipo_afiliacion_id],
            precio_base: cotizacion.precio_base,
            descuento_aporte: cotizacion.descuento_aporte,
            promocion_aplicada: cotizacion.promocion_aplicada,
            descuento_promocion: cotizacion.descuento_promocion,
            precio_final: cotizacion.precio_final,
          });
          return acc;
        }, {});

        setCotizaciones(Object.values(cotizacionesAgrupadas));
      }
    } catch (error) {
      console.error("Error al obtener las cotizaciones:", error);
    }
  };

  const fetchPromociones = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/vendedor/promociones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPromociones(data);
    } catch (error) {
      console.error("Error al obtener promociones:", error);
    }
  };

  const fetchPolizasGeneradas = async () => {
    try {
      setLoadingPolizas(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/polizas/prospecto/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // El backend devuelve { success: true, data: [] }
      const polizas = response.data.data || response.data || [];
      setPolizasGeneradas(polizas);
      
      console.log(`✅ Pólizas encontradas para prospecto ${id}:`, polizas.length);
      if (polizas.length > 0) {
        console.log('📋 Pólizas detalle:', polizas.map(p => ({
          id: p.id,
          numero_poliza: p.numero_poliza,
          cotizacion_id: p.cotizacion_id,
          plan_id: p.plan_id,
          plan_nombre: p.plan_nombre
        })));
      }
    } catch (error) {
      console.error("Error al obtener pólizas generadas:", error);
      // Si hay error, asumimos que no hay pólizas generadas
      setPolizasGeneradas([]);
    } finally {
      setLoadingPolizas(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // ✅ NUEVA: Función para enmascarar números de teléfono
  const maskPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, ''); // Remover caracteres no numéricos
    if (cleaned.length < 4) return phone; // Si es muy corto, devolver tal como está
    
    // Mostrar solo los últimos 4 dígitos
    const masked = '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
    
    // Mantener formato original si tiene caracteres especiales
    if (phone.includes('+')) {
      return `+${masked}`;
    } else if (phone.includes('-') || phone.includes(' ') || phone.includes('(')) {
      // Para formatos como (011) 1234-5678 o 011 1234-5678
      return `******${cleaned.slice(-4)}`;
    }
    
    return masked;
  };

  // ✅ NUEVA: Función para enmascarar correos electrónicos
  const maskEmail = (email) => {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    if (!domain) return email; // Si no tiene @, devolver tal como está
    
    if (localPart.length <= 2) {
      return `**@${domain}`;
    }
    
    // Mostrar los primeros 2 caracteres y enmascarar el resto hasta @
    const maskedLocal = localPart.substring(0, 2) + '*'.repeat(localPart.length - 2);
    return `${maskedLocal}@${domain}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleGenerarPoliza = (cotizacion) => {
    // Verificar si ya existe una póliza para esta cotización
    if (tienePolizaGenerada(cotizacion)) {
      // Buscar la póliza existente para mostrar información detallada
      const polizaExistente = polizasGeneradas.find(poliza => {
        return poliza.cotizacion_id === cotizacion.id || 
               (poliza.plan_id && poliza.plan_id === cotizacion.plan_id) ||
               (poliza.plan_nombre === cotizacion.plan_nombre && poliza.prospecto_id === parseInt(id));
      });
      
      Swal.fire({
        icon: 'info',
        title: 'Póliza ya generada',
        html: `
          <div class="text-start">
            <p>Ya existe una póliza generada para este plan:</p>
            <ul class="list-unstyled mt-3 mb-3">
              <li><strong>Plan:</strong> ${cotizacion.plan_nombre}</li>
              <li><strong>Número de póliza:</strong> ${polizaExistente?.numero_poliza || 'N/A'}</li>
              <li><strong>Estado:</strong> <span class="badge bg-success">Generada</span></li>
              ${polizaExistente?.created_at ? `<li><strong>Fecha:</strong> ${new Date(polizaExistente.created_at).toLocaleDateString()}</li>` : ''}
            </ul>
            <p class="text-muted small">No es posible generar otra póliza para la misma cotización.</p>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#0d6efd',
        footer: polizaExistente?.id ? 
          `<button id="btn-descargar-existente" class="btn btn-primary btn-sm">
            <i class="bi bi-download me-1"></i>Descargar PDF
          </button>` : '',
        didOpen: () => {
          // Agregar funcionalidad al botón de descarga si existe
          const btnDescargar = document.getElementById('btn-descargar-existente');
          if (btnDescargar && polizaExistente?.id) {
            btnDescargar.addEventListener('click', async () => {
              try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                  `${API_URL}/polizas/${polizaExistente.id}/pdf`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                  }
                );

                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `poliza-${polizaExistente.numero_poliza}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                
                Swal.close();
              } catch (error) {
                console.error('Error descargando PDF:', error);
                Swal.fire('Error', 'Error al descargar el PDF', 'error');
              }
            });
          }
        }
      });
      return;
    }

    // Si no hay póliza generada, proceder normalmente
    setCotizacionSeleccionada(cotizacion);
    setShowPolizaForm(true);
  };

  const handleEnviarCotizacion = (cotizacion) => {
    setCotizacionParaEnviar(cotizacion);
    setShowEnviarCotizacion(true);
  };



  // ✅ Cargar localidades cuando se abre el modal de edición
  useEffect(() => {
    if (showEditarProspectoModal) {
      const fetchLocalidades = async () => {
        try {
          const response = await axios.get(`${API_URL}/localidades/buenos-aires`);
          setLocalidades(response.data);
        } catch (error) {
          console.error('Error cargando localidades:', error);
          setLocalidades([]);
        }
      };
      fetchLocalidades();
    }
  }, [showEditarProspectoModal]);

  // ✅ NUEVA: Función para abrir modal de edición de prospecto
  const handleEditarProspecto = () => {
    setProspectoEditando({
      ...prospecto,
      familiares: prospecto.familiares || []
    });
    setFamiliares(prospecto.familiares || []);
    setNuevoFamiliar({
      vinculo: '',
      nombre: '',
      edad: '',
      tipo_afiliacion_id: '',
      sueldo_bruto: '',
      categoria_monotributo: ''
    });
    setShowAgregarFamiliar(false);
    setShowEditarProspectoModal(true);
  };

  // ✅ NUEVA: Función para agregar familiar
  const handleAgregarFamiliar = () => {
    // Validar campos obligatorios
    if (!nuevoFamiliar.vinculo || !nuevoFamiliar.nombre || !nuevoFamiliar.edad) {
      Swal.fire('Error', 'Vínculo, nombre y edad son obligatorios', 'error');
      return;
    }

    // Validar tipo de afiliación SOLO para pareja/conyuge
    if (nuevoFamiliar.vinculo === 'pareja/conyuge' && !nuevoFamiliar.tipo_afiliacion_id) {
      Swal.fire('Error', 'El tipo de afiliación es obligatorio para pareja/cónyuge', 'error');
      return;
    }

    // Agregar familiar a la lista
    const familiarCompleto = {
      ...nuevoFamiliar,
      edad: Number(nuevoFamiliar.edad),
      tipo_afiliacion_id: nuevoFamiliar.tipo_afiliacion_id ? Number(nuevoFamiliar.tipo_afiliacion_id) : null,
      sueldo_bruto: nuevoFamiliar.sueldo_bruto ? Number(nuevoFamiliar.sueldo_bruto) : null
    };

    setFamiliares([...familiares, familiarCompleto]);

    // Resetear formulario
    setNuevoFamiliar({
      vinculo: '',
      nombre: '',
      edad: '',
      tipo_afiliacion_id: '',
      sueldo_bruto: '',
      categoria_monotributo: ''
    });
    setShowAgregarFamiliar(false);
  };

  // ✅ NUEVA: Función para eliminar familiar
  const handleEliminarFamiliar = (index) => {
    Swal.fire({
      title: '¿Eliminar familiar?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setFamiliares(familiares.filter((_, i) => i !== index));
        Swal.fire('Eliminado', 'El familiar ha sido eliminado', 'success');
      }
    });
  };

  // ✅ NUEVA: Función para guardar cambios del prospecto
  const handleGuardarProspectoEditado = async () => {
    try {
      setEditandoProspecto(true);
      
      // ✅ BLOQUEAR SI HAY PÓLIZAS GENERADAS
      if (polizasGeneradas.length > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No se puede editar',
          text: `No se puede editar el prospecto mientras haya ${polizasGeneradas.length} póliza(s) generada(s). Si desea realizar cambios, debe eliminar las pólizas primero.`,
          confirmButtonText: 'Entendido'
        });
        setEditandoProspecto(false);
        return;
      }

      const token = localStorage.getItem('token');
      
      // Validar datos
      if (!prospectoEditando.nombre || !prospectoEditando.apellido || !prospectoEditando.edad) {
        Swal.fire('Error', 'Nombre, apellido y edad son obligatorios', 'error');
        return;
      }

      // Actualizar prospecto
      await axios.put(
        `${API_URL}/prospectos/${id}`,
        {
          ...prospectoEditando,
          familiares: familiares
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Recotizar automáticamente si cambió edad, tipo_afiliacion_id o familiares
      const camposQueAfectanCotizacion = [
        'edad',
        'tipo_afiliacion_id',
        'sueldo_bruto',
        'categoria_monotributo'
      ];

      const debeRecotizar = camposQueAfectanCotizacion.some(
        campo => prospectoEditando[campo] !== prospecto[campo]
      ) || JSON.stringify(familiares) !== JSON.stringify(prospecto.familiares || []);

      if (debeRecotizar) {
        await axios.post(
          `${API_URL}/prospectos/${id}/recotizar`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        Swal.fire({
          icon: 'success',
          title: 'Prospecto actualizado',
          text: 'Los datos han sido actualizados y se ha recotizado automáticamente',
          timer: 3000
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Prospecto actualizado',
          text: 'Los datos han sido actualizados correctamente',
          timer: 2000
        });
      }

      setShowEditarProspectoModal(false);
      
      // Recargar datos
      await fetchProspecto();
      await fetchCotizaciones();
    } catch (error) {
      console.error('Error al actualizar prospecto:', error);
      Swal.fire('Error', error.response?.data?.message || 'No se pudo actualizar el prospecto', 'error');
    } finally {
      setEditandoProspecto(false);
    }
  };

  const handleGenerarCuponPago = async (cotizacion) => {
    // Obtener el número de teléfono desde el formulario
    const telefonoInicial = prospecto?.numero_contacto || '';
    
    // Mostrar SweetAlert con opciones de configuración
    const { value: formValues, dismiss } = await Swal.fire({
      title: 'Generar Cupón de Pago',
      html: `
        <div class="text-start">
          <div class="mb-3">
            <label for="swal-input-telefono" class="form-label">Número de WhatsApp</label>
            <input 
              id="swal-input-telefono" 
              class="swal2-input" 
              placeholder="Ej: +5491123456789" 
              value="${telefonoInicial}" 
            />
          </div>
          <div class="mb-3">
            <label for="swal-input-vencimiento" class="form-label">Días de vencimiento</label>
            <select id="swal-input-vencimiento" class="swal2-select">
              <option value="3">3 días</option>
              <option value="7" selected>7 días</option>
              <option value="15">15 días</option>
              <option value="30">30 días</option>
            </select>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="swal-checkbox-whatsapp" checked>
            <label class="form-check-label" for="swal-checkbox-whatsapp">
              Enviar automáticamente por WhatsApp
            </label>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Generar Cupón',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      preConfirm: () => {
        const telefono = document.getElementById('swal-input-telefono').value.trim();
        const vencimiento = document.getElementById('swal-input-vencimiento').value;
        const enviarWhatsApp = document.getElementById('swal-checkbox-whatsapp').checked;
        
        if (enviarWhatsApp && !telefono) {
          Swal.showValidationMessage('Por favor ingrese un número de WhatsApp');
          return false;
        }
        
        return { telefono, vencimiento, enviarWhatsApp };
      }
    });

    if (!formValues || dismiss === Swal.DismissReason.cancel) {
      return;
    }

    setGenerandoCupon(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `https://wspflows.cober.online/cupones-pago/cotizacion/${cotizacion.id}`,
        {
          telefono: formValues.enviarWhatsApp ? formValues.telefono : null,
          vencimiento_dias: parseInt(formValues.vencimiento),
          enviar_whatsapp: formValues.enviarWhatsApp,
          metodos_pago: ['credit_card', 'debit_card', 'account_money', 'ticket']
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const cuponData = response.data.data;

      // Guardar el cupón generado en el estado
      setCuponesGenerados(prev => ({
        ...prev,
        [cotizacion.id]: cuponData
      }));

      // Mostrar resultado exitoso
      Swal.fire({
        title: '¡Cupón de pago generado!',
        html: `
          <div class="text-center">
            <div class="mb-3">
              <i class="fas fa-credit-card text-success" style="font-size: 3rem;"></i>
            </div>
            <p><strong>Plan:</strong> ${cotizacion.plan_nombre}</p>
            <p><strong>Total:</strong> ${formatCurrency(cuponData.total)}</p>
            <p><strong>Vence:</strong> ${new Date(cuponData.fecha_vencimiento).toLocaleDateString()}</p>
            ${formValues.enviarWhatsApp && cuponData.whatsapp_enviado 
              ? '<p class="text-success"><i class="fab fa-whatsapp"></i> Enviado por WhatsApp</p>' 
              : ''}
            
            <div class="d-grid gap-2 mt-3">
              <button id="btn-abrir-pago" class="btn btn-primary btn-lg">
                <i class="fas fa-external-link-alt me-2"></i>Abrir Enlace de Pago
              </button>
              <button id="btn-copiar-link" class="btn btn-outline-primary">
                <i class="fas fa-copy me-2"></i>Copiar Link de Pago
              </button>
              ${!formValues.enviarWhatsApp || !cuponData.whatsapp_enviado ? `
                <button id="btn-enviar-whatsapp" class="btn btn-success">
                  <i class="fab fa-whatsapp me-2"></i>Enviar por WhatsApp
                </button>
              ` : ''}
            </div>
          </div>
        `,
        icon: 'success',
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Cerrar',
        didOpen: () => {
          // Función para detectar dispositivos móviles
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          // Abrir enlace de pago
          document.getElementById('btn-abrir-pago')?.addEventListener('click', () => {
            if (isMobile) {
              // En móviles, intentar abrir en el navegador del sistema
              const link = document.createElement('a');
              link.href = cuponData.checkout_url;
              link.target = '_system'; // Para Cordova/PhoneGap
              link.rel = 'noopener noreferrer';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              // También intentar con window.open con configuraciones especiales
              setTimeout(() => {
                window.open(cuponData.checkout_url, '_blank', 'location=yes,hidden=no,clearcache=yes,clearsessioncache=yes');
              }, 100);
            } else {
              // En desktop, abrir normalmente
              window.open(cuponData.checkout_url, '_blank');
            }
          });
          
          // Copiar link
          document.getElementById('btn-copiar-link')?.addEventListener('click', () => {
            navigator.clipboard.writeText(cuponData.checkout_url);
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Link copiado al portapapeles',
              showConfirmButton: false,
              timer: 2000
            });
          });

          // Enviar por WhatsApp
          document.getElementById('btn-enviar-whatsapp')?.addEventListener('click', async () => {
            const { value: telefono } = await Swal.fire({
              title: 'Enviar por WhatsApp',
              input: 'text',
              inputLabel: 'Número de WhatsApp',
              inputValue: formValues.telefono || telefonoInicial,
              inputPlaceholder: 'Ej: +5491123456789',
              showCancelButton: true
            });

            if (telefono) {
              try {
                await axios.post(
                  `${API_URL}/cupones-pago/${cuponData.cupon_id}/reenviar-whatsapp`,
                  { telefono },
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                Swal.fire('¡Enviado!', 'Cupón enviado por WhatsApp exitosamente', 'success');
              } catch (error) {
                Swal.fire('Error', 'Error enviando por WhatsApp', 'error');
              }
            }
          });
        }
      });

    } catch (error) {
      console.error('Error generando cupón de pago:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Error al generar cupón de pago',
        icon: 'error'
      });
    } finally {
      setGenerandoCupon(false);
    }
  };

  const toggleDetallesCotizacion = (index) => {
    setShowDetallesCotizacion(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const tieneReciboSueldo = () => {
    return cotizaciones.some(cotizacion => 
      cotizacion.detalles && cotizacion.detalles.some(detalle => 
        detalle.tipo_afiliacion_id === 2
      )
    );
  };

  // ✅ NUEVA: Obtener integrantes con recibo de sueldo (tipo_afiliacion_id === 2) - MEJORADO CON DEDUPLICACIÓN
  const getIntegrantesConReciboSueldo = () => {
    const integrantesUnicos = {};
    
    cotizaciones.forEach(cotizacion => {
      if (cotizacion.detalles && Array.isArray(cotizacion.detalles)) {
        cotizacion.detalles.forEach(detalle => {
          // Solo procesar integrantes con recibo de sueldo (tipo_afiliacion_id === 2)
          if (detalle.tipo_afiliacion_id === 2) {
            // Crear identificador único: si no tiene nombre, usar persona
            const nombreCompleto = (detalle.nombre || detalle.persona || '').trim();
            const vinculoNormalizado = (detalle.vinculo || '').trim().toLowerCase();
            const identificador = `${vinculoNormalizado}|${nombreCompleto}`;
            
            // Solo guardar si no existe o actualizar si hay mejor información
            if (!integrantesUnicos[identificador]) {
              integrantesUnicos[identificador] = {
                nombre: nombreCompleto,
                vinculo: detalle.vinculo,
                edad: detalle.edad,
                persona: detalle.persona
              };
            }
          }
        });
      }
    });
    
    // Convertir objeto a array
    return Object.values(integrantesUnicos);
  };

  const getPlanColorClass = (planNombre) => {
    if (!planNombre) return "";
    const nombre = planNombre.toLowerCase();
    if (nombre.includes("classic")) return "cotizacion-plan-classic";
    if (nombre.includes("taylored")) return "cotizacion-plan-taylored";
    if (nombre.includes("wagon")) return "cotizacion-plan-wagon";
    if (nombre.includes("cober x")) return "cotizacion-plan-coberx";
    return "";
  };

  const tienePolizaGenerada = (cotizacion) => {
    if (!polizasGeneradas || polizasGeneradas.length === 0) {
      return false;
    }
    
    return polizasGeneradas.some(poliza => {
      // Verificar por ID de cotización
      if (poliza.cotizacion_id && cotizacion.id && poliza.cotizacion_id === cotizacion.id) {
        return true;
      }
      
      // Verificar por plan_id como fallback
      if (poliza.plan_id && cotizacion.plan_id && poliza.plan_id === cotizacion.plan_id) {
        return true;
      }
      
      // Verificar por nombre del plan y detalles similares (fallback adicional)
      if (poliza.plan_nombre && cotizacion.plan_nombre && 
          poliza.plan_nombre === cotizacion.plan_nombre &&
          poliza.prospecto_id === parseInt(id)) {
        return true;
      }
      
      return false;
    });
  };

  // Sidebar content - Reemplazar el drawerContent existente
  const drawerContent = (
    <VendedorSidebar 
      vista="prospectos"
      setVista={(nuevaVista) => {
        if (nuevaVista === "polizas") {
          navigate('/prospectos', { state: { vista: 'polizas' } });
        } else if (nuevaVista === "whatsapp") {
          navigate('/prospectos', { state: { vista: 'whatsapp' } });
        } else if (nuevaVista === "prospectos") {
          navigate('/prospectos');
        }
      }}
      onNuevoProspecto={() => navigate('/prospectos/nuevo')}
      onCloseDrawer={() => setOpenDrawer(false)}
    />
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary" />
          <div className="mt-2">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!prospecto) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <h4>Prospecto no encontrado</h4>
          <Link to="/prospectos" className="btn btn-primary mt-3">
            <FaArrowLeft className="me-2" /> Volver a Prospectos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Layout para Desktop */}
      <div className="d-none d-lg-flex min-vh-100" style={{ background: "#f8fafc" }}>
        {/* Sidebar fijo */}
        <div className="bg-white border-end shadow-sm" style={{ width: 280, minHeight: "100vh", position: "fixed", zIndex: 1030 }}>
          {drawerContent}
        </div>
        
        {/* Contenido principal */}
        <div style={{ flex: 1, marginLeft: 280 }}>
          {/* Header */}
          <div className="bg-white border-bottom px-4 py-3 shadow-sm">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <Link to="/prospectos" className="btn btn-outline-secondary me-3">
                  <FaArrowLeft className="me-1" /> Volver
                </Link>
                <div>
                  <h4 className="mb-0">Detalle del Prospecto</h4>
                  <small className="text-muted">{prospecto.nombre} {prospecto.apellido}</small>
                </div>
              </div>
              <div className="d-flex gap-2">
                <OverlayTrigger
                  placement="bottom"
                  overlay={
                    <Tooltip>
                      {polizasGeneradas.length > 0 
                        ? "No se puede aplicar promoción con póliza(s) generada(s)" 
                        : "Aplicar promoción a las cotizaciones"}
                    </Tooltip>
                  }
                >
                  <span className="d-inline-block">
                    <Button 
                      variant="success" 
                      onClick={() => setShowPromocionesModal(true)}
                      disabled={polizasGeneradas.length > 0}
                    >
                      <FaMoneyBillWave className="me-1" /> Aplicar Promoción
                    </Button>
                  </span>
                </OverlayTrigger>
                {tieneReciboSueldo() && (
                  <OverlayTrigger
                    placement="bottom"
                    overlay={
                      <Tooltip>
                        {polizasGeneradas.length > 0 
                          ? "No se puede aplicar Ley 19032 con póliza(s) generada(s)" 
                          : "Aplicar Ley 19032 a integrantes con recibo de sueldo"}
                      </Tooltip>
                    }
                  >
                    <span className="d-inline-block">
                      <Button 
                        variant="info" 
                        onClick={() => setShowLey19032Modal(true)}
                        disabled={polizasGeneradas.length > 0}
                      >
                        <FaUserCheck className="me-1" /> Ley 19032
                      </Button>
                    </span>
                  </OverlayTrigger>
                )}
              </div>
            </div>
          </div>

          {/* Contenido */}
          <Container fluid className="p-4">
            <Row className="g-4">
              {/* Información del prospecto y familiares en desktop */}
              <Col lg={12}>
                {/* Información del prospecto */}
                <Card className="shadow-sm mb-4 card-gradient-header">
                  <Card.Header className=" text-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Información del Prospecto</h5>
                      <div className="d-flex gap-2">
                        <OverlayTrigger
                          placement="bottom"
                          overlay={
                            <Tooltip>
                              {polizasGeneradas.length > 0 
                                ? "No se puede editar el prospecto con póliza(s) generada(s)" 
                                : "Editar datos del prospecto"}
                            </Tooltip>
                          }
                        >
                          <span className="d-inline-block">
                            <Button 
                              onClick={handleEditarProspecto}
                              disabled={polizasGeneradas.length > 0}
                              style={{
                                backgroundColor: 'white',
                                color: '#0d6efd',
                                border: '2px solid #0d6efd',
                                fontWeight: 'bold'
                              }}
                              className="d-flex align-items-center"
                            >
                              <FaEdit className="me-1" /> Editar
                            </Button>
                          </span>
                        </OverlayTrigger>
                        {polizasGeneradas.length > 0 && (
                          <Badge bg="success" className="ms-2 align-self-center">
                            {polizasGeneradas.length} Póliza{polizasGeneradas.length > 1 ? 's' : ''} Generada{polizasGeneradas.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-3">
                      <Col lg={4} md={6} sm={6} style={{ borderRight: '1px solid #e0e0e0', paddingRight: '20px' }}>
                        <div className="d-flex align-items-center mb-2">
                          <FaUser className="me-2" style={{ color: '#666' }} />
                          <strong>Nombre:</strong>
                        </div>
                        <span className="ps-4">{prospecto.nombre} {prospecto.apellido}</span>
                      </Col>
                      <Col lg={4} md={6} sm={6} style={{ borderRight: '1px solid #e0e0e0', paddingRight: '20px' }}>
                        <div className="d-flex align-items-center mb-2">
                          <FaCalendarAlt className="me-2" style={{ color: '#666' }} />
                          <strong>Edad:</strong>
                        </div>
                        <span className="ps-4">{prospecto.edad} años</span>
                      </Col>
                      <Col lg={4} md={6} sm={6} style={{ paddingRight: '20px' }}>
                        <div className="d-flex align-items-center mb-2">
                          <FaPhone className="me-2" style={{ color: '#666' }} />
                          <strong>Contacto:</strong>
                        </div>
                        <span className="ps-4">{maskPhoneNumber(prospecto.numero_contacto)}</span>
                      </Col>
                      <Col lg={4} md={6} sm={6} style={{ borderRight: '1px solid #e0e0e0', paddingRight: '20px', borderTop: '1px solid #e0e0e0', paddingTop: '20px', marginTop: '10px' }}>
                        <div className="d-flex align-items-center mb-2">
                          <FaEnvelope className="me-2" style={{ color: '#666' }} />
                          <strong>Email:</strong>
                        </div>
                        <span className="ps-4">{maskEmail(prospecto.correo)}</span>
                      </Col>
                      <Col lg={4} md={6} sm={6} style={{ borderRight: '1px solid #e0e0e0', paddingRight: '20px', borderTop: '1px solid #e0e0e0', paddingTop: '20px', marginTop: '10px' }}>
                        <div className="d-flex align-items-center mb-2">
                          <FaMapMarkerAlt className="me-2" style={{ color: '#666' }} />
                          <strong>Localidad:</strong>
                        </div>
                        <span className="ps-4">{prospecto.localidad}</span>
                      </Col>
                      <Col lg={4} md={6} sm={6} style={{ borderRight: '1px solid #e0e0e0', paddingRight: '20px', borderTop: '1px solid #e0e0e0', paddingTop: '20px', marginTop: '10px' }}>
                        <div className="d-flex align-items-center mb-2">
                          <FaFlag className="me-2" style={{ color: '#666' }} />
                          <strong>Tipo Afiliación:</strong>
                        </div>
                        <div className="ps-4">
                          {prospecto.tipo_afiliacion_id ? (
                            <Badge bg="info">{TIPO_AFILIACION[prospecto.tipo_afiliacion_id] || prospecto.tipo_afiliacion_id}</Badge>
                          ) : (
                            <span className="text-muted">Sin especificar</span>
                          )}
                        </div>
                      </Col>
                      {prospecto.tipo_afiliacion_id === 3 && (
                        <Col lg={4} md={6} sm={6} style={{ borderRight: '1px solid #e0e0e0', paddingRight: '20px', borderTop: '1px solid #e0e0e0', paddingTop: '20px', marginTop: '10px' }}>
                          <div className="d-flex align-items-center mb-2">
                            <FaFlag className="me-2" style={{ color: '#666' }} />
                            <strong>Categoría Monotributo:</strong>
                          </div>
                          <div className="ps-4">
                            {prospecto.categoria_monotributo ? (
                              <Badge bg="warning" className="text-dark">{prospecto.categoria_monotributo}</Badge>
                            ) : (
                              <span className="text-muted">Sin especificar</span>
                            )}
                          </div>
                        </Col>
                      )}
                      {prospecto.tipo_afiliacion_id === 2 && (
                        <Col lg={4} md={6} sm={6} style={{ borderRight: '1px solid #e0e0e0', paddingRight: '20px', borderTop: '1px solid #e0e0e0', paddingTop: '20px', marginTop: '10px' }}>
                          <div className="d-flex align-items-center mb-2">
                            <FaMoneyBillWave className="me-2" style={{ color: '#666' }} />
                            <strong>Sueldo Bruto:</strong>
                          </div>
                          <div className="ps-4">
                            {prospecto.sueldo_bruto ? (
                              <Badge bg="success">{formatCurrency(prospecto.sueldo_bruto)}</Badge>
                            ) : (
                              <span className="text-muted">Sin especificar</span>
                            )}
                          </div>
                        </Col>
                      )}
                      <Col lg={4} md={6} sm={6} style={{ borderTop: '1px solid #e0e0e0', paddingTop: '20px', marginTop: '10px' }}>
                        <div className="d-flex align-items-center mb-2">
                          <FaFlag className="me-2" style={{ color: '#666' }} />
                          <strong>Estado:</strong>
                        </div>
                        <div className="ps-4">
                          <Badge bg="primary">{prospecto.estado}</Badge>
                        </div>
                      </Col>
                      <Col xs={12} style={{ borderTop: '1px solid #e0e0e0', paddingTop: '20px', marginTop: '10px' }}>
                        <div className="d-flex align-items-center mb-2">
                          <FaComments className="me-2" style={{ color: '#666' }} />
                          <strong>Comentario:</strong>
                        </div>
                        <span className="ps-4">{prospecto.comentario || "Sin comentario"}</span>
                      </Col>
                    </Row>
                  </Card.Body>
                   {/* Familiares */}
                <Card className="shadow-sm card-no-border">
                  <Card.Header className="text-white">
                    <h5 className="mb-0"><FaUserFriends className="me-2" />Familiares</h5>
                  </Card.Header>
                  <Card.Body>
                    {prospecto.familiares && prospecto.familiares.length > 0 ? (
                      prospecto.familiares.map((familiar, idx) => (
                        <Card key={idx} className="mb-3 ">
                          <Card.Body className="py-2">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <strong>{familiar.vinculo}: {familiar.nombre}</strong>
                              <Badge bg="secondary">{familiar.edad} años</Badge>
                            </div>
                            <div className="d-flex flex-wrap gap-2">
                              {familiar.tipo_afiliacion_id && (
                                <Badge bg="info" className="small">
                                  {TIPO_AFILIACION[familiar.tipo_afiliacion_id] || familiar.tipo_afiliacion_id}
                                </Badge>
                              )}
                              {familiar.sueldo_bruto && (
                                <Badge bg="success" className="small">
                                  Sueldo: {formatCurrency(familiar.sueldo_bruto)}
                                </Badge>
                              )}
                              {familiar.categoria_monotributo && (
                                <Badge bg="warning" className="small">
                                  Monotributo: {familiar.categoria_monotributo}
                                </Badge>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      ))
                    ) : (
                      <div className="text-muted text-center py-3">Sin familiares registrados</div>
                    )}
                  </Card.Body>
                </Card>
                </Card>              
              </Col>

              {/* Cotizaciones y promociones */}
              <Col lg={12}>
                {/* Cotizaciones */}
                <Card className="shadow-sm mb-4 card-no-border">
                  <Card.Header className=" text-white">
                    <h5 className="mb-0"><FaMoneyBillWave className="me-2" />Cotizaciones</h5>
                  </Card.Header>
                  <Card.Body>
                    {cotizaciones.length === 0 ? (
                      <div className="text-muted text-center py-3 ">Sin cotizaciones disponibles</div>
                    ) : (
                      <div className="gap-3">
                        {cotizaciones.map((cotizacion, index) => (
                          <Card key={cotizacion.id} className="mb-4 shadow-sm border-0 cotizacion-card">
                            <Card.Header className={`d-flex justify-content-between align-items-center text-white  ${getPlanColorClass(cotizacion.plan_nombre)}`}>
                              <div>
                                <div className="d-flex align-items-center gap-2">
                                  <h6 className="mb-0 fw-bold">{cotizacion.plan_nombre}</h6>
                                  {tienePolizaGenerada(cotizacion) && (
                                    <Badge bg="success" className="small">
                                      <FaUserCheck className="me-1" />
                                      Póliza Generada
                                    </Badge>
                                  )}
                                </div>
                                <small className="text-black-50">Año: {cotizacion.anio}</small>
                              </div>
                              <div className="text-end">
                                <span className="fw-bold fs-5 text-success">{formatCurrency(cotizacion.total_final)}</span>
                                <br />
                                <small className="text-black-50">Total Final</small>
                              </div>
                            </Card.Header>
                            <Card.Body>
                              <Row className="mb-2">
                                <Col xs={6} md={3}>
                                  <div className="text-muted small">Precio lista</div>
                                  <div className="fw-bold text-info">{formatCurrency(cotizacion.total_bruto)}</div>
                                </Col>
                                <Col xs={6} md={3}>
                                  <div className="text-muted small">Descuento</div>
                                  <div className="fw-bold text-warning">{formatCurrency(parseFloat(cotizacion.total_descuento_aporte) + parseFloat(cotizacion.total_descuento_promocion))}</div>
                                </Col>
                                <Col xs={6} md={3}>
                                  <div className="text-muted small">Personas</div>
                                  <div className="fw-bold">{cotizacion.detalles.length}</div>
                                </Col>
                                <Col xs={6} md={3}>
                                  <div className="text-muted small">Fecha</div>
                                  <div className="fw-bold">{new Date(cotizacion.fecha).toLocaleDateString()}</div>
                                </Col>
                              </Row>
                              <div className="d-flex gap-2 mb-2">
                                <OverlayTrigger
                                  placement="top"
                                  overlay={
                                    <Tooltip>
                                      {loadingPolizas 
                                        ? "Verificando pólizas existentes..." 
                                        : tienePolizaGenerada(cotizacion) 
                                          ? "Esta cotización ya tiene una póliza generada" 
                                          : "Generar póliza para esta cotización"
                                      }
                                    </Tooltip>
                                  }
                                >
                                  <span className="d-inline-block">
                                    <Button
                                      variant={tienePolizaGenerada(cotizacion) ? "success" : "primary"}
                                      size="sm"
                                      onClick={() => tienePolizaGenerada(cotizacion) ? null : handleGenerarPoliza(cotizacion)}
                                      disabled={tienePolizaGenerada(cotizacion) || loadingPolizas}
                                      style={tienePolizaGenerada(cotizacion) || loadingPolizas ? { pointerEvents: 'none' } : {}}
                                    >
                                      {loadingPolizas ? (
                                        <>
                                          <Spinner animation="border" size="sm" className="me-1" />
                                          Verificando...
                                        </>
                                      ) : tienePolizaGenerada(cotizacion) ? (
                                        <>
                                          <FaUserCheck className="me-1" />
                                          Póliza Generada
                                        </>
                                      ) : (
                                        "Generar Póliza"
                                      )}
                                    </Button>
                                  </span>
                                </OverlayTrigger>
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleEnviarCotizacion(cotizacion)}
                                >
                                  <FaWhatsapp className="me-1" />
                                  Enviar
                                </Button>
                                {/* <Button
                                  variant="warning"
                                  size="sm"
                                  onClick={() => handleGenerarCuponPago(cotizacion)}
                                  disabled={generandoCupon}
                                >
                                  {generandoCupon ? (
                                    <>
                                      <Spinner animation="border" size="sm" className="me-1" />
                                      Generando...
                                    </>
                                  ) : (
                                    <>
                                      <FaCreditCard className="me-1" />
                                      Cupón Pago
                                    </>
                                  )}
                                </Button> */}
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => toggleDetallesCotizacion(index)}
                                >
                                  <FaEye className="me-1" />
                                  {showDetallesCotizacion[index] ? 'Ocultar' : 'Ver'} Detalles
                                </Button>
                              </div>
                              {showDetallesCotizacion[index] && (
                                <div className="mt-3 border-top pt-3">
                                  {/* Vista de escritorio - Tabla */}
                                  <div className="d-none d-lg-block">
                                    <Table size="sm" responsive className="mb-0 table-striped align-middle">
                                      <thead>
                                        <tr>
                                          <th>Persona</th>
                                          <th>Vínculo</th>
                                          <th>Edad</th>
                                          <th>Tipo Afiliación</th>
                                          <th>Base</th>
                                          <th>Desc. Aporte</th>
                                          <th>Desc. Promoción</th>
                                          <th>Promoción</th>
                                          <th>Final</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {cotizacion.detalles.map((detalle, idx) => (
                                          <tr key={detalle.id || idx}>
                                            <td>{detalle.persona}</td>
                                            <td>{detalle.vinculo}</td>
                                            <td>{detalle.edad}</td>
                                            <td>{TIPO_AFILIACION[detalle.tipo_afiliacion_id] || detalle.tipo_afiliacion || 'No especificado'}</td>
                                            <td>{formatCurrency(detalle.precio_base)}</td>
                                            <td>
                                              {formatCurrency(detalle.descuento_aporte)}
                                              {parseFloat(detalle.descuento_aporte) > 0 && (
                                                <span className="badge bg-info ms-1">Aporte</span>
                                              )}
                                            </td>
                                            <td>
                                              {formatCurrency(detalle.descuento_promocion)}
                                              {parseFloat(detalle.descuento_promocion) > 0 && (
                                                <span className="badge bg-warning text-dark ms-1">Promoción</span>
                                              )}
                                            </td>
                                            <td>
                                              {detalle.promocion_aplicada
                                                ? <span className="badge bg-warning text-dark">{detalle.promocion_aplicada}</span>
                                                : <span className="text-muted small">Sin promoción</span>
                                              }
                                            </td>
                                            <td className="fw-bold text-success">{formatCurrency(detalle.precio_final)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </Table>
                                  </div>

                                  {/* Vista móvil - Cards */}
                                  <div className="d-lg-none">
                                    {cotizacion.detalles.map((detalle, idx) => (
                                      <Card key={detalle.id || idx} className="mb-2 border-start border-primary border-3">
                                        <Card.Body className="p-2">
                                          <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                              <h6 className="mb-0 fw-bold">{detalle.persona}</h6>
                                              <Badge bg="secondary" className="small">{detalle.vinculo}</Badge>
                                            </div>
                                            <Badge bg="info">{detalle.edad} años</Badge>
                                          </div>
                                          
                                          <Row className="g-2 mb-2">
                                            <Col xs={6}>
                                              <div className="small text-muted">Tipo Afiliación</div>
                                              <div className="fw-bold small">{TIPO_AFILIACION[detalle.tipo_afiliacion_id] || detalle.tipo_afiliacion || 'No especificado'}</div>
                                            </Col>
                                            <Col xs={6}>
                                              <div className="small text-muted">Precio Base</div>
                                              <div className="fw-bold small text-primary">{formatCurrency(detalle.precio_base)}</div>
                                            </Col>
                                          </Row>

                                          <Row className="g-2 mb-2">
                                            <Col xs={6}>
                                              <div className="small text-muted">Desc. Aporte</div>
                                              <div className="fw-bold small text-info">
                                                {formatCurrency(detalle.descuento_aporte)}
                                                {parseFloat(detalle.descuento_aporte || 0) > 0 && (
                                                  <Badge bg="info" className="ms-1 small">Aporte</Badge>
                                                )}
                                              </div>
                                            </Col>
                                            <Col xs={6}>
                                              <div className="small text-muted">Desc. Promoción</div>
                                              <div className="fw-bold small text-warning">
                                                {formatCurrency(detalle.descuento_promocion)}
                                                {parseFloat(detalle.descuento_promocion || 0) > 0 && (
                                                  <Badge bg="warning" className="ms-1 small text-dark">Promo</Badge>
                                                )}
                                              </div>
                                            </Col>
                                          </Row>

                                          {detalle.promocion_aplicada && (
                                            <div className="mb-2">
                                              <div className="small text-muted">Promoción Aplicada</div>
                                              <Badge bg="warning" className="text-dark">{detalle.promocion_aplicada}</Badge>
                                            </div>
                                          )}

                                          <div className="border-top pt-2 mt-2">
                                            <div className="d-flex justify-content-between align-items-center">
                                              <span className="fw-bold">Precio Final:</span>
                                              <span className="fw-bold fs-6 text-success">{formatCurrency(detalle.precio_final)}</span>
                                            </div>
                                          </div>
                                        </Card.Body>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* Promociones */}
                {/* <Card className="shadow-sm">
                  <Card.Header className="bg-warning text-dark">
                    <h5 className="mb-0"><FaUserCheck className="me-2" />Promociones Disponibles</h5>
                  </Card.Header>
                  <Card.Body>
                    {promociones.length === 0 ? (
                      <div className="text-muted text-center py-3">Sin promociones disponibles</div>
                    ) : (
                      <div className="d-grid gap-3">
                        {promociones.map((promocion, index) => (
                          <Card key={index} className="border-warning">
                            <Card.Body className="p-3">
                              <h6 className="card-title">{promocion.titulo}</h6>
                              <p className="card-text small mb-2">{promocion.descripcion}</p>
                              <div className="d-flex justify-content-between align-items-center">
                                <Badge bg="warning" text="dark">{promocion.descuento}% OFF</Badge>
                                <small className="text-muted">
                                  Hasta: {new Date(promocion.fecha_vencimiento).toLocaleDateString()}
                                </small>
                              </div>
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card> */}
              </Col>
            </Row>
          </Container>
        </div>
      </div>

      {/* Layout para Mobile/Tablet */}
      <div className="d-lg-none min-vh-100" style={{ background: "#f8fafc" }}>
        {/* Offcanvas Sidebar para móvil */}
        <Offcanvas
          show={openDrawer}
          onHide={() => setOpenDrawer(false)}
          placement="start"
          className="shadow"
        >
          <Offcanvas.Body className="p-0">
            {drawerContent}
          </Offcanvas.Body>
        </Offcanvas>

        {/* Header móvil */}
        <div className="bg-white border-bottom px-3 py-2 shadow-sm sticky-top">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <Button variant="light" size="sm" className="me-2" onClick={() => setOpenDrawer(true)}>
                <FaBars />
              </Button>
              <Link to="/prospectos" className="btn btn-outline-secondary btn-sm me-2">
                <FaArrowLeft />
              </Link>
              <div>
                <h6 className="mb-0">Detalle Prospecto</h6>
                <small className="text-muted">{prospecto.nombre}</small>
              </div>
            </div>
            <div className="d-flex gap-1">
              <OverlayTrigger
                placement="bottom"
                overlay={
                  <Tooltip>
                    {polizasGeneradas.length > 0 
                      ? "No se puede aplicar promoción con póliza(s) generada(s)" 
                      : "Aplicar promoción"}
                  </Tooltip>
                }
              >
                <span className="d-inline-block">
                  <Button 
                    variant="success" 
                    size="sm" 
                    onClick={() => setShowPromocionesModal(true)}
                    disabled={polizasGeneradas.length > 0}
                  >
                    <FaMoneyBillWave />
                  </Button>
                </span>
              </OverlayTrigger>
              {tieneReciboSueldo() && (
                <OverlayTrigger
                  placement="bottom"
                  overlay={
                    <Tooltip>
                      {polizasGeneradas.length > 0 
                        ? "No se puede aplicar Ley 19032 con póliza(s) generada(s)" 
                        : "Aplicar Ley 19032"}
                    </Tooltip>
                  }
                >
                  <span className="d-inline-block">
                    <Button 
                      variant="info" 
                      size="sm" 
                      onClick={() => setShowLey19032Modal(true)}
                      disabled={polizasGeneradas.length > 0}
                    >
                      <FaUserCheck />
                    </Button>
                  </span>
                </OverlayTrigger>
              )}
            </div>
          </div>
        </div>

        {/* Contenido móvil */}
        <Container fluid className="p-3">
          {/* Información del prospecto - móvil */}
          <Card className="shadow-sm mb-3">
            <Card.Header className="text-white py-2">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Información del Prospecto</h6>
                <div className="d-flex gap-2 align-items-center">
                  <OverlayTrigger
                    placement="bottom"
                    overlay={
                      <Tooltip>
                        {polizasGeneradas.length > 0 
                          ? "No se puede editar el prospecto con póliza(s) generada(s)" 
                          : "Editar datos del prospecto"}
                      </Tooltip>
                    }
                  >
                    <span className="d-inline-block">
                      <Button 
                        onClick={handleEditarProspecto}
                        disabled={polizasGeneradas.length > 0}
                        size="sm"
                        style={{
                          backgroundColor: 'white',
                          color: '#0d6efd',
                          border: '2px solid #0d6efd',
                          fontWeight: 'bold'
                        }}
                      >
                        <FaEdit className="me-1" /> Editar
                      </Button>
                    </span>
                  </OverlayTrigger>
                  {polizasGeneradas.length > 0 && (
                    <Badge bg="success" className="small">
                      {polizasGeneradas.length} Póliza{polizasGeneradas.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-3">
              <Row className="g-3">
                <Col xs={6} sm={6} md={4} style={{ borderRight: '1px solid #e0e0e0', paddingRight: '15px' }}>
                  <div className="d-flex align-items-center mb-2">
                    <FaUser className="me-2" style={{ color: '#666', fontSize: '0.9rem' }} />
                    <small className="text-muted fw-bold">Nombre</small>
                  </div>
                  <div className="small ps-4">{prospecto.nombre} {prospecto.apellido}</div>
                </Col>
                <Col xs={6} sm={6} md={4} style={{ borderRight: '1px solid #e0e0e0', paddingRight: '15px' }}>
                  <div className="d-flex align-items-center mb-2">
                    <FaCalendarAlt className="me-2" style={{ color: '#666', fontSize: '0.9rem' }} />
                    <small className="text-muted fw-bold">Edad</small>
                  </div>
                  <div className="small ps-4">{prospecto.edad} años</div>
                </Col>
                <Col xs={6} sm={6} md={4} style={{ borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
                  <div className="d-flex align-items-center mb-2">
                    <FaPhone className="me-2" style={{ color: '#666', fontSize: '0.9rem' }} />
                    <small className="text-muted fw-bold">Contacto</small>
                  </div>
                  <div className="small ps-4">{maskPhoneNumber(prospecto.numero_contacto)}</div>
                </Col>
                <Col xs={6} sm={6} md={4} style={{ borderRight: '1px solid #e0e0e0', paddingRight: '15px', borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
                  <div className="d-flex align-items-center mb-2">
                    <FaEnvelope className="me-2" style={{ color: '#666', fontSize: '0.9rem' }} />
                    <small className="text-muted fw-bold">Email</small>
                  </div>
                  <div className="small ps-4">{maskEmail(prospecto.correo)}</div>
                </Col>
                <Col xs={6} sm={6} md={4} style={{ borderRight: '1px solid #e0e0e0', paddingRight: '15px', borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
                  <div className="d-flex align-items-center mb-2">
                    <FaMapMarkerAlt className="me-2" style={{ color: '#666', fontSize: '0.9rem' }} />
                    <small className="text-muted fw-bold">Localidad</small>
                  </div>
                  <div className="small ps-4">{prospecto.localidad}</div>
                </Col>
                <Col xs={6} sm={6} md={4} style={{ borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
                  <div className="d-flex align-items-center mb-2">
                    <FaFlag className="me-2" style={{ color: '#666', fontSize: '0.9rem' }} />
                    <small className="text-muted fw-bold">Estado</small>
                  </div>
                  <div className="ps-4"><Badge bg="primary" className="small">{prospecto.estado}</Badge></div>
                </Col>
                <Col xs={6} sm={6} md={4} style={{ borderRight: '1px solid #e0e0e0', paddingRight: '15px', borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
                  <div className="d-flex align-items-center mb-2">
                    <FaFlag className="me-2" style={{ color: '#666', fontSize: '0.9rem' }} />
                    <small className="text-muted fw-bold">Tipo Afiliación</small>
                  </div>
                  <div className="ps-4">
                    {prospecto.tipo_afiliacion_id ? (
                      <Badge bg="info" className="small">{TIPO_AFILIACION[prospecto.tipo_afiliacion_id] || prospecto.tipo_afiliacion_id}</Badge>
                    ) : (
                      <span className="text-muted small">Sin especificar</span>
                    )}
                  </div>
                </Col>
                {prospecto.tipo_afiliacion_id === 3 && (
                  <Col xs={6} sm={6} md={4} style={{ borderRight: '1px solid #e0e0e0', paddingRight: '15px', borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
                    <div className="d-flex align-items-center mb-2">
                      <FaFlag className="me-2" style={{ color: '#666', fontSize: '0.9rem' }} />
                      <small className="text-muted fw-bold">Categoría Mono.</small>
                    </div>
                    <div className="ps-4">
                      {prospecto.categoria_monotributo ? (
                        <Badge bg="warning" className="text-dark small">{prospecto.categoria_monotributo}</Badge>
                      ) : (
                        <span className="text-muted small">Sin especificar</span>
                      )}
                    </div>
                  </Col>
                )}
                {prospecto.tipo_afiliacion_id === 2 && (
                  <Col xs={6} sm={6} md={4} style={{ borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
                    <div className="d-flex align-items-center mb-2">
                      <FaMoneyBillWave className="me-2" style={{ color: '#666', fontSize: '0.9rem' }} />
                      <small className="text-muted fw-bold">Sueldo Bruto</small>
                    </div>
                    <div className="ps-4">
                      {prospecto.sueldo_bruto ? (
                        <Badge bg="success" className="small">{formatCurrency(prospecto.sueldo_bruto)}</Badge>
                      ) : (
                        <span className="text-muted small">Sin especificar</span>
                      )}
                    </div>
                  </Col>
                )}
                {prospecto.comentario && (
                  <Col xs={12} style={{ borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
                    <div className="d-flex align-items-center mb-2">
                      <FaComments className="me-2" style={{ color: '#666', fontSize: '0.9rem' }} />
                      <small className="text-muted fw-bold">Comentario</small>
                    </div>
                    <div className="small ps-4">{prospecto.comentario}</div>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>

          {/* Familiares - móvil */}
          {prospecto.familiares && prospecto.familiares.length > 0 && (
            <Card className="shadow-sm mb-3">
              <Card.Header className="primary text-white py-2">
                <h6 className="mb-0"><FaUserFriends className="me-1" />Familiares ({prospecto.familiares.length})</h6>
              </Card.Header>
              <Card.Body className="p-2">
                {prospecto.familiares.map((familiar, idx) => (
                  <div key={idx} className="border-bottom pb-2 mb-2 last:border-bottom-0 last:mb-0">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div>
                        <div className="fw-bold small">{familiar.nombre}</div>
                        <small className="text-muted">{familiar.vinculo}</small>
                      </div>
                      <Badge bg="secondary" className="small">{familiar.edad} años</Badge>
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                      {familiar.tipo_afiliacion_id && (
                        <Badge bg="info" className="small">
                          {TIPO_AFILIACION[familiar.tipo_afiliacion_id]}
                        </Badge>
                      )}
                      {familiar.sueldo_bruto && (
                        <Badge bg="success" className="small">
                          {formatCurrency(familiar.sueldo_bruto)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}

          {/* Cotizaciones - móvil */}
          <Card className="shadow-sm mb-3">
            <Card.Header className="text-white py-2">
              <h6 className="mb-0"><FaMoneyBillWave className="me-1" />Cotizaciones ({cotizaciones.length})</h6>
            </Card.Header>
            <Card.Body className="p-2">
              {cotizaciones.length === 0 ? (
                <div className="text-muted text-center py-3 small">Sin cotizaciones disponibles</div>
              ) : (
                <div className="d-grid gap-2">
                  {cotizaciones.map((cotizacion, index) => (
                    <Card key={cotizacion.id} className="mb-4 shadow-sm border-0 cotizacion-card">
                      <Card.Header className={`d-flex justify-content-between align-items-center text-white shadow-sm ${getPlanColorClass(cotizacion.plan_nombre)}`}>
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <h6 className="mb-0 fw-bold">{cotizacion.plan_nombre}</h6>
                            {tienePolizaGenerada(cotizacion) && (
                              <Badge bg="success" className="small">
                                <FaUserCheck />
                              </Badge>
                            )}
                          </div>
                          <small className="text-black-50">Año: {cotizacion.anio}</small>
                        </div>
                        <div className="text-end">
                          <span className="fw-bold fs-5 text-success">{formatCurrency(cotizacion.total_final)}</span>
                          <br />
                          <small className="text-black-50">Total Final</small>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <Row className="mb-2">
                          <Col xs={6} md={3}>
                            <div className="text-muted small">Bruto</div>
                            <div className="fw-bold text-info">{formatCurrency(cotizacion.total_bruto)}</div>
                          </Col>
                          <Col xs={6} md={3}>
                            <div className="text-muted small">Descuento</div>
                            <div className="fw-bold text-warning">{formatCurrency(parseFloat(cotizacion.total_descuento_aporte) + parseFloat(cotizacion.total_descuento_promocion))}</div>
                          </Col>
                          <Col xs={6} md={3}>
                            <div className="text-muted small">Personas</div>
                            <div className="fw-bold">{cotizacion.detalles.length}</div>
                          </Col>
                          <Col xs={6} md={3}>
                            <div className="text-muted small">Fecha</div>
                            <div className="fw-bold">{new Date(cotizacion.fecha).toLocaleDateString()}</div>
                          </Col>
                        </Row>
                        <div className="d-flex gap-2 mb-2">
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip>
                                {loadingPolizas 
                                  ? "Verificando pólizas..." 
                                  : tienePolizaGenerada(cotizacion) 
                                    ? "Póliza ya generada" 
                                    : "Generar póliza"
                                }
                              </Tooltip>
                            }
                          >
                            <span className="d-inline-block">
                              <Button
                                variant={tienePolizaGenerada(cotizacion) ? "success" : "primary"}
                                size="sm"
                                onClick={() => tienePolizaGenerada(cotizacion) ? null : handleGenerarPoliza(cotizacion)}
                                disabled={tienePolizaGenerada(cotizacion) || loadingPolizas}
                                style={tienePolizaGenerada(cotizacion) || loadingPolizas ? { pointerEvents: 'none' } : {}}
                              >
                                {loadingPolizas ? (
                                  <>
                                    <Spinner animation="border" size="sm" className="me-1" />
                                    Verificando...
                                  </>
                                ) : tienePolizaGenerada(cotizacion) ? (
                                  <>
                                    <FaUserCheck className="me-1" />
                                    Generada
                                  </>
                                ) : (
                                  "Póliza"
                                )}
                              </Button>
                            </span>
                          </OverlayTrigger>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleEnviarCotizacion(cotizacion)}
                          >
                            <FaWhatsapp /> Enviar
                          </Button>
                          {/* <Button
                            variant="warning"
                            size="sm"
                            onClick={() => handleGenerarCuponPago(cotizacion)}
                            disabled={generandoCupon}
                          >
                            {generandoCupon ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-1" />
                              </>
                            ) : (
                              <FaCreditCard />
                            )}
                          </Button> */}
                        </div>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => toggleDetallesCotizacion(index)}
                        >
                          <FaEye className="me-1" />
                          {showDetallesCotizacion[index] ? 'Ocultar' : 'Ver'} Detalles
                        </Button>

                        {showDetallesCotizacion[index] && cotizacion.detalles && (
                          <div className="mt-3 border-top pt-3">
                            {/* Vista de escritorio - Tabla */}
                            <div className="d-none d-lg-block">
                              <Table size="sm" responsive className="mb-0 table-striped align-middle">
                                <thead>
                                  <tr>
                                    <th>Persona</th>
                                    <th>Vínculo</th>
                                    <th>Edad</th>
                                    <th>Tipo Afiliación</th>
                                    <th>Base</th>
                                    <th>Desc. Aporte</th>
                                    <th>Desc. Promoción</th>
                                    <th>Promoción</th>
                                    <th>Final</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cotizacion.detalles.map((detalle, idx) => (
                                    <tr key={detalle.id || idx}>
                                      <td>{detalle.persona}</td>
                                      <td>{detalle.vinculo}</td>
                                      <td>{detalle.edad}</td>
                                      <td>{TIPO_AFILIACION[detalle.tipo_afiliacion_id] || detalle.tipo_afiliacion || 'No especificado'}</td>
                                      <td>{formatCurrency(detalle.precio_base)}</td>
                                      <td>
                                        {formatCurrency(detalle.descuento_aporte)}
                                        {parseFloat(detalle.descuento_aporte) > 0 && (
                                          <span className="badge bg-info ms-1">Aporte</span>
                                        )}
                                      </td>
                                      <td>
                                        {formatCurrency(detalle.descuento_promocion)}
                                        {parseFloat(detalle.descuento_promocion) > 0 && (
                                          <span className="badge bg-warning text-dark ms-1">Promoción</span>
                                        )}
                                      </td>
                                      <td>
                                        {detalle.promocion_aplicada
                                          ? <span className="badge bg-warning text-dark">{detalle.promocion_aplicada}</span>
                                          : <span className="text-muted small">Sin promoción</span>
                                        }
                                      </td>
                                      <td className="fw-bold text-success">{formatCurrency(detalle.precio_final)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>

                            {/* Vista móvil - Cards */}
                            <div className="d-lg-none">
                              {cotizacion.detalles.map((detalle, idx) => (
                                <Card key={detalle.id || idx} className="mb-2 border-start border-primary border-3">
                                  <Card.Body className="p-2">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <div>
                                        <h6 className="mb-0 fw-bold">{detalle.persona}</h6>
                                        <Badge bg="secondary" className="small">{detalle.vinculo}</Badge>
                                      </div>
                                      <Badge bg="info">{detalle.edad} años</Badge>
                                    </div>
                                    
                                    <Row className="g-2 mb-2">
                                      <Col xs={6}>
                                        <div className="small text-muted">Tipo Afiliación</div>
                                        <div className="fw-bold small">{TIPO_AFILIACION[detalle.tipo_afiliacion_id] || detalle.tipo_afiliacion || 'No especificado'}</div>
                                      </Col>
                                      <Col xs={6}>
                                        <div className="small text-muted">Precio Base</div>
                                        <div className="fw-bold small text-primary">{formatCurrency(detalle.precio_base)}</div>
                                      </Col>
                                    </Row>

                                    <Row className="g-2 mb-2">
                                      <Col xs={6}>
                                        <div className="small text-muted">Desc. Aporte</div>
                                        <div className="fw-bold small text-info">
                                          {formatCurrency(detalle.descuento_aporte)}
                                          {parseFloat(detalle.descuento_aporte || 0) > 0 && (
                                            <Badge bg="info" className="ms-1 small">Aporte</Badge>
                                          )}
                                        </div>
                                      </Col>
                                      <Col xs={6}>
                                        <div className="small text-muted">Desc. Promoción</div>
                                        <div className="fw-bold small text-warning">
                                          {formatCurrency(detalle.descuento_promocion)}
                                          {parseFloat(detalle.descuento_promocion || 0) > 0 && (
                                            <Badge bg="warning" className="ms-1 small text-dark">Promo</Badge>
                                          )}
                                        </div>
                                      </Col>
                                    </Row>

                                    {detalle.promocion_aplicada && (
                                      <div className="mb-2">
                                        <div className="small text-muted">Promoción Aplicada</div>
                                        <Badge bg="warning" className="text-dark">{detalle.promocion_aplicada}</Badge>
                                      </div>
                                    )}

                                    <div className="border-top pt-2 mt-2">
                                      <div className="d-flex justify-content-between align-items-center">
                                        <span className="fw-bold">Precio Final:</span>
                                        <span className="fw-bold fs-6 text-success">{formatCurrency(detalle.precio_final)}</span>
                                      </div>
                                    </div>
                                  </Card.Body>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Promociones - móvil */}
          {/* {promociones.length > 0 && (
            <Card className="shadow-sm">
              <Card.Header className="bg-warning text-dark py-2">
                <h6 className="mb-0"><FaUserCheck className="me-1" />Promociones ({promociones.length})</h6>
              </Card.Header>
              <Card.Body className="p-2">
                <div className="d-grid gap-2">
                  {promociones.map((promocion, index) => (
                    <Card key={index} className="border-warning">
                      <Card.Body className="p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1">{promocion.titulo}</h6>
                            <p className="small mb-0 text-muted">{promocion.descripcion}</p>
                          </div>
                          <Badge bg="warning" text="dark">{promocion.descuento}%</Badge>
                        </div>
                        <small className="text-muted">
                          Válido hasta: {new Date(promocion.fecha_vencimiento).toLocaleDateString()}
                        </small>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )} */}
        </Container>
      </div>

      {/* Modales */}
      <PolizaForm
        show={showPolizaForm}
        onHide={() => {
          setShowPolizaForm(false);
          setCotizacionSeleccionada(null);
        }}
        cotizacion={cotizacionSeleccionada}
        prospecto={prospecto}
        onPolizaCreada={(poliza) => {
          console.log('🎉 Póliza creada exitosamente:', poliza);
          console.log('🔄 Refrescando lista de pólizas...');
          
          // Actualizar la lista de pólizas generadas
          setPolizasGeneradas(prev => {
            const nuevaLista = [...prev, poliza];
            console.log('📋 Nueva lista de pólizas:', nuevaLista);
            return nuevaLista;
          });
          
          // Cerrar el modal y limpiar estado
          setShowPolizaForm(false);
          setCotizacionSeleccionada(null);
          
          // Opcional: Refrescar las pólizas desde el servidor para estar 100% sincronizado
          fetchPolizasGeneradas();
          
          console.log('✅ Estado actualizado - botón debería deshabilitarse');
        }}
      />

      <PromocionesModal
        prospectoId={id}
        show={showPromocionesModal}
        onClose={() => setShowPromocionesModal(false)}
        onPromocionAplicada={fetchCotizaciones}
      />

      <EnviarCotizacionModal
        show={showEnviarCotizacion}
        onHide={() => setShowEnviarCotizacion(false)}
        cotizacion={cotizacionParaEnviar}
        prospecto={prospecto}
      />

      <Ley19032Modal
        prospectoId={id}
        show={showLey19032Modal}
        onClose={() => setShowLey19032Modal(false)}
        onLey19032Aplicada={fetchCotizaciones}
        integrantesConReciboSueldo={getIntegrantesConReciboSueldo()}
      />

      {/* Modal de Edición de Prospecto */}
      <Modal show={showEditarProspectoModal} onHide={() => setShowEditarProspectoModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEdit className="me-2" />
            Editar Prospecto
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {prospectoEditando && (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre *</Form.Label>
                    <Form.Control
                      type="text"
                      value={prospectoEditando.nombre || ''}
                      onChange={(e) => setProspectoEditando({ ...prospectoEditando, nombre: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Apellido *</Form.Label>
                    <Form.Control
                      type="text"
                      value={prospectoEditando.apellido || ''}
                      onChange={(e) => setProspectoEditando({ ...prospectoEditando, apellido: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Edad *</Form.Label>
                    <Form.Control
                      type="number"
                      value={prospectoEditando.edad || ''}
                      onChange={(e) => setProspectoEditando({ ...prospectoEditando, edad: e.target.value })}
                      min={0}
                      max={120}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tipo de Afiliación *</Form.Label>
                    <Form.Select
                      value={prospectoEditando.tipo_afiliacion_id || ''}
                      onChange={(e) => setProspectoEditando({ ...prospectoEditando, tipo_afiliacion_id: e.target.value })}
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

              {tiposAfiliacion.find(t => t.id === Number(prospectoEditando.tipo_afiliacion_id))?.requiere_sueldo === 1 && (
                <Form.Group className="mb-3">
                  <Form.Label>Sueldo Bruto</Form.Label>
                  <Form.Control
                    type="number"
                    value={prospectoEditando.sueldo_bruto || ''}
                    onChange={(e) => setProspectoEditando({ ...prospectoEditando, sueldo_bruto: e.target.value })}
                    min={0}
                  />
                </Form.Group>
              )}

              {tiposAfiliacion.find(t => t.id === Number(prospectoEditando.tipo_afiliacion_id))?.requiere_categoria === 1 && (
                <Form.Group className="mb-3">
                  <Form.Label>Categoría Monotributo</Form.Label>
                  <Form.Select
                    value={prospectoEditando.categoria_monotributo || ''}
                    onChange={(e) => setProspectoEditando({ ...prospectoEditando, categoria_monotributo: e.target.value })}
                  >
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
                    <Form.Label>Número de Contacto (No editable)</Form.Label>
                    <Form.Control
                      type="text"
                      value={maskPhoneNumber(prospectoEditando.numero_contacto || '')}
                      disabled
                      className="bg-light"
                    />
                    <Form.Text className="text-muted">
                      El número de contacto no se puede modificar
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email (No editable)</Form.Label>
                    <Form.Control
                      type="email"
                      value={maskEmail(prospectoEditando.correo || '')}
                      disabled
                      className="bg-light"
                    />
                    <Form.Text className="text-muted">
                      El correo electrónico no se puede modificar
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Localidad</Form.Label>
                <Form.Select
                  value={prospectoEditando.localidad || ''}
                  onChange={(e) => setProspectoEditando({ ...prospectoEditando, localidad: e.target.value })}
                >
                  <option value="">Selecciona una localidad...</option>
                  {localidades.map(loc => (
                    <option key={loc.id} value={loc.nombre}>{loc.nombre}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <hr className="my-4" />

              {/* Sección de Familiares */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Familiares a Cargo</h6>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => setShowAgregarFamiliar(!showAgregarFamiliar)}
                  >
                    {showAgregarFamiliar ? 'Cancelar' : '+ Agregar Familiar'}
                  </Button>
                </div>

                {/* Formulario para agregar nuevo familiar */}
                {showAgregarFamiliar && (
                  <Card className="mb-3 border-primary">
                    <Card.Body>
                      <h6 className="text-primary mb-3">Nuevo Familiar</h6>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Vínculo *</Form.Label>
                            <Form.Select
                              value={nuevoFamiliar.vinculo}
                              onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, vinculo: e.target.value })}
                            >
                              <option value="">Selecciona...</option>
                              {vinculos.map(v => (
                                <option key={v.value} value={v.value}>{v.label}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Nombre *</Form.Label>
                            <Form.Control
                              type="text"
                              value={nuevoFamiliar.nombre}
                              onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, nombre: e.target.value })}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Edad *</Form.Label>
                            <Form.Control
                              type="number"
                              value={nuevoFamiliar.edad}
                              onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, edad: e.target.value })}
                              min={0}
                              max={120}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Campos adicionales para pareja/cónyuge e hijos */}
                      {(nuevoFamiliar.vinculo === 'pareja/conyuge' || nuevoFamiliar.vinculo === 'hijo/a') && (
                        <>
                          <Form.Group className="mb-3">
                            <Form.Label>Tipo de Afiliación *</Form.Label>
                            <Form.Select
                              value={nuevoFamiliar.tipo_afiliacion_id}
                              onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, tipo_afiliacion_id: e.target.value })}
                            >
                              <option value="">Selecciona...</option>
                              {tiposAfiliacion.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.etiqueta}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>

                          {tiposAfiliacion.find(t => t.id === Number(nuevoFamiliar.tipo_afiliacion_id))?.requiere_sueldo === 1 && (
                            <Form.Group className="mb-3">
                              <Form.Label>Sueldo Bruto</Form.Label>
                              <Form.Control
                                type="number"
                                value={nuevoFamiliar.sueldo_bruto}
                                onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, sueldo_bruto: e.target.value })}
                                min={0}
                              />
                            </Form.Group>
                          )}

                          {tiposAfiliacion.find(t => t.id === Number(nuevoFamiliar.tipo_afiliacion_id))?.requiere_categoria === 1 && (
                            <Form.Group className="mb-3">
                              <Form.Label>Categoría Monotributo</Form.Label>
                              <Form.Select
                                value={nuevoFamiliar.categoria_monotributo}
                                onChange={(e) => setNuevoFamiliar({ ...nuevoFamiliar, categoria_monotributo: e.target.value })}
                              >
                                <option value="">Selecciona...</option>
                                {categoriasMonotributo.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          )}
                        </>
                      )}

                      <div className="d-flex justify-content-end">
                        <Button variant="success" onClick={handleAgregarFamiliar}>
                          Agregar Familiar
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                )}

                {/* Lista de familiares actuales */}
                {familiares.length > 0 ? (
                  <div className="list-group">
                    {familiares.map((fam, idx) => (
                      <div key={idx} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-1">
                              <Badge bg="secondary" className="me-2">
                                {vinculos.find(v => v.value === fam.vinculo)?.label || fam.vinculo}
                              </Badge>
                              {fam.nombre}
                            </h6>
                            <small className="text-muted">
                              Edad: {fam.edad} años
                              {fam.tipo_afiliacion_id && (
                                <> | {tiposAfiliacion.find(t => t.id === Number(fam.tipo_afiliacion_id))?.etiqueta}</>
                              )}
                              {fam.sueldo_bruto && <> | Sueldo: ${Number(fam.sueldo_bruto).toLocaleString()}</>}
                              {fam.categoria_monotributo && <> | Categoría: {fam.categoria_monotributo}</>}
                            </small>
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleEliminarFamiliar(idx)}
                          >
                            <FaTimes />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert variant="light" className="text-center">
                    <small className="text-muted">No hay familiares agregados</small>
                  </Alert>
                )}
              </div>

              <Alert variant="info" className="mt-3">
                <small>
                  <strong>Nota:</strong> Si modificas la edad, tipo de afiliación, sueldo bruto, categoría de monotributo o familiares, 
                  se recotizará automáticamente al guardar.
                </small>
              </Alert>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditarProspectoModal(false)} disabled={editandoProspecto}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleGuardarProspectoEditado} disabled={editandoProspecto}>
            {editandoProspecto ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Guardando...
              </>
            ) : (
              <>
                <FaEdit className="me-1" />
                Guardar Cambios
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ProspectoDetalle;