/**
 * db/config.ts — Dexie Database Schema & Instance
 * 
 * This is the single source of truth for the IndexedDB schema.
 * All table definitions and version migrations live here.
 */

import { Dexie, type EntityTable } from 'dexie';
import {
  GreenCoffee, Roast, Order, RoastedStock, RetailBagStock,
  ProductionActivity, Expense, ProductionItem, UserProfile,
  CuppingSession, EspressoSession, FilterSession, FilterRecipe,
  TeamMember, ScheduleEntry, SalesProduct, SalesCategory,
  SalesOrder, CashRegister, SalesCashSession, GuiaRemision, Client
} from '../types';

// ── Type Definition ──────────────────────────────────────────────
export type VarietalDB = Dexie & {
  greenCoffees: EntityTable<GreenCoffee, 'id'>;
  roasts: EntityTable<Roast, 'id'>;
  orders: EntityTable<Order, 'id'>;
  roastedStocks: EntityTable<RoastedStock, 'id'>;
  retailBags: EntityTable<RetailBagStock, 'id'>;
  history: EntityTable<ProductionActivity, 'id'>;
  expenses: EntityTable<Expense, 'id'>;
  productionInventory: EntityTable<ProductionItem, 'id'>;
  profiles: EntityTable<UserProfile, 'id'>;
  cuppingSessions: EntityTable<CuppingSession, 'id'>;
  espressoSessions: EntityTable<EspressoSession, 'id'>;
  filterSessions: EntityTable<FilterSession, 'id'>;
  filterRecipes: EntityTable<FilterRecipe, 'id'>;
  teamMembers: EntityTable<TeamMember, 'id'>;
  scheduleEntries: EntityTable<ScheduleEntry, 'id'>;
  salesProducts: EntityTable<SalesProduct, 'id'>;
  salesCategories: EntityTable<SalesCategory, 'id'>;
  salesOrders: EntityTable<SalesOrder, 'id'>;
  cashRegisters: EntityTable<CashRegister, 'id'>;
  salesCashSessions: EntityTable<SalesCashSession, 'id'>;
  guiasRemision: EntityTable<GuiaRemision, 'id'>;
  clients: EntityTable<Client, 'id'>;
};

// ── Shared Constants ─────────────────────────────────────────────
/** Canonical list of all table names in the database */
export const ALL_TABLES = [
  'greenCoffees', 'roasts', 'orders', 'roastedStocks', 'retailBags',
  'history', 'expenses', 'productionInventory', 'profiles',
  'cuppingSessions', 'espressoSessions', 'filterSessions', 'filterRecipes',
  'teamMembers', 'scheduleEntries', 'salesProducts', 'salesCategories',
  'salesOrders', 'cashRegisters', 'salesCashSessions', 'guiasRemision', 'clients'
] as const;

/**
 * Whitelist of allowed columns per table.
 * Used by sanitizeRecord() to strip unknown fields before pushing to Supabase.
 */
