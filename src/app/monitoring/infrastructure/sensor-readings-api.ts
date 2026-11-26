import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {forkJoin, Observable, of} from 'rxjs';
import {map} from 'rxjs';
import {environment} from '../../../environments/environment';
import {SensorReadingResource} from './sensor-reading-response';
import {RegisterSensorReadingRequest} from './register-sensor-reading.request';

@Service()
export class SensorReadingsApi {
  private readonly http = inject(HttpClient);
  private readonly readingsUrl = `${environment.cultivatechBaseApi}${environment.sensorReadingsEndpoint}`;
  private readonly devicesUrl = `${environment.cultivatechBaseApi}${environment.devicesEndpoint}`;

  getReadings(): Observable<SensorReadingResource[]> {
    return this.http.get<SensorReadingResource[]>(this.readingsUrl);
  }

  getReadingsByDeviceId(deviceId: number): Observable<SensorReadingResource[]> {
    return this.http.get<SensorReadingResource[]>(`${this.devicesUrl}/${deviceId}/sensor-readings`);
  }

  /**
   * Aggregates readings from several devices using the real nested endpoints.
   * Empty input does not trigger any HTTP request.
   */
  getReadingsByDeviceIds(deviceIds: number[]): Observable<SensorReadingResource[]> {
    if (deviceIds.length === 0) {
      return of([]);
    }
    return forkJoin(deviceIds.map((deviceId) => this.getReadingsByDeviceId(deviceId))).pipe(
      map((results) => results.flat()),
    );
  }

  createReading(deviceId: number, request: RegisterSensorReadingRequest): Observable<SensorReadingResource> {
    return this.http.post<SensorReadingResource>(
      `${this.devicesUrl}/${deviceId}/sensor-readings`,
      request,
    );
  }

  deleteReading(sensorReadingId: number): Observable<void> {
    return this.http.delete<void>(`${this.readingsUrl}/${sensorReadingId}`);
  }
}