import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * authGuard — functional route guard.
 * Redirects unauthenticated users to /login, preserving the attempted URL
 * as a `redirect` query parameter so the user can be bounced back after signing in.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  router.navigate(['/login'], { queryParams: { redirect: state.url } });
  return false;
};
