import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { StockMovementResource } from './stock-movement-response';
import { CreateStockMovementRequest } from '../domain/model';

@Service()
export class StockMovementApi {
  private http = inject(HttpClient);

  private baseUrl = `${environment.cultivatechBaseApi}/stock_movements`;

  getMovements(): Observable<StockMovementResource[]> {
    return this.http.get<StockMovementResource[]>(this.baseUrl);
  }

  createMovement(request: CreateStockMovementRequest): Observable<StockMovementResource> {
    return this.http.post<StockMovementResource>(this.baseUrl, request);
  }
}
