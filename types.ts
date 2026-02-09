
export type CoffeeType = 'Verde' | 'Tostado';
export type OrderType = 'Venta Café Tostado' | 'Servicio de Tueste';

export interface OrderLine {
  id: string;
  variety: string;
  quantityKg: number;
  grindType?: 'grano' | 'molido';
  grindNumber?: number;
  grindReference?: string;
  bagsCount?: number;
  bagSizeGrams?: number;
  roastProfile?: string;
}

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
  type: OrderType;
  quantityKg: number;
  serviceRoastedQtyKg?: number;
  entryDate: string;
  dueDate: string;
  status: 'Pendiente' | 'En Producción' | 'Listo para Despacho' | 'Enviado' | 'Facturado';
  progress: number;
  fulfilledKg?: number;
  orderLines?: OrderLine[];
  relatedRoastIds?: string[];
  requiresRoasting?: boolean;
  roastType?: string;
  defaultGrindType?: 'grano' | 'molido';
  accumulatedRoastedKg?: number;
  accumulatedGreenUsedKg?: number;
  packagingType?: 'bags' | 'grainpro';
  bagsUsed?: number;
  sortingLossKg?: number;
  fulfilledFromStockId?: string;
  shippedDate?: string;
  shippingCost?: number;
  invoicedDate?: string;
  deliveryAddress?: string;
  deliveryAddressDetail?: string;
  isPaused?: boolean;
  nextActivity?: ProductionActivityType;
  completedActivities?: ProductionActivityType[];
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
  createdBy?: 'Anthony' | 'Alei';
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
  clientName?: string;
  roastDate?: string;
  roastId?: string;
}

export interface SensoryAnalysis {
  crema: string;
  acidity: { quality: 'positive' | 'negative' | null; description: string };
  sweetness: { present: boolean | null; intensity: string };
  bitterness: { quality: 'positive' | 'negative' | null; description: string };
  body: string;
  aftertaste: { duration: 'quick' | 'semi-prolonged' | 'prolonged' | null; description: string };
}

export interface EspressoShot {
  id: string;
  recipeName: string;
  grindSetting: string;
  doseIn: number;
  yieldOut: number;
  timeSeconds: number;
  extraction: number; // 0-100 slider value
  tasteBalance: string[]; // Multi-select ['sour', 'bitter', 'balanced', etc.]
  sensory: SensoryAnalysis;
  notes?: string;
}

export interface EspressoSession {
  id: string;
  date: string;
  baristaName: string;
  coffeeName: string;
  shots: EspressoShot[];
  notes?: string;
}

export type ProductionActivityType = 
  | 'Armado de Pedido' 
  | 'Selección de Café' 
  | 'Armado de Bolsas Retail' 
  | 'Despacho de Pedido'
  | 'SYSTEM_RESET'
  | 'Examen'
  | 'Calibración';

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

export interface CuppingForm {
  fragranceIntensity: number;
  fragranceDescriptors: string[];
  fragranceNotes: string;
  aromaIntensity: number;
  aromaDescriptors: string[];
  aromaNotes: string;
  flavorIntensity: number;
  flavorDescriptors: string[];
  flavorNotes: string;
  aftertasteIntensity: number;
  aftertasteDescriptors: string[];
  aftertasteNotes: string;
  acidityIntensity: number;
  acidityNotes: string;
  sweetnessIntensity: number;
  sweetnessNotes: string;
  mouthfeelIntensity: number;
  mouthfeelDescriptors: string[];
  mouthfeelNotes: string;
}

export interface FreeCuppingSample {
  id: string;
  brand: string;
  variety: string;
  origin: string;
  process: string;
  roastType: string;
  roastDate: string;
  restDays: number;
  notes: string;
  form: CuppingForm;
}

export type CuppingSessionType = 'internal' | 'free';

export interface CuppingSession {
  id: string;
  date: string;
  roastId?: string; // Optional for free cupping
  roastStockId?: string; // Optional for free cupping
  tasterName: string; // Used for both
  objective?: string; // Used for internal
  notes?: string;
  form?: CuppingForm; // Used for internal (single sample)
  
  // Legacy / Internal fields
  coffeeName?: string;
  clientName?: string;
  
  // Free Cupping Fields
  sessionType: CuppingSessionType;
  samples?: FreeCuppingSample[];
}

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface UserProfile {
  id: string; // Matches auth.users.id
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface ExamResult {
  id: string;
  date: string;
  studentName: string;
  examTitle: string;
  score: number;
  passed: boolean;
  answers: number[];
  questions: Question[];
  deleted?: boolean;
}
