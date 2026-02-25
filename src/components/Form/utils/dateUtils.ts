// Utilidades para cálculos de fechas

export const calcularDias = (fechaInspeccion: string, fechaRecarga: string): number => {
  if (!fechaInspeccion || !fechaRecarga) return 0;
  
  const fecha1 = new Date(fechaInspeccion);
  const fecha2 = new Date(fechaRecarga);
  const diffTime = Math.abs(fecha2.getTime() - fecha1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};
