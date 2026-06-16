import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ConfirmDialogComponent — simple reusable yes/no modal.
 * Parent controls visibility via [visible] binding and responds to
 * (confirm) / (cancel) output events.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-backdrop" *ngIf="visible" (click)="cancel.emit()"></div>
    <div class="modal d-block" tabindex="-1" *ngIf="visible" role="dialog"
         aria-modal="true">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-exclamation-triangle-fill text-warning"></i>
              {{ title }}
            </h5>
          </div>
          <div class="modal-body">
            <p class="mb-0">{{ message }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light" (click)="cancel.emit()">
              {{ cancelLabel }}
            </button>
            <button type="button" class="btn"
                    [class.btn-danger]="kind === 'danger'"
                    [class.btn-primary]="kind === 'primary'"
                    (click)="confirm.emit()">
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15,23,42,0.5);
      z-index: 1055;
    }
    .modal { z-index: 1056; }
    .modal-title i { margin-right: 0.4rem; }
  `]
})
export class ConfirmDialogComponent {
  @Input() visible = false;
  @Input() title = 'Are you sure?';
  @Input() message = 'This action cannot be undone.';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() kind: 'danger' | 'primary' = 'danger';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
