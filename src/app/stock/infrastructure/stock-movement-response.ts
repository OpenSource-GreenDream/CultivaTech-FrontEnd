import { StockMovementType } from '../domain/model';

export interface StockMovementResource {
  id: string;
  supplyId: string;
  type: StockMovementType;
  quantity: number;
  createdAt: string;
}
