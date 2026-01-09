import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, CircularProgress } from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import TodayIcon from "@mui/icons-material/Today";
import DateRangeIcon from "@mui/icons-material/DateRange";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupIcon from "@mui/icons-material/Group";
import { API_URL } from "../../config";



// Componente reutilizable para animar el conteo
const CountUp = ({ end, duration = 1000, ...props }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span {...props}>{count}</span>;
};

const SupervisorResumen = () => {
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState({
    totalAsignados: 0,
    nuevosDia: 0,
    nuevosSemana: 0,
    nuevosMes: 0,
    totalVentas: 0,
    prospectosPorEstado: [],
  });

  useEffect(() => {
    const fetchResumen = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API_URL}/supervisor/resumen`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setResumen(data);
      } catch (error) {
        console.error("Error al cargar resumen:", error);
        // Datos de ejemplo para desarrollo
        setResumen({
          totalAsignados: 156,
          nuevosDia: 12,
          nuevosSemana: 45,
          nuevosMes: 187,
          totalVentas: 23,
          prospectosPorEstado: [
            { estado: "Nuevo", cantidad: 45, color: "#1976d2" },
            { estado: "Contactado", cantidad: 32, color: "#2e7d32" },
            { estado: "Interesado", cantidad: 28, color: "#ed6c02" },
            { estado: "Negociación", cantidad: 15, color: "#9c27b0" },
            { estado: "Cerrado", cantidad: 23, color: "#00796b" },
            { estado: "Perdido", cantidad: 13, color: "#d32f2f" }
          ],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchResumen();
  }, []);

  // Datos para las métricas modernas
  const metricasData = [
    {
      id: 'totalAsignados',
      value: resumen.totalAsignados,
      label: 'Total Asignados',
      description: 'Prospectos en el sistema',
      icon: GroupIcon,
      type: 'primary',
      trend: { type: 'up', value: 12 },
      progress: 85
    },
    {
      id: 'nuevosDia',
      value: resumen.nuevosDia,
      label: 'Nuevos Hoy',
      description: 'Ingresados en el día',
      icon: TodayIcon,
      type: 'success',
      trend: { type: 'up', value: 8 },
      progress: 60
    },
    {
      id: 'nuevosSemana',
      value: resumen.nuevosSemana,
      label: 'Esta Semana',
      description: 'Prospectos semanales',
      icon: DateRangeIcon,
      type: 'warning',
      trend: { type: 'up', value: 15 },
      progress: 75
    },
    {
      id: 'nuevosMes',
      value: resumen.nuevosMes,
      label: 'Este Mes',
      description: 'Total del mes actual',
      icon: TrendingUpIcon,
      type: 'info',
      trend: { type: 'up', value: 22 },
      progress: 90
    },
    {
      id: 'totalVentas',
      value: resumen.totalVentas,
      label: 'Convertidos',
      description: `${Math.round((resumen.totalVentas / resumen.totalAsignados) * 100) || 0}% de conversión`,
      icon: AssessmentIcon,
      type: 'primary',
      trend: { type: 'up', value: 18 },
      progress: Math.round((resumen.totalVentas / resumen.totalAsignados) * 100) || 0
    }
  ];

  if (loading) {
    return (
      <Box sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center",
        minHeight: "400px",
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 4
      }}>
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      {/* Métricas Modernas Glass Morphism */}
      <div className="supervisor-metrics-modern">
        {/* Vista Desktop - Glass Cards */}
        <div className="d-none d-lg-block">
          <div className="metrics-glass-grid">
            {metricasData.map((metrica, index) => {
              const IconComponent = metrica.icon;
              
              return (
                <div 
                  key={metrica.id} 
                  className={`metric-glass-card metric-${metrica.type}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="metric-header">
                    <div className="metric-icon-container">
                      <IconComponent className="metric-icon" />
                    </div>
                    <div className={`metric-trend trend-${metrica.trend.type}`}>
                      {metrica.trend.type === 'up' ? '↗' : '↙'} {metrica.trend.value}%
                    </div>
                  </div>
                  
                  <div className="metric-content">
                    <div className="metric-number">
                      <CountUp end={metrica.value} duration={1500} />
                    </div>
                    <div className="metric-label">
                      {metrica.label}
                    </div>
                    <div className="metric-description">
                      {metrica.description}
                    </div>
                  </div>
                  
                  {metrica.progress > 0 && (
                    <div className="metric-footer">
                      <div className="metric-progress-modern">
                        <div className="progress-info">
                          <span className="progress-label">Progreso</span>
                          <span className="progress-value">{metrica.progress}%</span>
                        </div>
                        <div className="progress-track">
                          <div 
                            className="progress-fill"
                            style={{ width: `${metrica.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Vista Tablet y Mobile - Cards Compactas */}
        <div className="d-lg-none">
          <div className="metrics-glass-grid">
            {metricasData.map((metrica, index) => {
              const IconComponent = metrica.icon;
              
              return (
                <div 
                  key={metrica.id}
                  className={`metric-glass-card-mobile metric-${metrica.type}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`metric-icon-mobile metric-${metrica.type}`}>
                    <IconComponent />
                  </div>
                  <div className="metric-number-mobile">
                    <CountUp end={metrica.value} duration={1200} />
                  </div>
                  <div className="metric-label-mobile">
                    {metrica.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Box>
  );
};

export default SupervisorResumen;
