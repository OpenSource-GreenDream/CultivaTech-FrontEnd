import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {InventoryResource} from './inventory-resource';

@Service()
export class InventoryApi{
  private http = inject(HttpClient);
  private baseUrl = `${environment.cultivatechBaseApi}/inventories`;

  getInventories(): Observable<InventoryResource[]> {
    return this.http.get<InventoryResource[]>(this.baseUrl);
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
