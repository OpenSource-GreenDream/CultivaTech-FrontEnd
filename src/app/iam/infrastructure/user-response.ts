export interface RoleResource {
  id: number;
  name: string;
  description?: string | null;
}

export interface ProfileRegistrationResource {
  fundoName: string;
  contactPhone: string;
  moistureThreshold: number;
  temperatureThreshold: number;
}

export interface UserResponse {
  id: number;
  email: string;
  roles: string[];
  profile?: ProfileRegistrationResource;
}
