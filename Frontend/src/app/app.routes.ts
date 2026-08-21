import { Routes } from '@angular/router';

/**
 * Application routes.
 *
 * Rider area is lazy loaded so the app shell stays small and route concerns
 * are isolated to the feature itself.
 */
export const routes: Routes = [
  { path: '', loadChildren: () => import('./features/rider/rider.routes').then((module) => module.RIDER_ROUTES) },
  { path: '**', redirectTo: '' }
];
