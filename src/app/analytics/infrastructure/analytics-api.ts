import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {AnalyticsReportResource} from './analytics-report-response';

@Service()
export class AnalyticsApi {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.cultivatechBaseApi}/reports`;

  getReportsByDeviceId(deviceId: number): Observable<AnalyticsReportResource[]> {
    return this.http.get<AnalyticsReportResource[]>(`${this.resourceUrl}?device_id=${deviceId}`);
  }

  getAllReports(): Observable<AnalyticsReportResource[]> {
    return this.http.get<AnalyticsReportResource[]>(this.resourceUrl);
  }
}
