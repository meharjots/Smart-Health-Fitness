import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Activity, ApiResponse, PaginatedActivities } from '../models/models';

/**
 * ActivityService — full CRUD for /api/activities plus filtered listing.
 * Demonstrates all four HTTP verbs (GET, POST, PUT, DELETE) as required
 * by the CW2 rubric "Communication with Back-end".
 */
@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  /** GET /api/activities with optional filters. */
  list(opts: {
    activity_type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    per_page?: number;
  } = {}): Observable<ApiResponse<PaginatedActivities>> {
    let params = new HttpParams();
    if (opts.activity_type) params = params.set('activity_type', opts.activity_type);
    if (opts.start_date) params = params.set('start_date', opts.start_date);
    if (opts.end_date) params = params.set('end_date', opts.end_date);
    params = params.set('page', String(opts.page ?? 1));
    params = params.set('per_page', String(opts.per_page ?? 10));
    return this.http.get<ApiResponse<PaginatedActivities>>(`${this.api}/activities`, { params });
  }

  /** GET /api/activities/:id */
  get(id: string): Observable<ApiResponse<Activity>> {
    return this.http.get<ApiResponse<Activity>>(`${this.api}/activities/${id}`);
  }

  /** POST /api/activities */
  create(body: Partial<Activity>): Observable<ApiResponse<Activity>> {
    return this.http.post<ApiResponse<Activity>>(`${this.api}/activities`, body);
  }

  /** PUT /api/activities/:id */
  update(id: string, body: Partial<Activity>): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.api}/activities/${id}`, body);
  }

  /** DELETE /api/activities/:id */
  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.api}/activities/${id}`);
  }
}
