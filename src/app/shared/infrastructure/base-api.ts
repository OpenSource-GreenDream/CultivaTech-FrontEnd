import {inject, Service} from '@angular/core';
import {BaseEntity} from '../domain/model/base.entity';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';

/**
 * Template to create a bounded-api.
 */
@Service()
export abstract class BaseApi<T extends BaseEntity> {
  protected readonly http = inject(HttpClient);
  protected abstract readonly baseUrl: string;
  protected abstract readonly endpoint: string;

  protected get resourceUrl(): string {
    return `${this.baseUrl}${this.endpoint}`;
  }

  /**
   * Get all registers
   * @param params this is the filter
   */
  getAll(params?: HttpParams): Observable<T[]>{
    return this.http.get<T[]>(this.resourceUrl, {params: params});
  }

  /**
   * Get by id a register
   * @param id register's identifier
   */
  getById(id: number): Observable<T>{
    return this.http.get<T>(`${this.resourceUrl}/${id}`);
  }

  /**
   * Create a new register
   * @param item new register
   */
  create(item: Omit<T, 'id'>): Observable<T>{
    return this.http.post<T>(this.resourceUrl, item);
  }

  /**
   * Update register
   * @param id register's identifier
   * @param item new register
   */
  update(id: number, item: Partial<T>): Observable<T>{
    return this.http.put<T>(`${this.resourceUrl}/${id}`, item);
  }

  /**
   * Deleted register
   * @param id register's identifier
   */
  delete(id: number): Observable<void>{
    return this.http.delete<void>(`${this.resourceUrl}/${id}`);
  }
}
