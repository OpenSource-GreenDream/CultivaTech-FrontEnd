export interface DeviceResource {
  id: number;
  fieldId: number;
  macAddress: string;
  status: string;
  lastSync: string | null;
}