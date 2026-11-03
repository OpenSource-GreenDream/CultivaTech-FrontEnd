import {inject, Service} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable, of} from 'rxjs';
import {ProductResource} from './product-response';
import {CreateProductRequest} from './create-product.request';

@Service()
export class ProductApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.cultivatechBaseApi}${environment.productsEndpoint}`;

  getProducts(): Observable<ProductResource[]> {
    return this.http.get<ProductResource[]>(this.baseUrl);
  }

  /**
   * Retrieves the products owned by a field in a single scoped query.
   */
  getProductsByFieldId(fieldId: number): Observable<ProductResource[]> {
    const params = new HttpParams().set('field_id', fieldId.toString());
    return this.http.get<ProductResource[]>(this.baseUrl, { params });
  }

  /**
   * Retrieves the products of several fields in a single scoped request.
   */
  getProductsByFieldIds(fieldIds: number[]): Observable<ProductResource[]> {
    if (fieldIds.length === 0) {
      return of([]);
    }
    let params = new HttpParams();
    for (const fieldId of fieldIds) {
      params = params.append('field_id', fieldId.toString());
    }
    return this.http.get<ProductResource[]>(this.baseUrl, { params });
  }

  getProductById(id: number): Observable<ProductResource> {
    return this.http.get<ProductResource>(`${this.baseUrl}/${id}`);
  }

  /**
   * Registers a new catalog product linked to the selected field (batch).
   */
  createProduct(request: CreateProductRequest): Observable<ProductResource> {
    const now = new Date().toISOString();
    const payload = {
      field_id: request.fieldId,
      name: request.name,
      description: request.description,
      price: request.price,
      image_url: request.imageUrl,
      created_at: now,
      updated_at: now,
    };
    return this.http.post<ProductResource>(this.baseUrl, payload);
  }
}
