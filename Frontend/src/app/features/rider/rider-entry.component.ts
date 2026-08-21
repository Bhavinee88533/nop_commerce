import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RiderSessionService } from './rider-session.service';

/**
 * Feature entry component.
 *
 * Redirect strategy:
 * - authenticated non-rider => show "Become a Rider"
 * - authenticated rider => dashboard
 * - unauthenticated => nopCommerce login
 */
@Component({
  selector: 'app-rider-entry',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="entry-shell">
      <div class="entry-card">
        <h1 *ngIf="loading()">Preparing your rider portal</h1>
        <h1 *ngIf="!loading()">Welcome, {{ customerName() || 'Customer' }}</h1>
        <p *ngIf="loading()">We are checking your customer and rider profile.</p>
        <p *ngIf="!loading()">Complete onboarding to unlock rider dashboard, live status controls, and delivery insights.</p>
        <button *ngIf="!loading()" (click)="goToOnboarding()">Become a Rider</button>
      </div>
    </section>
  `,
  styles: [
    `
      .entry-shell {
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: radial-gradient(circle at 20% 20%, #f8d9ff 0%, #f5f0ff 40%, #f7f7ff 100%);
      }

      .entry-card {
        border-radius: 18px;
        padding: 1.5rem 1.75rem;
        background: rgba(255, 255, 255, 0.72);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.65);
        box-shadow: 0 12px 40px rgba(126, 56, 173, 0.17);
        width: min(480px, 92vw);
      }

      h1 {
        margin: 0 0 0.5rem;
        font-size: clamp(1.2rem, 3.8vw, 1.6rem);
      }

      p {
        margin: 0;
        color: #4d4061;
      }

      button {
        margin-top: 1rem;
        border: none;
        border-radius: 999px;
        padding: 0.7rem 1.1rem;
        background: linear-gradient(140deg, #ff93c7, #d468ff);
        color: #fff;
        font-weight: 700;
        cursor: pointer;
      }
    `
  ]
})
export class RiderEntryComponent {
  readonly loading = signal(true);
  readonly customerName = signal('');

  constructor(private readonly router: Router, private readonly sessionService: RiderSessionService) {
    this.sessionService.refreshSession().subscribe((session) => {
      if (!session?.authenticated) {
        window.location.href = '/login?returnUrl=%2Frider';
        return;
      }

      this.customerName.set(session.name);
      this.loading.set(false);

      if (session.isRider) {
        this.router.navigateByUrl('/dashboard');
      }
    });
  }

  goToOnboarding(): void {
    this.router.navigateByUrl('/onboarding');
  }
}
