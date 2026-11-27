import {Component, computed, effect, inject, OnInit, signal} from '@angular/core';
import {Router} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import {DatePipe} from '@angular/common';
import {AuthService} from '../../../../iam/application/auth.service';
import {canAccessAgriculturalModules} from '../../../../shared/domain/access-policy';
import {ProfileStore} from '../../../../profile/application/profile.store';
import {ProfileContextService} from '../../../../profile/application/profile-context.service';
import {StockStore} from '../../../../stock/application/stock.store';
import {MonitoringStore} from '../../../../monitoring/application/monitoring.store';
import {NotificationStore} from '../../../../notification/application/notification.store';
import {TelemetryChartComponent} from '../../../../analytics/presentation/components/telemetry-chart/telemetry-chart';
import {SensorReading} from '../../../../monitoring/domain/model/sensor-reading.entity';

@Component({
  imports: [TranslatePipe, DatePipe, TelemetryChartComponent],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private profileStore = inject(ProfileStore);
  private profileContext = inject(ProfileContextService);
  private stockStore = inject(StockStore);
  private monitoringStore = inject(MonitoringStore);
  private notificationStore = inject(NotificationStore);

  readonly canAccessAgricultural = computed(() => canAccessAgriculturalModules(this.authService.currentUserRoles()));

  readonly fields = this.profileStore.fields;
  readonly devices = this.monitoringStore.devices;
  readonly products = this.stockStore.products;
  readonly notifications = this.notificationStore.notifications;
  readonly readings = this.monitoringStore.readings;

  readonly selectedDeviceId = signal<number | null>(null);

  constructor() {
    effect(() => {
      const devices = this.devices();
      if (this.selectedDeviceId() === null && devices.length > 0) {
        this.selectedDeviceId.set(devices[0].id);
      }
    });
  }

  readonly registeredFieldsCount = computed(() => this.fields().length);
  readonly activeDevicesCount = computed(() => this.devices().filter((d) => d.status === 'ACTIVE').length);
  readonly publishedProductsCount = computed(() => this.products().length);
  readonly unreadAlertsCount = computed(() => this.notifications().filter((n) => n.isAlert && !n.isRead).length);

  readonly recentAlerts = computed(() =>
    [...this.notifications()]
      .filter((n) => n.isAlert)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  );

  readonly moistureReadings = computed<SensorReading[]>(() => {
    const deviceId = this.selectedDeviceId();
    if (deviceId === null) return [];
    return this.readings()
      .filter((r) => Number(r.deviceId) === Number(deviceId) && r.parameter === 'MOISTURE')
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  });

  readonly today = new Date();

  readonly loading = computed(() =>
    this.profileStore.fields().length === 0 && this.monitoringStore.loading()
  );

  getLatestReading(deviceId: number): string {
    const reading = this.readings()
      .filter((r) => Number(r.deviceId) === Number(deviceId))
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];
    if (!reading) return '-';
    return `${reading.value} ${reading.unit}`;
  }

  ngOnInit(): void {
    if (!this.canAccessAgricultural()) return;
    this.profileContext.fetchCurrentProfile().subscribe();
    this.profileStore.loadFieldsForCurrentProfile().subscribe();
    this.stockStore.loadProducts().subscribe();
    this.monitoringStore.loadMonitoringData().subscribe();
    this.notificationStore.loadNotifications().subscribe();
  }

  selectDevice(deviceId: number): void {
    this.selectedDeviceId.set(deviceId);
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }
}