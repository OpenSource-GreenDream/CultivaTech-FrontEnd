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
import {CommunityApi} from '../../../../community/infrastructure/community-api';
import {CommunityProfile} from '../../../../community/domain/model/community-profile.entity';
import {CommunityProfileAssembler} from '../../../../community/infrastructure/community-profile.assembler';
import {Review} from '../../../../community/domain/model/review.entity';
import {ReviewAssembler} from '../../../../community/infrastructure/review.assembler';
import {Product} from '../../../../stock/domain/model/product.entity';

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
  private communityApi = inject(CommunityApi);

  readonly canAccessAgricultural = computed(() => canAccessAgriculturalModules(this.authService.currentUserRoles()));

  readonly fields = this.profileStore.fields;
  readonly devices = this.monitoringStore.devices;
  readonly products = this.stockStore.products;
  readonly notifications = this.notificationStore.notifications;
  readonly readings = this.monitoringStore.readings;

  readonly selectedDeviceId = signal<number | null>(null);

  readonly profileName = computed(() => this.profileContext.currentProfile()?.fundoName ?? '');

  // Commercial/community state
  readonly communityProfiles = signal<CommunityProfile[]>([]);
  readonly myReviews = signal<Review[]>([]);
  readonly commercialLoading = signal<boolean>(false);
  readonly commercialError = signal<boolean>(false);

  readonly publishedProductsCount = computed(() => this.products().length);
  readonly producersCount = computed(() => this.communityProfiles().filter((p) => Number(p.visibilityStatus) === 1).length);
  readonly myReviewsCount = computed(() => this.myReviews().length);
  readonly unreadNotificationsCount = computed(() => this.notificationStore.unreadCount());

  readonly recentProducts = computed<Product[]>(() => [...this.products()].slice(0, 3));
  readonly recentReviews = computed<Review[]>(() => [...this.myReviews()].slice(0, 3));
  readonly recentNotifications = computed(() => [...this.notifications()].slice(0, 3));

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
    if (!this.canAccessAgricultural()) {
      this.loadCommercialData();
      return;
    }
    this.profileContext.fetchCurrentProfile().subscribe();
    this.profileStore.loadFieldsForCurrentProfile().subscribe();
    this.stockStore.loadProducts().subscribe();
    this.monitoringStore.loadMonitoringData().subscribe();
    this.notificationStore.loadNotifications().subscribe();
  }

  private loadCommercialData(): void {
    this.commercialLoading.set(true);
    this.profileContext.fetchCurrentProfile().subscribe({
      next: (profile) => {
        if (!profile) {
          this.commercialLoading.set(false);
          return;
        }
        this.stockStore.loadProducts().subscribe({
          next: () => {},
          error: () => this.commercialError.set(true),
        });
        this.communityApi.getAllCommunityProfiles().subscribe({
          next: (profiles) => this.communityProfiles.set(profiles.map((r) => CommunityProfileAssembler.toEntityFromResource(r))),
          error: () => this.commercialError.set(true),
        });
        this.communityApi.getAllReviews().subscribe({
          next: (reviews) => {
            const authored = reviews
              .map((r) => ReviewAssembler.toEntityFromResource(r))
              .filter((r) => Number(r.authorProfileId) === Number(profile.id))
              .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
            this.myReviews.set(authored);
          },
          error: () => this.commercialError.set(true),
        });
        this.notificationStore.loadNotifications().subscribe({
          next: () => this.commercialLoading.set(false),
          error: () => {
            this.commercialError.set(true);
            this.commercialLoading.set(false);
          },
        });
      },
      error: () => {
        this.commercialError.set(true);
        this.commercialLoading.set(false);
      },
    });
  }

  selectDevice(deviceId: number): void {
    this.selectedDeviceId.set(deviceId);
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  viewProduct(product: Product): void {
    this.router.navigate(['/stock'], { queryParams: { product: product.id } });
  }

  producerName(product: Product): string {
    const field = this.profileStore.fields().find((f) => Number(f.id) === Number(product.fieldId));
    return field ? field.name : '';
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }
}