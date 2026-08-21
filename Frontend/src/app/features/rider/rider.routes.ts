import { Routes } from '@angular/router';
import { customerAuthGuard } from './guards/customer-auth.guard';
import { nonRiderGuard } from './guards/non-rider.guard';
import { riderOnlyGuard } from './guards/rider-only.guard';
import { RiderDashboardComponent } from './rider-dashboard.component';
import { RiderEntryComponent } from './rider-entry.component';
import { RiderOnboardingComponent } from './rider-onboarding.component';
import { RiderOrderDetailsComponent } from './rider-order-details.component';
import { RiderAcceptedOrdersComponent } from './rider-accepted-orders.component';
import { RiderPastDeliveriesComponent } from './rider-past-deliveries.component';

/**
 * Rider feature routes.
 *
 * Entry route checks customer session and redirects users based on rider existence.
 */
export const RIDER_ROUTES: Routes = [
  {
    path: '',
    component: RiderEntryComponent
  },
  {
    path: 'onboarding',
    component: RiderOnboardingComponent,
    canActivate: [customerAuthGuard, nonRiderGuard]
  },
  {
    path: 'dashboard',
    component: RiderDashboardComponent,
    canActivate: [customerAuthGuard, riderOnlyGuard]
  },
  {
    path: 'accepted-orders',
    component: RiderAcceptedOrdersComponent,
    canActivate: [customerAuthGuard, riderOnlyGuard]
  },
  {
    path: 'past-deliveries',
    component: RiderPastDeliveriesComponent,
    canActivate: [customerAuthGuard, riderOnlyGuard]
  },
  {
    path: 'orders/:orderId',
    component: RiderOrderDetailsComponent,
    canActivate: [customerAuthGuard, riderOnlyGuard]
  }
];
