export interface ProductResource {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}
