import {inject, Service} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {InventoryResource} from './inventory-response';
import {CreateInventoryRequest} from './create-inventory.request';

@Service()
export class InventoryApi{
  private http = inject(HttpClient);
  private baseUrl = `${environment.cultivatechBaseApi}${environment.inventoriesEndpoint}`;

  getInventories(): Observable<InventoryResource[]> {
    return this.http.get<InventoryResource[]>(this.baseUrl);
  }

  /**
   * Retrieves the inventories owned by a farm profile in a single scoped query.
   */
  getInventoriesByProfileId(profileId: number): Observable<InventoryResource[]> {
    const params = new HttpParams().set('profile_id', profileId.toString());
    return this.http.get<InventoryResource[]>(this.baseUrl, { params });
  }

  createInventory(request: CreateInventoryRequest): Observable<InventoryResource> {
    const now = new Date().toISOString();
    const payload = {
      product_id: request.productId,
      profile_id: request.profileId,
      field_id: request.fieldId,
      stock_quantity: request.stockQuantity,
      created_at: now,
      updated_at: now,
    };
    return this.http.post<InventoryResource>(this.baseUrl, payload);
  }

  getInventoryById(id: number): Observable<InventoryResource> {
    return this.http.get<InventoryResource>(`${this.baseUrl}/${id}`);
  }

  updateStockQuantity(id: number, stockQuantity: number): Observable<InventoryResource> {
    return this.http.patch<InventoryResource>(`${this.baseUrl}/${id}`, {
      stock_quantity: stockQuantity,
      updated_at: new Date().toISOString(),
    });
  }
}