export const tableColumnWhitelist: Record<string, string[]> = {
  greenCoffees: ['id', 'clientName', 'variety', 'origin', 'entryDate', 'quantityKg'],
  roasts: [
    'id', 'greenCoffeeId', 'greenCoffeeName', 'orderId', 'clientName',
    'greenQtyKg', 'roastedQtyKg', 'weightLossPercentage', 'profile',
    'roastDate', 'roastCode'
  ],
  orders: [
    'id', 'clientName', 'variety', 'type', 'quantityKg', 'entryDate', 'dueDate',
    'status', 'progress', 'relatedRoastIds', 'requiresRoasting', 'roastType',
    'accumulatedRoastedKg', 'accumulatedGreenUsedKg', 'packagingType', 'bagsUsed',
    'sortingLossKg', 'fulfilledFromStockId', 'shippedDate', 'shippingCost', 'invoicedDate'
  ],
  roastedStocks: [
    'id', 'roastId', 'variety', 'clientName', 'totalQtyKg', 'remainingQtyKg',
    'isSelected', 'mermaGrams', 'roastDate', 'roastType', 'roastCode'
  ],
  retailBags: ['id', 'coffeeName', 'type', 'quantity', 'clientName', 'roastDate', 'roastId'],
  history: ['id', 'type', 'date', 'details'],
  expenses: ['id', 'reason', 'amount', 'documentType', 'documentId', 'date', 'status', 'relatedOrderId', 'createdBy', 'paidBy'],
  productionInventory: ['id', 'name', 'type', 'quantity', 'minThreshold', 'format'],
  profiles: ['id', 'email', 'role', 'isActive'],
  cuppingSessions: ['id', 'roastStockId', 'roastId', 'coffeeName', 'clientName', 'tasterName', 'date', 'objective', 'form', 'notes', 'sessionType', 'samples', 'deleted'],
  espressoSessions: ['id', 'date', 'baristaName', 'coffeeName', 'shots', 'notes', 'coffeeOrigin', 'coffeeProcess', 'roastDate', 'deleted'],
  filterSessions: ['id', 'date', 'brewerName', 'coffeeName', 'coffeeOrigin', 'coffeeProcess', 'roastDate', 'recipes', 'notes', 'deleted'],
  filterRecipes: [
    'id', 'createdAt', 'updatedAt', 'name', 'method', 'coffeeName', 'coffeeOrigin',
    'coffeeDate', 'doseGrams', 'waterTempCelsius', 'grinderModel', 'grinderClicks',
    'totalWaterMl', 'ratio', 'totalTimeSeconds', 'pressureBars', 'filterType',
    'waterBrand', 'phases', 'tasting', 'notes', 'deleted'
  ],
  teamMembers: ['id', 'name'],
  scheduleEntries: ['id', 'user_id', 'type', 'date', 'time', 'endDate', 'details'],
  salesProducts: ['id', 'name', 'categoryId', 'price', 'isFavorite', 'createdAt'],
  salesCategories: ['id', 'name', 'color', 'createdAt'],
  salesOrders: ['id', 'clientName', 'total', 'status', 'createdAt', 'completedAt', 'items', 'orderName', 'source', 'deliveredAt', 'despachadoAt', 'invoicedAt', 'usedRoastedCoffee', 'usedRetailBags', 'usedUtilityBags', 'shippingCost', 'shippingPaidBy', 'clientId'],
  cashRegisters: ['id', 'monthStart', 'monthEnd', 'isOpen', 'openingAmount', 'totalIncome', 'totalExpense', 'closedAt', 'entries'],
  salesCashSessions: ['id', 'openedAt', 'closedAt', 'openingAmount', 'isOpen', 'entries', 'totalIncome', 'totalExpense', 'label', 'legacyRegisterId'],
  guiasRemision: ['id', 'createdAt', 'fechaEmision', 'fechaInicio', 'fechaFin', 'emisor', 'rucEmisor', 'transportista', 'ceDniTransportista', 'placa', 'puntoPartida', 'destinatario', 'rucDestinatario', 'motivo', 'direccionDestino', 'descripcion', 'productos', 'numeroGuia'],
  clients: ['id', 'name', 'district', 'address', 'reference', 'phone', 'clientType', 'observations', 'createdAt']
};

// ── Sanitizer ────────────────────────────────────────────────────
/**
 * Strips fields not in the whitelist before pushing to Supabase.
 * Prevents mass-assignment of unexpected columns.
 */
export function sanitizeRecord(table: string, record: any): any {
  const allowed = tableColumnWhitelist[table];
  if (!allowed) return record;
  const sanitized: any = {};
  for (const key of allowed) {
    if (key in record) {
      sanitized[key] = record[key];
    }
  }
  return sanitized;
}

// ── Supabase Table Name Mapping ──────────────────────────────────
/** Maps local Dexie table names to their Supabase equivalents */
export function getSupabaseTableName(table: string): string {
  return table === 'teamMembers' ? 'team_members' : table;
}

// ── Database Instance ────────────────────────────────────────────
const db = new Dexie('VarietalDB') as VarietalDB;

