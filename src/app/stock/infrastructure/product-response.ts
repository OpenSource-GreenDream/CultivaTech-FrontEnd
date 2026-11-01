export interface ProductResource {
  id: number;
  name: string;
  description: string;
  price: number;
  field_id?: number | null;
  image_url?: string;
  created_at: string;
  updated_at: string;
}
