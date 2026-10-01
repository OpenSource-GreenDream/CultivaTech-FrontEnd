import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { SupplyResource } from './supply-response';
import { CreateSupplyRequest } from '../domain/model/create-supply.request';
import { UpdateStockRequest } from '../domain/model/update-stock.request';

/**
 * Service to consume the Stock Management API.
 */
@Service()
export class StockApi {
  private http = inject(HttpClient);

  private baseUrl =
    `${environment.cultivatechBaseApi}${environment.inventoriesEndpoint}`;

  /**
   * Retrieves all supplies registered in the inventory.
   */
  getSupplies(): Observable<SupplyResource[]> {
    return this.http.get<SupplyResource[]>(this.baseUrl);
  }

  /**
   * Registers a new supply in the inventory.
   */
  createSupply(request: CreateSupplyRequest): Observable<SupplyResource> {
    return this.http.post<SupplyResource>(this.baseUrl, request);
  }

  /**
   * Updates the available quantity of a supply.
   */
  updateStock(
    id: string,
    request: UpdateStockRequest
  ): Observable<SupplyResource> {
    return this.http.patch<SupplyResource>(
      `${this.baseUrl}/${id}`,
      request
    );
  }
}
