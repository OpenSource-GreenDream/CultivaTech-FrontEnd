import {inject, Service} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {forkJoin, Observable, of} from 'rxjs';
import {map} from 'rxjs';
import {environment} from '../../../environments/environment';
import {AnalyticsReportResource} from './analytics-report-response';
import {SensorStatisticsResource} from './sensor-statistics.response';

@Service()
export class AnalyticsApi {
  private readonly http = inject(HttpClient);
  private readonly reportsUrl = `${environment.cultivatechBaseApi}${environment.reportsEndpoint}`;
  private readonly devicesUrl = `${environment.cultivatechBaseApi}${environment.devicesEndpoint}`;

  getReportsByDeviceId(deviceId: number): Observable<AnalyticsReportResource[]> {
    return this.http.get<AnalyticsReportResource[]>(`${this.devicesUrl}/${deviceId}/reports`);
  }

  getReportsByDeviceIds(deviceIds: number[]): Observable<AnalyticsReportResource[]> {
    if (deviceIds.length === 0) {
      return of([]);
    }
    return forkJoin(deviceIds.map((deviceId) => this.getReportsByDeviceId(deviceId))).pipe(
      map((results) => results.flat()),
    );
  }

  generateReport(deviceId: number, request: { from: string; to: string }): Observable<AnalyticsReportResource[]> {
    return this.http.post<AnalyticsReportResource[]>(`${this.devicesUrl}/${deviceId}/reports`, request);
  }

  getStatistics(deviceId: number, from?: string, to?: string): Observable<SensorStatisticsResource[]> {
    let params = new HttpParams();
    if (from && to) {
      params = params.set('from', from).set('to', to);
    }
    return this.http.get<SensorStatisticsResource[]>(
      `${this.devicesUrl}/${deviceId}${environment.statisticsEndpoint}`,
      { params },
    );
  }
}