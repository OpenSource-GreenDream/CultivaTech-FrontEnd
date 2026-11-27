export interface ProductResource {
  id: number;
  inventoryId: number;
  fieldId: number | null;
  name: string;
  description: string;
  price: number;
  type: string;
  imageUrl?: string;
}