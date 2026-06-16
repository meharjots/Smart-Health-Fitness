import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, HealthMetrics } from '../models/models';

/**
 * HealthMetricsService — GET/PUT the vital stats sub-document.
 * BMI is computed server-side and included on every GET.
 */
@Injectable({ providedIn: 'root' })
export class HealthMetricsService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  get(): Observable<ApiResponse<HealthMetrics>> {
    return this.http.get<ApiResponse<HealthMetrics>>(`${this.api}/health-metrics`);
  }

  update(body: Partial<HealthMetrics>): Observable<ApiResponse<HealthMetrics>> {
    return this.http.put<ApiResponse<HealthMetrics>>(`${this.api}/health-metrics`, body);
  }
}
