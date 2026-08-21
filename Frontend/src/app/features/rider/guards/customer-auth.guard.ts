import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { RiderSessionService } from '../rider-session.service';

/**
 * Ensures customer session exists before entering rider feature pages.
 * If not authenticated, redirect user to standard nopCommerce login page.
 */
export const customerAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const sessionService = inject(RiderSessionService);

  return sessionService.refreshSession().pipe(
    map((session) => {
      if (session?.authenticated) {
        return true;
      }

      window.location.href = '/login?returnUrl=%2Frider';
      return router.createUrlTree(['/']);
    })
  );
};
