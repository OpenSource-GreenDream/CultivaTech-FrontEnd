export interface RoleResource{
  id: number;
  name: string;
  description: string;
}

export interface UserResponse{
  id: number,
  users: UserResource[]
}

export interface UserResource{
  id: number,
  email_address: string,
  /**
   * The mock API returns either embedded role objects (preferred) or
   * plain role names. The assembler normalizes both shapes.
   */
  roles?: Array<RoleResource | string>;
  created_at: string,
  updated_at: string
}