db.version(12).stores({
  greenCoffees: 'id, clientName, variety',
  roasts: 'id, clientName, greenCoffeeId',
  orders: 'id, clientName, status',
  roastedStocks: 'id, roastId, clientName',
  retailBags: 'id, coffeeName, type',
  history: 'id, type, date',
  expenses: 'id, date, status',
  productionInventory: 'id, name, type, format',
  profiles: 'id, email, role',
  cuppingSessions: 'id, roastStockId, tasterName, date',
  espressoSessions: 'id, date, coffeeName',
  filterSessions: 'id, date, brewerName, coffeeName',
  filterRecipes: 'id, method, coffeeName',
  teamMembers: 'id, name',
  scheduleEntries: 'id, user_id, type, date',
  salesProducts: 'id, name, categoryId, isFavorite',
  salesCategories: 'id, name',
  salesOrders: 'id, status, createdAt',
  cashRegisters: 'id, monthStart, isOpen'
});

db.version(13).stores({
  greenCoffees: 'id, clientName, variety',
  roasts: 'id, clientName, greenCoffeeId',
  orders: 'id, clientName, status',
  roastedStocks: 'id, roastId, clientName',
  retailBags: 'id, coffeeName, type',
  history: 'id, type, date',
  expenses: 'id, date, status',
  productionInventory: 'id, name, type, format',
  profiles: 'id, email, role',
  cuppingSessions: 'id, roastStockId, tasterName, date',
  espressoSessions: 'id, date, coffeeName',
  filterSessions: 'id, date, brewerName, coffeeName',
  filterRecipes: 'id, method, coffeeName',
  teamMembers: 'id, name',
  scheduleEntries: 'id, user_id, type, date',
  salesProducts: 'id, name, categoryId, isFavorite',
  salesCategories: 'id, name',
  salesOrders: 'id, status, createdAt',
  cashRegisters: 'id, monthStart, isOpen',
  salesCashSessions: 'id, openedAt, closedAt, isOpen'
});

db.version(14).stores({
  greenCoffees: 'id, clientName, variety',
  roasts: 'id, clientName, greenCoffeeId',
  orders: 'id, clientName, status',
  roastedStocks: 'id, roastId, clientName',
  retailBags: 'id, coffeeName, type',
  history: 'id, type, date',
  expenses: 'id, date, status',
  productionInventory: 'id, name, type, format',
  profiles: 'id, email, role',
  cuppingSessions: 'id, roastStockId, tasterName, date',
  espressoSessions: 'id, date, coffeeName',
  filterSessions: 'id, date, brewerName, coffeeName',
  filterRecipes: 'id, method, coffeeName',
  teamMembers: 'id, name',
  scheduleEntries: 'id, user_id, type, date',
  salesProducts: 'id, name, categoryId, isFavorite',
  salesCategories: 'id, name',
  salesOrders: 'id, status, createdAt',
  cashRegisters: 'id, monthStart, isOpen',
  salesCashSessions: 'id, openedAt, closedAt, isOpen',
  guiasRemision: 'id, destinatario, createdAt'
});

db.version(15).stores({
  greenCoffees: 'id, clientName, variety',
  roasts: 'id, clientName, greenCoffeeId',
  orders: 'id, clientName, status',
  roastedStocks: 'id, roastId, clientName',
  retailBags: 'id, coffeeName, type',
  history: 'id, type, date',
  expenses: 'id, date, status',
  productionInventory: 'id, name, type, format',
  profiles: 'id, email, role',
  cuppingSessions: 'id, roastStockId, tasterName, date',
  espressoSessions: 'id, date, coffeeName',
  filterSessions: 'id, date, brewerName, coffeeName',
  filterRecipes: 'id, method, coffeeName',
  teamMembers: 'id, name',
  scheduleEntries: 'id, user_id, type, date',
  salesProducts: 'id, name, categoryId, isFavorite',
  salesCategories: 'id, name',
  salesOrders: 'id, status, createdAt',
  cashRegisters: 'id, monthStart, isOpen',
  salesCashSessions: 'id, openedAt, closedAt, isOpen',
  guiasRemision: 'id, destinatario, createdAt',
  clients: 'id, name, district, clientType'
});

export { db };
