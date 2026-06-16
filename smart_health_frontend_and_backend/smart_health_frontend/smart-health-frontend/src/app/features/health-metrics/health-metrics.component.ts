import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { HealthMetricsService } from '../../core/services/health-metrics.service';
import { ToastService } from '../../core/services/toast.service';
import { HealthMetrics } from '../../core/models/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

/**
 * HealthMetricsComponent — view current vital stats (heart rate, BP,
 * sleep, VO2 max) plus the server-computed BMI and update them.
 *
 * All field ranges mirror the CW1 API validators so the client-side
 * validation catches issues before hitting the back-end.
 */
@Component({
  selector: 'app-health-metrics',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './health-metrics.component.html'
})
export class HealthMetricsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(HealthMetricsService);
  private readonly toast = inject(ToastService);

  readonly metrics = signal<HealthMetrics | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    heart_rate: [null as number | null, [Validators.min(20), Validators.max(300)]],
    systolic_bp: [null as number | null, [Validators.min(50), Validators.max(300)]],
    diastolic_bp: [null as number | null, [Validators.min(30), Validators.max(200)]],
    sleep_hours: [null as number | null, [Validators.min(0), Validators.max(24)]],
    resting_heart_rate: [null as number | null, [Validators.min(20), Validators.max(200)]],
    vo2_max: [null as number | null, [Validators.min(10), Validators.max(100)]]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.get().subscribe({
      next: (res) => {
        if (res.data) {
          this.metrics.set(res.data);
          this.form.patchValue({
            heart_rate: res.data.heart_rate ?? null,
            systolic_bp: res.data.systolic_bp ?? null,
            diastolic_bp: res.data.diastolic_bp ?? null,
            sleep_hours: res.data.sleep_hours ?? null,
            resting_heart_rate: res.data.resting_heart_rate ?? null,
            vo2_max: res.data.vo2_max ?? null
          });
        }
      },
      complete: () => this.loading.set(false)
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // Strip out null values so we don't overwrite existing metrics with blanks.
    const raw = this.form.getRawValue();
    const body: Partial<HealthMetrics> = {};
    (Object.keys(raw) as (keyof typeof raw)[]).forEach(k => {
      const v = raw[k];
      if (v !== null && v !== undefined && v !== ('' as unknown)) {
        (body as Record<string, unknown>)[k as string] = v;
      }
    });

    if (Object.keys(body).length === 0) {
      this.toast.info('Enter at least one metric.');
      return;
    }

    this.saving.set(true);
    this.service.update(body).subscribe({
      next: (res) => {
        if (res.data) this.metrics.set(res.data);
        this.toast.success('Health metrics updated.');
      },
      error: () => this.saving.set(false),
      complete: () => this.saving.set(false)
    });
  }

  bmiClass(bmi?: number): string {
    if (!bmi) return 'text-muted';
    if (bmi < 18.5) return 'text-warning';
    if (bmi < 25) return 'text-success';
    if (bmi < 30) return 'text-warning';
    return 'text-danger';
  }

  bmiCategory(bmi?: number): string {
    if (!bmi) return '—';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }
}
