import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastComponent } from './shared/components/toast/toast.component';

/**
 * Root component — composes the persistent UI chrome (navbar + toasts)
 * around the <router-outlet> where the active feature page renders.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-navbar></app-navbar>
    <app-toast></app-toast>
    <main>
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent {}
