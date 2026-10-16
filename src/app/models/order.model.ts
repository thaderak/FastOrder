export type ProductCategory = 'Pollo a la brasa' | 'Parrillas' | 'Bebidas' | 'Guarniciones' | 'Combos';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  imageUrl?: string;
  badge?: string;
  popular?: boolean;
}

export type OrderStatus = 'recibido' | 'en_preparacion' | 'listo' | 'entregado';
export type SyncStatus = 'synced' | 'pending_sync' | 'syncing' | 'failed';

export interface OrderItem {
  product: Product;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  igv: number;
  total: number;
  customerName: string;
  tableOrTakeout: string;
  notes?: string;
  createdAt: string;
  status: OrderStatus;
  syncStatus: SyncStatus;
  offlineCreated?: boolean;
}
