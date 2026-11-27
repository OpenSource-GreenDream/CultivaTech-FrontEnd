import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {environment} from '../../../environments/environment';
import {ProductResource} from './product-response';
import {CreateProductRequest} from './create-product.request';
import {map} from 'rxjs';

@Service()
export class ProductApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.cultivatechBaseApi}${environment.productsEndpoint}`;

  getProducts(): Observable<ProductResource[]> {
    return this.http.get<ProductResource[]>(this.baseUrl);
  }

  getProductById(id: number): Observable<ProductResource> {
    return this.http.get<ProductResource>(`${this.baseUrl}/${id}`);
  }

  getProductsByFieldId(fieldId: number): Observable<ProductResource[]> {
    return this.getProducts().pipe(
      map((products) => products.filter((product) => Number(product.fieldId) === Number(fieldId))),
    );
  }

  getProductsByFieldIds(fieldIds: number[]): Observable<ProductResource[]> {
    if (fieldIds.length === 0) {
      return of([]);
    }
    const allowed = new Set(fieldIds.map(Number));
    return this.getProducts().pipe(
      map((products) => products.filter((product) => product.fieldId !== null && allowed.has(Number(product.fieldId)))),
    );
  }

  createProduct(request: CreateProductRequest): Observable<ProductResource> {
    const payload = {
      inventoryId: request.inventoryId,
      fieldId: request.fieldId ?? null,
      name: request.name,
      description: request.description,
      price: request.price,
      type: request.type,
      imageUrl: request.imageUrl,
    };
    return this.http.post<ProductResource>(this.baseUrl, payload);
  }

  updateProduct(id: number, request: CreateProductRequest): Observable<ProductResource> {
    const payload = {
      inventoryId: request.inventoryId,
      fieldId: request.fieldId ?? null,
      name: request.name,
      description: request.description,
      price: request.price,
      type: request.type,
      imageUrl: request.imageUrl,
    };
    return this.http.put<ProductResource>(`${this.baseUrl}/${id}`, payload);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}