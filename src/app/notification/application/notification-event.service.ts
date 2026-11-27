import {effect, inject, Service, signal} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {catchError, finalize, forkJoin, map, Observable, of} from 'rxjs';
import {AuthService} from '../../iam/application/auth.service';
import {ProfileContextService} from '../../profile/application/profile-context.service';
import {Profile} from '../../profile/domain/model/profile.entity';
import {Field} from '../../profile/domain/model/field.entity';
import {Product} from '../../stock/domain/model/product.entity';
import {Inventory} from '../../stock/domain/model/inventory.entity';
import {Device} from '../../monitoring/domain/model/device.entity';
import {NotificationApiService} from '../infrastructure/notification-api.service';

const PENDING_EVENTS_STORAGE_KEY = 'cultivatech_pending_lifecycle_events';

interface LifecycleNotificationEvent {
  userId: number | null;
  title: string;
  message: string;
  occurredAt: string;
}

interface LifecycleNotificationDraft {
  title: string;
  message: string;
}

@Service()
export class NotificationEventService {
  private readonly authService = inject(AuthService);
  private readonly profileContext = inject(ProfileContextService);
  private readonly notificationApi = inject(NotificationApiService);
  private readonly translate = inject(TranslateService);

  private readonly pendingEvents = signal<LifecycleNotificationEvent[]>(this.readPendingEvents());
  private flushing = false;

  constructor() {
    effect(() => {
      const profileId = this.profileContext.currentProfileId();
      if (profileId !== null) {
        this.flushPending(profileId);
      }
    });
  }

  accountCreated(emailAddress: string): void {
    this.emit({
      title: this.text('notification.events.account-created.title', {}, 'Cuenta creada con éxito'),
      message: this.text('notification.events.account-created.message', { email: emailAddress }, `La cuenta ${emailAddress} se creó correctamente.`),
    });
  }

  profileCreated(profile: Profile): void {
    this.emit(
      {
        title: this.text('notification.events.profile-created.title', {}, 'Perfil de fundo registrado'),
        message: this.text('notification.events.profile-created.message', { name: profile.fundoName }, `El perfil de fundo ${profile.fundoName} se registró correctamente.`),
      },
      profile.id,
    );
  }

  fieldCreated(field: Field): void {
    this.emit({
      title: this.text('notification.events.field-created.title', {}, 'Nuevo field registrado'),
      message: this.text('notification.events.field-created.message', { name: field.name, area: field.sizeM2 }, `Se agregó nuevo field: ${field.name} (${field.sizeM2} m²).`),
    });
  }

  fieldUpdated(field: Field): void {
    this.emit({
      title: this.text('notification.events.field-updated.title', {}, 'Field actualizado'),
      message: this.text('notification.events.field-updated.message', { name: field.name }, `El field ${field.name} se actualizó correctamente.`),
    });
  }

  deviceCreated(device: Device): void {
    this.emit({
      title: this.text('notification.events.device-created.title', {}, 'Sensor registrado'),
      message: this.text('notification.events.device-created.message', { mac: device.macAddress }, `El sensor ${device.macAddress} se registró correctamente.`),
    });
  }

  productCreated(product: Product): void {
    this.emit({
      title: this.text('notification.events.product-created.title', {}, 'Producto registrado'),
      message: this.text('notification.events.product-created.message', { name: product.name, price: product.price }, `Se creó el producto ${product.name} con un precio de ${product.price}.`),
    });
  }

  stockInitialized(inventory: Inventory, productName: string): void {
    this.emit({
      title: this.text('notification.events.stock-initialized.title', {}, 'Stock inicial registrado'),
      message: this.text('notification.events.stock-initialized.message', { product: productName, quantity: inventory.stockQuantity }, `Se registró el stock inicial de ${productName} con ${inventory.stockQuantity} unidades.`),
    });
  }

  stockUpdated(inventory: Inventory, productName: string, previousQuantity: number | null): void {
    this.emit({
      title: this.text('notification.events.stock-updated.title', {}, 'Stock actualizado'),
      message: this.text('notification.events.stock-updated.message', { product: productName, previous: previousQuantity ?? '-', quantity: inventory.stockQuantity }, `El stock de ${productName} cambió de ${previousQuantity ?? '-'} a ${inventory.stockQuantity} unidades.`),
    });
  }

  flushPending(profileId: number | null): void {
    if (this.flushing || profileId === null) {
      return;
    }

    const currentUserId = this.authService.currentUser()?.id ?? null;
    const pending = this.pendingEvents().filter((event) => event.userId === currentUserId);
    if (pending.length === 0) {
      return;
    }

    this.flushing = true;
    forkJoin(
      pending.map((event) =>
        this.persist(profileId, event).pipe(
          map((notification) => ({ event, delivered: notification !== null })),
        ),
      ),
    ).pipe(
      finalize(() => {
        this.flushing = false;
      }),
    ).subscribe((results) => {
      const delivered = new Set(
        results.filter((result) => result.delivered).map((result) => result.event),
      );
      if (delivered.size > 0) {
        this.updatePending((current) => current.filter((event) => !delivered.has(event)));
      }
    });
  }

  private text(key: string, params: Record<string, unknown>, fallback: string): string {
    const translated = this.translate.instant(key, params);
    return translated === key ? fallback : translated;
  }

  private emit(draft: LifecycleNotificationDraft, profileIdOverride?: number | null): void {
    const event: LifecycleNotificationEvent = {
      userId: this.authService.currentUser()?.id ?? null,
      title: draft.title,
      message: draft.message,
      occurredAt: new Date().toISOString(),
    };

    const profileId = profileIdOverride ?? this.profileContext.currentProfileId();
    if (profileId === null) {
      this.enqueue(event);
      return;
    }

    this.flushPending(profileId);
    this.persist(profileId, event).subscribe((notification) => {
      if (notification === null) {
        this.enqueue(event);
      }
    });
  }

  private persist(profileId: number, event: LifecycleNotificationEvent): Observable<unknown | null> {
    return this.notificationApi.create({
      profileId,
      title: event.title,
      message: event.message,
      isAlert: false,
    }).pipe(
      catchError(() => of(null)),
    );
  }

  private enqueue(event: LifecycleNotificationEvent): void {
    this.updatePending((current) => [...current, event]);
  }

  private updatePending(update: (current: LifecycleNotificationEvent[]) => LifecycleNotificationEvent[]): void {
    const next = update(this.pendingEvents());
    this.pendingEvents.set(next);
    this.writePendingEvents(next);
  }

  private readPendingEvents(): LifecycleNotificationEvent[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const raw = localStorage.getItem(PENDING_EVENTS_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter((event): event is LifecycleNotificationEvent =>
        event
        && typeof event.title === 'string'
        && typeof event.message === 'string',
      );
    } catch {
      return [];
    }
  }

  private writePendingEvents(events: LifecycleNotificationEvent[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      if (events.length === 0) {
        localStorage.removeItem(PENDING_EVENTS_STORAGE_KEY);
      } else {
        localStorage.setItem(PENDING_EVENTS_STORAGE_KEY, JSON.stringify(events));
      }
    } catch {
      // Ignore storage quota errors
    }
  }
}