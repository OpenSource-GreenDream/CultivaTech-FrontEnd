import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {ProductResource} from './product-response';

@Service()
export class ProductApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.cultivatechBaseApi}/products`;

  getProducts(): Observable<ProductResource[]> {
    return this.http.get<ProductResource[]>(this.baseUrl);
  }

  getProductById(id: number): Observable<ProductResource> {
    return this.http.get<ProductResource>(`${this.baseUrl}/${id}`);
  }
}
