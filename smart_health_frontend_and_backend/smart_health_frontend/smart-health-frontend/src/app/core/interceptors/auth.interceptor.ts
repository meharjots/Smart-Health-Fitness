import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * authInterceptor — functional HTTP interceptor (Angular 15+ style).
 *
 *   1. Attaches an `Authorization: Bearer <jwt>` header to every outgoing
 *      request when a token is available, except for /login and /register
 *      (where no token yet exists).
 *   2. Intercepts 401 Unauthorised responses — on an expired/invalid token
 *      the user is force-logged-out and redirected to /login.
 *   3. Surfaces helpful error messages via the toast service.
 *
 * This single piece of code is all the front-end needs to stay in sync
 * with the Flask JWT-Extended back-end from CW1.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);

  const isAuthEndpoint =
    req.url.endsWith('/login') || req.url.endsWith('/register');

  const token = auth.getToken();
  const authed =
    token && !isAuthEndpoint
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authed).pipe(
    catchError((err: HttpErrorResponse) => {
      // Server responded 401 — treat session as expired.
      if (err.status === 401 && !isAuthEndpoint) {
        toast.warn('Session expired — please log in again.');
        auth.logout();
      } else if (err.status === 403) {
        toast.error('You do not have permission to perform this action.');
      } else if (err.status === 0) {
        toast.error('Cannot reach the API server. Is the Flask back-end running?');
      } else if (err.error?.message) {
        // Server-provided message (from utils.error in CW1)
        toast.error(err.error.message);
      } else if (err.status >= 500) {
        toast.error('Server error — please try again later.');
      }
      return throwError(() => err);
    })
  );
};
