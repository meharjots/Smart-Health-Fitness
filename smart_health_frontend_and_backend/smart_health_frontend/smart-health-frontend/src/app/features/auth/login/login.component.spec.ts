import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { LoginComponent } from './login.component';

/**
 * LoginComponent spec — smoke tests for form creation, validation
 * and the demo-fill helper.
 */
describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, HttpClientTestingModule],
      providers: [provideRouter([])]
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('starts with an invalid, empty form', () => {
    expect(component.form.valid).toBeFalse();
    expect(component.form.controls.email.value).toBe('');
    expect(component.form.controls.password.value).toBe('');
  });

  it('flags an invalid email', () => {
    component.form.controls.email.setValue('not-an-email');
    expect(component.form.controls.email.errors?.['email']).toBeTrue();
  });

  it('flags a short password', () => {
    component.form.controls.password.setValue('123');
    expect(component.form.controls.password.errors?.['minlength']).toBeTruthy();
  });

  it('accepts valid credentials', () => {
    component.form.patchValue({
      email: 'alice@example.com', password: 'password123'
    });
    expect(component.form.valid).toBeTrue();
  });

  it('fillDemo("user") populates alice@example.com', () => {
    component.fillDemo('user');
    expect(component.form.controls.email.value).toBe('alice@example.com');
    expect(component.form.controls.password.value).toBe('password123');
  });

  it('fillDemo("admin") populates admin credentials', () => {
    component.fillDemo('admin');
    expect(component.form.controls.email.value).toBe('admin@smarthealth.com');
    expect(component.form.controls.password.value).toBe('admin123');
  });

  it('toggles password visibility', () => {
    expect(component.showPassword()).toBeFalse();
    component.showPassword.set(true);
    expect(component.showPassword()).toBeTrue();
  });
});
