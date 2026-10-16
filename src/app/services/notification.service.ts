import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { OrderStatus } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private swPush = inject(SwPush);
  private http = inject(HttpClient);

  // Clave pública VAPID (en producción proviene de variables de entorno / backend)
  private readonly VAPID_PUBLIC_KEY = 'BEl62iB7vU6z-p_8u_8-7_8-7_8-7_8-7_8-7_8-7_8-7_8-7_8-7_8-7_8-7_8-7_8';

  readonly permissionStatus = signal<NotificationPermission>('default');
  readonly isPushSupported = signal<boolean>(false);
  readonly isSubscribed = signal<boolean>(false);

  constructor() {
    if (this.isBrowser) {
      this.checkSupportAndPermission();
      this.listenToPushMessages();
    }
  }

  private checkSupportAndPermission(): void {
    if ('Notification' in window) {
      this.permissionStatus.set(Notification.permission);
      this.isPushSupported.set(this.swPush.isEnabled || 'Notification' in window);
    }
  }

  /**
   * Solicita permisos de notificación al usuario
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isBrowser || !('Notification' in window)) {
      console.warn('[NotificationService] Notificaciones no soportadas en este navegador.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionStatus.set(permission);

      if (permission === 'granted') {
        // Intenta suscribir al canal Web Push
        await this.subscribeToPush();
        this.showLocalNotification(' Notificaciones Activadas', {
          body: 'FastOrder S.A. te notificará cuando tu pedido esté listo.',
          icon: 'icons/icon-192x192.png'
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('[NotificationService] Error solicitando permisos:', error);
      return false;
    }
  }

  /**
   * Suscribe el cliente al servicio Push mediante SwPush
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.isBrowser || !this.swPush.isEnabled) {
      console.log('[NotificationService] SwPush no está habilitado (modo desarrollo o sin SW activo).');
      return null;
    }

    try {
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC_KEY
      });

      this.isSubscribed.set(true);
      console.log('[NotificationService] Suscripción Push exitosa:', subscription);

      // Enviamos la suscripción al backend
      try {
        await firstValueFrom(this.http.post('/api/notifications/subscribe', subscription));
      } catch {
        console.info('[NotificationService] Backend mock: suscripción registrada localmente.');
      }

      return subscription;
    } catch (err) {
      console.warn('[NotificationService] No se pudo completar la suscripción Web Push:', err);
      return null;
    }
  }

  /**
   * Escucha mensajes push entrantes en tiempo real desde el Service Worker
   */
  private listenToPushMessages(): void {
    if (!this.isBrowser || !this.swPush.isEnabled) return;

    this.swPush.messages.subscribe((msg: any) => {
      console.log('[NotificationService] Mensaje Push recibido:', msg);
      const title = msg?.notification?.title || msg?.title || 'FastOrder S.A.';
      const options = msg?.notification || msg || {};
      this.showLocalNotification(title, options);
    });

    this.swPush.notificationClicks.subscribe(event => {
      console.log('[NotificationService] Click en notificación:', event);
      if (window?.focus) {
        window.focus();
      }
    });
  }

  /**
   * Muestra notificación local (mediante ServiceWorkerRegistration o Notification API nativa)
   */
  async showLocalNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!this.isBrowser || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const defaultOptions: Record<string, any> = {
      icon: 'icons/icon-192x192.png',
      badge: 'icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      tag: 'fastorder-status',
      renotify: true,
      ...options
    };

    // Intentar mostrar vía ServiceWorkerRegistration para soporte en segundo plano
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          await (registration as any).showNotification(title, defaultOptions);
          return;
        }
      } catch {
        // Fallback a Notification tradicional
      }
    }

    try {
      new Notification(title, defaultOptions as any);
    } catch {
      // Ignorar si el navegador restringe Notification directa
    }

    // Vibración háptica en móviles si está disponible
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150]);
      } catch {
        // Ignorar si no está permitido
      }
    }
  }

  /**
   * Genera notificación según el estado del pedido de cocina
   */
  notifyOrderStatus(orderId: string, status: OrderStatus): void {
    const shortId = orderId.slice(0, 8);
    switch (status) {
      case 'recibido':
        this.showLocalNotification(` Pedido #${shortId} Recibido`, {
          body: '¡Tu orden ha sido registrada y enviada a la línea de cocina!',
          icon: 'icons/icon-192x192.png'
        });
        break;
      case 'en_preparacion':
        this.showLocalNotification(` Pedido #${shortId} en Preparación`, {
          body: 'Nuestros maestros polleros y parrilleros están preparando tu pedido.',
          icon: 'icons/icon-192x192.png'
        });
        break;
      case 'listo':
        this.showLocalNotification(` ¡Pedido #${shortId} Listo para Entrega!`, {
          body: '¡Tu comida está lista y calientita! Acércate al mostrador de retiro.',
          icon: 'icons/icon-192x192.png'
        });
        break;
      case 'entregado':
        this.showLocalNotification(` Pedido #${shortId} Entregado`, {
          body: '¡Buen provecho! Gracias por elegir FastOrder S.A.',
          icon: 'icons/icon-192x192.png'
        });
        break;
    }
  }
}
