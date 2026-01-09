import { Badge } from 'react-bootstrap';
import React from 'react';

export const estadosConfig = {
  'Lead': { bg: 'secondary', text: 'Lead' },
  '1º Contacto': { bg: 'info', text: '1º Contacto' },
  'Calificado Cotización': { bg: 'warning', text: 'Cotización' },
  'Calificado Póliza': { bg: 'primary', text: 'Póliza' },
  'Calificado Pago': { bg: 'success', text: 'Pago' },
  'Venta': { bg: 'success', text: 'Venta' },
  'Fuera de zona': { bg: 'danger', text: 'Fuera zona' },
  'Fuera de edad': { bg: 'danger', text: 'Fuera edad' },
  'No contesta': { bg: 'warning', text: 'No contesta' },
  'No le interesa (económico)': { bg: 'danger', text: 'No interesa' },
  'No le interesa cartilla': { bg: 'danger', text: 'No interesa' },
  'No busca cobertura médica': { bg: 'danger', text: 'No cobertura' },
  'Teléfono erróneo': { bg: 'danger', text: 'Tel. erróneo' },
  'Ya es socio': { bg: 'info', text: 'Ya es socio' },
  'Busca otra Cobertura': { bg: 'warning', text: 'Otra cobertura' },
  'Preexistencia': { bg: 'danger', text: 'Preexistencia' },
  'Reafiliación': { bg: 'info', text: 'Reafiliación' }
};

export const getBadgeEstado = (estado) => {
  const config = estadosConfig[estado] || { bg: 'secondary', text: estado };
  return <Badge bg={config.bg}>{config.text}</Badge>;
};