import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ActivityService } from './activity.service';
import { Activity } from '../models/models';
import { environment } from '../../../environments/environment';

/**
 * ActivityService unit tests — verify the full CRUD surface and that
 * querystring parameters are serialised correctly into the URL.
 */
describe('ActivityService', () => {
  let service: ActivityService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ActivityService]
    });
    service = TestBed.inject(ActivityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('GET /activities with pagination params', () => {
    service.list({ page: 2, per_page: 5 }).subscribe();
    const req = httpMock.expectOne(r =>
      r.url === `${environment.apiUrl}/activities`
      && r.params.get('page') === '2'
      && r.params.get('per_page') === '5'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'success', message: 'OK', data: {
      activity_logs: [], total: 0, page: 2, per_page: 5, total_pages: 0
    }});
  });

  it('GET /activities with filter params', () => {
    service.list({
      activity_type: 'running',
      start_date: '2026-01-01',
      end_date: '2026-03-31'
    }).subscribe();
    const req = httpMock.expectOne(r => {
      return r.url === `${environment.apiUrl}/activities`
        && r.params.get('activity_type') === 'running'
        && r.params.get('start_date') === '2026-01-01'
        && r.params.get('end_date') === '2026-03-31';
    });
    req.flush({ status: 'success', message: 'OK', data: null });
  });
  it('POST /activities sends the body verbatim', () => {
    const body: Partial<Activity> = {
      activity_type: 'cycling', duration_minutes: 40,
      calories_burned: 300, activity_date: '2026-03-11'
    };
    service.create(body).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/activities`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ status: 'success', message: 'OK' });
  });

  it('PUT /activities/:id', () => {
    service.update('abc123', { duration_minutes: 55 }).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/activities/abc123`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ duration_minutes: 55 });
    req.flush({ status: 'success', message: 'OK' });
  });

  it('DELETE /activities/:id', () => {
    service.delete('abc123').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/activities/abc123`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ status: 'success', message: 'OK' });
  });
});
