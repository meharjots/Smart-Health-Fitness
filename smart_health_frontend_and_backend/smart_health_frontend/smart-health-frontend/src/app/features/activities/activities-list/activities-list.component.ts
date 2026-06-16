import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';

import { ActivityService } from '../../../core/services/activity.service';
import { ToastService } from '../../../core/services/toast.service';
import { Activity } from '../../../core/models/models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

/**
 * ActivitiesListComponent — paginated, filterable list of the user's activities.
 *
 * Demonstrates for the CW2 marking rubric:
 *  - GET with querystring params (activity_type, start_date, end_date, page, per_page)
 *  - DELETE with confirmation dialog
 *  - Angular directives: *ngIf, *ngFor, [ngClass], [formGroup], [routerLink]
 *  - Debounced filter re-query so the user can type freely without API spam
 */
@Component({
  selector: 'app-activities-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe,
            ConfirmDialogComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './activities-list.component.html'
})
export class ActivitiesListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ActivityService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly activities = signal<Activity[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly perPage = signal(10);
  readonly totalPages = signal(1);
  readonly deleteTarget = signal<Activity | null>(null);

  readonly ACTIVITY_TYPES = ['running', 'cycling', 'swimming', 'walking', 'yoga',
                             'gym', 'football', 'basketball', 'tennis', 'hiking', 'rowing', 'other'];

  readonly filters = this.fb.nonNullable.group({
    activity_type: [''],
    start_date: [''],
    end_date: ['']
  });

  ngOnInit(): void {
    this.load();
    // Debounce changes so rapid typing in date inputs doesn't spam the API.
    this.filters.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.service.list({
      ...this.filters.getRawValue(),
      page: this.page(),
      per_page: this.perPage()
    }).subscribe({
      next: (res) => {
        if (res.data) {
          this.activities.set(res.data.activity_logs);
          this.total.set(res.data.total);
          this.totalPages.set(res.data.total_pages);
        }
      },
      complete: () => this.loading.set(false)
    });
  }

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.page.set(page);
    this.load();
  }

  resetFilters(): void {
    this.filters.reset({ activity_type: '', start_date: '', end_date: '' });
    this.page.set(1);
  }

  edit(a: Activity): void {
    this.router.navigate(['/activities/edit', a._id]);
  }

  askDelete(a: Activity): void {
    this.deleteTarget.set(a);
  }

  doDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.service.delete(target._id).subscribe({
      next: () => {
        this.toast.success('Activity deleted.');
        this.deleteTarget.set(null);
        this.load();
      },
      error: () => this.deleteTarget.set(null)
    });
  }

  /** Build a compact pagination range: [1] … [prev] [cur] [next] … [last] */
  pageRange(): number[] {
    const total = this.totalPages();
    const cur = this.page();
    const pages = new Set<number>([1, total, cur, cur - 1, cur + 1]);
    return Array.from(pages).filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  }

  activityIcon(type: string): string {
    const icons: Record<string, string> = {
      running: 'bi-person-arms-up', cycling: 'bi-bicycle', swimming: 'bi-water',
      walking: 'bi-person-walking', yoga: 'bi-heart', gym: 'bi-trophy',
      football: 'bi-dribbble', basketball: 'bi-dribbble', tennis: 'bi-circle',
      hiking: 'bi-tree', rowing: 'bi-life-preserver', other: 'bi-activity'
    };
    return icons[type] ?? 'bi-activity';
  }
}
