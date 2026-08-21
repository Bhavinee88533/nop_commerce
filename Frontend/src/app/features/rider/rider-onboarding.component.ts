import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RiderApiService } from './rider-api.service';

/**
 * Rider onboarding page.
 *
 * This page is available only for authenticated customers who are not riders yet.
 * On success, customer is converted into rider and redirected to dashboard.
 */
@Component({
  selector: 'app-rider-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rider-onboarding.component.html',
  styleUrl: './rider-onboarding.component.css'
})
export class RiderOnboardingComponent {
  vehicleType = 'Bike';
  licenseNumber = '';
  currentLocation = '';
  availability = true;

  loading = false;
  errorMessage = '';

  constructor(private readonly riderApi: RiderApiService, private readonly router: Router) {}

  submit(): void {
    this.errorMessage = '';

    if (!this.licenseNumber.trim()) {
      this.errorMessage = 'License number is required.';
      return;
    }

    this.loading = true;

    this.riderApi
      .onboard({
        vehicleType: this.vehicleType,
        licenseNumber: this.licenseNumber.trim(),
        currentLocation: this.currentLocation.trim(),
        availability: this.availability
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigateByUrl('/dashboard');
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.error ?? 'Unable to complete onboarding right now.';
        }
      });
  }
}
