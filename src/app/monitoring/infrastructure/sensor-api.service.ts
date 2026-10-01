import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sensor } from '../domain/model/sensor.entity';
import { SensorCreateRequest } from '../domain/model/sensor-create.request';
import { SensorResource } from './sensor-resource';
import { SensorAssembler } from './sensor.assembler';

const DEVICES_ENDPOINT = environment.devicesEndpoint;

@Injectable({
  providedIn: 'root',
})
export class SensorApiService {
  private readonly http = inject(HttpClient);

  private readonly resourceUrl = `${environment.cultivatechBaseApi}${DEVICES_ENDPOINT}`;

  getAll(): Observable<Sensor[]> {
    return this.http
      .get<SensorResource[]>(this.resourceUrl)
      .pipe(
        map((resources) =>
          resources.map((resource) => SensorAssembler.toEntityFromResource(resource)),
        ),
      );
  }

  create(request: SensorCreateRequest): Observable<Sensor> {
    const payload = {
      code: request.code,
      field_id: request.fieldId,
    };

    return this.http
      .post<SensorResource>(this.resourceUrl, payload)
      .pipe(map(SensorAssembler.toEntityFromResource));
  }
}
