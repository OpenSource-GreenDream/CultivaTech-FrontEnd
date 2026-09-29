import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService, KeyIndicators } from '../../services/analytics';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics-dashboard.html',
  styleUrl: './analytics-dashboard.css',
})
export class AnalyticsDashboardComponent implements OnInit {
  indicators: KeyIndicators | null = null;
  loading = true;
  selectedDeviceId = 1;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loadIndicators();
  }

  loadIndicators(): void {
    this.loading = true;
    this.analyticsService.getIndicatorsByDeviceId(this.selectedDeviceId).subscribe({
      next: (data) => {
        this.indicators = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar indicadores de analítica', err);
        this.loading = false;
      },
    });
  }
}
