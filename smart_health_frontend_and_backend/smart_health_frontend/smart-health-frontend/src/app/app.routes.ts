import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';

/**
 * Top-level route table. Each feature is lazy-loaded via loadComponent()
 * so the initial JS bundle stays small — the home screen only downloads
 * the login/dashboard chunks.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  // ---- Public -----------------------------------------------------------
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Log in · Smart Health',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    title: 'Create account · Smart Health',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },

  // ---- Authenticated ---------------------------------------------------
  {
    path: 'dashboard',
    canActivate: [authGuard],
    title: 'Dashboard · Smart Health',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    title: 'My Profile · Smart Health',
    loadComponent: () =>
      import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },

  // Activities
  {
    path: 'activities',
    canActivate: [authGuard],
    title: 'Activities · Smart Health',
    loadComponent: () =>
      import('./features/activities/activities-list/activities-list.component')
        .then(m => m.ActivitiesListComponent)
  },
  {
    path: 'activities/new',
    canActivate: [authGuard],
    title: 'New Activity · Smart Health',
    loadComponent: () =>
      import('./features/activities/activity-form/activity-form.component')
        .then(m => m.ActivityFormComponent)
  },
  {
    path: 'activities/edit/:id',
    canActivate: [authGuard],
    title: 'Edit Activity · Smart Health',
    loadComponent: () =>
      import('./features/activities/activity-form/activity-form.component')
        .then(m => m.ActivityFormComponent)
  },

  // Nutrition
  {
    path: 'nutrition',
    canActivate: [authGuard],
    title: 'Nutrition · Smart Health',
    loadComponent: () =>
      import('./features/nutrition/nutrition-list/nutrition-list.component')
        .then(m => m.NutritionListComponent)
  },
  {
    path: 'nutrition/new',
    canActivate: [authGuard],
    title: 'New Meal Log · Smart Health',
    loadComponent: () =>
      import('./features/nutrition/nutrition-form/nutrition-form.component')
        .then(m => m.NutritionFormComponent)
  },
  {
    path: 'nutrition/edit/:id',
    canActivate: [authGuard],
    title: 'Edit Meal Log · Smart Health',
    loadComponent: () =>
      import('./features/nutrition/nutrition-form/nutrition-form.component')
        .then(m => m.NutritionFormComponent)
  },

  // Health metrics & goals
  {
    path: 'health-metrics',
    canActivate: [authGuard],
    title: 'Health Metrics · Smart Health',
    loadComponent: () =>
      import('./features/health-metrics/health-metrics.component')
        .then(m => m.HealthMetricsComponent)
  },
  {
    path: 'goals',
    canActivate: [authGuard],
    title: 'Fitness Goals · Smart Health',
    loadComponent: () =>
      import('./features/goals/goals.component').then(m => m.GoalsComponent)
  },

  // Analytics
  {
    path: 'analytics',
    canActivate: [authGuard],
    title: 'Analytics · Smart Health',
    loadComponent: () =>
      import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent)
  },

  // Admin
  {
    path: 'admin/users',
    canActivate: [authGuard, adminGuard],
    title: 'All Users (Admin) · Smart Health',
    loadComponent: () =>
      import('./features/admin/users-list/users-list.component')
        .then(m => m.UsersListComponent)
  },
  {
    path: 'admin/top-active',
    canActivate: [authGuard, adminGuard],
    title: 'Top Active Users (Admin) · Smart Health',
    loadComponent: () =>
      import('./features/admin/top-active-users/top-active-users.component')
        .then(m => m.TopActiveUsersComponent)
  },

  // Fallback
  { path: '**', redirectTo: 'dashboard' }
];
