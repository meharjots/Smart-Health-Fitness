import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

/**
 * ToastService unit tests — verifies the reactive toast queue.
 */
describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    jasmine.clock().install();
    TestBed.configureTestingModule({ providers: [ToastService] });
    service = TestBed.inject(ToastService);
  });

  afterEach(() => jasmine.clock().uninstall());

  it('starts with an empty queue', () => {
    expect(service.toasts().length).toBe(0);
  });

  it('adds a success toast', () => {
    service.success('Saved!');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].kind).toBe('success');
    expect(service.toasts()[0].message).toBe('Saved!');
  });

  it('assigns unique IDs to consecutive toasts', () => {
    service.info('one');
    service.info('two');
    const ids = service.toasts().map(t => t.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('auto-dismisses a toast after 4 seconds', () => {
    service.success('hello');
    expect(service.toasts().length).toBe(1);
    jasmine.clock().tick(4001);
    expect(service.toasts().length).toBe(0);
  });

  it('dismiss() removes the targeted toast immediately', () => {
    service.success('one');
    service.warn('two');
    const firstId = service.toasts()[0].id;
    service.dismiss(firstId);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('two');
  });
});
