import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * adminGuard — restricts routes to users whose JWT carries the admin role.
 * Non-admin users are bounced to the dashboard with an explanatory toast.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);
  const router = inject(Router);

  if (auth.isAdmin()) return true;

  toast.error('Admin access required.');
  router.navigate(['/dashboard']);
  return false;
};
