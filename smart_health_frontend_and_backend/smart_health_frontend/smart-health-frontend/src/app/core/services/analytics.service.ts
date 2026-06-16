import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ActivitySummaryRow, ApiResponse, BmiReport, CalorieBalance, GoalTracking,
  NutritionSummaryRow, TopActiveUser, WeeklyProgressDay
} from '../models/models';

/**
 * AnalyticsService — the "insight" endpoints: BMI, calorie balance,
 * weekly progress, goal tracking, per-type summaries, and the admin
 * leaderboard (top active users).
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  bmiReport(): Observable<ApiResponse<BmiReport>> {
    return this.http.get<ApiResponse<BmiReport>>(`${this.api}/analytics/bmi-report`);
  }

  calorieBalance(start?: string, end?: string): Observable<ApiResponse<CalorieBalance>> {
    let params = new HttpParams();
    if (start) params = params.set('start_date', start);
    if (end) params = params.set('end_date', end);
    return this.http.get<ApiResponse<CalorieBalance>>(
      `${this.api}/analytics/calorie-balance`, { params }
    );
  }

  weeklyProgress(): Observable<ApiResponse<{ weekly_breakdown: WeeklyProgressDay[] }>> {
    return this.http.get<ApiResponse<{ weekly_breakdown: WeeklyProgressDay[] }>>(
      `${this.api}/analytics/weekly-progress`
    );
  }

  goalTracking(): Observable<ApiResponse<GoalTracking>> {
    return this.http.get<ApiResponse<GoalTracking>>(`${this.api}/analytics/goal-tracking`);
  }

  activitySummary(): Observable<ApiResponse<{ activity_summary: ActivitySummaryRow[]; total_activity_types: number }>> {
    return this.http.get<ApiResponse<{ activity_summary: ActivitySummaryRow[]; total_activity_types: number }>>(
      `${this.api}/analytics/activity-summary`
    );
  }

  nutritionSummary(): Observable<ApiResponse<{ nutrition_summary: NutritionSummaryRow[] }>> {
    return this.http.get<ApiResponse<{ nutrition_summary: NutritionSummaryRow[] }>>(
      `${this.api}/analytics/nutrition-summary`
    );
  }

  topActiveUsers(limit = 10): Observable<ApiResponse<{ top_active_users: TopActiveUser[] }>> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<ApiResponse<{ top_active_users: TopActiveUser[] }>>(
      `${this.api}/analytics/admin/top-active-users`, { params }
    );
  }
}
