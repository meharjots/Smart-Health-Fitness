import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

/**
 * authGuard unit tests — verify that protected routes block unauthenticated
 * users and remember the attempted URL so they can be redirected back after login.
 */
describe('authGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, provideRouter([])]
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.stub();
    localStorage.clear();
  });

  it('returns false and navigates to /login when not authenticated', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/activities' } as any)
    );
    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(
      ['/login'], { queryParams: { redirect: '/activities' } }
    );
  });

  it('returns true when a token is present', () => {
    localStorage.setItem('sh_token', 'abc');
    localStorage.setItem('sh_user', JSON.stringify({
      access_token: 'abc', user_id: '1', email: 'a@b.com',
      full_name: 'A', role: 'user'
    }));
    // Create a fresh AuthService so it picks up the stored state
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, provideRouter([])]
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/dashboard' } as any)
    );
    expect(result).toBeTrue();
  });
});
