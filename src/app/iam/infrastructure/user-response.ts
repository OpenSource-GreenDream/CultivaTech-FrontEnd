export interface UserResponse{
  id: number,
  users: UserResource[]
}

export interface UserResource{
  id: number,
  emailAddress: string,
  password_hash: string,
  created_at: string,
  updated_at: string
}
