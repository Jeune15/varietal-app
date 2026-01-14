
export type CoffeeType = 'Verde' | 'Tostado';
export type OrderType = 'Venta Café Tostado' | 'Servicio de Tueste';

export interface GreenCoffee {
  id: string;
  clientName: string;
  variety: string;
  origin: string;
  entryDate: string;
  quantityKg: number;
}

export interface Roast {
  id: string;
  greenCoffeeId: string;
  orderId?: string; // Link to an order if it's a "Make to Order" roast
  clientName: string;
  greenQtyKg: number;
  roastedQtyKg: number;
  weightLossPercentage: number;
  profile: string;
  roastDate: string;
}

export interface Order {
  id: string;
  clientName: string;
  variety: string;
  type: OrderType; // Changed from CoffeeType to specific OrderType
  quantityKg: number;
  entryDate: string;
  dueDate: string;
  status: 'Pendiente' | 'En Producción' | 'Listo para Despacho' | 'Enviado' | 'Facturado';
  progress: number;
  
  // Traceability & Production Data
  relatedRoastIds?: string[]; // Roasts made for this order
  requiresRoasting?: boolean; // Flag if it needs new roast
  roastType?: string; // e.g. "Espresso", "Filtrado", "Omni", "Medio"
  accumulatedRoastedKg?: number; // Total roasted so far for this order
  accumulatedGreenUsedKg?: number; // Total green coffee used so far (critical for Service Orders)
  
  // Packing
  packagingType?: 'bags' | 'grainpro';
  bagsUsed?: number;
  
  // Selection/Merma
  sortingLossKg?: number; // Merma de selección specific to this order/batch
  fulfilledFromStockId?: string;

  // Dates
  shippedDate?: string;
  shippingCost?: number;
  invoicedDate?: string;
}

export interface Expense {
  id: string;
  reason: string;
  amount: number;
  documentType?: 'Factura' | 'Boleta';
  documentId?: string; // Factura o Boleta
  date: string;
  status: 'pending' | 'paid';
  relatedOrderId?: string;
}

export interface RoastedStock {
  id: string;
  roastId: string;
  variety: string;
  clientName: string;
  totalQtyKg: number;
  remainingQtyKg: number;
  isSelected: boolean;
  mermaGrams: number;
}

export interface RetailBagStock {
  id: string;
  coffeeName: string;
  type: '250g' | '500g' | '1kg';
  quantity: number;
}

export type ProductionActivityType = 
  | 'Armado de Pedido' 
  | 'Selección de Café' 
  | 'Armado de Bolsas Retail' 
  | 'Despacho de Pedido';

export interface ProductionActivity {
  id: string;
  type: ProductionActivityType;
  date: string;
  details: any;
}

export interface ProductionItem {
  id: string;
  name: string;
  type: 'rechargeable' | 'unit';
  quantity: number; // 0-100 for rechargeable, count for unit
  minThreshold: number;
  format?: '250g' | '500g' | '1kg'; // For automatic deduction linkage
}

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface UserProfile {
  id: string; // Matches auth.users.id
  email: string;
  role: UserRole;
  isActive: boolean;
}
