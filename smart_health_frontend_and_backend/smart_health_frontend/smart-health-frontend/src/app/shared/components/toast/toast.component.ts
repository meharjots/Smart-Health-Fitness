import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ToastService } from '../../../core/services/toast.service';

/**
 * ToastComponent — renders the global ToastService signal as a vertical
 * stack of dismissible Bootstrap-styled toasts in the top-right corner.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-container">
      <div *ngFor="let t of toast.toasts()"
           class="toast show align-items-center border-0 mb-2"
           [ngClass]="'text-bg-' + t.kind"
           role="alert">
        <div class="d-flex">
          <div class="toast-body">
            <i class="bi" [ngClass]="iconFor(t.kind)"></i>
            {{ t.message }}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto"
                  (click)="toast.dismiss(t.id)" aria-label="Close"></button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast {
      min-width: 280px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.15);
    }
    .toast-body i { margin-right: 0.5rem; }
  `]
})
export class ToastComponent {
  readonly toast = inject(ToastService);

  iconFor(kind: string): string {
    switch (kind) {
      case 'success': return 'bi-check-circle-fill';
      case 'danger':  return 'bi-exclamation-octagon-fill';
      case 'warning': return 'bi-exclamation-triangle-fill';
      default:        return 'bi-info-circle-fill';
    }
  }
}
