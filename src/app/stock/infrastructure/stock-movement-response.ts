import { StockMovementType } from '../domain/model/stock-movement-type';

export interface StockMovementResource {
  id: string;
  supplyId: string;
  type: StockMovementType;
  quantity: number;
  createdAt: string;
}
