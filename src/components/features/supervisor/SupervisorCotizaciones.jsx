import { useState, useEffect } from "react";
import { ButtonGroup, Button, Container, Spinner, Alert } from "react-bootstrap";
import CotizacionesTable from "./CotizacionesTable";
import CotizacionesCard from "./CotizacionesCard";
import axios from "axios";
import { API_URL } from "../../config";


const SupervisorCotizaciones = () => {
  const [vista, setVista] = useState("tabla");
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCotizaciones = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API_URL}/cotizaciones`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCotizaciones(data);
      } catch (err) {
        setError("No se pudieron cargar las cotizaciones.");
      } finally {
        setLoading(false);
      }
    };

    fetchCotizaciones();
  }, []);

  if (loading) {
    return (
      <Container className="my-4 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Cargando cotizaciones...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Cotizaciones</h4>
        <ButtonGroup>
          <Button
            variant={vista === "tabla" ? "primary" : "outline-primary"}
            onClick={() => setVista("tabla")}
          >
            Tabla
          </Button>
          <Button
            variant={vista === "card" ? "primary" : "outline-primary"}
            onClick={() => setVista("card")}
          >
            Cards
          </Button>
        </ButtonGroup>
      </div>
      {vista === "tabla" ? (
        <CotizacionesTable cotizaciones={cotizaciones} />
      ) : (
        <CotizacionesCard cotizaciones={cotizaciones} />
      )}
    </Container>
  );
};

export default SupervisorCotizaciones;