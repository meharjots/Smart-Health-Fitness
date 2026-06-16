import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { GoalsService } from '../../core/services/goals.service';
import { ToastService } from '../../core/services/toast.service';
import { FitnessGoals } from '../../core/models/models';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

/**
 * GoalsComponent — the user's fitness goals.
 * GET, PUT (partial update), and DELETE (clear all).
 */
@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe,
            ConfirmDialogComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './goals.component.html'
})
export class GoalsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(GoalsService);
  private readonly toast = inject(ToastService);

  readonly GOAL_TYPES = [
    { value: 'lose_weight',       label: 'Lose weight' },
    { value: 'gain_muscle',       label: 'Gain muscle' },
    { value: 'maintain',          label: 'Maintain current fitness' },
    { value: 'improve_endurance', label: 'Improve endurance' },
    { value: 'general_fitness',   label: 'General fitness' }
  ];

  readonly goals = signal<FitnessGoals | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showClearDialog = signal(false);

  readonly form = this.fb.nonNullable.group({
    target_weight_kg: [null as number | null, [Validators.min(20), Validators.max(500)]],
    daily_calorie_target: [null as number | null, [Validators.min(500), Validators.max(10000)]],
    weekly_workout_target: [null as number | null, [Validators.min(1), Validators.max(21)]],
    goal_type: [''],
    target_date: ['']
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.get().subscribe({
      next: (res) => {
        const g = res.data ?? {};
        this.goals.set(g);
        this.form.patchValue({
          target_weight_kg: g.target_weight_kg ?? null,
          daily_calorie_target: g.daily_calorie_target ?? null,
          weekly_workout_target: g.weekly_workout_target ?? null,
          goal_type: g.goal_type ?? '',
          target_date: g.target_date?.substring(0, 10) ?? ''
        });
      },
      complete: () => this.loading.set(false)
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const body: Record<string, unknown> = {};
    (Object.keys(raw) as (keyof typeof raw)[]).forEach(k => {
      const v = raw[k];
      if (v !== null && v !== '' && v !== undefined) {
        body[k as string] = v;
      }
    });

    if (Object.keys(body).length === 0) {
      this.toast.info('Enter at least one goal.');
      return;
    }

    this.saving.set(true);
    this.service.update(body).subscribe({
      next: (res) => {
        if (res.data) this.goals.set(res.data);
        this.toast.success('Goals updated.');
      },
      error: () => this.saving.set(false),
      complete: () => this.saving.set(false)
    });
  }

  confirmClear(): void {
    this.showClearDialog.set(false);
    this.service.clear().subscribe({
      next: () => {
        this.toast.success('Goals cleared.');
        this.form.reset({
          target_weight_kg: null, daily_calorie_target: null,
          weekly_workout_target: null, goal_type: '', target_date: ''
        });
        this.goals.set({});
      }
    });
  }

  hasAnyGoals(): boolean {
    const g = this.goals();
    if (!g) return false;
    return !!(g.target_weight_kg || g.daily_calorie_target ||
              g.weekly_workout_target || g.goal_type || g.target_date);
  }

  minDate(): string {
    return new Date().toISOString().substring(0, 10);
  }

  /** Map a goal_type enum string to a readable label. */
  goalTypeLabel(value?: string): string {
    const g = this.GOAL_TYPES.find(x => x.value === value);
    return g?.label ?? '—';
  }
}
