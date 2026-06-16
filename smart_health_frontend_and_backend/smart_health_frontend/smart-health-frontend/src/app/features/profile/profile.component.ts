import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/models';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

/**
 * ProfileComponent — view, edit, or delete the signed-in user's profile.
 * PUT is partial: only fields that the user actually edits are sent.
 * DELETE triggers the confirm-dialog and, on success, logs the user out.
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, ConfirmDialogComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly user = signal<User | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showDeleteDialog = signal(false);

  readonly form = this.fb.nonNullable.group({
    full_name: ['', [Validators.required, Validators.minLength(2)]],
    age: [25, [Validators.required, Validators.min(1), Validators.max(120)]],
    gender: ['male', Validators.required],
    height_cm: [170, [Validators.required, Validators.min(50), Validators.max(300)]],
    weight_kg: [70, [Validators.required, Validators.min(10), Validators.max(500)]],
    membership_type: ['free', Validators.required]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.userService.getProfile().subscribe({
      next: (res) => {
        if (res.data) {
          this.user.set(res.data);
          this.form.patchValue({
            full_name: res.data.full_name,
            age: res.data.age,
            gender: res.data.gender,
            height_cm: res.data.height_cm,
            weight_kg: res.data.weight_kg,
            membership_type: res.data.membership_type
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
    // Only send fields that actually changed.
    const patch: Record<string, unknown> = {};
    Object.entries(this.form.controls).forEach(([key, ctrl]) => {
      if (ctrl.dirty) patch[key] = ctrl.value;
    });
    if (Object.keys(patch).length === 0) {
      this.toast.info('No changes to save.');
      return;
    }

    this.saving.set(true);
    this.userService.updateProfile(patch).subscribe({
      next: (res) => {
        if (res.data) {
          this.user.set(res.data);
          this.auth.updateLocalUser({
            full_name: res.data.full_name,
            email: res.data.email
          });
          this.toast.success('Profile updated.');
          this.form.markAsPristine();
        }
      },
      error: () => this.saving.set(false),
      complete: () => this.saving.set(false)
    });
  }

  confirmDelete(): void {
    this.userService.deleteProfile().subscribe({
      next: () => {
        this.toast.success('Account deleted.');
        this.auth.logout();
      }
    });
  }
}
