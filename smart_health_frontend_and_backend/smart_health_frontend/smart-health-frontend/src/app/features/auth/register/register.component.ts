import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * RegisterComponent — full sign-up form matching the CW1 /register
 * validation: email format, age 1-120, height 50-300, weight 10-500,
 * gender enum, password >= 6 characters.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    full_name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm_password: ['', [Validators.required]],
    age: [25, [Validators.required, Validators.min(1), Validators.max(120)]],
    gender: ['male', [Validators.required]],
    height_cm: [170, [Validators.required, Validators.min(50), Validators.max(300)]],
    weight_kg: [70, [Validators.required, Validators.min(10), Validators.max(500)]],
    membership_type: ['free', [Validators.required]]
  }, { validators: passwordsMatch });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const { confirm_password, ...payload } = this.form.getRawValue();

    this.auth.register(payload).subscribe({
      next: () => {
        this.toast.success('Account created successfully!');
        this.router.navigateByUrl('/dashboard');
      },
      error: () => this.submitting.set(false),
      complete: () => this.submitting.set(false)
    });
  }
}

/** Cross-field validator: password and confirm_password must match. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const cpw = group.get('confirm_password')?.value;
  return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
}
