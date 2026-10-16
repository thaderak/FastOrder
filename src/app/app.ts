import { Component } from '@angular/core';
import { OrderComponent } from './components/order/order.component';

@Component({
  imports: [OrderComponent],
  selector: 'app-root',
  template: '<app-order></app-order>',
  styles: ['']
})
export class App {
}
