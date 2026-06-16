/**
 * Domain model interfaces shared across the application.
 * Centralised here to keep typing consistent with the Flask/MongoDB API payloads.
 */

export type UserRole = 'user' | 'admin';
export type MembershipType = 'free' | 'premium';
export type Gender = 'male' | 'female' | 'other' | 'prefer not to say';

export type ActivityType =
  | 'running' | 'cycling' | 'swimming' | 'walking' | 'yoga' | 'gym'
  | 'football' | 'basketball' | 'tennis' | 'hiking' | 'rowing' | 'other';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type GoalType = 'lose_weight' | 'gain_muscle' | 'maintain' | 'improve_endurance' | 'general_fitness';

/** Wrapper that matches the utils.success(...) / utils.error(...) shape from CW1. */
export interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

export interface User {
  _id: string;
  email: string;
  full_name: string;
  age: number;
  gender: Gender;
  height_cm: number;
  weight_kg: number;
  membership_type: MembershipType;
  role: UserRole;
  created_at?: string;
}

export interface AuthPayload {
  access_token: string;
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface RegisterPayload {
  user: User;
  access_token: string;
}

export interface Activity {
  _id: string;
  activity_type: ActivityType;
  duration_minutes: number;
  calories_burned: number;
  activity_date: string;
  notes?: string;
}

export interface PaginatedActivities {
  activity_logs: Activity[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface NutritionLog {
  _id: string;
  meal_type: MealType;
  food_name: string;
  calories_intake: number;
  protein_grams: number;
  carbs_grams: number;
  fats_grams: number;
  log_date: string;
}

export interface PaginatedNutrition {
  nutrition_logs: NutritionLog[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface HealthMetrics {
  heart_rate?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  sleep_hours?: number;
  resting_heart_rate?: number;
  vo2_max?: number;
  bmi?: number;
  updated_at?: string;
}

export interface FitnessGoals {
  target_weight_kg?: number;
  daily_calorie_target?: number;
  weekly_workout_target?: number;
  goal_type?: GoalType;
  target_date?: string;
  updated_at?: string;
}

export interface BmiReport {
  weight_kg: number;
  height_cm: number;
  bmi: number;
  category: string;
  advice: string;
}

export interface CalorieBalance {
  period: { start: string; end: string };
  calories_consumed: number;
  calories_burned: number;
  net_balance: number;
  activity_count: number;
  meals_logged: number;
  daily_calorie_target?: number;
}

export interface WeeklyProgressDay {
  date: string;
  day: string;
  calories_consumed: number;
  calories_burned: number;
  net: number;
  activities: number;
}

export interface GoalTracking {
  goals: FitnessGoals;
  progress: {
    weight?: {
      current_kg: number;
      target_kg: number;
      difference_kg: number;
      status: 'achieved' | 'above_target' | 'below_target';
    };
    weekly_workouts?: {
      completed: number;
      target: number;
      remaining: number;
      percentage: number;
    };
    today_calories?: {
      consumed: number;
      target: number;
      remaining: number;
      percentage: number;
    };
  };
}

export interface ActivitySummaryRow {
  activity_type: string;
  total_sessions: number;
  total_duration_minutes: number;
  total_calories_burned: number;
  avg_duration_minutes: number;
  avg_calories_burned: number;
}

export interface NutritionSummaryRow {
  meal_type: string;
  total_meals: number;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fats_g: number;
  avg_calories_per_meal: number;
}

export interface TopActiveUser {
  user_id: string;
  full_name: string;
  email: string;
  membership_type: string;
  total_sessions: number;
  total_calories_burned: number;
  total_duration_minutes: number;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
