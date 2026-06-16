import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

/**
 * Root dependency-injection config for the standalone-bootstrapped app.
 *  - Router with component input binding so route params auto-bind to @Input()s
 *  - HttpClient with functional JWT interceptor
 *  - Browser animations (for toast fades, modal transitions)
 *
 * Note: Chart.js is registered globally below (see Chart.register call) so we
 * don't need provideCharts here. ng2-charts v6 uses BaseChartDirective directly
 * in component imports.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations()
  ]
};