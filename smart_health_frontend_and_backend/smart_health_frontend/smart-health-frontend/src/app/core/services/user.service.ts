import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedUsers, User } from '../models/models';

/**
 * UserService — wraps the /profile and admin /users endpoints.
 * Filters (page, per_page, membership, search) are sent as query-string params
 * which Angular's HttpClient serialises automatically via HttpParams.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  /** GET /api/profile — return the currently authenticated user. */
  getProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.api}/profile`);
  }

  /** PUT /api/profile — partial update. */
  updateProfile(patch: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.api}/profile`, patch);
  }

  /** DELETE /api/profile — permanently delete the account. */
  deleteProfile(): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.api}/profile`);
  }

  // ---- Admin endpoints ----------------------------------------------------

  /** Admin: GET /api/users with optional filters. */
  listUsers(opts: {
    page?: number;
    per_page?: number;
    membership_type?: string;
    gender?: string;
    search?: string;
  } = {}): Observable<ApiResponse<PaginatedUsers>> {
    const params: Record<string, string> = {};
    if (opts.page) params['page'] = String(opts.page);
    if (opts.per_page) params['per_page'] = String(opts.per_page);
    if (opts.membership_type) params['membership_type'] = opts.membership_type;
    if (opts.gender) params['gender'] = opts.gender;
    if (opts.search) params['search'] = opts.search;
    return this.http.get<ApiResponse<PaginatedUsers>>(`${this.api}/users`, { params });
  }

  /** Admin: GET /api/users/:id */
  getUser(userId: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.api}/users/${userId}`);
  }

  /** Admin: DELETE /api/users/:id */
  deleteUser(userId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.api}/users/${userId}`);
  }

  /** Admin: PUT /api/users/:id/role */
  changeRole(userId: string, role: 'user' | 'admin'): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.api}/users/${userId}/role`, { role });
  }
}
