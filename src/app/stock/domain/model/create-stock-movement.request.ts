import { StockMovementType } from './stock-movement-type';

export interface CreateStockMovementRequest {
  supplyId: string;
  type: StockMovementType;
  quantity: number;
}
