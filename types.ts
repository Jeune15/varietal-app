
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
  greenCoffeeName?: string; // Nombre del café verde cuando se ingresa manualmente
  orderId?: string; // Link to an order if it's a "Make to Order" roast
  clientName: string;
  greenQtyKg: number;
  roastedQtyKg: number;
  weightLossPercentage: number;
  profile: string;
  roastDate: string;
  roastCode?: string; // Código de café tostado
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
  shippedKg?: number;
  shippingCost?: number;
  shippingPaidBy?: string;
  invoicedDate?: string;
  deliveryType?: 'envio' | 'recojo';
  deliveryAddress?: string;
  deliveryAddressDetail?: string;
  isPaused?: boolean;
  nextActivity?: ProductionActivityType;
  completedActivities?: ProductionActivityType[];
  
  // Fields for Ventas -> Equipo Integration
  isSalesOrder?: boolean;
  salesOrderOriginal?: any;
}

export interface Expense {
  id: string;
  reason: string;
  amount: number;
  documentType?: 'Factura' | 'Boleta' | 'Recibo' | 'Otro';
  documentId?: string;
  date: string;
  status: 'pending' | 'paid';
  relatedOrderId?: string;
  createdBy?: string;
  paidBy?: string; // Varietal, Isai, Alejhandro, Anthony
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
  roastDate?: string; // Fecha de tostado para stock manual
  roastType?: string; // Tipo de tueste (espresso, omni, filtrado)
  roastCode?: string; // Código de café tostado
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
  intensity?: number; // 0-100 or 0-5 slider value
  balance?: number; // 0-100 or 0-5 slider value
  nextAction?: string[]; // Variables to change for next shot
  sensoryDescriptors?: string[]; // Selected descriptors from grid
  tasteBalance: string[]; // Multi-select ['sour', 'bitter', 'balanced', etc.]
  sensory: SensoryAnalysis;
  notes?: string;
  waterTempCelsius?: number;
  preinfusionSeconds?: number;
  pressureBar?: number;
  firstDropsSeconds?: number;
  tamping?: 'soft' | 'normal' | 'firm';
  acidityScore?: number;
  sweetnessScore?: number;
  bitternessScore?: number;
  bodyScore?: number;
  clarityScore?: number;
  sensoryCategories?: string[];
  sensorySubnotes?: string;
  acidityDescriptors?: string;
  sweetnessDescriptors?: string;
  bitternessDescriptors?: string;
  bodyDescriptors?: string;
  clarityDescriptors?: string;
  sensoryTimelineOffsets?: number[];
  sensoryTimelineNotes?: string[];
  temporalProfileStart?: number;
  temporalProfileMiddle?: number;
  temporalProfileEnd?: number;
  temporalProfileStartNotes?: string;
  temporalProfileMiddleNotes?: string;
  temporalProfileEndNotes?: string;
}

export interface EspressoSession {
  id: string;
  date: string;
  baristaName: string;
  coffeeName: string;
  shots: EspressoShot[];
  notes?: string;
  deleted?: boolean;
  coffeeOrigin?: string;
  coffeeProcess?: string;
  roastDate?: string;
}

export type BrewMethod = 'Filtro' | 'Inmersión' | 'Hario Switch' | 'Aeropress';

export type GrindSize =
  | 'extra-fine'
  | 'fine'
  | 'medium'
  | 'coarse'
  | 'extra-coarse';

export interface FilterPour {
  id: string;
  order: number;
  timeSeconds: number;
  volumeMl: number;
}

export interface FilterSession {
  id: string;
  date: string;
  brewerName: string;
  coffeeName: string;
  method: string;
  pours: FilterPour[];
  notes?: string;
  deleted?: boolean;
}

export interface FilterRecipePhase {
  id: string;
  order: number;
  startTimeSeconds: number;
  endTimeSeconds: number;
  volumeMl: number;
  pourType: 'espiral' | 'central' | 'pulsar' | 'lluvia' | 'continuous' | 'pulsed' | 'circular' | 'direct'; // Added new options, kept old for safety
  agitation?: boolean;
  spinCount?: number;
  action?: 'vertido' | 'presion'; // Aeropress specific
  pressureProfile?: 'suave' | 'moderada' | 'fuerte'; // Aeropress specific
}

export interface FilterTastingNotes {
  flavor: string;
  aroma: string;
  body: string;
  acidity: string;
  extraction?: number; // 0-10
  intensity?: number; // 0-10
  balance?: number; // 0-10
  clarity?: number; // 0-10
  selectedNotes?: string[];
  perceivedNotes?: string;
  observations?: string;
}

export interface FilterRecipe {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  method: BrewMethod;
  coffeeName: string;
  coffeeOrigin: string;
  coffeeProcess?: string; // New field
  coffeeDate: string;
  doseGrams: number;
  waterTempCelsius: number;
  grinderModel: string;
  grinderClicks: number | null;
  totalWaterMl: number;
  ratio: string;
  totalTimeSeconds: number;
  pressureBars: number | null;
  filterType: string;
  waterBrand: string;
  aeropressPressureProfile?: 'suave' | 'moderada' | 'fuerte'; // Aeropress specific
  aeropressPressTimeSeconds?: number; // Aeropress specific
  phases: FilterRecipePhase[];
  tasting: FilterTastingNotes;
  notes?: string;
  deleted?: boolean;
}

export type ProductionActivityType = 
  | 'Armado de Pedido' 
  | 'Selección de Café' 
  | 'Armado de Bolsas Retail' 
  | 'Despacho de Pedido'
  | 'SYSTEM_RESET'
  | 'Examen'
  | 'Calibración'
  | 'Ajuste de Merma'
  | 'Facturación de Pedido';

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

export interface TeamMember {
  id: string;
  name: string;
}

export interface ScheduleEntry {
  id: string;
  user_id: string;
  type: 'check_in' | 'check_out' | 'task' | 'event';
  date: string;
  time: string;
  details: any; // jsonb
}

// ===== Sales System Types =====

export interface SalesCategory {
  id: string;
  name: string;
  color: string; // hex color
  createdAt: string;
}

export interface SalesProduct {
  id: string;
  name: string;
  price: number;
  categoryId?: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface SalesOrderItem {
  id: string;
  productId?: string;
  productName: string;
  price: number;
  quantity: number;
  observation?: string;
}

export type SalesOrderStatus = 'pendiente' | 'entregado' | 'despachado';

export interface SalesOrder {
  id: string;
  clientName: string;
  orderName: string;
  items: SalesOrderItem[];
  total: number;
  status: SalesOrderStatus;
  createdAt: string;
  deliveredAt?: string;
  despachadoAt?: string; // Cuando se envía a equipo
  invoicedAt?: string; // Cuando se marca facturado
  usedRoastedCoffee?: { stockId: string; variety: string; qtyKg: number }[];
  usedRetailBags?: { bagId: string; type: string; variety: string; qty: number }[];
  usedUtilityBags?: { utilityId: string; format: string; qty: number }[];
  shippingCost?: number;
  shippingPaidBy?: string; // Varietal, Alejhandro, Anthony, Isai
}

export interface CashEntry {
  id: string;
  registerId: string;
  type: 'ingreso' | 'egreso';
  amount: number;
  description: string;
  orderId?: string;
  createdAt: string;
}

export interface CashRegister {
  id: string;
  weekStart: string; // ISO Monday 00:01
  weekEnd: string;   // ISO Sunday 23:59
  openingAmount: number;
  isOpen: boolean;
  entries: CashEntry[];
  totalIncome: number;
  totalExpense: number;
  closedAt?: string;
}
