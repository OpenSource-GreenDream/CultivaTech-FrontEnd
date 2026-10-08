import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SupplyResource } from './supply-response';

@Service()
export class StockMovementApi {
  private http = inject(HttpClient);

  private baseUrl = `${environment.cultivatechBaseApi}${environment.inventoriesEndpoint}`;

  getSupply(id: string): Observable<SupplyResource> {
    return this.http.get<SupplyResource>(`${this.baseUrl}/${id}`);
  }

  updateSupplyQuantity(id: string, quantity: number): Observable<SupplyResource> {
    return this.http.patch<SupplyResource>(`${this.baseUrl}/${id}`, { quantity });
  }
}
