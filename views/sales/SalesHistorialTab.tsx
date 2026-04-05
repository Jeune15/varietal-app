import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { SalesCashSession } from '../../types';
import { History, Calendar, ChevronDown, ChevronUp, FileDown, LockKeyhole, Unlock } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SalesHistorialTab: React.FC = () => {
  const sessions = useLiveQuery(() => db.salesCashSessions.toArray()) || [];
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return sessions
      .slice()
      .sort((a, b) => new Date((b.closedAt || b.openedAt)).getTime() - new Date((a.closedAt || a.openedAt)).getTime());
  }, [sessions]);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const downloadPDF = (session: SalesCashSession) => {
    const doc = new jsPDF();
    const title = 'Resumen de Caja';
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 30);

    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text(`Apertura: ${formatDate(session.openedAt)} ${formatTime(session.openedAt)}`, 14, 40);
    doc.text(`Cierre: ${session.closedAt ? `${formatDate(session.closedAt)} ${formatTime(session.closedAt)}` : 'Abierta'}`, 14, 47);
    if (session.label) {
      doc.text(`Etiqueta: ${session.label}`, 14, 54);
    }

    const balance = session.openingAmount + session.totalIncome - session.totalExpense;
    doc.setFontSize(12);
    doc.text(`Monto Inicial: S/ ${session.openingAmount.toFixed(2)}`, 14, 66);
    doc.text(`Ingresos: S/ ${session.totalIncome.toFixed(2)}`, 14, 73);
    doc.text(`Egresos: S/ ${session.totalExpense.toFixed(2)}`, 14, 80);
    doc.text(`Balance Final: S/ ${balance.toFixed(2)}`, 14, 87);

    const entries = (session.entries || []).slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (entries.length > 0) {
      const entryData = entries.map(e => [
        `${formatDate(e.createdAt)} ${formatTime(e.createdAt)}`,
        e.type.toUpperCase(),
        e.description,
        `S/ ${Number(e.amount).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: 95,
        head: [['Fecha', 'Tipo', 'Descripción', 'Monto']],
        body: entryData,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0] },
        styles: { fontSize: 8, cellPadding: 3 }
      });
    }

    const fileId = session.closedAt ? session.closedAt.split('T')[0] : session.openedAt.split('T')[0];
    doc.save(`Caja_${fileId}.pdf`);
  };

  if (sorted.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <div className="border-b border-stone-200 dark:border-stone-800 pb-6 mb-8">
          <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Historial de Caja</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Resumen por periodos de apertura y cierre</p>
        </div>
        <div className="text-center py-16 text-stone-400 dark:text-stone-600">
          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No hay historial aún</p>
          <p className="text-xs mt-1">El historial aparecerá cuando abras y cierres una caja</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase">Historial de Caja</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Resumen por periodos de apertura y cierre</p>
        </div>
      </div>

      <div className="space-y-4">
        {sorted.map(session => {
          const isExpanded = expandedId === session.id;
          const balance = session.openingAmount + session.totalIncome - session.totalExpense;
          const StatusIcon = session.isOpen ? Unlock : LockKeyhole;
          const statusText = session.isOpen ? 'Caja abierta' : 'Caja cerrada';
          const statusColor = session.isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-500 dark:text-stone-400';

          return (
            <div key={session.id} className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-stone-500 dark:text-stone-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                    {formatDate(session.openedAt)} {formatTime(session.openedAt)}
                    {session.closedAt ? ` — ${formatDate(session.closedAt)} ${formatTime(session.closedAt)}` : ''}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusIcon className={`w-3.5 h-3.5 ${statusColor}`} />
                    <p className={`text-[10px] uppercase tracking-widest font-bold ${statusColor}`}>{statusText}</p>
                    {session.label ? (
                      <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded">
                        {session.label}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-4">
                  <div>
                    <p className={`text-sm font-black ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      S/ {balance.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-0.5">
                      {session.entries?.length || 0} mov.
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPDF(session);
                    }}
                    className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-sm transition-colors"
                    title="Descargar PDF"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  )}
                </div>
              </button>

              {/* Expandable Detail */}
              {isExpanded && (
                <div className="border-t border-stone-100 dark:border-stone-800">
                  <div className="p-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Movimientos</h4>
                    {!session.entries || session.entries.length === 0 ? (
                      <p className="text-xs text-stone-400 text-center py-4">Sin movimientos</p>
                    ) : (
                      <div className="space-y-2">
                        {session.entries
                          .slice()
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map(entry => (
                            <div key={entry.id} className="flex items-center gap-3 bg-stone-50 dark:bg-stone-800/30 rounded-lg px-3 py-2.5">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                entry.type === 'ingreso'
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                  : 'bg-red-100 dark:bg-red-900/30'
                              }`}>
                                <span className={`text-[10px] font-black ${
                                  entry.type === 'ingreso'
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-red-700 dark:text-red-400'
                                }`}>
                                  {entry.type === 'ingreso' ? '+' : '-'}
                                </span>
                              </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">{entry.description}</p>
                              <p className="text-[10px] text-stone-400">{formatDate(entry.createdAt)} · {formatTime(entry.createdAt)}</p>
                            </div>
                            <div className={`text-xs font-black flex-shrink-0 ${
                              entry.type === 'ingreso'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              S/ {Number(entry.amount).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SalesHistorialTab;
