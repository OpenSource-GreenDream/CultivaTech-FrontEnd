/**
 * Alert copy templates and evaluation constants for the Monitoring context.
 * Centralised here to avoid magic strings inside stores and components.
 */
export const TELEMETRY_ALERT_MESSAGES = {
  lowMoisture: {
    title: 'Alerta de Baja Humedad',
    message: (zone: string, mac: string, value: number, unit: string, threshold: number): string =>
      `El sensor ${mac} de la zona ${zone} reportó ${value}${unit}, por debajo del umbral de humedad de ${threshold}${unit}.`,
  },
  outOfRange: {
    title: 'Alerta de Parámetro Fuera de Rango',
    message: (zone: string, mac: string, value: number, unit: string, threshold: number): string =>
      `El sensor ${mac} de la zona ${zone} reportó ${value}${unit}, fuera del rango permitido (límite ${threshold}${unit}).`,
  },
} as const;

export const TELEMETRY_ALERT_TYPE_KEYS = {
  FIELD_FALLBACK_PREFIX: '#',
} as const;
