import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * LoadingSpinnerComponent — drop-in spinner with optional message.
 * Use [inline]=true when you want it centred within a card body,
 * or [overlay]=true for a full-viewport backdrop.
 */
@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="overlay" class="overlay-loader">
      <div class="text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading…</span>
        </div>
        <div class="small text-muted mt-2">{{ message }}</div>
      </div>
    </div>

    <div *ngIf="!overlay" class="text-center py-4">
      <div class="spinner-border text-primary" role="status" aria-hidden="true"></div>
      <div class="small text-muted mt-2">{{ message }}</div>
    </div>
  `
})
export class LoadingSpinnerComponent {
  @Input() message = 'Loading…';
  @Input() overlay = false;
}
