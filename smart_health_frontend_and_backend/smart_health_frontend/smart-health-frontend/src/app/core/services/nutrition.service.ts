import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, NutritionLog, PaginatedNutrition } from '../models/models';

/**
 * NutritionService — CRUD for /api/nutrition.
 * Filtering by meal_type and date range, with pagination.
 */
@Injectable({ providedIn: 'root' })
export class NutritionService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  list(opts: {
    meal_type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    per_page?: number;
  } = {}): Observable<ApiResponse<PaginatedNutrition>> {
    let params = new HttpParams();
    if (opts.meal_type) params = params.set('meal_type', opts.meal_type);
    if (opts.start_date) params = params.set('start_date', opts.start_date);
    if (opts.end_date) params = params.set('end_date', opts.end_date);
    params = params.set('page', String(opts.page ?? 1));
    params = params.set('per_page', String(opts.per_page ?? 10));
    return this.http.get<ApiResponse<PaginatedNutrition>>(`${this.api}/nutrition`, { params });
  }

  get(id: string): Observable<ApiResponse<NutritionLog>> {
    return this.http.get<ApiResponse<NutritionLog>>(`${this.api}/nutrition/${id}`);
  }

  create(body: Partial<NutritionLog>): Observable<ApiResponse<NutritionLog>> {
    return this.http.post<ApiResponse<NutritionLog>>(`${this.api}/nutrition`, body);
  }

  update(id: string, body: Partial<NutritionLog>): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.api}/nutrition/${id}`, body);
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.api}/nutrition/${id}`);
  }
}
