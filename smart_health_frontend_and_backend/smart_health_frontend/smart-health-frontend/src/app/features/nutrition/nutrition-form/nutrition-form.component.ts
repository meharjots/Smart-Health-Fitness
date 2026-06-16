import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { NutritionService } from '../../../core/services/nutrition.service';
import { NutritionLog, ApiResponse } from '../../../core/models/models';
import { Observable } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

/**
 * NutritionFormComponent — create/edit a meal log with macros.
 * Live-computes a "from macros" calorie estimate (4/4/9 rule) so the
 * user can sanity-check their input.
 */
@Component({
  selector: 'app-nutrition-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nutrition-form.component.html'
})
export class NutritionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(NutritionService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

  readonly editingId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  /** Reactive calorie estimate from macros: protein 4 kcal/g, carbs 4, fats 9. */
  readonly macroCalories = signal(0);

  readonly form = this.fb.nonNullable.group({
    meal_type: ['breakfast', Validators.required],
    food_name: ['', [Validators.required, Validators.minLength(2)]],
    calories_intake: [0, [Validators.required, Validators.min(0), Validators.max(10000)]],
    protein_grams: [0, [Validators.min(0), Validators.max(1000)]],
    carbs_grams: [0, [Validators.min(0), Validators.max(1000)]],
    fats_grams: [0, [Validators.min(0), Validators.max(1000)]],
    log_date: [new Date().toISOString().substring(0, 10), Validators.required]
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
              meal_type: res.data.meal_type,
              food_name: res.data.food_name,
              calories_intake: res.data.calories_intake,
              protein_grams: res.data.protein_grams,
              carbs_grams: res.data.carbs_grams,
              fats_grams: res.data.fats_grams,
              log_date: res.data.log_date?.substring(0, 10)
            });
          }
        },
        complete: () => this.loading.set(false)
      });
    }

    // Update the macro-calories hint whenever macros change.
    this.form.valueChanges.subscribe(v => {
      const p = Number(v.protein_grams) || 0;
      const c = Number(v.carbs_grams) || 0;
      const f = Number(v.fats_grams) || 0;
      this.macroCalories.set(Math.round(p * 4 + c * 4 + f * 9));
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const body = this.form.getRawValue() as Partial<NutritionLog>;
    const id = this.editingId();

    const action$ = id
      ? this.service.update(id, body)
      : this.service.create(body);
    (action$ as Observable<ApiResponse<null> | ApiResponse<NutritionLog>>).subscribe({
      next: () => {
        this.toast.success(id ? 'Meal log updated.' : 'Meal logged.');
        this.router.navigate(['/nutrition']);
      },
      error: () => this.saving.set(false),
      complete: () => this.saving.set(false)
    });
  }
}
