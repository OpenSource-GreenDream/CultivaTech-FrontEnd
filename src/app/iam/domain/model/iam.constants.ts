export const USER_ROLES = {
  AGRICULTOR: 'AGRICULTOR',
  PROVEEDOR: 'PROVEEDOR',
  CLIENTEB2B: 'CLIENTEB2B',
} as const;

export type UserRoleType = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export interface RoleDefinition {
  id: number;
  name: string;
  description: string;
}

export const ROLE_DEFINITIONS: Record<UserRoleType, RoleDefinition> = {
  [USER_ROLES.AGRICULTOR]: {
    id: 1,
    name: 'agricultor',
    description: 'Usuario gestor de fundo, lotes y sensores',
  },
  [USER_ROLES.PROVEEDOR]: {
    id: 2,
    name: 'proveedor',
    description: 'Proveedor de insumos agropecuarios y maquinaria',
  },
  [USER_ROLES.CLIENTEB2B]: {
    id: 3,
    name: 'clienteb2b',
    description: 'Cliente corporativo comprador de productos agropecuarios',
  },
};

export const IAM_SESSION_STORAGE_KEY = 'cultivatech_active_session';

export const IAM_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
} as const;
