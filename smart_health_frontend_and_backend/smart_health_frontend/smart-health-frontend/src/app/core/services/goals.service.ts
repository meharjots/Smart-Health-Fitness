import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse, FitnessGoals } from '../models/models';

/**
 * GoalsService — fitness targets (weight, calories, workouts, etc).
 */
@Injectable({ providedIn: 'root' })
export class GoalsService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  get(): Observable<ApiResponse<FitnessGoals>> {
    return this.http.get<ApiResponse<FitnessGoals>>(`${this.api}/goals`);
  }

  update(body: Partial<FitnessGoals>): Observable<ApiResponse<FitnessGoals>> {
    return this.http.put<ApiResponse<FitnessGoals>>(`${this.api}/goals`, body);
  }

  clear(): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.api}/goals`);
  }
}
