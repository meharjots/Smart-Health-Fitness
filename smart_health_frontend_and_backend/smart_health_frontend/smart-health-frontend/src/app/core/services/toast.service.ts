import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'danger' | 'warning' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

/**
 * ToastService — lightweight, signal-based notification bus.
 * Components call success()/error()/etc; the <app-toast> component
 * subscribes to the signal and renders each message for ~4s.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private counter = 0;

  success(message: string): void { this.push('success', message); }
  error(message: string): void   { this.push('danger', message); }
  warn(message: string): void    { this.push('warning', message); }
  info(message: string): void    { this.push('info', message); }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: ToastKind, message: string): void {
    const id = ++this.counter;
    this.toasts.update((list) => [...list, { id, kind, message }]);
    // Auto-dismiss after 4 seconds.
    setTimeout(() => this.dismiss(id), 4000);
  }
}
