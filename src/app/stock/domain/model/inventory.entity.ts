export interface Inventory {
  id: number;
  productId: number;
  profileId: number;
  /** Field (batch) where the product is stocked. */
  fieldId: number;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
}
