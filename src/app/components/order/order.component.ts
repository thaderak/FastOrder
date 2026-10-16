import { Component, inject, signal, computed, OnInit, HostListener, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { IconComponent } from './icon.component';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { NotificationService } from '../../services/notification.service';
import { Product, ProductCategory, OrderStatus } from '../../models/order.model';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './order.component.html',
  styleUrl: './order.component.scss'
})
export class OrderComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  public orderService = inject(OrderService);
  public notificationService = inject(NotificationService);

  // Filtros y búsqueda
  readonly categories: (ProductCategory | 'Todos')[] = [
    'Todos',
    'Pollo a la brasa',
    'Parrillas',
    'Bebidas',
    'Guarniciones'
  ];
  readonly selectedCategory = signal<ProductCategory | 'Todos'>('Todos');
  readonly searchQuery = signal<string>('');

  // Formulario de Pedido
  readonly view = signal<'menu' | 'history'>('menu');
  readonly categoryIcons: Record<string, string> = { Todos: 'Utensils', 'Pollo a la brasa': 'Drumstick', Parrillas: 'Beef', Bebidas: 'CupSoda', Guarniciones: 'Salad' };
  customerName = '';
  tableOrTakeout = 'Mesa 04';
  orderNotes = '';
  isCartDrawerOpen = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  // Soporte de Instalación PWA (beforeinstallprompt)
  deferredPrompt: any = null;
  canInstallPwa = signal<boolean>(false);

  // Productos filtrados reactivamente
  readonly filteredProducts = computed(() => {
    const cat = this.selectedCategory();
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.orderService.products();

    return list.filter(p => {
      const matchesCategory = cat === 'Todos' || p.category === cat;
      const matchesQuery = !query ||
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  });

  ngOnInit(): void {
    if (this.isBrowser) {
      this.initInstallPromptListener();
    }
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(event: Event): void {
    event.preventDefault();
    this.deferredPrompt = event;
    this.canInstallPwa.set(true);
  }

  private initInstallPromptListener(): void {
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstallPwa.set(false);
      console.log('[PWA] FastOrder instalada con éxito en el dispositivo.');
    });
  }

  async promptInstallPwa(): Promise<void> {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const choice = await this.deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      console.log('[PWA] Usuario aceptó instalar la aplicación.');
    }
    this.deferredPrompt = null;
    this.canInstallPwa.set(false);
  }

  // Métodos de interacción con el carrito
  getItemQuantityInCart(productId: string): number {
    const item = this.orderService.cart().find(i => i.product.id === productId);
    return item ? item.quantity : 0;
  }

  addToCart(product: Product): void {
    this.orderService.addToCart(product);
  }

  decreaseQuantity(productId: string): void {
    this.orderService.decreaseQuantity(productId);
  }

  removeFromCart(productId: string): void {
    this.orderService.removeFromCart(productId);
  }

  toggleCartDrawer(): void {
    this.isCartDrawerOpen.set(!this.isCartDrawerOpen());
  }

  // Envío de la Orden
  async submitOrder(): Promise<void> {
    if (this.orderService.cart().length === 0) return;
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    try {
      await this.orderService.sendOrder(
        this.customerName || 'Cliente FastOrder',
        this.tableOrTakeout || 'Para Llevar',
        this.orderNotes
      );
      this.isCartDrawerOpen.set(false);
      this.orderNotes = '';
    } catch (error) {
      console.error('Error enviando orden:', error);
      alert('Ocurrió un error al procesar el pedido. Intente nuevamente.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // Manejo de Estados de Cocina
  advanceStatus(nextStatus: OrderStatus): void {
    const active = this.orderService.activeOrder();
    if (active) {
      this.orderService.updateOrderStatus(active.orderId, nextStatus);
    }
  }

  resetForNewOrder(): void {
    this.orderService.activeOrder.set(null);
  }

  // Solicitar Notificaciones
  async requestNotificationPermission(): Promise<void> {
    await this.notificationService.requestPermission();
  }

  // Sincronizar manualmente
  async syncNow(): Promise<void> {
    await this.orderService.syncPendingOrders();
  }
}

