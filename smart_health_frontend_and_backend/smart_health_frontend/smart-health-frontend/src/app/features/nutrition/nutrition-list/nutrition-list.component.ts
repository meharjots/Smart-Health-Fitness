import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';

import { NutritionService } from '../../../core/services/nutrition.service';
import { ToastService } from '../../../core/services/toast.service';
import { NutritionLog } from '../../../core/models/models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

/**
 * NutritionListComponent — filter by meal type / date range,
 * paginate, edit, and delete nutrition entries. Mirrors the
 * activities list structure for UI consistency.
 */
@Component({
  selector: 'app-nutrition-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe,
            ConfirmDialogComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nutrition-list.component.html'
})
export class NutritionListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(NutritionService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

  readonly loading = signal(true);
  readonly logs = signal<NutritionLog[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly perPage = signal(10);
  readonly totalPages = signal(1);
  readonly deleteTarget = signal<NutritionLog | null>(null);

  readonly filters = this.fb.nonNullable.group({
    meal_type: [''],
    start_date: [''],
    end_date: ['']
  });

  ngOnInit(): void {
    this.load();
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
          this.logs.set(res.data.nutrition_logs);
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
    this.filters.reset({ meal_type: '', start_date: '', end_date: '' });
    this.page.set(1);
  }

  pageRange(): number[] {
    const total = this.totalPages();
    const cur = this.page();
    const pages = new Set<number>([1, total, cur, cur - 1, cur + 1]);
    return Array.from(pages).filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  }

  edit(log: NutritionLog): void {
    this.router.navigate(['/nutrition/edit', log._id]);
  }

  askDelete(log: NutritionLog): void {
    this.deleteTarget.set(log);
  }

  doDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.service.delete(target._id).subscribe({
      next: () => {
        this.toast.success('Meal log deleted.');
        this.deleteTarget.set(null);
        this.load();
      },
      error: () => this.deleteTarget.set(null)
    });
  }

  mealIcon(type: string): string {
    const icons: Record<string, string> = {
      breakfast: 'bi-sunrise', lunch: 'bi-sun', dinner: 'bi-moon', snack: 'bi-egg'
    };
    return icons[type] ?? 'bi-cup-straw';
  }

  mealBadgeClass(type: string): string {
    const classes: Record<string, string> = {
      breakfast: 'badge-soft-warning',
      lunch: 'badge-soft-primary',
      dinner: 'badge-soft-info',
      snack: 'badge-soft-success'
    };
    return classes[type] ?? 'badge-soft-primary';
  }
}
