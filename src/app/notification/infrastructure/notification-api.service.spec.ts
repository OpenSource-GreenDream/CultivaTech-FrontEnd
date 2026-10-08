import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { NotificationType } from '../domain/model/notification-type.enum';
import { NotificationApiService } from './notification-api.service';
import { NotificationResource } from './notification-resource';

describe('NotificationApiService', () => {
  let service: NotificationApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificationApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('resolves a profile from the authenticated user id', () => {
    let resultProfileId: number | null | undefined;

    service.getProfileIdByUser(5).subscribe((profileId) => {
      resultProfileId = profileId;
    });

    const request = httpTestingController.expectOne(
      (candidate) => candidate.url === `${environment.cultivatechBaseApi}${environment.profilesEndpoint}`,
    );
    expect(request.request.params.get('user_id')).toBe('5');
    request.flush([{ id: 9, user_id: 5 }]);

    expect(resultProfileId).toBe(9);
  });

  it('gets notifications by profile in descending creation order', () => {
    const resource: NotificationResource = {
      id: 2,
      profile_id: 5,
      title: 'New review',
      message: 'A new review is available.',
      is_read: false,
      is_alert: false,
      type: 'NEW_REVIEW',
      field_id: null,
      created_at: '2026-09-21T06:01:10Z',
      updated_at: '2026-09-21T06:01:10Z',
    };
    let resultType: NotificationType | undefined;

    service.getByProfile(5).subscribe((notifications) => {
      resultType = notifications[0].type;
    });

    const request = httpTestingController.expectOne(
      (candidate) => candidate.url === `${environment.cultivatechBaseApi}${environment.notificationsEndpoint}`,
    );
    expect(request.request.params.get('profile_id')).toBe('5');
    expect(request.request.params.get('_sort')).toBe('created_at');
    expect(request.request.params.get('_order')).toBe('desc');
    request.flush([resource]);

    expect(resultType).toBe(NotificationType.NEW_REVIEW);
  });

  it('marks a notification as read with an update timestamp', () => {
    const resource: NotificationResource = {
      id: 2,
      profile_id: 5,
      title: 'New review',
      message: 'A new review is available.',
      is_read: true,
      is_alert: false,
      type: 'NEW_REVIEW',
      field_id: null,
      created_at: '2026-09-21T06:01:10Z',
      updated_at: '2026-09-21T06:01:10Z',
    };

    service.markAsRead({
      id: resource.id,
      profileId: resource.profile_id,
      title: resource.title,
      message: resource.message,
      isRead: false,
      isAlert: resource.is_alert,
      type: NotificationType.NEW_REVIEW,
      fieldId: resource.field_id,
      createdAt: resource.created_at,
      updatedAt: resource.updated_at,
    }).subscribe((notification) => expect(notification.isRead).toBe(true));

    const request = httpTestingController.expectOne(
      `${environment.cultivatechBaseApi}${environment.notificationsEndpoint}/${resource.id}`,
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body.is_read).toBe(true);
    expect(request.request.body.updated_at).toBeTruthy();
    request.flush(resource);
  });

  it('creates a product demand notification', () => {
    const resource: NotificationResource = {
      id: 10,
      profile_id: 5,
      title: 'Demand increased',
      message: 'Demand increased this week.',
      is_read: false,
      is_alert: false,
      type: 'PRODUCT_DEMAND',
      field_id: null,
      created_at: '2026-09-22T12:00:00Z',
      updated_at: '2026-09-22T12:00:00Z',
    };

    service.create({
      profileId: 5,
      title: resource.title,
      message: resource.message,
      type: NotificationType.PRODUCT_DEMAND,
      fieldId: null,
    }).subscribe((notification) => expect(notification.type).toBe(NotificationType.PRODUCT_DEMAND));

    const request = httpTestingController.expectOne(
      `${environment.cultivatechBaseApi}${environment.notificationsEndpoint}`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body.profile_id).toBe(5);
    expect(request.request.body.type).toBe('PRODUCT_DEMAND');
    expect(request.request.body.is_read).toBe(false);
    request.flush(resource);
  });

  it('creates a new review notification', () => {
    const resource: NotificationResource = {
      id: 11,
      profile_id: 5,
      title: 'New review received',
      message: 'A review was posted for your product.',
      is_read: false,
      is_alert: false,
      type: 'NEW_REVIEW',
      field_id: null,
      created_at: '2026-09-22T13:00:00Z',
      updated_at: '2026-09-22T13:00:00Z',
    };

    service.create({
      profileId: resource.profile_id,
      title: resource.title,
      message: resource.message,
      type: NotificationType.NEW_REVIEW,
      fieldId: null,
    }).subscribe((notification) => expect(notification.type).toBe(NotificationType.NEW_REVIEW));

    const request = httpTestingController.expectOne(
      `${environment.cultivatechBaseApi}${environment.notificationsEndpoint}`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body.type).toBe('NEW_REVIEW');
    request.flush(resource);
  });

  it('creates a product of interest notification', () => {
    const resource: NotificationResource = {
      id: 12,
      profile_id: 5,
      title: 'A product may interest you',
      message: 'A related product is now available.',
      is_read: false,
      is_alert: false,
      type: 'PRODUCT_OF_INTEREST',
      field_id: null,
      created_at: '2026-09-22T14:00:00Z',
      updated_at: '2026-09-22T14:00:00Z',
    };

    service.create({
      profileId: resource.profile_id,
      title: resource.title,
      message: resource.message,
      type: NotificationType.PRODUCT_OF_INTEREST,
      fieldId: null,
    }).subscribe((notification) => expect(notification.type).toBe(NotificationType.PRODUCT_OF_INTEREST));

    const request = httpTestingController.expectOne(
      `${environment.cultivatechBaseApi}${environment.notificationsEndpoint}`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body.type).toBe('PRODUCT_OF_INTEREST');
    request.flush(resource);
  });

  it('creates an offer or stock change notification', () => {
    const resource: NotificationResource = {
      id: 13,
      profile_id: 5,
      title: 'Offer and stock update',
      message: 'An offer is available and stock was updated.',
      is_read: false,
      is_alert: false,
      type: 'OFFER_OR_STOCK_CHANGE',
      field_id: null,
      created_at: '2026-09-22T15:00:00Z',
      updated_at: '2026-09-22T15:00:00Z',
    };

    service.create({
      profileId: resource.profile_id,
      title: resource.title,
      message: resource.message,
      type: NotificationType.OFFER_OR_STOCK_CHANGE,
      fieldId: null,
    }).subscribe((notification) => expect(notification.type).toBe(NotificationType.OFFER_OR_STOCK_CHANGE));

    const request = httpTestingController.expectOne(
      `${environment.cultivatechBaseApi}${environment.notificationsEndpoint}`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body.type).toBe('OFFER_OR_STOCK_CHANGE');
    request.flush(resource);
  });
});
