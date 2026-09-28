import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { NotificationPreference } from '../domain/model/notification-preference.entity';
import { NotificationType } from '../domain/model/notification-type.enum';
import { NotificationPreferenceApiService } from './notification-preference-api.service';
import { NotificationPreferenceResource } from './notification-preference-resource';

describe('NotificationPreferenceApiService', () => {
  let service: NotificationPreferenceApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificationPreferenceApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('gets preferences for a profile', () => {
    const resource: NotificationPreferenceResource = {
      id: 4,
      profile_id: 12,
      type: NotificationType.SENSOR_ALERT,
      field_id: null,
      enabled: true,
      created_at: '2026-09-22T00:00:00Z',
      updated_at: '2026-09-22T00:00:00Z',
    };
    let resultType: NotificationType | undefined;

    service.getByProfile(12).subscribe((preferences) => {
      resultType = preferences[0].type;
    });

    const request = httpTestingController.expectOne(
      (candidate) => candidate.url === `${environment.cultivatechBaseApi}${environment.notificationPreferencesEndpoint}`,
    );
    expect(request.request.params.get('profile_id')).toBe('12');
    request.flush([resource]);

    expect(resultType).toBe(NotificationType.SENSOR_ALERT);
  });

  it('gets crop zones from the selected profile', () => {
    let resultFieldName: string | undefined;

    service.getFieldsByProfile(12).subscribe((fields) => {
      resultFieldName = fields[0].name;
    });

    const request = httpTestingController.expectOne(
      (candidate) => candidate.url === `${environment.cultivatechBaseApi}${environment.fieldsEndpoint}`,
    );
    expect(request.request.params.get('profile_id')).toBe('12');
    request.flush([{ id: 7, profile_id: 12, name: 'Field from API' }]);

    expect(resultFieldName).toBe('Field from API');
  });

  it('updates enabled and field association for a preference', () => {
    const preference = new NotificationPreference(
      4,
      12,
      NotificationType.SENSOR_ALERT,
      7,
      false,
      '2026-09-22T00:00:00Z',
      '2026-09-22T00:00:00Z',
    );
    const resource: NotificationPreferenceResource = {
      id: preference.id,
      profile_id: preference.profileId,
      type: preference.type,
      field_id: preference.fieldId,
      enabled: preference.enabled,
      created_at: preference.createdAt,
      updated_at: '2026-09-23T00:00:00Z',
    };

    service.update(preference).subscribe((updated) => expect(updated.enabled).toBe(false));

    const request = httpTestingController.expectOne(
      `${environment.cultivatechBaseApi}${environment.notificationPreferencesEndpoint}/${preference.id}`,
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body.enabled).toBe(false);
    expect(request.request.body.field_id).toBe(7);
    expect(request.request.body.updated_at).toBeTruthy();
    request.flush(resource);
  });

  it('creates a preference for an individual crop zone', () => {
    const resource: NotificationPreferenceResource = {
      id: 15,
      profile_id: 12,
      type: NotificationType.SENSOR_ALERT,
      field_id: 7,
      enabled: false,
      created_at: '2026-09-22T00:00:00Z',
      updated_at: '2026-09-22T00:00:00Z',
    };

    service.create(12, NotificationType.SENSOR_ALERT, 7, false).subscribe((preference) => {
      expect(preference.fieldId).toBe(7);
    });

    const request = httpTestingController.expectOne(
      `${environment.cultivatechBaseApi}${environment.notificationPreferencesEndpoint}`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body.profile_id).toBe(12);
    expect(request.request.body.type).toBe(NotificationType.SENSOR_ALERT);
    expect(request.request.body.field_id).toBe(7);
    expect(request.request.body.enabled).toBe(false);
    request.flush(resource);
  });
});
