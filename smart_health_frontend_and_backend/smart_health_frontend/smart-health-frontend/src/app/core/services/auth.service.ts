import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ApiResponse, AuthPayload, RegisterPayload, User, UserRole
} from '../models/models';

/**
 * AuthService — central authentication store.
 *
 * Responsibilities:
 *  - Persist / restore the JWT token and user profile (localStorage).
 *  - Expose reactive Angular signals so guards and components can react
 *    instantly to login / logout / role changes without Observables.
 *  - Call the Flask API's /api/login and /api/register endpoints.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly TOKEN_KEY = 'sh_token';
  private readonly USER_KEY = 'sh_user';
  private readonly api = environment.apiUrl;

  /** Current user, or null when logged out. Reactive via Angular signals. */
  readonly currentUser = signal<AuthPayload | null>(this.restore());
  /** Derived: true when a user is authenticated. */
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  /** Derived: true when current user has admin role. */
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor() {
    // Multi-tab support: sync state when localStorage changes in another tab.
    window.addEventListener('storage', (e) => {
      if (e.key === this.TOKEN_KEY) {
        this.currentUser.set(this.restore());
      }
    });
  }

  /** POST /api/login — authenticate and persist JWT. */
  login(email: string, password: string): Observable<ApiResponse<AuthPayload>> {
    return this.http
      .post<ApiResponse<AuthPayload>>(`${this.api}/login`, { email, password })
      .pipe(tap((res) => res.data && this.persist(res.data)));
  }

  /** POST /api/register — create account and auto-login. */
  register(payload: Record<string, unknown>): Observable<ApiResponse<RegisterPayload>> {
    return this.http
      .post<ApiResponse<RegisterPayload>>(`${this.api}/register`, payload)
      .pipe(tap((res) => {
        if (res.data) {
          this.persist({
            access_token: res.data.access_token,
            user_id: res.data.user._id,
            email: res.data.user.email,
            full_name: res.data.user.full_name,
            role: res.data.user.role
          });
        }
      }));
  }

  /** Clear local auth state and bounce to /login. */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /** Return the raw JWT token string (or null). Used by the HTTP interceptor. */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** Convenience role check. */
  hasRole(role: UserRole): boolean {
    return this.currentUser()?.role === role;
  }

  /** Update the user's display name / role locally (after profile edit). */
  updateLocalUser(patch: Partial<Pick<User, 'full_name' | 'email'>>): void {
    const cur = this.currentUser();
    if (!cur) return;
    const next: AuthPayload = { ...cur, ...patch };
    this.currentUser.set(next);
    localStorage.setItem(this.USER_KEY, JSON.stringify(next));
  }

  // ---- private helpers ----------------------------------------------------
  private persist(payload: AuthPayload): void {
    localStorage.setItem(this.TOKEN_KEY, payload.access_token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(payload));
    this.currentUser.set(payload);
  }

  private restore(): AuthPayload | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const raw = localStorage.getItem(this.USER_KEY);
    if (!token || !raw) return null;
    try {
      return JSON.parse(raw) as AuthPayload;
    } catch {
      return null;
    }
  }
}
