import {inject, Service} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable, of} from 'rxjs';
import {AnalyticsReportResource} from './analytics-report-response';
import {HarvestProjectionResource} from './harvest-projection.response';

@Service()
export class AnalyticsApi {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.cultivatechBaseApi}${environment.reportsEndpoint}`;
  private readonly projectionsUrl = `${environment.cultivatechBaseApi}${environment.harvestProjectionsEndpoint}`;

  getReportsByDeviceId(deviceId: number): Observable<AnalyticsReportResource[]> {
    const params = new HttpParams().set('device_id', deviceId.toString());
    return this.http.get<AnalyticsReportResource[]>(this.resourceUrl, { params });
  }

  /**
   * Retrieves the reports of several devices in a single scoped request.
   */
  getReportsByDeviceIds(deviceIds: number[]): Observable<AnalyticsReportResource[]> {
    if (deviceIds.length === 0) {
      return of([]);
    }
    let params = new HttpParams();
    for (const deviceId of deviceIds) {
      params = params.append('device_id', deviceId.toString());
    }
    return this.http.get<AnalyticsReportResource[]>(this.resourceUrl, { params });
  }

  getAllReports(): Observable<AnalyticsReportResource[]> {
    return this.http.get<AnalyticsReportResource[]>(this.resourceUrl);
  }

  getProjectionsByDeviceId(deviceId: number): Observable<HarvestProjectionResource[]> {
    const params = new HttpParams().set('device_id', deviceId.toString());
    return this.http.get<HarvestProjectionResource[]>(this.projectionsUrl, { params });
  }
}
