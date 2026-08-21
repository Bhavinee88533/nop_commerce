import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RiderApiService } from './rider-api.service';
import { PastDelivery, PastDeliveriesResponse } from './rider.models';

type SortOption = 'relevance' | 'price-asc' | 'price-desc';

@Component({
  selector: 'app-rider-past-deliveries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rider-past-deliveries.component.html',
  styleUrl: './rider-past-deliveries.component.css'
})
export class RiderPastDeliveriesComponent implements OnInit {
  private readonly responseState = signal<PastDeliveriesResponse | null>(null);
  private readonly loadingState = signal(true);
  private readonly errorState = signal('');
  private readonly sortState = signal<SortOption>('relevance');
  private readonly priceMinState = signal<number | null>(null);
  private readonly priceMaxState = signal<number | null>(null);

  readonly PAGE_SIZE = 10;

  // API filter form model
  dateFrom = '';
  dateTo = '';
  statusId: string = '';  // '' = all past statuses, '4' = Delivered, '5' = Failed

  // Client-side sort & price filter form models
  priceMin: number | null = null;
  priceMax: number | null = null;

  get response(): PastDeliveriesResponse | null {
    return this.responseState();
  }

  get items(): PastDelivery[] {
    return this.responseState()?.items ?? [];
  }

  get loading(): boolean {
    return this.loadingState();
  }

  get errorMessage(): string {
    return this.errorState();
  }

  get currentPage(): number {
    return (this.responseState()?.pageIndex ?? 0) + 1;
  }

  get totalPages(): number {
    return this.responseState()?.totalPages ?? 0;
  }

  get totalCount(): number {
    return this.responseState()?.totalCount ?? 0;
  }

  get hasPrev(): boolean {
    return (this.responseState()?.pageIndex ?? 0) > 0;
  }

  get hasNext(): boolean {
    const r = this.responseState();
    if (!r) return false;
    return r.pageIndex < r.totalPages - 1;
  }

  get sortOption(): SortOption {
    return this.sortState();
  }

  get hasPriceFilter(): boolean {
    return this.priceMinState() !== null || this.priceMaxState() !== null;
  }

  readonly displayedItems = computed<PastDelivery[]>(() => {
    let result = [...(this.responseState()?.items ?? [])];

    const min = this.priceMinState();
    const max = this.priceMaxState();
    if (min !== null) result = result.filter(i => i.orderTotal >= min);
    if (max !== null) result = result.filter(i => i.orderTotal <= max);

    const sort = this.sortState();
    if (sort === 'price-asc') result.sort((a, b) => a.orderTotal - b.orderTotal);
    else if (sort === 'price-desc') result.sort((a, b) => b.orderTotal - a.orderTotal);

    return result;
  });

  constructor(private readonly riderApi: RiderApiService) {}

  ngOnInit(): void {
    this.load(0);
  }

  applyFilters(): void {
    this.resetSortAndFilter();
    this.load(0);
  }

  clearFilters(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.statusId = '';
    this.resetSortAndFilter();
    this.load(0);
  }

  prevPage(): void {
    const pageIndex = this.responseState()?.pageIndex ?? 0;
    if (pageIndex > 0) this.load(pageIndex - 1);
  }

  nextPage(): void {
    const r = this.responseState();
    if (r && r.pageIndex < r.totalPages - 1) this.load(r.pageIndex + 1);
  }

  goToDashboard(): void {
    window.location.href = '/rider/dashboard';
  }

  setSort(option: SortOption): void {
    this.sortState.set(option);
  }

  applyPriceFilter(): void {
    this.priceMinState.set(this.priceMin);
    this.priceMaxState.set(this.priceMax);
  }

  clearPriceFilter(): void {
    this.priceMin = null;
    this.priceMax = null;
    this.priceMinState.set(null);
    this.priceMaxState.set(null);
  }

  private resetSortAndFilter(): void {
    this.sortState.set('relevance');
    this.priceMin = null;
    this.priceMax = null;
    this.priceMinState.set(null);
    this.priceMaxState.set(null);
  }

  private load(pageIndex: number): void {
    this.loadingState.set(true);
    this.errorState.set('');

    this.riderApi.getPastDeliveries({
      pageIndex,
      pageSize: this.PAGE_SIZE,
      dateFrom: this.dateFrom || undefined,
      dateTo: this.dateTo || undefined,
      statusId: this.statusId ? Number(this.statusId) : undefined
    }).subscribe({
      next: (res) => {
        this.responseState.set(res);
        this.loadingState.set(false);
      },
      error: (err) => {
        this.errorState.set(err?.error?.error ?? 'Failed to load delivery history.');
        this.loadingState.set(false);
      }
    });
  }
}
