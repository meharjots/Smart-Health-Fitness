import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Observable, catchError, forkJoin, of } from 'rxjs';

import { AnalyticsService } from '../../core/services/analytics.service';
import { ActivityService } from '../../core/services/activity.service';
import { NutritionService } from '../../core/services/nutrition.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Activity, BmiReport, CalorieBalance, GoalTracking,
  NutritionLog, WeeklyProgressDay
} from '../../core/models/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

/**
 * DashboardComponent — the "home" page for authenticated users.
 *
 * It aggregates several API calls with forkJoin() to populate:
 *  - headline metric cards (today's calories, workouts this week, BMI)
 *  - a weekly bar chart showing calories in vs out
 *  - the most recent activities and meals
 *  - a quick-start strip of common actions
 *
 * Graceful degradation: if any individual endpoint 404s (e.g. no goals set),
 * the dashboard still renders — only the affected widget shows an empty state.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, BaseChartDirective, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly analytics = inject(AnalyticsService);
  private readonly activities = inject(ActivityService);
  private readonly nutrition = inject(NutritionService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly bmi = signal<BmiReport | null>(null);
  readonly balance = signal<CalorieBalance | null>(null);
  readonly goals = signal<GoalTracking | null>(null);
  readonly recentActivities = signal<Activity[]>([]);
  readonly recentMeals = signal<NutritionLog[]>([]);

  readonly barChartData = signal<ChartData<'bar'>>({
    labels: [],
    datasets: []
  });

  readonly barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: false }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Calories' } }
    }
  };

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);

    // Kick off 5 parallel API calls, but don't let a single failure
    // (e.g. 404 because no goals set yet) kill the whole page.
    forkJoin({
      bmi:        this.safe(this.analytics.bmiReport()),
      balance:    this.safe(this.analytics.calorieBalance()),
      weekly:     this.safe(this.analytics.weeklyProgress()),
      goals:      this.safe(this.analytics.goalTracking()),
      activities: this.safe(this.activities.list({ per_page: 5 })),
      meals:      this.safe(this.nutrition.list({ per_page: 5 }))
    }).subscribe({
      next: (r) => {
        this.bmi.set(r.bmi?.data ?? null);
        this.balance.set(r.balance?.data ?? null);
        this.goals.set(r.goals?.data ?? null);
        this.recentActivities.set(r.activities?.data?.activity_logs ?? []);
        this.recentMeals.set(r.meals?.data?.nutrition_logs ?? []);

        if (r.weekly?.data?.weekly_breakdown) {
          this.buildChart(r.weekly.data.weekly_breakdown);
        }
      },
      complete: () => this.loading.set(false)
    });
  }

  private buildChart(rows: WeeklyProgressDay[]): void {
    this.barChartData.set({
      labels: rows.map(r => r.day.substring(0, 3)),
      datasets: [
        {
          label: 'Calories consumed',
          data: rows.map(r => r.calories_consumed),
          backgroundColor: 'rgba(13,110,253,0.7)',
          borderRadius: 4
        },
        {
          label: 'Calories burned',
          data: rows.map(r => r.calories_burned),
          backgroundColor: 'rgba(25,135,84,0.7)',
          borderRadius: 4
        }
      ]
    });
  }

  /** Swallow errors so a single failing API call doesn't break the page. */
  private safe<T>(obs: Observable<T>): Observable<T | null> {
    return obs.pipe(catchError(() => of(null as T | null)));
  }

  navigateTo(path: string): void {
    this.router.navigateByUrl(path);
  }

  firstName(): string {
    const name = this.auth.currentUser()?.full_name ?? '';
    return name.split(' ')[0] ?? 'there';
  }

  /** True when at least one goal field has been set. */
  hasGoals(): boolean {
    const g = this.goals()?.goals;
    if (!g) return false;
    return !!(g.target_weight_kg || g.daily_calorie_target ||
              g.weekly_workout_target || g.goal_type || g.target_date);
  }
  bmiBadgeClass(): string {
    const b = this.bmi();
    if (!b) return 'badge-soft-info';
    if (b.bmi < 18.5) return 'badge-soft-warning';
    if (b.bmi < 25) return 'badge-soft-success';
    if (b.bmi < 30) return 'badge-soft-warning';
    return 'badge-soft-danger';
  }
}
