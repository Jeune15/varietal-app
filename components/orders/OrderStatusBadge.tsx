/**
 * components/orders/OrderStatusBadge.tsx
 *
 * Renders a styled status badge for an order.
 * Extracted from OrdersView to avoid duplication across mobile/desktop views.
 */

import React from 'react';

interface Props {
  status: string;
  className?: string;
}

const OrderStatusBadge: React.FC<Props> = ({ status, className = '' }) => (
  <span
    className={`border border-black dark:border-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-black dark:text-white ${className}`}
  >
    {status}
  </span>
);

export default OrderStatusBadge;
