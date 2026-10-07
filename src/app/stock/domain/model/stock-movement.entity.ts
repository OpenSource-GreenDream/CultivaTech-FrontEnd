import { StockMovementType } from './stock-movement-type';

export interface StockMovement {
  id: string;
  supplyId: string;
  type: StockMovementType;
  quantity: number;
  createdAt: string;
}
