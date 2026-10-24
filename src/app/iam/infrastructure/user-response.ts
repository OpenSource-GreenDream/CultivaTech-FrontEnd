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
  password_hash: string,
  roles?: RoleResource[];
  created_at: string,
  updated_at: string
}
