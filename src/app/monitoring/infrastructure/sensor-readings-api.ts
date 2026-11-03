import {inject, Service} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {environment} from '../../../environments/environment';
import {SensorReadingResource} from './sensor-reading-response';

/**
 * Service to consume the `sensor_readings` endpoint.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class SensorReadingsApi {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.cultivatechBaseApi}${environment.sensorReadingsEndpoint}`;

  getReadingsByDeviceId(deviceId: number): Observable<SensorReadingResource[]> {
    const params = new HttpParams().set('device_id', deviceId.toString());
    return this.http.get<SensorReadingResource[]>(this.resourceUrl, { params });
  }

  /**
   * Retrieves the readings of several devices in a single scoped request.
   */
  getReadingsByDeviceIds(deviceIds: number[]): Observable<SensorReadingResource[]> {
    if (deviceIds.length === 0) {
      return of([]);
    }
    let params = new HttpParams();
    for (const deviceId of deviceIds) {
      params = params.append('device_id', deviceId.toString());
    }
    return this.http.get<SensorReadingResource[]>(this.resourceUrl, { params });
  }

  getReadings(): Observable<SensorReadingResource[]> {
    return this.http.get<SensorReadingResource[]>(this.resourceUrl);
  }
}
