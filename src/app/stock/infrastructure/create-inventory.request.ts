export interface CreateInventoryRequest {
  productId: number;
  profileId?: number;
  fieldId: number;
  stockQuantity: number;
}
