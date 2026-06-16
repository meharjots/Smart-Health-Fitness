import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { forkJoin, of, catchError, Observable } from 'rxjs';

import { AnalyticsService } from '../../core/services/analytics.service';
import {
  ActivitySummaryRow, BmiReport, CalorieBalance,
  NutritionSummaryRow, WeeklyProgressDay
} from '../../core/models/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

/**
 * AnalyticsComponent — the deep-dive reporting screen.
 *
 * Shows:
 *  - BMI report card
 *  - Adjustable calorie-balance range (querystring start_date / end_date)
 *  - Line chart: weekly calorie trend
 *  - Doughnut chart: total calories burned per activity type
 *  - Stacked-bar chart: protein / carbs / fats by meal type
 *  - Tabular summaries underneath each chart
 *
 * All five widgets are loaded in parallel with forkJoin and safely
 * fall back to null if an endpoint returns an error.
 */
@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, BaseChartDirective, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss'
})
export class AnalyticsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly analytics = inject(AnalyticsService);

  readonly loading = signal(true);
  readonly refreshing = signal(false);

  readonly bmi = signal<BmiReport | null>(null);
  readonly balance = signal<CalorieBalance | null>(null);
  readonly weekly = signal<WeeklyProgressDay[]>([]);
  readonly activitySummary = signal<ActivitySummaryRow[]>([]);
  readonly nutritionSummary = signal<NutritionSummaryRow[]>([]);

  readonly dateForm = this.fb.nonNullable.group({
    start_date: [''],
    end_date: ['']
  });

  // ---- Chart data signals -----------------------------------------------
  readonly lineChartData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  readonly doughnutData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });
  readonly macroBarData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });

  readonly lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } }
  };

  readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  readonly macroBarOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Grams' } }
    }
  };

  // Color palette used across the charts.
  private readonly palette = [
    '#0d6efd', '#198754', '#dc3545', '#ffc107', '#0dcaf0',
    '#6f42c1', '#fd7e14', '#20c997', '#d63384', '#6610f2'
  ];

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    const { start_date, end_date } = this.dateForm.getRawValue();

    forkJoin({
      bmi:       this.safe(this.analytics.bmiReport()),
      balance:   this.safe(this.analytics.calorieBalance(start_date || undefined, end_date || undefined)),
      weekly:    this.safe(this.analytics.weeklyProgress()),
      activity:  this.safe(this.analytics.activitySummary()),
      nutrition: this.safe(this.analytics.nutritionSummary())
    }).subscribe({
      next: (r) => {
        this.bmi.set(r.bmi?.data ?? null);
        this.balance.set(r.balance?.data ?? null);

        const weekly = r.weekly?.data?.weekly_breakdown ?? [];
        this.weekly.set(weekly);
        this.buildLineChart(weekly);

        const acts = r.activity?.data?.activity_summary ?? [];
        this.activitySummary.set(acts);
        this.buildDoughnut(acts);

        const nuts = r.nutrition?.data?.nutrition_summary ?? [];
        this.nutritionSummary.set(nuts);
        this.buildMacroBar(nuts);
      },
      complete: () => this.loading.set(false)
    });
  }

  applyRange(): void {
    this.refreshing.set(true);
    const { start_date, end_date } = this.dateForm.getRawValue();
    this.analytics.calorieBalance(start_date || undefined, end_date || undefined).subscribe({
      next: (res) => this.balance.set(res.data ?? null),
      complete: () => this.refreshing.set(false)
    });
  }

  resetRange(): void {
    this.dateForm.reset({ start_date: '', end_date: '' });
    this.applyRange();
  }

  private buildLineChart(rows: WeeklyProgressDay[]): void {
    this.lineChartData.set({
      labels: rows.map(r => r.day.substring(0, 3)),
      datasets: [
        {
          label: 'Calories consumed',
          data: rows.map(r => r.calories_consumed),
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13,110,253,0.15)',
          fill: true,
          tension: 0.35
        },
        {
          label: 'Calories burned',
          data: rows.map(r => r.calories_burned),
          borderColor: '#198754',
          backgroundColor: 'rgba(25,135,84,0.15)',
          fill: true,
          tension: 0.35
        },
        {
          label: 'Net balance',
          data: rows.map(r => r.net),
          borderColor: '#dc3545',
          borderDash: [5, 5],
          fill: false,
          tension: 0.35
        }
      ]
    });
  }

  private buildDoughnut(rows: ActivitySummaryRow[]): void {
    this.doughnutData.set({
      labels: rows.map(r => r.activity_type.charAt(0).toUpperCase() + r.activity_type.slice(1)),
      datasets: [{
        data: rows.map(r => r.total_calories_burned),
        backgroundColor: this.palette.slice(0, rows.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    });
  }

  private buildMacroBar(rows: NutritionSummaryRow[]): void {
    this.macroBarData.set({
      labels: rows.map(r => r.meal_type.charAt(0).toUpperCase() + r.meal_type.slice(1)),
      datasets: [
        { label: 'Protein (g)', data: rows.map(r => r.total_protein_g), backgroundColor: '#0d6efd' },
        { label: 'Carbs (g)',   data: rows.map(r => r.total_carbs_g),   backgroundColor: '#ffc107' },
        { label: 'Fats (g)',    data: rows.map(r => r.total_fats_g),    backgroundColor: '#dc3545' }
      ]
    });
  }

  private safe<T>(obs: Observable<T>): Observable<T | null> {
    return obs.pipe(catchError(() => of(null as T | null)));
  }

  bmiClass(): string {
    const b = this.bmi()?.bmi;
    if (!b) return 'text-muted';
    if (b < 18.5) return 'text-warning';
    if (b < 25) return 'text-success';
    if (b < 30) return 'text-warning';
    return 'text-danger';
  }
}
