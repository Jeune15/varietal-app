import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { db } from '../db';
import { Order } from '../types';

/**
 * Hook to retrieve all orders, including salesOrders transformed into generic Orders.
 */
export const useOrders = (): Order[] => {
  const salesOrders = useLiveQuery(() => db.salesOrders.toArray()) || [];
  const rawOrders = useLiveQuery(() => db.orders.toArray()) || [];

  const orders = useMemo(() => {
    const salesAsOrders = salesOrders
      .filter(so => so.status === 'despachado')
      .map(so => ({
        id: so.id,
        clientName: so.clientName,
        variety: 'Pedido de Ventas',
        type: 'Venta Café Tostado' as const,
        quantityKg: 0,
        status: so.invoicedAt ? 'Facturado' : 'Pendiente',
        progress: so.invoicedAt ? 100 : 0,
        entryDate: so.despachadoAt || so.createdAt,
        dueDate: so.createdAt,
        orderLines: so.items.map(item => ({
          id: item.id,
          variety: item.productName,
          quantityKg: item.quantity,
          bagSizeGrams: 0,
          bagsCount: item.quantity
        })),
        isSalesOrder: true,
        salesOrderOriginal: so
      }));
    return [...rawOrders, ...salesAsOrders] as any[];
  }, [salesOrders, rawOrders]);

  return orders;
};
