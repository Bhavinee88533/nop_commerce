import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { RiderSessionService } from '../rider-session.service';

/**
 * Prevents already-converted riders from revisiting onboarding screen.
 */
export const nonRiderGuard: CanActivateFn = () => {
  const router = inject(Router);
  const sessionService = inject(RiderSessionService);

  return sessionService.refreshSession().pipe(
    map((session) => (session?.isRider ? router.createUrlTree(['/dashboard']) : true))
  );
};
