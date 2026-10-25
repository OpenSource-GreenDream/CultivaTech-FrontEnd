export interface CreateInventoryRequest {
  productId: number;
  name: string;
  stockQuantity: number;
  warehouseLocation: string;
}
