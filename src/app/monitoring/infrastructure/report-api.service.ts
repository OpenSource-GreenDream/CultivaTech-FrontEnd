import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Report } from '../domain/model/report.entity';
import { ReportResource } from './report-resource';
import { ReportAssembler } from './report.assembler';

@Injectable({
  providedIn: 'root',
})
export class ReportApiService {
  private readonly baseUrl = `${environment.cultivatechBaseApi}${environment.reportsEndpoint}`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Report[]> {
    return this.http
      .get<ReportResource[]>(this.baseUrl)
      .pipe(
        map((resources: ReportResource[]) =>
          resources.map((resource: ReportResource) =>
            ReportAssembler.toEntityFromResource(resource),
          ),
        ),
      );
  }
}
