import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {InventoryResource} from './inventory-response';
import {CreateInventoryRequest} from './create-inventory.request';

@Service()
export class InventoryApi{
  private http = inject(HttpClient);
  private baseUrl = `${environment.cultivatechBaseApi}/inventories`;

  getInventories(): Observable<InventoryResource[]> {
    return this.http.get<InventoryResource[]>(this.baseUrl);
  }

  createInventory(request: CreateInventoryRequest): Observable<InventoryResource> {
    const payload = {
      product_id: request.productId,
      name: request.name,
      stock_quantity: request.stockQuantity,
      warehouse_location: request.warehouseLocation,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
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
