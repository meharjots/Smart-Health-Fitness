import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ActivityService } from '../../../core/services/activity.service';
import { Activity, ApiResponse } from '../../../core/models/models';
import { Observable } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

/**
 * ActivityFormComponent — dual-purpose create / edit form.
 * The presence of an :id route parameter switches it into edit mode
 * and pre-populates the form via a GET /activities/:id.
 */
@Component({
  selector: 'app-activity-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './activity-form.component.html'
})
export class ActivityFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ActivityService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly editingId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly ACTIVITY_TYPES = ['running', 'cycling', 'swimming', 'walking', 'yoga',
                             'gym', 'football', 'basketball', 'tennis', 'hiking', 'rowing', 'other'];

  readonly form = this.fb.nonNullable.group({
    activity_type: ['running', Validators.required],
    duration_minutes: [30, [Validators.required, Validators.min(1), Validators.max(1440)]],
    calories_burned: [200, [Validators.required, Validators.min(0), Validators.max(10000)]],
    activity_date: [new Date().toISOString().substring(0, 10), Validators.required],
    notes: ['']
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingId.set(id);
      this.loading.set(true);
      this.service.get(id).subscribe({
        next: (res) => {
          if (res.data) {
            this.form.patchValue({
              activity_type: res.data.activity_type,
              duration_minutes: res.data.duration_minutes,
              calories_burned: res.data.calories_burned,
              activity_date: res.data.activity_date?.substring(0, 10),
              notes: res.data.notes ?? ''
            });
          }
        },
        complete: () => this.loading.set(false)
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const body = this.form.getRawValue() as Partial<Activity>;
    const id = this.editingId();

    const action$ = id
      ? this.service.update(id, body)
      : this.service.create(body);
    (action$ as Observable<ApiResponse<null> | ApiResponse<Activity>>).subscribe({
      next: () => {
        this.toast.success(id ? 'Activity updated.' : 'Activity logged.');
        this.router.navigate(['/activities']);
      },
      error: () => this.saving.set(false),
      complete: () => this.saving.set(false)
    });
  }
}
