import { AlertTriangle, CheckSquare, Search, Square, Trash2, X } from "lucide-react";
import React, { useMemo, useState } from "react";
import ModalSheet from "./ModalSheet";
import { useInventory } from "../context/InventoryContext";
import { formatCOP } from "../utils/formatters";

interface PurgeConfirmModalProps {
  onClose: () => void;
}

type ManagementTab = "selective" | "clear_all";

const CONFIRMATION_PHRASE = "vaciar inventario";

export default function PurgeConfirmModal({ onClose }: PurgeConfirmModalProps) {
  const { products, deleteMultipleProducts, clearAllProducts } = useInventory();

  const [activeTab, setActiveTab] = useState<ManagementTab>("selective");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  // Filtrado de productos para la pestaña selectiva
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  // Selección individual
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Selección de todos los filtrados
  const toggleSelectAllFiltered = () => {
    if (selectedIds.size === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  // Ejecución de eliminación selectiva
  const handleDeleteSelective = async () => {
    if (selectedIds.size === 0 || isExecuting) return;
    setIsExecuting(true);
    try {
      await deleteMultipleProducts(Array.from(selectedIds));
      onClose();
    } finally {
      setIsExecuting(false);
    }
  };

  // Ejecución de vaciado total (requiere frase exacta)
  const isClearAllConfirmed = confirmationInput.trim().toLowerCase() === CONFIRMATION_PHRASE;

  const handleClearAll = async () => {
    if (!isClearAllConfirmed || isExecuting) return;
    setIsExecuting(true);
    try {
      await clearAllProducts();
      onClose();
    } finally {
      setIsExecuting(false);
    }
  };

  const allFilteredSelected =
    filteredProducts.length > 0 && selectedIds.size === filteredProducts.length;

  return (
    <ModalSheet
      title="Gestión y Vaciado de Catálogo"
      onClose={onClose}
      footer={
        activeTab === "selective" ? (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isExecuting}
              className="flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 text-sm font-bold text-[var(--text-primary)] dark:text-zinc-200 active:scale-[0.98] transition-transform"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteSelective}
              disabled={selectedIds.size === 0 || isExecuting}
              className={`flex min-h-12 items-center justify-center gap-1.5 rounded-2xl text-sm font-bold text-white shadow-lg active:scale-[0.98] transition-all duration-75 ${
                selectedIds.size === 0 || isExecuting
                  ? "bg-zinc-400 dark:bg-zinc-700 opacity-40 cursor-not-allowed shadow-none"
                  : "bg-[#ff3b30] hover:bg-[#ff453a]"
              }`}
            >
              <Trash2 size={16} />
              <span>
                {isExecuting
                  ? "Eliminando..."
                  : `Eliminar (${selectedIds.size})`}
              </span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isExecuting}
              className="flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 text-sm font-bold text-[var(--text-primary)] dark:text-zinc-200 active:scale-[0.98] transition-transform"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={!isClearAllConfirmed || isExecuting}
              className={`flex min-h-12 items-center justify-center gap-1.5 rounded-2xl text-sm font-bold text-white shadow-lg active:scale-[0.98] transition-all duration-75 ${
                !isClearAllConfirmed || isExecuting
                  ? "bg-zinc-400 dark:bg-zinc-700 opacity-40 cursor-not-allowed shadow-none"
                  : "bg-[#ff3b30] hover:bg-[#ff453a]"
              }`}
            >
              <Trash2 size={16} />
              <span>{isExecuting ? "Vaciando..." : "Ejecutar vaciado"}</span>
            </button>
          </div>
        )
      }
    >
      <div className="space-y-4 py-1">
        {/* Selector de Pestañas: Selección Selectiva vs Vaciado Total */}
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-[var(--border-color)] dark:border-zinc-800 bg-black/5 dark:bg-zinc-900/80 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("selective")}
            className={`min-h-10 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "selective"
                ? "bg-[var(--bg-elevated)] dark:bg-zinc-800 text-[var(--text-primary)] dark:text-white shadow-sm"
                : "text-[var(--text-secondary)] dark:text-zinc-400 hover:text-[var(--text-primary)]"
            }`}
          >
            Selección Manual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("clear_all")}
            className={`min-h-10 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "clear_all"
                ? "bg-[#ff3b30]/15 text-[#ff3b30] dark:bg-[#ff3b30]/25 dark:text-[#ff453a] shadow-sm"
                : "text-[var(--text-secondary)] dark:text-zinc-400 hover:text-[#ff3b30]"
            }`}
          >
            Vaciado Total (Catálogo)
          </button>
        </div>

        {/* Pestaña A: Selección Manual Selectiva */}
        {activeTab === "selective" && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {/* Buscador + Acciones rápidas */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] dark:text-zinc-500"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o categoría..."
                  className="w-full rounded-xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 pl-9 pr-8 py-2 text-xs font-semibold text-[var(--text-primary)] dark:text-zinc-100 placeholder:text-[var(--text-secondary)] dark:placeholder:text-zinc-500 outline-none focus:border-[#007aff] dark:focus:border-[#0a84ff] transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {filteredProducts.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAllFiltered}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-3 text-xs font-bold text-[var(--text-primary)] dark:text-zinc-200 active:scale-95 transition-transform shrink-0"
                >
                  {allFilteredSelected ? (
                    <>
                      <CheckSquare size={14} className="text-[#007aff] dark:text-[#0a84ff]" />
                      <span>Deseleccionar</span>
                    </>
                  ) : (
                    <>
                      <Square size={14} className="text-[var(--text-secondary)]" />
                      <span>Seleccionar todo</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Contador de seleccionados */}
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] dark:text-zinc-400 px-1">
              <span>
                Mostrando {filteredProducts.length} de {products.length} productos
              </span>
              <span className="font-bold text-[var(--text-primary)] dark:text-zinc-200">
                {selectedIds.size} seleccionados
              </span>
            </div>

            {/* Lista con checkboxes */}
            <div className="max-h-[46vh] overflow-y-auto space-y-2 pr-1">
              {filteredProducts.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900/50 p-6 text-center text-xs text-[var(--text-secondary)] dark:text-zinc-400">
                  No se encontraron productos que coincidan con la búsqueda.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isChecked = selectedIds.has(p.id);
                  const totalStock = p.batches.reduce((sum, b) => sum + b.stock, 0);

                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleSelect(p.id)}
                      className={`flex items-center justify-between gap-3 rounded-2xl border p-3 cursor-pointer select-none transition-colors ${
                        isChecked
                          ? "border-[#ff3b30]/50 bg-[#ff3b30]/10 dark:bg-[#ff3b30]/15"
                          : "border-[var(--border-color)] dark:border-zinc-800/80 bg-[var(--bg-elevated)] dark:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                            isChecked
                              ? "border-[#ff3b30] bg-[#ff3b30] text-white"
                              : "border-zinc-400 dark:border-zinc-600 bg-transparent"
                          }`}
                        >
                          {isChecked && <CheckSquare size={14} className="text-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-xs sm:text-sm font-bold text-[var(--text-primary)] dark:text-zinc-100">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-[var(--text-secondary)] dark:text-zinc-400 truncate">
                            {p.category} · {totalStock} uds
                          </p>
                        </div>
                      </div>

                      <span className="tabular-nums text-xs font-bold text-[var(--text-primary)] dark:text-zinc-200 shrink-0">
                        {formatCOP(p.price)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Pestaña B: Vaciado Total con Frase Obligatoria */}
        {activeTab === "clear_all" && (
          <div className="space-y-4 animate-in fade-in duration-150 py-1">
            {/* Alerta de Alto Impacto */}
            <div className="flex items-start gap-3 rounded-2xl border border-[#ff3b30]/40 bg-[#ff3b30]/10 p-3.5 text-[#ff3b30] dark:bg-[#ff3b30]/15">
              <AlertTriangle size={24} className="shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold text-sm">Vaciado Total y Permanente de Inventario</p>
                <p className="mt-1 opacity-90">
                  Estás a punto de desincorporar todos los{" "}
                  <strong>{products.length} productos</strong> del catálogo y vaciar el stock de la
                  tienda.
                </p>
                <p className="mt-1 text-[11px] opacity-75">
                  Regla de integridad: Las ventas, transacciones y métricas financieras previas en el
                  Historial permanecerán 100% conservadas.
                </p>
              </div>
            </div>

            {/* Instrucción de Seguridad */}
            <div className="rounded-2xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900/60 p-4 space-y-3">
              <label
                htmlFor="confirmation-phrase-input"
                className="block text-xs font-semibold text-[var(--text-secondary)] dark:text-zinc-400"
              >
                Para confirmar la eliminación total, escribe la frase exacta{" "}
                <span className="font-extrabold text-[#ff3b30] select-all underline">
                  "{CONFIRMATION_PHRASE}"
                </span>{" "}
                en el campo a continuación:
              </label>

              <input
                id="confirmation-phrase-input"
                type="text"
                autoComplete="off"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={`Escribe "${CONFIRMATION_PHRASE}" para desbloquear...`}
                className="w-full rounded-xl border border-[var(--border-color)] dark:border-zinc-700 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-3.5 py-2.5 text-sm font-bold text-[var(--text-primary)] dark:text-zinc-100 placeholder:text-[var(--text-secondary)] dark:placeholder:text-zinc-500 outline-none focus:border-[#ff3b30] transition-colors"
              />

              {confirmationInput.length > 0 && !isClearAllConfirmed && (
                <p className="text-[11px] font-medium text-[#ff3b30] animate-in fade-in duration-100">
                  La frase aún no coincide de forma exacta.
                </p>
              )}
              {isClearAllConfirmed && (
                <p className="text-[11px] font-bold text-[#30d158] animate-in fade-in duration-100">
                  ✓ Frase confirmada. El botón de vaciado ha sido desbloqueado.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </ModalSheet>
  );
}
