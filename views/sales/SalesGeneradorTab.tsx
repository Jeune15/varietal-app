import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, syncToCloud, getSupabase } from '../../db';
import { GuiaRemision, GuiaProducto } from '../../types';
import {
  Plus, Trash2, Eye, Download, Save, FileText, ChevronDown, ChevronUp,
  X, Check, RotateCcw, Calendar, Truck, User, MapPin, Package, ClipboardList
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

interface FormData {
  fechaEmision: string;
  fechaInicio: string;
  fechaFin: string;
  emisor: string;
  rucEmisor: string;
  transportista: string;
  ceDniTransportista: string;
  placa: string;
  puntoPartida: string;
  destinatario: string;
  rucDestinatario: string;
  motivo: string;
  direccionDestino: string;
  descripcion: string;
  productos: GuiaProducto[];
}

const emptyProduct = (): GuiaProducto => ({
  id: crypto.randomUUID(),
  nombre: '',
  cantidad: 1,
  unidad: 'Und.',
  precio: 0,
});

const emptyForm = (): FormData => ({
  fechaEmision: new Date().toISOString().split('T')[0],
  fechaInicio: new Date().toISOString().split('T')[0],
  fechaFin: new Date().toISOString().split('T')[0],
  emisor: '',
  rucEmisor: '',
  transportista: '',
  ceDniTransportista: '',
  placa: '',
  puntoPartida: '',
  destinatario: '',
  rucDestinatario: '',
  motivo: '',
  direccionDestino: '',
  descripcion: '',
  productos: [emptyProduct()],
});

const formatDateShort = (d: string) => {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length !== 3) return d;
  return `${parseInt(parts[2])}/${parseInt(parts[1])}/${parts[0].slice(2)}`;
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const SalesGeneradorTab: React.FC = () => {
  const guias = useLiveQuery(() => db.guiasRemision.orderBy('createdAt').reverse().toArray()) || [];

  const [form, setForm] = useState<FormData>(emptyForm());
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [viewingGuia, setViewingGuia] = useState<GuiaRemision | null>(null);
  const [openSections, setOpenSections] = useState({
    general: true,
    transporte: true,
    destinatario: true,
    envio: true,
    productos: true,
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [mobileScale, setMobileScale] = useState(1);

  useEffect(() => {
    const calcScale = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 1024) {
          // Mobile: scale to fit viewport
          setMobileScale(Math.min(1, (window.innerWidth - 24) / 750));
        } else {
          // Desktop: form(420) + gap(24) + padding(48) = 492px reserved
          const available = window.innerWidth - 492;
          setMobileScale(Math.min(1, available / 750));
        }
      }
    };
    calcScale();
    window.addEventListener('resize', calcScale);
    return () => window.removeEventListener('resize', calcScale);
  }, []);

  const previewRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // ---- Form Helpers ----
  const updateField = (key: keyof FormData, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updateProduct = (id: string, key: keyof GuiaProducto, value: any) => {
    setForm(prev => ({
      ...prev,
      productos: prev.productos.map(p => (p.id === id ? { ...p, [key]: value } : p)),
    }));
  };

  const addProduct = () => {
    setForm(prev => ({
      ...prev,
      productos: [...prev.productos, emptyProduct()],
    }));
  };

  const removeProduct = (id: string) => {
    setForm(prev => ({
      ...prev,
      productos: prev.productos.filter(p => p.id !== id),
    }));
  };

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isFormValid = useMemo(() => {
    return (
      form.emisor.trim() &&
      form.destinatario.trim() &&
      form.productos.length > 0 &&
      form.productos.every(p => p.nombre.trim())
    );
  }, [form]);

  // ---- Generate Preview ----
  const handleGeneratePreview = () => {
    if (!isFormValid) return;
    setViewingGuia(null);
    setShowPreview(true);
    // On mobile, scroll up for preview
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---- Generate next guia number ----
  const generateGuiaNumber = () => {
    const count = guias.length + 1;
    return `GR-${count.toString().padStart(4, '0')}`;
  };

  // ---- Save ----
  const handleSave = async () => {
    if (!isFormValid) return;
    setSaving(true);
    try {
      const guia: GuiaRemision = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        fechaEmision: form.fechaEmision,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        emisor: form.emisor,
        rucEmisor: form.rucEmisor,
        transportista: form.transportista,
        ceDniTransportista: form.ceDniTransportista,
        placa: form.placa,
        puntoPartida: form.puntoPartida,
        destinatario: form.destinatario,
        rucDestinatario: form.rucDestinatario,
        motivo: form.motivo,
        direccionDestino: form.direccionDestino,
        descripcion: form.descripcion,
        productos: form.productos,
        numeroGuia: generateGuiaNumber(),
      };
      await db.guiasRemision.add(guia);
      await syncToCloud('guiasRemision', guia);
      setToast('✓ Guía guardada correctamente');
      setForm(emptyForm());
      setShowPreview(false);
      setViewingGuia(null);
    } catch (err) {
      console.error('Error saving guia:', err);
      setToast('✕ Error al guardar la guía');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    setDownloading(true);

    // Temporarily reset transform on zoom-wrapper so html2canvas captures at full size
    const zoomWrapper = document.getElementById('zoom-wrapper');
    const origTransform = zoomWrapper?.style.transform;
    const origWidth = zoomWrapper?.style.width;
    const origMarginBottom = zoomWrapper?.style.marginBottom;
    if (zoomWrapper) {
      zoomWrapper.style.transform = 'none';
      zoomWrapper.style.width = 'auto';
      zoomWrapper.style.marginBottom = '0';
    }

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = previewRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20; // 10mm margin each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pageHeight - 20) {
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      } else {
        // Multi-page
        let y = 0;
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        const maxSliceHeight = Math.floor(((pageHeight - 20) / imgWidth) * canvas.width);

        while (y < canvas.height) {
          const sliceH = Math.min(maxSliceHeight, canvas.height - y);
          pageCanvas.height = sliceH;
          const ctx = pageCanvas.getContext('2d')!;
          ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
          const sliceData = pageCanvas.toDataURL('image/png');
          const sliceImgH = (sliceH * imgWidth) / canvas.width;
          if (y > 0) pdf.addPage();
          pdf.addImage(sliceData, 'PNG', 10, 10, imgWidth, sliceImgH);
          y += sliceH;
        }
      }

      const name = viewingGuia
        ? `guia_${viewingGuia.numeroGuia}_${viewingGuia.destinatario}`
        : `guia_${form.destinatario || 'preview'}`;
      pdf.save(`${name.replace(/\s+/g, '_')}.pdf`);
      setToast('✓ PDF descargado');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setToast('✕ Error al generar PDF');
    } finally {
      if (zoomWrapper) {
        if (origTransform !== undefined) zoomWrapper.style.transform = origTransform;
        if (origWidth !== undefined) zoomWrapper.style.width = origWidth;
        if (origMarginBottom !== undefined) zoomWrapper.style.marginBottom = origMarginBottom;
      }
      setDownloading(false);
    }
  };

  // ---- Delete ----
  const handleDelete = async (id: string) => {
    try {
      await db.guiasRemision.delete(id);
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('guiasRemision').delete().eq('id', id);
      }
      if (viewingGuia?.id === id) {
        setViewingGuia(null);
        setShowPreview(false);
      }
      setConfirmDeleteId(null);
      setToast('✓ Guía eliminada');
    } catch (err) {
      console.error('Error deleting guia:', err);
      setToast('✕ Error al eliminar');
    }
  };

  // ---- View from history ----
  const handleView = (guia: GuiaRemision) => {
    setViewingGuia(guia);
    setShowPreview(true);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---- Download from history ----
  const handleHistoryDownload = (guia: GuiaRemision) => {
    setViewingGuia(guia);
    setShowPreview(true);
    // We need to wait for the preview to render before downloading
    setTimeout(() => handleDownloadPDF(), 500);
  };

  // The data to show in preview — either form data or a loaded guia
  const previewData = viewingGuia || {
    ...form,
    numeroGuia: generateGuiaNumber(),
    id: '',
    createdAt: '',
  };

  const totalPrecio = (viewingGuia?.productos || form.productos).reduce(
    (s, p) => s + ((p.precio || 0) * (p.cantidad || 0)),
    0
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Main content area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Desktop: side-by-side, Mobile: stacked */}
          <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 p-4 lg:p-6">
            {/* LEFT: Form */}
            <div className={`w-full lg:w-[420px] flex-shrink-0`}>
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-black uppercase tracking-widest text-stone-500 dark:text-stone-400">
                    Generador de Guía
                  </h2>
                </div>

                {/* Section: Datos Generales */}
                <FormSection
                  title="Datos Generales"
                  icon={<Calendar className="w-3.5 h-3.5" />}
                  open={openSections.general}
                  onToggle={() => toggleSection('general')}
                >
                  <div className="grid grid-cols-3 gap-2">
                    <FieldInput label="F. Emisión" type="date" value={form.fechaEmision} onChange={v => updateField('fechaEmision', v)} />
                    <FieldInput label="F. Inicio" type="date" value={form.fechaInicio} onChange={v => updateField('fechaInicio', v)} />
                    <FieldInput label="F. Fin" type="date" value={form.fechaFin} onChange={v => updateField('fechaFin', v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <FieldInput label="Emisor" value={form.emisor} onChange={v => updateField('emisor', v)} placeholder="Nombre emisor" />
                    <FieldInput label="RUC / CI" value={form.rucEmisor} onChange={v => updateField('rucEmisor', v)} placeholder="RUC o CI" />
                  </div>
                </FormSection>

                {/* Section: Transporte */}
                <FormSection
                  title="Transporte"
                  icon={<Truck className="w-3.5 h-3.5" />}
                  open={openSections.transporte}
                  onToggle={() => toggleSection('transporte')}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <FieldInput label="Transportista" value={form.transportista} onChange={v => updateField('transportista', v)} placeholder="Nombre" />
                    <FieldInput label="CE / DNI" value={form.ceDniTransportista} onChange={v => updateField('ceDniTransportista', v)} placeholder="Documento" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <FieldInput label="Placa" value={form.placa} onChange={v => updateField('placa', v)} placeholder="ABC-123" />
                    <FieldInput label="Punto de Partida" value={form.puntoPartida} onChange={v => updateField('puntoPartida', v)} placeholder="Bodega..." />
                  </div>
                </FormSection>

                {/* Section: Destinatario */}
                <FormSection
                  title="Destinatario"
                  icon={<User className="w-3.5 h-3.5" />}
                  open={openSections.destinatario}
                  onToggle={() => toggleSection('destinatario')}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <FieldInput label="Destinatario" value={form.destinatario} onChange={v => updateField('destinatario', v)} placeholder="Nombre" />
                    <FieldInput label="RUC / CI" value={form.rucDestinatario} onChange={v => updateField('rucDestinatario', v)} placeholder="RUC o CI" />
                  </div>
                  <FieldInput label="Motivo" value={form.motivo} onChange={v => updateField('motivo', v)} placeholder="Motivo de envío" className="mt-2" />
                </FormSection>

                {/* Section: Envío */}
                <FormSection
                  title="Envío"
                  icon={<MapPin className="w-3.5 h-3.5" />}
                  open={openSections.envio}
                  onToggle={() => toggleSection('envio')}
                >
                  <FieldInput label="Dirección Destino" value={form.direccionDestino} onChange={v => updateField('direccionDestino', v)} placeholder="Dirección completa" />
                  <FieldInput label="Descripción" value={form.descripcion} onChange={v => updateField('descripcion', v)} placeholder="Descripción del envío" className="mt-2" />
                </FormSection>

                {/* Section: Productos */}
                <FormSection
                  title={`Productos (${form.productos.length})`}
                  icon={<Package className="w-3.5 h-3.5" />}
                  open={openSections.productos}
                  onToggle={() => toggleSection('productos')}
                >
                  <div className="space-y-2">
                    {form.productos.map((prod, idx) => (
                      <div key={prod.id} className="flex items-start gap-1.5 p-2 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-100 dark:border-stone-700/50">
                        <span className="flex-shrink-0 w-4 h-4 mt-4 rounded-full bg-stone-200 dark:bg-stone-700 text-[8px] font-black flex items-center justify-center text-stone-500 dark:text-stone-400">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0 space-y-1">
                          {/* Row 1: Nombre (full width) */}
                          <input
                            value={prod.nombre}
                            onChange={e => updateProduct(prod.id, 'nombre', e.target.value)}
                            placeholder="Nombre del producto"
                            className="w-full px-2 py-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          {/* Row 2: Cantidad | Unidad | Precio */}
                          <div className="grid grid-cols-3 gap-1">
                            <div>
                              <label className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block mb-0.5">Cant.</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={prod.cantidad}
                                onChange={e => updateProduct(prod.id, 'cantidad', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                className="w-full px-2 py-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block mb-0.5">Unidad</label>
                              <select
                                value={prod.unidad}
                                onChange={e => updateProduct(prod.id, 'unidad', e.target.value)}
                                className="w-full px-2 py-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              >
                                <option value="Und.">Und.</option>
                                <option value="Kg">Kg</option>
                                <option value="Lt">Lt</option>
                                <option value="Caja">Caja</option>
                                <option value="Paquete">Paquete</option>
                                <option value="Bolsa">Bolsa</option>
                                <option value="Saco">Saco</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block mb-0.5">Precio</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={prod.precio}
                                onChange={e => updateProduct(prod.id, 'precio', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                className="w-full px-2 py-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                        </div>
                        {form.productos.length > 1 && (
                          <button
                            onClick={() => removeProduct(prod.id)}
                            className="flex-shrink-0 mt-4 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addProduct}
                    className="w-full mt-2 py-2 flex items-center justify-center gap-1.5 border border-dashed border-stone-300 dark:border-stone-600 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:border-stone-400 dark:hover:border-stone-500 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar Producto
                  </button>
                </FormSection>

                {/* Action Button */}
                <button
                  onClick={handleGeneratePreview}
                  disabled={!isFormValid}
                  className="w-full py-3 bg-stone-800 dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-widest rounded-lg hover:bg-stone-900 dark:hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
                >
                  <Eye className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                  Generar Vista Previa
                </button>
              </div>
            </div>

            {/* RIGHT: Preview */}
            {showPreview && (
              <div className="
                fixed inset-0 z-[200] bg-stone-900/60 backdrop-blur-sm lg:static lg:inset-auto lg:z-auto lg:bg-transparent lg:backdrop-blur-none flex flex-col items-center justify-center lg:items-stretch lg:justify-start
              ">
                {/* Mobile Pop-up Container */}
                <div className="
                  flex flex-col w-full h-full bg-stone-100 dark:bg-stone-900 lg:bg-transparent
                  lg:flex-1 lg:min-w-0 relative lg:h-auto
                ">
                  {/* Mobile Header */}
                  <div className="lg:hidden flex-shrink-0 flex items-center justify-between p-4 bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 shadow-sm z-30 w-full relative">
                    <span className="text-xs font-black uppercase tracking-widest text-stone-700 dark:text-stone-300">
                      Vista Previa
                    </span>
                    <button
                      onClick={() => { setShowPreview(false); setViewingGuia(null); }}
                      className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-800 rounded-full transition-colors active:scale-[0.8]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Scrollable Document Area */}
                  <div className="flex-1 overflow-y-auto overflow-x-auto w-full relative z-20" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <div
                      id="zoom-wrapper"
                      className="origin-top-left lg:block lg:w-auto py-4 pb-28 lg:pb-0 lg:py-0"
                      style={mobileScale < 1 ? {
                        transform: `scale(${mobileScale})`,
                        transformOrigin: 'top left',
                        width: '750px',
                        marginBottom: `calc(${(750 * mobileScale)}px - 750px + 32px)`,
                      } : {}}
                    >
                      {/* The Preview Card */}
                      <div className="
                        bg-white shadow-2xl lg:shadow-lg lg:border border-stone-200 dark:border-stone-700
                        overflow-hidden
                        w-[750px]
                      ">
                        <div ref={previewRef} className="w-[750px] bg-white">
                          <GuiaPreview data={previewData as any} totalPrecio={totalPrecio} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Mobile (fixed bottom) */}
                  <div className="
                    lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 z-30 flex gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]
                  ">
                    <button
                      onClick={handleDownloadPDF}
                      disabled={downloading}
                      className="flex-1 py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <Download className="w-4 h-4" />
                      {downloading ? 'Generando...' : 'Descargar PDF'}
                    </button>
                    {!viewingGuia && (
                      <button
                        onClick={handleSave}
                        disabled={saving || !isFormValid}
                        className="flex-1 py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Guardando...' : 'Guardar Guía'}
                      </button>
                    )}
                  </div>

                  {/* Desktop Actions */}
                  <div className="hidden lg:flex gap-3 mt-4">
                    <button
                      onClick={handleDownloadPDF}
                      disabled={downloading}
                      className="flex-1 py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <Download className="w-4 h-4" />
                      {downloading ? 'Generando...' : 'Descargar PDF'}
                    </button>
                    {!viewingGuia && (
                      <button
                        onClick={handleSave}
                        disabled={saving || !isFormValid}
                        className="flex-1 py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Guardando...' : 'Guardar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* When preview is hidden on desktop, show placeholder */}
            {!showPreview && (
              <div className="hidden lg:flex flex-1 items-center justify-center text-stone-300 dark:text-stone-700">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-sm font-bold text-stone-400 dark:text-stone-600">
                    Completa el formulario y genera la vista previa
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* HISTORIAL */}
          <div className="px-4 lg:px-6 pb-6">
            <div className="border-t border-stone-200 dark:border-stone-800 pt-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-3 flex items-center gap-2">
                <ClipboardList className="w-3.5 h-3.5" />
                Historial de Guías ({guias.length})
              </h3>

              {guias.length === 0 ? (
                <div className="text-center py-10 text-stone-300 dark:text-stone-700">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs text-stone-400 dark:text-stone-600">No hay guías guardadas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {guias.map(guia => (
                    <div
                      key={guia.id}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      {/* Guia number badge */}
                      <div className="flex-shrink-0 w-14 h-10 bg-stone-100 dark:bg-stone-800 rounded-md flex items-center justify-center">
                        <span className="text-[9px] font-black text-stone-500 dark:text-stone-400 uppercase">
                          {guia.numeroGuia}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">
                          {guia.destinatario || 'Sin destinatario'}
                        </p>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                          {new Date(guia.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {' · '}
                          {guia.productos.length} producto{guia.productos.length !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex items-center gap-1">
                        <button
                          onClick={() => handleView(guia)}
                          className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Ver"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleHistoryDownload(guia)}
                          className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {confirmDeleteId === guia.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(guia.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Confirmar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(guia.id)}
                            className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] bg-stone-800 dark:bg-white text-white dark:text-black px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in">
          <span className="text-xs font-bold">{toast}</span>
        </div>
      )}
    </div>
  );
};

// ============================================================
// FORM SECTION (collapsible)
// ============================================================

interface FormSectionProps {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ title, icon, open, onToggle, children }) => (
  <div className="border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden bg-white dark:bg-stone-900">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
    >
      <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
        {icon}
        <span className="text-[11px] font-black uppercase tracking-wider">{title}</span>
      </div>
      {open ? <ChevronUp className="w-3.5 h-3.5 text-stone-400" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
    </button>
    {open && (
      <div className="px-3 pb-3 pt-1">
        {children}
      </div>
    )}
  </div>
);

// ============================================================
// FIELD INPUT
// ============================================================

interface FieldInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}

const FieldInput: React.FC<FieldInputProps> = ({ label, value, onChange, placeholder, type = 'text', className = '' }) => (
  <div className={className}>
    <label className="text-[9px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 block mb-0.5">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-stone-300 dark:placeholder:text-stone-600"
    />
  </div>
);

// ============================================================
// GUIA PREVIEW — Document-like Layout
// ============================================================

interface GuiaPreviewProps {
  data: GuiaRemision & Partial<FormData>;
  totalPrecio: number;
}

const GuiaPreview: React.FC<GuiaPreviewProps> = ({ data, totalPrecio }) => {
  return (
    <div
      style={{
        fontFamily: 'Inter, Arial, Helvetica, sans-serif',
        color: '#000000',
        backgroundColor: '#ffffff',
        padding: '32px',
        minHeight: '700px',
      }}
    >
      {/* ---- HEADER + EMISOR: Logo left, Title perfect center, Emisor bottom right ---- */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch', marginBottom: '10px', minHeight: '90px' }}>
        {/* Logo — top-left, stretches from top to emisor height */}
        <div style={{ width: '180px', flexShrink: 0, display: 'flex', alignItems: 'flex-start' }}>
          <img
            src="/logonegro.png"
            alt="Logo"
            style={{ width: '100%', objectFit: 'contain', objectPosition: 'left top' }}
            crossOrigin="anonymous"
          />
        </div>

        {/* Title — perfectly centered in the document layout */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '8px', textAlign: 'center', pointerEvents: 'none' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 900,
            letterSpacing: '0.08em',
            color: '#000000',
            margin: 0,
            textTransform: 'uppercase',
          }}>
            GUÍA DE REMISIÓN
          </h1>
        </div>

        {/* Emisor — bottom right */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '2px' }}>
          <div style={{
            textAlign: 'right',
            fontSize: '11px',
            lineHeight: '1.6',
          }}>
            <div><span style={{ fontWeight: 700, color: '#000000', textTransform: 'uppercase' }}>EMISOR:</span> {data.emisor}</div>
            <div><span style={{ fontWeight: 700, color: '#000000', textTransform: 'uppercase' }}>RUC / C.I:</span> {data.rucEmisor}</div>
          </div>
        </div>
      </div>

      {/* ---- TRANSPORTE — 3 columns: Fechas | Transportista+RUC | Placa+Partida ---- */}
      <div style={{
        display: 'flex',
        border: '1px solid #000000',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        {/* Col 1: Fechas */}
        <div style={{
          flex: '1',
          padding: '10px 14px',
          fontSize: '11px',
          lineHeight: '1.8',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div><span style={{ fontWeight: 700, color: '#000000', textTransform: 'uppercase' }}>Fecha de Emisión:</span> {formatDateShort(data.fechaEmision)}</div>
          <div><span style={{ fontWeight: 700, color: '#000000', textTransform: 'uppercase' }}>Fecha de Inicio:</span> {formatDateShort(data.fechaInicio)}</div>
          <div><span style={{ fontWeight: 700, color: '#000000', textTransform: 'uppercase' }}>Fecha Fin:</span> {formatDateShort(data.fechaFin)}</div>
        </div>
        {/* Col 2: Transportista + RUC */}
        <div style={{
          flex: '1',
          padding: '10px 14px',
          fontSize: '11px',
          lineHeight: '1.8',
          borderLeft: '1px solid #000000',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div><span style={{ fontWeight: 700, color: '#000000', textTransform: 'uppercase' }}>Transportista:</span> {data.transportista}</div>
          <div><span style={{ fontWeight: 700, color: '#000000', textTransform: 'uppercase' }}>RUC / C.I:</span> {data.ceDniTransportista}</div>
        </div>
        {/* Col 3: Placa + Punto de Partida */}
        <div style={{
          width: '200px',
          flexShrink: 0,
          padding: '10px 14px',
          fontSize: '11px',
          lineHeight: '1.8',
          borderLeft: '1px solid #000000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div><span style={{ fontWeight: 700, color: '#000000', textTransform: 'uppercase' }}>Placa:</span> {data.placa}</div>
          <div><span style={{ fontWeight: 700, color: '#000000', textTransform: 'uppercase' }}>Punto de Partida:</span> {data.puntoPartida}</div>
        </div>
      </div>

      {/* ---- DESTINATARIO ---- */}
      <div style={{
        display: 'flex',
        marginTop: '10px',
        border: '1px solid #000000',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          flex: '1',
          padding: '10px 14px',
          fontSize: '11px',
          lineHeight: '1.8',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div><span style={{ fontWeight: 700, color: '#000000', textTransform: 'uppercase' }}>Destinatario:</span> {data.destinatario}</div>
          <div><span style={{ fontWeight: 700, color: '#000000', textTransform: 'uppercase' }}>RUC / C.I:</span> {data.rucDestinatario}</div>
          <div><span style={{ fontWeight: 700, color: '#000000', textTransform: 'uppercase' }}>Motivo:</span> {data.motivo}</div>
        </div>
        <div style={{
          flex: '1',
          padding: '10px 14px',
          fontSize: '11px',
          lineHeight: '1.8',
          borderLeft: '1px solid #000000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div><span style={{ fontWeight: 700, color: '#000000', textTransform: 'uppercase' }}>Dirección de Destino:</span> {data.direccionDestino}</div>
          <div><span style={{ fontWeight: 700, color: '#000000', textTransform: 'uppercase' }}>Descripción:</span> {data.descripcion}</div>
        </div>
      </div>

      {/* ---- DETALLE DE GUÍA ---- */}
      <h2 style={{
        fontSize: '14px',
        fontWeight: 900,
        marginTop: '20px',
        marginBottom: '10px',
        color: '#000000',
        letterSpacing: '0.02em',
      }}>
        Detalle de Guía
      </h2>

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '12px',
        border: '1px solid #000000',
      }}>
        <thead>
          <tr style={{
            backgroundColor: '#000000',
            color: '#ffffff',
          }}>
            <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em', width: '40%' }}>Producto</th>
            <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Cantidad</th>
            <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Unidad</th>
            <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Precio Unit.</th>
            <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {(data.productos || []).map((prod, idx) => {
            const lineTotal = (prod.precio || 0) * (prod.cantidad || 0);
            return (
              <tr key={prod.id || idx} style={{
                borderBottom: '1px solid #d4d4d4',
                backgroundColor: idx % 2 === 1 ? '#f5f5f5' : '#ffffff',
              }}>
                <td style={{ padding: '10px 14px' }}>{prod.nombre}</td>
                <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600 }}>
                  {typeof prod.cantidad === 'number' ? prod.cantidad.toFixed(2) : prod.cantidad}
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'center' }}>{prod.unidad}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                  {(prod.precio || 0).toFixed(2)}
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>
                  {lineTotal.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: '#000000', color: '#ffffff' }}>
            <td colSpan={4} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Total</td>
            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, fontSize: '13px' }}>
              {totalPrecio.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ---- FIRMAS ---- */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '40px',
        gap: '32px',
      }}>
        {['Aprobado por:', 'Recibido por:'].map(label => (
          <div key={label} style={{ width: '220px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#000000', marginBottom: '6px' }}>{label}</p>
            <div style={{
              height: '50px',
              border: '1px solid #000000',
              borderRadius: '2px',
              backgroundColor: '#fafafa',
            }} />
          </div>
        ))}
      </div>

      {/* Guia number watermark */}
      {data.numeroGuia && (
        <p style={{
          textAlign: 'right',
          fontSize: '10px',
          color: '#737373',
          marginTop: '16px',
        }}>
          {data.numeroGuia}
        </p>
      )}
    </div>
  );
};

export default SalesGeneradorTab;
