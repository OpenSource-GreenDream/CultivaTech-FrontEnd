import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {environment} from '../../../environments/environment';
import {InventoryResource} from './inventory-response';
import {CreateInventoryRequest} from './create-inventory.request';

@Service()
export class InventoryApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.cultivatechBaseApi}${environment.inventoriesEndpoint}`;
  private profilesUrl = `${environment.cultivatechBaseApi}${environment.profilesEndpoint}`;
  private fieldsUrl = `${environment.cultivatechBaseApi}${environment.fieldsEndpoint}`;

  getInventories(): Observable<InventoryResource[]> {
    return this.http.get<InventoryResource[]>(this.baseUrl);
  }

  getInventoryById(id: number): Observable<InventoryResource> {
    return this.http.get<InventoryResource>(`${this.baseUrl}/${id}`);
  }

  getInventoriesByProfileId(profileId: number): Observable<InventoryResource[]> {
    return this.http.get<InventoryResource[]>(`${this.profilesUrl}/${profileId}/inventories`);
  }

  getInventoriesByFieldId(fieldId: number): Observable<InventoryResource[]> {
    return this.http.get<InventoryResource[]>(`${this.fieldsUrl}/${fieldId}/inventories`);
  }

  createInventory(profileId: number, request: CreateInventoryRequest): Observable<InventoryResource> {
    const payload = {
      fieldId: request.fieldId,
      stockQuantity: request.stockQuantity,
    };
    return this.http.post<InventoryResource>(`${this.profilesUrl}/${profileId}/inventories`, payload);
  }

  updateInventory(id: number, fieldId: number, stockQuantity: number): Observable<InventoryResource> {
    const payload = {
      fieldId,
      stockQuantity,
    };
    return this.http.put<InventoryResource>(`${this.baseUrl}/${id}`, payload);
  }

  deleteInventory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}