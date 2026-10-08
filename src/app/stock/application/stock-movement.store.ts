import { inject, Service, signal } from '@angular/core';
import { Observable, map, switchMap, tap, throwError } from 'rxjs';

import { StockMovementApi } from '../infrastructure/stock-movement-api';
import { StockMovement } from '../domain/model';
import { CreateStockMovementRequest } from '../domain/model';

@Service()
export class StockMovementStore {
  private stockMovementApi = inject(StockMovementApi);

  readonly movements = signal<StockMovement[]>([]);

  loadMovements(): Observable<StockMovement[]> {
    return new Observable((subscriber) => {
      subscriber.next(this.movements());
      subscriber.complete();
    });
  }

  createMovement(request: CreateStockMovementRequest): Observable<StockMovement> {
    if (!request.supplyId) {
      return throwError(() => new Error('Supply ID is required'));
    }

    if (request.quantity <= 0) {
      return throwError(() => new Error('Quantity must be greater than zero'));
    }

    if (request.type !== 'IN' && request.type !== 'OUT') {
      return throwError(() => new Error('Invalid stock movement type'));
    }

    return this.stockMovementApi.getSupply(request.supplyId).pipe(
      switchMap((supply) => {
        const currentQuantity = supply.quantity;

        const newQuantity =
          request.type === 'IN'
            ? currentQuantity + request.quantity
            : currentQuantity - request.quantity;

        if (newQuantity < 0) {
          return throwError(() => new Error('Stock quantity cannot be negative'));
        }

        return this.stockMovementApi.updateSupplyQuantity(request.supplyId, newQuantity).pipe(
          map((): StockMovement => ({
            id: crypto.randomUUID(),
            supplyId: request.supplyId,
            type: request.type,
            quantity: request.quantity,
            createdAt: new Date().toISOString(),
          })),
        );
      }),

      tap((movement) => {
        this.movements.update((movements) => [...movements, movement]);
      }),
    );
  }
}
