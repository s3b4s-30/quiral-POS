import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Edit2,
  Package,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import React, { useMemo, useRef, useState } from "react";
import {
  SUPPLIER_PALETTE,
  useInventory,
} from "../../../context/InventoryContext";
import { Supplier } from "../../../types/domain";
import { formatCOP } from "../../../utils/formatters";

interface DesktopSuppliersViewProps {
  onBack: () => void;
}

export default function DesktopSuppliersView({
  onBack,
}: DesktopSuppliersViewProps) {
  const {
    suppliers,
    products,
    showCosts,
    addSupplier,
    updateSupplier,
    deleteSupplier,
  } = useInventory();

  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedColor, setSelectedColor] = useState(SUPPLIER_PALETTE[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null
  );

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Estadísticas calculadas por proveedor (referencias, stock e inversión)
  const supplierStats = useMemo(() => {
    const statsMap = new Map<
      string,
      { productsCount: number; totalStock: number; totalCost: number }
    >();

    for (const sup of suppliers) {
      statsMap.set(sup.id, { productsCount: 0, totalStock: 0, totalCost: 0 });
    }

    for (const prod of products) {
      const supIdsInProduct = new Set<string>();
      for (const batch of prod.batches) {
        if (batch.supplierId) {
          supIdsInProduct.add(batch.supplierId);
          const current = statsMap.get(batch.supplierId) || {
            productsCount: 0,
            totalStock: 0,
            totalCost: 0,
          };
          current.totalStock += batch.stock;
          current.totalCost += batch.stock * batch.cost;
          statsMap.set(batch.supplierId, current);
        }
      }
      for (const sId of supIdsInProduct) {
        const current = statsMap.get(sId);
        if (current) {
          current.productsCount += 1;
        }
      }
    }

    return statsMap;
  }, [suppliers, products]);

  // Métricas globales acumuladas
  const globalStats = useMemo(() => {
    let totalStockAll = 0;
    let totalCostAll = 0;
    for (const stat of supplierStats.values()) {
      totalStockAll += stat.totalStock;
      totalCostAll += stat.totalCost;
    }
    return { totalStockAll, totalCostAll };
  }, [supplierStats]);

  // Filtrado de proveedores
  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || (s.phone && s.phone.includes(q))
    );
  }, [suppliers, searchQuery]);

  const startEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setName(sup.name);
    setPhone(sup.phone || "");
    setSelectedColor(sup.color);
    setError(null);
    setSuccessMsg(null);
    nameInputRef.current?.focus();
  };

  const cancelEdit = () => {
    setEditingSupplier(null);
    setName("");
    setPhone("");
    setSelectedColor(SUPPLIER_PALETTE[0]);
    setError(null);
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("El nombre del proveedor es obligatorio.");
      return;
    }

    if (editingSupplier) {
      updateSupplier({
        ...editingSupplier,
        name: trimmedName,
        phone: phone.trim() || undefined,
        color: selectedColor,
      });
      showSuccess(`Proveedor "${trimmedName}" actualizado correctamente.`);
      cancelEdit();
    } else {
      addSupplier({
        name: trimmedName,
        phone: phone.trim() || undefined,
        color: selectedColor,
      });
      showSuccess(`Proveedor "${trimmedName}" registrado con éxito.`);
      setName("");
      setPhone("");
      setSelectedColor(SUPPLIER_PALETTE[0]);
      nameInputRef.current?.focus();
    }
  };

  const confirmDelete = () => {
    if (!supplierToDelete) return;
    const name = supplierToDelete.name;
    deleteSupplier(supplierToDelete.id);
    if (editingSupplier?.id === supplierToDelete.id) {
      cancelEdit();
    }
    setSupplierToDelete(null);
    showSuccess(`Proveedor "${name}" eliminado.`);
  };

  return (
    <div
      data-testid="desktop-suppliers-view"
      className="w-full h-full flex flex-col overflow-hidden bg-[var(--bg-primary)] select-none antialiased-hd"
    >
      {/* 1. Cabecera Fija de Navegación de Escritorio */}
      <div className="shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-elevated)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="suppliers-back-btn"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent/40 active:scale-95 transition-all shadow-xs"
          >
            <ArrowLeft size={16} />
            <span>Regresar</span>
          </button>
          <div className="h-5 w-px bg-[var(--border-color)]" />
          <div>
            <h1 className="text-lg font-black text-[var(--text-primary)] leading-tight">
              Gestión de Proveedores y Canales de Abastecimiento
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Base de datos de mayoristas, líneas directas, identificación
              cromática y control de existencias
            </p>
          </div>
        </div>

        {/* Métricas Resumen */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-semibold">
            <span className="text-[var(--text-secondary)]">Proveedores:</span>
            <span className="tabular-nums font-bold text-[var(--text-primary)]">
              {suppliers.length}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-semibold">
            <span className="text-[var(--text-secondary)]">
              Stock Abastecido:
            </span>
            <span className="tabular-nums font-bold text-accent">
              {globalStats.totalStockAll} uds
            </span>
          </div>
          {showCosts && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span>Inversión Costo:</span>
              <span className="tabular-nums font-extrabold">
                {formatCOP(globalStats.totalCostAll)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Banner de Feedback / Éxito */}
      {successMsg && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-6 py-2.5 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in duration-150 shrink-0">
          <Check size={16} className="stroke-[3]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. Área de Trabajo Dividida: Formulario Rápido (Izquierda ~32%) + Data Grid Tipo Excel (Derecha ~68%) */}
      <div className="flex-1 overflow-hidden p-6 lg:p-8 flex flex-col md:flex-row gap-6">
        {/* Panel Izquierdo: Formulario de Alta Velocidad (Sin Modales) */}
        <div className="w-full md:w-80 lg:w-96 shrink-0 flex flex-col rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-5 shadow-xs overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
              {editingSupplier ? "Modificar Proveedor" : "Registrar Proveedor"}
            </h2>
            {editingSupplier && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-xs font-bold text-amber-500 hover:underline"
              >
                Cancelar
              </button>
            )}
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs font-semibold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Nombre de la Empresa / Mayorista *
              </label>
              <input
                ref={nameInputRef}
                type="text"
                data-testid="supplier-name-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="Ej. Importadora Medellín"
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2.5 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Contacto / Teléfono / WhatsApp
              </label>
              <div className="relative">
                <Phone
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
                />
                <input
                  type="tel"
                  data-testid="supplier-phone-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+57 300 123 4567"
                  className="tabular-nums w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] pl-9 pr-3.5 py-2.5 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                />
              </div>
            </div>

            {/* Selector de Color de Identificación */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-2">
                Color de Identificación Visual
              </label>
              <div className="grid grid-cols-7 gap-2 pt-1">
                {SUPPLIER_PALETTE.map((color) => {
                  const isSelected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      aria-label={`Seleccionar color ${color}`}
                      className="relative flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-90 shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      {isSelected && (
                        <Check
                          size={16}
                          strokeWidth={3}
                          className="text-white drop-shadow-md"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-[var(--text-secondary)]">
                Este color se asociará a los puntos de lote de cada producto que
                provenga de este proveedor.
              </p>
            </div>

            {/* Botones del Formulario */}
            <div className="pt-2">
              <button
                type="submit"
                data-testid="save-supplier-btn"
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-accent hover:bg-accent-hover shadow-accent-glow active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {editingSupplier ? (
                  <>
                    <Check size={14} />
                    <span>Guardar Cambios</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>Guardar Proveedor</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Panel Derecho: Tabla de Datos tipo Hoja de Cálculo (Data Grid) */}
        <div className="flex-1 flex flex-col rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 shadow-xs overflow-hidden">
          {/* Barra de Filtro de la Tabla */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)] shrink-0">
            <div className="relative flex-1 max-w-md">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
              />
              <input
                type="text"
                data-testid="search-suppliers-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar proveedor por nombre o teléfono..."
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] pl-10 pr-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-accent transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <span className="text-xs font-bold text-[var(--text-secondary)] tabular-nums">
              Mostrando {filteredSuppliers.length} de {suppliers.length}{" "}
              proveedores
            </span>
          </div>

          {/* Contenedor de la Tabla con Scroll Propio */}
          <div className="flex-1 overflow-y-auto mt-4 rounded-2xl border border-[var(--border-color)]">
            {filteredSuppliers.length === 0 ? (
              <div className="p-12 text-center text-[var(--text-secondary)]">
                <Users size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  Sin proveedores encontrados
                </p>
                <p className="text-xs mt-1">
                  {searchQuery
                    ? "No hay resultados para el filtro ingresado."
                    : "No hay proveedores registrados aún. Utiliza el formulario a la izquierda."}
                </p>
              </div>
            ) : (
              <table
                data-testid="desktop-suppliers-table"
                className="w-full text-left border-collapse"
              >
                <thead className="sticky top-0 z-10 bg-[var(--bg-primary)] border-b border-[var(--border-color)] text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Color</th>
                    <th className="py-3 px-4 min-w-[180px]">
                      Proveedor / Mayorista
                    </th>
                    <th className="py-3 px-4 w-44">Contacto / Teléfono</th>
                    <th className="py-3 px-4 w-36 text-center">Referencias</th>
                    <th className="py-3 px-4 w-36 text-center">Stock Físico</th>
                    {showCosts && (
                      <th className="py-3 px-4 w-36 text-right">
                        Inversión Costo
                      </th>
                    )}
                    <th className="py-3 px-4 w-28 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-xs font-semibold">
                  {filteredSuppliers.map((sup) => {
                    const isEditing = editingSupplier?.id === sup.id;
                    const stats = supplierStats.get(sup.id) || {
                      productsCount: 0,
                      totalStock: 0,
                      totalCost: 0,
                    };

                    return (
                      <tr
                        key={sup.id}
                        data-testid={`supplier-row-${sup.id}`}
                        className={`transition-colors ${
                          isEditing
                            ? "bg-accent-subtle/60"
                            : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                        }`}
                      >
                        {/* 1. Indicador de Color */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className="inline-block h-5 w-5 rounded-full ring-2 ring-white/20 shadow-xs"
                            style={{ backgroundColor: sup.color }}
                          />
                        </td>

                        {/* 2. Nombre del Proveedor */}
                        <td className="py-3 px-4 min-w-[180px]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[var(--text-primary)]">
                              {sup.name}
                            </span>
                            {isEditing && (
                              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-extrabold text-white">
                                Editando
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Contacto */}
                        <td className="py-3 px-4 tabular-nums text-[var(--text-secondary)] whitespace-nowrap">
                          {sup.phone ? (
                            <span className="font-semibold text-xs text-[var(--text-primary)]">
                              {sup.phone}
                            </span>
                          ) : (
                            <span className="text-[11px] italic opacity-60">
                              Sin teléfono
                            </span>
                          )}
                        </td>

                        {/* 4. Referencias Vinculadas */}
                        <td className="py-3 px-4 text-center tabular-nums">
                          <span className="rounded-lg bg-black/5 dark:bg-white/10 px-2.5 py-1 text-xs font-bold text-[var(--text-primary)]">
                            {stats.productsCount}{" "}
                            {stats.productsCount === 1 ? "ref" : "refs"}
                          </span>
                        </td>

                        {/* 5. Stock Físico */}
                        <td className="py-3 px-4 text-center tabular-nums">
                          <span
                            className={`font-black text-xs ${
                              stats.totalStock > 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-[var(--text-secondary)]"
                            }`}
                          >
                            {stats.totalStock} uds
                          </span>
                        </td>

                        {/* 6. Inversión en Costo (si showCosts) */}
                        {showCosts && (
                          <td className="py-3 px-4 text-right tabular-nums">
                            <span className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                              {formatCOP(stats.totalCost)}
                            </span>
                          </td>
                        )}

                        {/* 7. Acciones */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEdit(sup)}
                              aria-label={`Editar proveedor ${sup.name}`}
                              title="Editar proveedor"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-transparent bg-accent-subtle text-accent hover:border-accent-subtle active:scale-95 transition-all"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSupplierToDelete(sup)}
                              aria-label={`Eliminar proveedor ${sup.name}`}
                              title="Eliminar proveedor"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-transparent bg-red-500/10 text-red-500 hover:border-red-500/20 active:scale-95 transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal / Dialogo de Confirmación de Eliminación */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-red-600 dark:text-red-400">
              <AlertTriangle size={24} className="shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-black text-sm">¿Eliminar proveedor?</p>
                <p className="mt-1 opacity-90">
                  Estás a punto de eliminar a{" "}
                  <strong>"{supplierToDelete.name}"</strong>. Los lotes y
                  productos que tengan asignado este proveedor conservarán su
                  información histórica y su stock.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSupplierToDelete(null)}
                className="flex min-h-11 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs font-bold text-[var(--text-primary)] hover:border-accent/40 active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700 shadow-md active:scale-95 transition-all"
              >
                <Trash2 size={15} />
                <span>Sí, eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
