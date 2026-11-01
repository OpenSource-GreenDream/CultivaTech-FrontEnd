export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  /** Field (batch) that owns the product, when it belongs to a specific farm. */
  fieldId: number | null;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}
