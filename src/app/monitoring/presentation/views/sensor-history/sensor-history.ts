import {Component, inject, OnInit} from '@angular/core';
import {MonitoringStore} from '../../../application/monitoring.store';
import {Router} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import {DatePipe} from '@angular/common';

@Component({
  imports: [
    TranslatePipe,
    DatePipe
  ],
  selector: 'app-sensor-history',
  styleUrl: './sensor-history.css',
  templateUrl: './sensor-history.html',
})
export class SensorHistory implements OnInit {
  private readonly monitoringStore = inject(MonitoringStore);
  private readonly router = inject(Router);

  readonly reports = this.monitoringStore.sortedReports;
  readonly loading = this.monitoringStore.loading;

  ngOnInit() {
    if (this.monitoringStore.reports().length === 0) {
      this.monitoringStore.loadMonitoringData().subscribe();
    }
  }

  goBack(): void {
    this.router.navigate(['/monitoring']);
  }
}
