import { useEffect, useState } from "react";
import { Container, Button, Table, Form } from "react-bootstrap";
import axios from "axios";
import { API_URL } from "../../config";


const CotizacionesTabla = () => {
  const [prospectos, setProspectos] = useState([]);
  const [cotizaciones, setCotizaciones] = useState({});
  const [prospectoSeleccionado, setProspectoSeleccionado] = useState("");

  useEffect(() => {
    // Obtener la lista de prospectos
    const fetchProspectos = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API_URL}/supervisor/prospectos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProspectos(data);
      } catch (error) {
        console.error("Error al obtener prospectos:", error);
      }
    };

    fetchProspectos();
  }, []);

  const handleProspectoChange = async (e) => {
    const prospectoId = e.target.value;
    setProspectoSeleccionado(prospectoId);

    if (!prospectoId) {
      setCotizaciones({});
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/supervisor/cotizaciones/${prospectoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Organizar cotizaciones por plan
      const cotizacionesPorPlan = data.reduce((acc, cot) => {
        const plan = cot.plan || "Sin Plan";
        if (!acc[plan]) acc[plan] = [];
        acc[plan].push(cot);
        return acc;
      }, {});

      setCotizaciones(cotizacionesPorPlan);
    } catch (error) {
      setCotizaciones({});
      console.error("Error al obtener cotizaciones:", error);
    }
  };

  return (
    <Container className="my-4">
      <h4>Cotizaciones</h4>

      {/* Selector de prospectos */}
      <Form.Group className="mb-3">
        <Form.Label>Selecciona un prospecto</Form.Label>
        <Form.Select value={prospectoSeleccionado} onChange={handleProspectoChange}>
          <option value="">Selecciona...</option>
          {prospectos.map((prospecto) => (
            <option key={prospecto.id} value={prospecto.id}>
              {prospecto.nombre} {prospecto.apellido}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {/* Mostrar cotizaciones organizadas por plan */}
      {Object.keys(cotizaciones).length === 0 ? (
        <div className="text-muted">Sin cotizaciones</div>
      ) : (
        Object.entries(cotizaciones).map(([plan, cotizaciones]) => (
          <div key={plan} className="mb-4">
            <h5 className="fw-bold">{plan}</h5>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Persona</th>
                  <th>Vínculo</th>
                  <th>Edad</th>
                  <th>Tipo Afiliación</th>
                  <th>Precio Base</th>
                  <th>Descuento</th>
                  <th>Precio Final</th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.map((cotizacion, index) => (
                  <tr key={cotizacion.id}>
                    <td>{index + 1}</td>
                    <td>{cotizacion.persona}</td>
                    <td>{cotizacion.vinculo}</td>
                    <td>{cotizacion.edad}</td>
                    <td>{cotizacion.tipo_afiliacion}</td>
                    <td>${cotizacion.precio_base}</td>
                    <td>${cotizacion.descuento_aporte}</td>
                    <td>${cotizacion.precio_final}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ))
      )}
    </Container>
  );
};

export default CotizacionesTabla;