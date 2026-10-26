import {inject, OnDestroy, Service} from '@angular/core';
import {AnalyticsApi} from '../infrastructure/analytics-api';
import {map, Observable} from 'rxjs';
import {AnalyticsReportAssembler} from '../infrastructure/analytics-report.assembler';
import {AnalyticsReportEntity} from '../domain/model/entity/analytics-report.entity';

/**
 * This is Anti Corruption Layer for Analytics Context
 * It is used when we want to get data from Analytics Context in other contexts, like Monitoring Context.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class AnalyticsContext {
  private readonly reportApi = inject(AnalyticsApi);

  getReportByDeviceId(deviceId: number): Observable<AnalyticsReportEntity[]> {
    return this.reportApi.getReportsByDeviceId(deviceId).pipe(
      map((resources) => resources.map(AnalyticsReportAssembler.toEntityFromResource))
    );
  }

  getAllReportsForAnalytics(): Observable<AnalyticsReportEntity[]> {
    return this.reportApi.getAllReports().pipe(
      map((resources) => resources.map(AnalyticsReportAssembler.toEntityFromResource))
    );
  }
}
