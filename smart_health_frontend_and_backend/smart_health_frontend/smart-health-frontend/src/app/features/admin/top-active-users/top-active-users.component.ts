import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

import { AnalyticsService } from '../../../core/services/analytics.service';
import { TopActiveUser } from '../../../core/models/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

/**
 * TopActiveUsersComponent (admin) — horizontal-bar leaderboard of the most
 * active users (by total calories burned). Backed by a MongoDB aggregation
 * pipeline on the back-end.
 */
@Component({
  selector: 'app-top-active-users',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './top-active-users.component.html'
})
export class TopActiveUsersComponent implements OnInit {
  private readonly service = inject(AnalyticsService);

  readonly loading = signal(true);
  readonly users = signal<TopActiveUser[]>([]);
  limit = 10;

  readonly chartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  readonly chartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, title: { display: true, text: 'Calories burned' } }
    }
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.topActiveUsers(this.limit).subscribe({
      next: (res) => {
        const list = res.data?.top_active_users ?? [];
        this.users.set(list);
        this.chartData.set({
          labels: list.map(u => u.full_name),
          datasets: [{
            data: list.map(u => u.total_calories_burned),
            backgroundColor: list.map((_, i) =>
              `hsla(${(220 - i * 15) % 360}, 70%, 55%, 0.75)`
            ),
            borderRadius: 4
          }]
        });
      },
      complete: () => this.loading.set(false)
    });
  }

  medalIcon(index: number): string {
    if (index === 0) return 'bi-trophy-fill text-warning';
    if (index === 1) return 'bi-award-fill text-secondary';
    if (index === 2) return 'bi-award text-info';
    return 'bi-dot text-muted';
  }
}
