import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private readonly dbName = 'FastOrderDB';
  private readonly storeName = 'pendingOrders';
  private readonly fallbackKey = 'fastorder_pending_orders_fallback';

  constructor() {
    if (this.isBrowser) {
      this.initDB().catch(err => {
        console.warn('[OfflineService] IndexedDB no disponible, usando localStorage fallback:', err);
      });
    }
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.isBrowser || typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB no está disponible en este entorno.');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'orderId' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async initDB(): Promise<void> {
    await this.getDB();
  }

  async saveOrder(order: Order): Promise<void> {
    if (!this.isBrowser) return;

    try {
      const db = await this.getDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.put(order);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Fallback a localStorage
      const orders = this.getFallbackOrders();
      const index = orders.findIndex(o => o.orderId === order.orderId);
      if (index >= 0) {
        orders[index] = order;
      } else {
        orders.push(order);
      }
      localStorage.setItem(this.fallbackKey, JSON.stringify(orders));
    }
  }

  async getAllPendingOrders(): Promise<Order[]> {
    if (!this.isBrowser) return [];

    try {
      const db = await this.getDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.getFallbackOrders();
    }
  }

  async clearOrder(orderId: string): Promise<void> {
    if (!this.isBrowser) return;

    try {
      const db = await this.getDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.delete(orderId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      const orders = this.getFallbackOrders().filter(o => o.orderId !== orderId);
      localStorage.setItem(this.fallbackKey, JSON.stringify(orders));
    }
  }

  async countPendingOrders(): Promise<number> {
    if (!this.isBrowser) return 0;
    const orders = await this.getAllPendingOrders();
    return orders.length;
  }

  private getFallbackOrders(): Order[] {
    if (!this.isBrowser) return [];
    try {
      const data = localStorage.getItem(this.fallbackKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
