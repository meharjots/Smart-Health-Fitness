import { bootstrapApplication } from '@angular/platform-browser';
import { Chart, registerables } from 'chart.js';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Register all default Chart.js controllers/elements/scales/plugins.
// Required when using ng2-charts v6 without provideCharts().
Chart.register(...registerables);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));