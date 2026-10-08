import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {FieldResource} from './field-response';
import {Observable} from 'rxjs';

@Service()
export class FieldApi{
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.cultivatechBaseApi}/fields`;

  getFields(): Observable<FieldResource[]> {
    return this.http.get<FieldResource[]>(this.resourceUrl);
  }

  getFieldById(id: number): Observable<FieldResource> {
    return this.http.get<FieldResource>(`${this.resourceUrl}/${id}`);
  }
}
