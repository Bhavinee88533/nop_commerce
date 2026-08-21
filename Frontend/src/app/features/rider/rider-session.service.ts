import { Injectable, computed, signal } from '@angular/core';
import { catchError, of, tap, timeout } from 'rxjs';
import { RiderApiService } from './rider-api.service';
import { RiderSession } from './rider.models';

/**
 * Centralized rider-session state for route guards and feature pages.
 */
@Injectable({ providedIn: 'root' })
export class RiderSessionService {
  private readonly sessionState = signal<RiderSession | null>(null);
  private readonly loadingState = signal(false);

  readonly session = computed(() => this.sessionState());
  readonly loading = computed(() => this.loadingState());

  constructor(private readonly riderApi: RiderApiService) {}

  refreshSession() {
    this.loadingState.set(true);

    return this.riderApi.getSession().pipe(
      // Avoid indefinite "preparing" state when network/proxy stalls.
      timeout(10000),
      tap((session) => {
        this.sessionState.set(session);
        this.loadingState.set(false);
      }),
      catchError(() => {
        this.sessionState.set({
          authenticated: false,
          customerId: 0,
          name: '',
          email: '',
          isRider: false
        });
        this.loadingState.set(false);
        return of(this.sessionState());
      })
    );
  }

  setSession(session: RiderSession): void {
    this.sessionState.set(session);
  }

  clearSession(): void {
    this.sessionState.set(null);
  }
}
