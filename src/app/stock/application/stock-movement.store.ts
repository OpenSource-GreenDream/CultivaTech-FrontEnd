import { inject, Service, signal } from '@angular/core';
import { Observable, tap, throwError } from 'rxjs';

import { StockMovementApi } from '../infrastructure/stock-movement-api';
import { StockMovement } from '../domain/model';
import { CreateStockMovementRequest } from '../domain/model';
import { StockMovementAssembler } from '../infrastructure/stock-movement.assembler';

@Service()
export class StockMovementStore {
  private stockMovementApi = inject(StockMovementApi);

  readonly movements = signal<StockMovement[]>([]);

  loadMovements(): Observable<StockMovement[]> {
    return this.stockMovementApi.getMovements().pipe(
      tap((resources) => {
        const movements = resources.map((resource) =>
          StockMovementAssembler.toEntityFromResource(resource),
        );

        this.movements.set(movements);
      }),
    );
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

    return this.stockMovementApi.createMovement(request).pipe(
      tap((resource) => {
        const movement = StockMovementAssembler.toEntityFromResource(resource);

        this.movements.update((movements) => [...movements, movement]);
      }),
    );
  }
}
