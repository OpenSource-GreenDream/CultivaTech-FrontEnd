export interface CreateProductRequest {
  inventoryId?: number;
  fieldId?: number | null;
  name: string;
  description: string;
  price: number;
  type?: string;
  imageUrl?: string;
}