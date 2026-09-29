import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Report } from '../models/report';

export interface KeyIndicators {
  averageMean: number;
  averageVariance: number;
  averageDeviation: number;
  totalReports: number;
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private apiUrl = 'http://localhost:3000/reports';

  constructor(private http: HttpClient) {}

  getReports(): Observable<Report[]> {
    return this.http.get<Report[]>(this.apiUrl);
  }

  getReportByDeviceId(deviceId: number): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.apiUrl}?device_id=${deviceId}`);
  }

  // Métodos agregados para la Task 10.2: Indicadores clave
  getIndicatorsByDeviceId(deviceId: number): Observable<KeyIndicators> {
    return this.getReportByDeviceId(deviceId).pipe(
      map((reports) => {
        if (!reports || reports.length === 0) {
          return {
            averageMean: 0,
            averageVariance: 0,
            averageDeviation: 0,
            totalReports: 0,
            status: 'Sin Datos',
          };
        }
        const total = reports.length;
        const sumMean = reports.reduce((acc, r) => acc + r.mean_value, 0);
        const sumVariance = reports.reduce((acc, r) => acc + r.variance, 0);
        const sumDev = reports.reduce((acc, r) => acc + r.standard_deviation, 0);

        return {
          averageMean: +(sumMean / total).toFixed(2),
          averageVariance: +(sumVariance / total).toFixed(2),
          averageDeviation: +(sumDev / total).toFixed(2),
          totalReports: total,
          status: 'Óptimo',
        };
      }),
    );
  }
}
