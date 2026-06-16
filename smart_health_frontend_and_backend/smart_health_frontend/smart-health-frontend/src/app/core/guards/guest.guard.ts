import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * guestGuard — applied to /login and /register so that an authenticated
 * user cannot see those pages again; they are redirected to /dashboard.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return true;
  router.navigate(['/dashboard']);
  return false;
};
