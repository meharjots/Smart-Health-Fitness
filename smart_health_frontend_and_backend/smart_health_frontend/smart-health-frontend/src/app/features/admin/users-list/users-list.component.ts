import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';

import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/models/models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

/**
 * UsersListComponent (admin) — paginated list of all users with:
 *  - free-text search on full_name
 *  - filter by membership_type / gender
 *  - inline role-change (user ⇄ admin) with a confirmation prompt
 *  - delete user with a confirmation modal
 *
 * Protected by both authGuard and adminGuard at the route level.
 */
@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe,
            ConfirmDialogComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users-list.component.html'
})
export class UsersListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly users = signal<User[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly perPage = signal(10);
  readonly totalPages = signal(1);

  readonly deleteTarget = signal<User | null>(null);
  readonly roleTarget = signal<User | null>(null);

  readonly filters = this.fb.nonNullable.group({
    search: [''],
    membership_type: [''],
    gender: ['']
  });

  ngOnInit(): void {
    this.load();
    this.filters.valueChanges.pipe(debounceTime(350)).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    const f = this.filters.getRawValue();
    this.service.listUsers({
      page: this.page(),
      per_page: this.perPage(),
      search: f.search || undefined,
      membership_type: f.membership_type || undefined,
      gender: f.gender || undefined
    }).subscribe({
      next: (res) => {
        if (res.data) {
          this.users.set(res.data.users);
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

  pageRange(): number[] {
    const total = this.totalPages();
    const cur = this.page();
    const pages = new Set<number>([1, total, cur, cur - 1, cur + 1]);
    return Array.from(pages).filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  }

  askDelete(u: User): void {
    if (u._id === this.auth.currentUser()?.user_id) {
      this.toast.warn("You can't delete your own admin account from this screen. Use Profile instead.");
      return;
    }
    this.deleteTarget.set(u);
  }

  doDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.service.deleteUser(target._id).subscribe({
      next: () => {
        this.toast.success(`${target.full_name} deleted.`);
        this.deleteTarget.set(null);
        this.load();
      },
      error: () => this.deleteTarget.set(null)
    });
  }

  askChangeRole(u: User): void {
    if (u._id === this.auth.currentUser()?.user_id) {
      this.toast.warn("You can't change your own role.");
      return;
    }
    this.roleTarget.set(u);
  }

  doChangeRole(): void {
    const target = this.roleTarget();
    if (!target) return;
    const newRole = target.role === 'admin' ? 'user' : 'admin';
    this.service.changeRole(target._id, newRole).subscribe({
      next: () => {
        this.toast.success(`${target.full_name} is now ${newRole}.`);
        this.roleTarget.set(null);
        this.load();
      },
      error: () => this.roleTarget.set(null)
    });
  }

  resetFilters(): void {
    this.filters.reset({ search: '', membership_type: '', gender: '' });
    this.page.set(1);
  }
}
