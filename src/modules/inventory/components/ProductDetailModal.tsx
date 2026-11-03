import { Eye, EyeOff, Minus, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import ModalSheet from "../../../components/ModalSheet";
import { useInventory } from "../../../context/InventoryContext";
import { Product } from "../../../types/domain";
import { formatCOP, parseCOPInput } from "../../../utils/formatters";

interface ProductDetailModalProps {
  product: Product;
  showCosts: boolean;
  onClose: () => void;
  onStartClose?: () => void;
  onOpenSuppliers: () => void;
}

/**
 * ProductDetailModal — Vista / Hoja de Detalle de Producto
 *
 * Estándares Apple HIG aplicados:
 * 1. Cabecera persistente opaca con handle superior ajustado y soporte swipe-to-dismiss (vía ModalSheet).
 * 2. Botón de acción principal fijado en el footer persistente inferior respetando safe areas,
 *    acercado ergonómicamente al borde inferior:
 *    - Si se modifica el precio: CTA Primario activo "Guardar nuevo precio".
 *    - Si no hay cambios pendientes: Botón "Listo" para confirmar y cerrar.
 * 3. Controles maestro de stock (+ / -) sincronizados determinísticamente con los lotes por proveedor
 *    (suma siempre idéntica al total; incrementa lote con mayor cantidad, decrementa lote con mayor stock disponible sin permitir negativos).
 * 4. Scroll vertical independiente con overscroll-contain e inercia táctil nativa.
 * 5. Acción destructiva ("Eliminar producto") ubicada al final del flujo de contenido
 *    con confirmación obligatoria para prevenir pulsaciones accidentales.
 */
export default function ProductDetailModal({
  product,
  showCosts,
  onClose,
  onStartClose,
  onOpenSuppliers,
}: ProductDetailModalProps) {
  const {
    products,
    suppliers,
    getSupplier,
    updateProductPrice,
    adjustBatchStock,
    adjustMasterStock,
    addBatchToProduct,
    deleteProduct,
  } = useInventory();

  // Control local de visibilidad de costos para atender al cliente en mostrador
  const [isCostVisible, setIsCostVisible] = useState(showCosts);

  // Obtener la instancia en tiempo real del producto desde el contexto
  const currentProduct = products.find((p) => p.id === product.id) || product;

  // Price editing state
  const [priceInput, setPriceInput] = useState(formatCOP(currentProduct.price));
  const currentNumericPrice = parseCOPInput(priceInput);
  const isPriceModified =
    currentNumericPrice !== currentProduct.price && currentNumericPrice > 0;

  // New batch form state
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [newBatchSupplierId, setNewBatchSupplierId] = useState(
    suppliers[0]?.id || ""
  );
  const [newBatchCostInput, setNewBatchCostInput] = useState("");
  const [newBatchStock, setNewBatchStock] = useState("5");

  // Total de unidades siempre calculado directamente de la suma de los lotes
  const totalStock = currentProduct.batches.reduce(
    (sum, b) => sum + b.stock,
    0
  );

  const handleSavePrice = () => {
    if (isPriceModified) {
      updateProductPrice(currentProduct.id, currentNumericPrice);
    }
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchSupplierId) return;
    const cost = parseCOPInput(newBatchCostInput);
    const stock = Math.max(0, parseInt(newBatchStock, 10) || 0);

    addBatchToProduct(currentProduct.id, {
      supplierId: newBatchSupplierId,
      cost,
      stock,
    });

    setIsAddingBatch(false);
    setNewBatchCostInput("");
    setNewBatchStock("5");
  };

  const handleDeleteProduct = () => {
    if (
      confirm(
        `¿Estás seguro de eliminar "${currentProduct.name}" del catálogo? Esta acción no afectará el historial de ventas previas.`
      )
    ) {
      deleteProduct(currentProduct.id);
      onClose();
    }
  };

  return (
    <ModalSheet
      onClose={onClose}
      onStartClose={onStartClose}
      title="Detalle de producto"
      // Botón de acción principal fijo en el footer inferior (ajustado ergonómicamente al borde)
      footer={
        <div className="w-full">
          {isPriceModified ? (
            <button
              type="button"
              onClick={handleSavePrice}
              className="flex min-h-11 w-full items-center justify-center rounded-2xl bg-accent text-sm font-bold text-white shadow-lg transition-all duration-200 active:scale-[0.98] hover:bg-accent-hover"
            >
              Guardar nuevo precio ({formatCOP(currentNumericPrice)})
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-11 w-full items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-sm font-bold text-[var(--text-primary)] shadow-sm transition-transform active:scale-[0.98] hover:bg-black/5 dark:hover:bg-white/5"
            >
              Listo
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Identificación del Producto */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] transition-colors duration-75">
            {currentProduct.name}
          </h1>
          <p className="mt-1 text-sm font-semibold text-accent transition-colors duration-200">
            {currentProduct.category}
          </p>
        </div>

        {/* Control Maestro de Stock Total: Sincronizado reactivamente con los lotes */}
        <div className="flex items-center justify-between rounded-3xl border border-[var(--border-color)] bg-[var(--bg-primary)]/50 p-4 transition-colors duration-75">
          <button
            type="button"
            onClick={() => adjustMasterStock(currentProduct.id, -1)}
            disabled={totalStock <= 0}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[#ff3b30] shadow-sm transition-transform active:scale-90 disabled:opacity-30"
            aria-label="Disminuir stock total"
          >
            <Minus size={22} strokeWidth={2.5} />
          </button>

          <div className="text-center">
            <span className="tabular-nums text-4xl font-black tracking-tight text-[var(--text-primary)] transition-colors duration-75">
              {totalStock}
            </span>
            <p className="text-xs font-semibold text-[var(--text-secondary)] transition-colors duration-75">
              unidades en total
            </p>
          </div>

          <button
            type="button"
            onClick={() => adjustMasterStock(currentProduct.id, 1)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[#30d158] shadow-sm transition-transform active:scale-90"
            aria-label="Aumentar stock total"
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Campo Precio de Venta Sugerido */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] transition-colors duration-75">
            Precio de venta sugerido
          </label>
          <input
            type="text"
            value={priceInput}
            onChange={(e) => {
              const val = parseCOPInput(e.target.value);
              setPriceInput(val > 0 ? formatCOP(val) : "");
            }}
            className="tabular-nums w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-4 py-3 text-lg font-bold text-[var(--text-primary)] outline-none focus:border-accent transition-colors"
          />
          {isPriceModified && (
            <p className="text-xs font-semibold text-accent transition-colors duration-200">
              Presiona «Guardar nuevo precio» en la barra inferior para aplicar
              el cambio.
            </p>
          )}
        </div>

        {/* Sección Lotes por Proveedor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Lotes por Proveedor
              </h3>
              <button
                type="button"
                onClick={() => setIsCostVisible((v) => !v)}
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-75"
                title={isCostVisible ? "Ocultar costos" : "Mostrar costos"}
                aria-label={isCostVisible ? "Ocultar costos" : "Mostrar costos"}
              >
                {isCostVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{isCostVisible ? "Ocultar" : "Costos"}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingBatch((prev) => !prev)}
              className="text-xs font-bold text-accent hover:underline transition-colors duration-200"
            >
              {isAddingBatch ? "Cerrar" : "+ Nuevo lote"}
            </button>
          </div>

          {/* Subformulario Nuevo Lote */}
          {isAddingBatch && (
            <form
              onSubmit={handleCreateBatch}
              className="rounded-2xl border border-accent/30 bg-accent-subtle p-3.5 space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-accent transition-colors duration-200">
                  Agregar Lote a este Producto
                </span>
                <button
                  type="button"
                  onClick={onOpenSuppliers}
                  className="text-[11px] font-semibold text-[var(--text-secondary)] hover:underline"
                >
                  Gestionar proveedores
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={newBatchSupplierId}
                  onChange={(e) => setNewBatchSupplierId(e.target.value)}
                  className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-2 text-xs font-semibold"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={newBatchCostInput}
                  onChange={(e) => {
                    const num = parseCOPInput(e.target.value);
                    setNewBatchCostInput(num > 0 ? formatCOP(num) : "");
                  }}
                  placeholder="Costo compra"
                  className="tabular-nums rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-2 text-xs"
                />

                <input
                  type="number"
                  min="1"
                  value={newBatchStock}
                  onChange={(e) => setNewBatchStock(e.target.value)}
                  placeholder="Cantidad"
                  className="tabular-nums rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                className="flex min-h-10 w-full items-center justify-center rounded-xl bg-accent hover:bg-accent-hover text-xs font-bold text-white shadow-sm transition-all duration-200"
              >
                Agregar Lote
              </button>
            </form>
          )}

          {/* Lista de Lotes */}
          <div className="space-y-2">
            {currentProduct.batches.map((batch) => {
              const sup = getSupplier(batch.supplierId);
              return (
                <div
                  key={batch.id}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)]/40 p-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3.5 w-3.5 rounded-full shadow-sm shrink-0"
                      style={{ backgroundColor: sup?.color ?? "#007aff" }}
                    />
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">
                        {sup?.name || "Proveedor desconocido"}
                      </p>
                      {isCostVisible && (
                        <p className="tabular-nums text-xs text-[var(--text-secondary)]">
                          Costo unitario: {formatCOP(batch.cost)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stepper por lote */}
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2 py-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() =>
                        adjustBatchStock(currentProduct.id, batch.id, -1)
                      }
                      disabled={batch.stock <= 0}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#ff3b30] hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-20"
                      aria-label="Reducir lote"
                    >
                      <Minus size={14} strokeWidth={2.5} />
                    </button>
                    <span className="tabular-nums min-w-[24px] text-center text-sm font-bold">
                      {batch.stock}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        adjustBatchStock(currentProduct.id, batch.id, 1)
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#30d158] hover:bg-black/5 dark:hover:bg-white/10"
                      aria-label="Aumentar lote"
                    >
                      <Plus size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Acción Destructiva: Al final del contenido con confirmación modal obligatoria */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleDeleteProduct}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#ff3b30] text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            <Trash2 size={18} />
            <span>Eliminar producto del catálogo</span>
          </button>
        </div>
      </div>
    </ModalSheet>
  );
}
