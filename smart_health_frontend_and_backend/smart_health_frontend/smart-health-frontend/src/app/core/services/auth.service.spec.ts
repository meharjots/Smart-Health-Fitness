import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

/**
 * AuthService unit tests.
 *
 * Uses Angular's HttpClientTestingModule to stub out real HTTP calls.
 * Verifies that:
 *  1. login() sends the right payload and persists the JWT
 *  2. logout() clears localStorage and sets currentUser to null
 *  3. isAdmin() reflects the role on the stored payload
 *  4. getToken() returns the persisted token
 */
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        provideRouter([])
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.stub();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('initially reports the user as logged out', () => {
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });

  it('persists the token and user after a successful login', () => {
    service.login('alice@example.com', 'password123').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'alice@example.com', password: 'password123'
    });

    req.flush({
      status: 'success',
      message: 'Login successful',
      data: {
        access_token: 'eyJ.fake.jwt',
        user_id: '64abc',
        email: 'alice@example.com',
        full_name: 'Alice Johnson',
        role: 'user'
      }
    });

    expect(service.isLoggedIn()).toBeTrue();
    expect(service.isAdmin()).toBeFalse();
    expect(service.getToken()).toBe('eyJ.fake.jwt');
    expect(localStorage.getItem('sh_token')).toBe('eyJ.fake.jwt');
  });

  it('recognises an admin user after login', () => {
    service.login('admin@smarthealth.com', 'admin123').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/login`).flush({
      status: 'success',
      message: 'OK',
      data: {
        access_token: 't', user_id: '1', email: 'admin@smarthealth.com',
        full_name: 'Admin', role: 'admin'
      }
    });
    expect(service.isAdmin()).toBeTrue();
  });

  it('clears state and navigates to /login on logout()', () => {
    localStorage.setItem('sh_token', 'x');
    localStorage.setItem('sh_user', JSON.stringify({
      access_token: 'x', user_id: '1', email: 'a@b.com',
      full_name: 'A', role: 'user'
    }));
    // New instance to pick up stored state
    const svc = TestBed.runInInjectionContext(() => new AuthService());
    expect(svc.isLoggedIn()).toBeTrue();

    svc.logout();

    expect(localStorage.getItem('sh_token')).toBeNull();
    expect(svc.isLoggedIn()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('updateLocalUser() merges the patch into the stored profile', () => {
    service.login('alice@example.com', 'password123').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/login`).flush({
      status: 'success', message: 'OK',
      data: {
        access_token: 't', user_id: '1', email: 'alice@example.com',
        full_name: 'Alice', role: 'user'
      }
    });

    service.updateLocalUser({ full_name: 'Alice Johnson' });
    expect(service.currentUser()?.full_name).toBe('Alice Johnson');
    expect(JSON.parse(localStorage.getItem('sh_user')!).full_name).toBe('Alice Johnson');
  });
});
