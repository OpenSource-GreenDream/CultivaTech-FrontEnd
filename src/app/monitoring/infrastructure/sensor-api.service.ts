import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sensor } from '../domain/model/sensor.entity';
import { SensorCreateRequest } from '../domain/model/sensor-create.request';
import { SensorResource } from './sensor-resource';
import { SensorAssembler } from './sensor.assembler';

const DEVICES_ENDPOINT = environment.devicesEndpoint;

@Service()
export class SensorApiService {
  private readonly http = inject(HttpClient);

  private readonly resourceUrl = `${environment.cultivatechBaseApi}${DEVICES_ENDPOINT}`;

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
