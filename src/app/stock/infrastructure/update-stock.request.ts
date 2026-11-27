export interface UpdateStockRequest {
  inventoryId: number;
  fieldId?: number;
  stockQuantity: number;
}
