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

  it('gets notifications by profile in descending creation order', () => {
    const resource: NotificationResource = {
      id: 2,
      profile_id: 5,
      title: 'New review',
      message: 'A new review is available.',
      is_read: false,
      is_alert: false,
      type: NotificationType.NEW_REVIEW,
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
      type: NotificationType.NEW_REVIEW,
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
      type: resource.type,
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
});
