import { Injectable, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { fromEvent, firstValueFrom } from 'rxjs';
import { OfflineService } from './offline.service';
import { NotificationService } from './notification.service';
import { Order, OrderItem, OrderStatus, Product, ProductCategory } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private http = inject(HttpClient);
  private offlineService = inject(OfflineService);
  private notificationService = inject(NotificationService);

  // Estado de Red (Online / Offline)
  readonly isOnline = signal<boolean>(true);
  readonly isSyncing = signal<boolean>(false);
  readonly pendingCount = signal<number>(0);

  // Carrito de compras reactivo
  readonly cart = signal<OrderItem[]>([]);

  // Orden activa actual en seguimiento
  readonly activeOrder = signal<Order | null>(null);

  // Historial de órdenes de la sesión
  readonly orderHistory = signal<Order[]>([]);

  // Cálculos reactivos con Angular Computed
  readonly subtotal = computed(() =>
    this.cart().reduce((sum, item) => sum + item.subtotal, 0)
  );

  readonly igv = computed(() =>
    Math.round(this.subtotal() * 0.18 * 100) / 100
  );

  readonly total = computed(() =>
    Math.round((this.subtotal() + this.igv()) * 100) / 100
  );

  readonly totalItemsCount = computed(() =>
    this.cart().reduce((count, item) => count + item.quantity, 0)
  );

  // Catálogo completo de productos de FastOrder S.A.
  readonly products = signal<Product[]>([
    // Pollo a la Brasa
    {
      id: 'p-01',
      name: '1/4 Pollo a la Brasa',
      description: 'Pierna o pecho jugoso con papas fritas crocantes y ensalada fresca.',
      price: 21.90,
      category: 'Pollo a la brasa',
      imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=400&q=80',
      popular: true,
      badge: 'Favorito'
    },
    {
      id: 'p-02',
      name: '1/2 Pollo a la Brasa',
      description: 'Medio pollo dorado al carbón con papas familiares y cremas artesanales.',
      price: 39.90,
      category: 'Pollo a la brasa',
      imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'p-03',
      name: '1 Pollo Entero Familiar',
      description: 'Pollo entero marinado con receta secreta + papas familiares + ensalada + cremas.',
      price: 74.90,
      category: 'Pollo a la brasa',
      imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=400&q=80',
      badge: 'Familiar'
    },
    {
      id: 'p-04',
      name: 'Mostrito Clásico FastOrder',
      description: '1/4 de pollo a la brasa + generoso arroz chaufa al wok + papas fritas.',
      price: 24.50,
      category: 'Pollo a la brasa',
      imageUrl: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=400&q=80',
      popular: true,
      badge: 'Top Ventas'
    },

    // Parrillas
    {
      id: 'pa-01',
      name: 'Anticuchos Tradicionales (3 un.)',
      description: 'Corazón de res macerado en ají panca, acompañado de papa dorada y choclo.',
      price: 22.00,
      category: 'Parrillas',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80',
      badge: 'Especialidad'
    },
    {
      id: 'pa-02',
      name: 'Chuleta Parrillera Ahumada',
      description: 'Tierna chuleta de cerdo a la parrilla con papas doradas y chimichurri.',
      price: 26.50,
      category: 'Parrillas',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'pa-03',
      name: 'Gran Parrilla Mixta',
      description: 'Bife angus, chuleta, 2 palos de anticucho, chorizo parrillero y guarnición.',
      price: 48.00,
      category: 'Parrillas',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80',
      badge: 'Para Compartir'
    },

    // Bebidas
    {
      id: 'b-01',
      name: 'Chicha Morada Artesanal (1 L)',
      description: 'Elaborada diariamente con maíz morado, piña, manzana y canela.',
      price: 12.00,
      category: 'Bebidas',
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
      popular: true
    },
    {
      id: 'b-02',
      name: 'Inca Kola 500ml',
      description: 'La bebida de sabor nacional heladita.',
      price: 5.00,
      category: 'Bebidas',
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'b-03',
      name: 'Coca Cola Sin Azúcar 500ml',
      description: 'Refresco carbonatado helado.',
      price: 5.00,
      category: 'Bebidas',
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'b-04',
      name: 'Limonada Frozen con Hierbabuena',
      description: 'Ultra refrescante batida al momento.',
      price: 9.00,
      category: 'Bebidas',
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80'
    },

    // Guarniciones
    {
      id: 'g-01',
      name: 'Papas Nativas Tumbay Fritas',
      description: 'Porción crujiente de papas amarillas peruanas.',
      price: 9.50,
      category: 'Guarniciones',
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'g-02',
      name: 'Arroz Chaufa al Wok',
      description: 'Porción individual con cebollita china, huevo y toque oriental.',
      price: 8.00,
      category: 'Guarniciones',
      imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'g-03',
      name: 'Tequeños Rellenos de Queso (6 un.)',
      description: 'Acompañados con guacamole casero con limón.',
      price: 14.00,
      category: 'Guarniciones',
      imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=400&q=80'
    }
  ]);

  constructor() {
    if (this.isBrowser) {
      this.isOnline.set(navigator.onLine);
      this.initConnectionListeners();
      this.refreshPendingCount();
    }
  }

  private initConnectionListeners(): void {
    fromEvent(window, 'online').subscribe(() => {
      this.isOnline.set(true);
      console.log('[FastOrder]  Conexión restablecida. Sincronizando pedidos...');
      this.syncPendingOrders();
    });

    fromEvent(window, 'offline').subscribe(() => {
      this.isOnline.set(false);
      console.warn('[FastOrder] 🔴 Conexión perdida. Activando modo offline local.');
      this.notificationService.showLocalNotification(' Modo Offline Activado', {
        body: 'Puedes seguir ordenando. Tus pedidos se guardarán y enviarán al reconectar.',
        icon: 'icons/icon-192x192.png'
      });
    });
  }

  async refreshPendingCount(): Promise<void> {
    const count = await this.offlineService.countPendingOrders();
    this.pendingCount.set(count);
  }

  // Métodos del Carrito
  addToCart(product: Product): void {
    const current = [...this.cart()];
    const existing = current.find(item => item.product.id === product.id);

    if (existing) {
      existing.quantity += 1;
      existing.subtotal = Math.round(existing.quantity * product.price * 100) / 100;
      this.cart.set(current);
    } else {
      this.cart.set([
        ...current,
        {
          product,
          quantity: 1,
          subtotal: product.price
        }
      ]);
    }
  }

  decreaseQuantity(productId: string): void {
    const current = [...this.cart()];
    const index = current.findIndex(item => item.product.id === productId);

    if (index >= 0) {
      if (current[index].quantity > 1) {
        current[index].quantity -= 1;
        current[index].subtotal = Math.round(current[index].quantity * current[index].product.price * 100) / 100;
        this.cart.set(current);
      } else {
        current.splice(index, 1);
        this.cart.set(current);
      }
    }
  }

  removeFromCart(productId: string): void {
    const filtered = this.cart().filter(item => item.product.id !== productId);
    this.cart.set(filtered);
  }

  clearCart(): void {
    this.cart.set([]);
  }

  // Envío de Pedido a Cocina
  async sendOrder(customerName: string, tableOrTakeout: string, notes: string = ''): Promise<Order> {
    const items = [...this.cart()];
    if (items.length === 0) {
      throw new Error('El carrito está vacío');
    }

    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const order: Order = {
      orderId,
      items,
      subtotal: this.subtotal(),
      igv: this.igv(),
      total: this.total(),
      customerName: customerName.trim() || 'Cliente Mostrador',
      tableOrTakeout: tableOrTakeout.trim() || 'Para Llevar',
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      status: 'recibido',
      syncStatus: this.isOnline() ? 'synced' : 'pending_sync',
      offlineCreated: !this.isOnline()
    };

    if (this.isOnline()) {
      try {
        await firstValueFrom(this.http.post('/api/orders', order));
        order.syncStatus = 'synced';
        console.log(`[FastOrder]  Pedido ${order.orderId} transmitido a cocina.`);
      } catch (httpError) {
        console.warn('[FastOrder] Fallo envío al servidor, respaldando en IndexedDB:', httpError);
        order.syncStatus = 'pending_sync';
        order.offlineCreated = true;
        await this.offlineService.saveOrder(order);
        await this.refreshPendingCount();
      }
    } else {
      console.warn(`[FastOrder]  Offline: Guardando pedido ${order.orderId} en IndexedDB local.`);
      await this.offlineService.saveOrder(order);
      await this.refreshPendingCount();
    }

    // Actualizamos la orden activa y el historial
    this.activeOrder.set(order);
    this.orderHistory.set([order, ...this.orderHistory()]);
    this.clearCart();

    // Notificación al usuario
    this.notificationService.notifyOrderStatus(order.orderId, 'recibido');

    // Iniciamos la simulación del flujo de cocina para pruebas interactivas
    this.simulateKitchenWorkflow(order.orderId);

    return order;
  }

  // Sincronización automática de pedidos pendientes
  async syncPendingOrders(): Promise<void> {
    if (!this.isBrowser || this.isSyncing()) return;

    const pending = await this.offlineService.getAllPendingOrders();
    if (pending.length === 0) {
      this.pendingCount.set(0);
      return;
    }

    this.isSyncing.set(true);
    let syncedCount = 0;

    for (const order of pending) {
      try {
        await firstValueFrom(this.http.post('/api/orders', order));
        await this.offlineService.clearOrder(order.orderId);
        syncedCount++;

        // Actualizamos estado en memoria si es la orden activa
        if (this.activeOrder()?.orderId === order.orderId) {
          const updated = { ...this.activeOrder()!, syncStatus: 'synced' as const };
          this.activeOrder.set(updated);
        }
      } catch (error) {
        console.error(`[FastOrder] Error al sincronizar orden ${order.orderId}:`, error);
      }
    }

    await this.refreshPendingCount();
    this.isSyncing.set(false);

    if (syncedCount > 0) {
      this.notificationService.showLocalNotification(' Pedidos Sincronizados', {
        body: `Se sincronizaron con éxito ${syncedCount} pedido(s) con la cocina.`,
        icon: 'icons/icon-192x192.png'
      });
    }
  }

  // Actualización manual de estado para cocina/cliente
  updateOrderStatus(orderId: string, status: OrderStatus): void {
    const current = this.activeOrder();
    if (current && current.orderId === orderId) {
      const updated: Order = { ...current, status };
      this.activeOrder.set(updated);
      this.notificationService.notifyOrderStatus(orderId, status);
    }
  }

  // Simulación temporal para demostración del ciclo de vida en cocina
  private simulateKitchenWorkflow(orderId: string): void {
    if (!this.isBrowser) return;

    // A los 6 segundos: Pasa a preparación
    setTimeout(() => {
      if (this.activeOrder()?.orderId === orderId && this.activeOrder()?.status === 'recibido') {
        this.updateOrderStatus(orderId, 'en_preparacion');
      }
    }, 6000);

    // A los 14 segundos: Pasa a listo para entrega
    setTimeout(() => {
      if (this.activeOrder()?.orderId === orderId && this.activeOrder()?.status === 'en_preparacion') {
        this.updateOrderStatus(orderId, 'listo');
      }
    }, 14000);
  }
}
