/**
 * hooks/useOrderCalculations.ts
 * 
 * Pure business-logic utilities for orders.
 * Extracted from OrdersView to be testable and reusable.
 */

import { Order, ProductionActivity, ProductionActivityType } from '../types';

/**
 * Returns the display quantity for an order, accounting for service orders
 * where the roasted qty is the customer-facing number.
 */
export function getDisplayQty(order: Order): number {
  return order.type === 'Servicio de Tueste' && typeof order.serviceRoastedQtyKg === 'number'
    ? order.serviceRoastedQtyKg
    : order.quantityKg;
}

/**
 * Returns the required production activities for an order type.
 */
export function getRequiredActivities(order: Order): ProductionActivityType[] {
  if (order.isSalesOrder) return ['Armado de Pedido'];
  return order.type === 'Venta Café Tostado'
    ? ['Armado de Bolsas Retail']
    : ['Selección de Café', 'Armado de Pedido'];
}

/**
 * Checks if a specific activity type has been completed for an order.
 */
export function isActivityCompleted(
  order: Order,
  activityType: ProductionActivityType,
  history: ProductionActivity[]
): boolean {
  if (order.completedActivities && order.completedActivities.includes(activityType)) {
    return true;
  }
  return history.some(activity => {
    const details: any = activity.details || {};
    const activityOrderId = details.orderId || details.selectedOrderId;
    return activity.type === activityType && activityOrderId === order.id;
  });
}

/**
 * Returns true if all required activities for an order have been completed.
 */
export function areAllRequiredActivitiesCompleted(
  order: Order,
  history: ProductionActivity[]
): boolean {
  return getRequiredActivities(order).every(a => isActivityCompleted(order, a, history));
}

/**
 * Formats a date string for display in the order list.
 */
export function formatOrderDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}
