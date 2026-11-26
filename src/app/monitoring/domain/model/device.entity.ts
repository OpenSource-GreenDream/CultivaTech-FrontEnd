export interface Device {
  id: number;
  fieldId: number;
  macAddress: string;
  status: string;
  lastSync: string | null;
}
