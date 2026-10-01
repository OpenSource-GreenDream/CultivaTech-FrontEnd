import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Field } from '../domain/model/field.entity';
import { FieldResource } from './field-resource';
import { FieldAssembler } from './field.assembler';

const FIELDS_ENDPOINT = environment.fieldsEndpoint;

@Injectable({
  providedIn: 'root',
})
export class FieldApiService {
  private readonly http = inject(HttpClient);

  private readonly resourceUrl = `${environment.cultivatechBaseApi}${FIELDS_ENDPOINT}`;

  getAll(): Observable<Field[]> {
    return this.http
      .get<FieldResource[]>(this.resourceUrl)
      .pipe(map((resources) => resources.map(FieldAssembler.toEntityFromResource)));
  }
}
