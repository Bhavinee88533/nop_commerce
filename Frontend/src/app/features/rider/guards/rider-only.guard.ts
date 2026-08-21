import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { RiderSessionService } from '../rider-session.service';

/**
 * Allows route activation only for customers already converted to riders.
 */
export const riderOnlyGuard: CanActivateFn = () => {
  const router = inject(Router);
  const sessionService = inject(RiderSessionService);

  return sessionService.refreshSession().pipe(
    map((session) => (session?.isRider ? true : router.createUrlTree(['/onboarding'])))
  );
};
