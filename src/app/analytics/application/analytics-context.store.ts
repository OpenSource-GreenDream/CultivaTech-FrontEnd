import {inject, Service} from '@angular/core';
import {Observable, map} from 'rxjs';
import {AnalyticsApi} from '../infrastructure/analytics-api';
import {AnalyticsReportAssembler} from '../infrastructure/analytics-report.assembler';
import {AnalyticsReport} from '../domain/model/entity/analytics-report.entity';

/**
 * This is Anti Corruption Layer for Analytics Context
 * It is used when we want to get data from Analytics Context in other contexts, like Monitoring Context.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class AnalyticsContext {
  private readonly reportApi = inject(AnalyticsApi);

  getReportByDeviceId(deviceId: number): Observable<AnalyticsReport[]> {
    return this.reportApi.getReportsByDeviceId(deviceId).pipe(
      map((resources) => resources.map(AnalyticsReportAssembler.toEntityFromResource))
    );
  }

  getReportsByDeviceIds(deviceIds: number[]): Observable<AnalyticsReport[]> {
    return this.reportApi.getReportsByDeviceIds(deviceIds).pipe(
      map((resources) => resources.map(AnalyticsReportAssembler.toEntityFromResource))
    );
  }

  getAllReportsForAnalytics(): Observable<AnalyticsReport[]> {
    return this.reportApi.getAllReports().pipe(
      map((resources) => resources.map(AnalyticsReportAssembler.toEntityFromResource))
    );
  }
}
