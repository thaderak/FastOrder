import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { App } from './app';
import { OrderService } from './services/order.service';

describe('FastOrder dashboard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [App], providers: [provideHttpClient(), provideServiceWorker('ngsw-worker.js', { enabled: false })]}).compileComponents();
  });
  it('filters the menu and updates the cart total', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('h2')?.textContent).toContain('¿Qué se te antoja hoy?');
    const input = root.querySelector('.search-box input') as HTMLInputElement;
    input.value = 'Mostrito'; input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(root.querySelectorAll('.product-card').length).toBe(1);
    (root.querySelector('.btn-add-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    const orders = TestBed.inject(OrderService);
    expect(orders.totalItemsCount()).toBe(1);
    expect(orders.total()).toBe(28.91);
    expect(root.querySelector('.total-amount')?.textContent).toContain('28.91');
  });
  it('opens the empty order history', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelectorAll('nav button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelector('.history-panel')?.textContent).toContain('Aún no tienes pedidos');
    expect(root.querySelector('.main-layout')).toBeNull();
  });
});
