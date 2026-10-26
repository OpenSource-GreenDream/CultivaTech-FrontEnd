import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {AnalyticsReportResource} from './analytics-report-response';
import {HarvestProjectionResource} from './harvest-projection.response';

@Service()
export class AnalyticsApi {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.cultivatechBaseApi}${environment.reportsEndpoint}`;
  private readonly projectionsUrl = `${environment.cultivatechBaseApi}${environment.harvestProjectionsEndpoint}`;

  getReportsByDeviceId(deviceId: number): Observable<AnalyticsReportResource[]> {
    return this.http.get<AnalyticsReportResource[]>(`${this.resourceUrl}?device_id=${deviceId}`);
  }

  getAllReports(): Observable<AnalyticsReportResource[]> {
    return this.http.get<AnalyticsReportResource[]>(this.resourceUrl);
  }

  getProjectionsByDeviceId(deviceId: number): Observable<HarvestProjectionResource[]> {
    return this.http.get<HarvestProjectionResource[]>(`${this.projectionsUrl}?device_id=${deviceId}`);
  }
}
