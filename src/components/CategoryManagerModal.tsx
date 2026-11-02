import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  Sliders,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import AttributeConfigModal from "./AttributeConfigModal";
import ModalSheet from "./ModalSheet";
import { useInventory } from "../context/InventoryContext";
import { ProductCategory } from "../types/domain";
import {
  FACTORY_BASE_CATEGORIES,
  FALLBACK_ORPHAN_CATEGORY,
  inferAttributeKeysForCategory,
  isSameCatalogText,
  normalizeCatalogText,
} from "../utils/catalogConfig";

interface CategoryManagerModalProps {
  onClose: () => void;
}

export default function CategoryManagerModal({ onClose }: CategoryManagerModalProps) {
  const {
    products,
    catalogConfig,
    updateCategoryOrder,
    addCategory,
    deleteCategory,
    resetCatalogConfigToDefault,
  } = useInventory();

  const [draftOrder, setDraftOrder] = useState<ProductCategory[]>(() => [
    ...catalogConfig.categoryOrder,
  ]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Estado para alerta de protección contra categorías huérfanas (Riesgo 1)
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<{
    name: ProductCategory;
    productCount: number;
  } | null>(null);

  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);

  // Sincronizar draftOrder si se agregan o eliminan categorías en catalogConfig
  useEffect(() => {
    setDraftOrder((prev) => {
      const validSet = new Set(
        catalogConfig.categories.map((c) => c.name.toLowerCase())
      );
      const filtered = prev.filter((name) => validSet.has(name.toLowerCase()));
      for (const cat of catalogConfig.categories) {
        if (!filtered.some((n) => isSameCatalogText(n, cat.name))) {
          filtered.unshift(cat.name);
        }
      }
      return filtered;
    });
  }, [catalogConfig.categories]);

  // Mapa de cantidad de productos activos por categoría
  const productCountByCategory = (catName: ProductCategory): number => {
    return products.filter((p) => isSameCatalogText(p.category, catName)).length;
  };

  const isFactoryCategory = (catName: ProductCategory): boolean => {
    return FACTORY_BASE_CATEGORIES.some((b) => isSameCatalogText(b, catName));
  };

  // Mover categoría arriba/abajo
  const moveCategory = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= draftOrder.length) return;
    setDraftOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  // Drag & Drop reordenamiento por índice
  const handleDropAt = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return;
    setDraftOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  // Crear nueva categoría desde el modal de organización
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeCatalogText(newCategoryName);
    if (!clean || clean.toLowerCase() === "todos") return;

    const created = addCategory(clean, inferAttributeKeysForCategory(clean));
    if (created) {
      setDraftOrder((prev) => {
        if (prev.some((c) => isSameCatalogText(c, created.name))) return prev;
        return [created.name, ...prev];
      });
      setNewCategoryName("");
    }
  };

  // Intento de eliminación de categoría personalizada
  const handleRequestDeleteCategory = async (catName: ProductCategory) => {
    if (isFactoryCategory(catName)) return;
    const count = productCountByCategory(catName);
    if (count > 0) {
      // Activar protección obligatoria contra productos huérfanos
      setCategoryPendingDelete({ name: catName, productCount: count });
      return;
    }
    await deleteCategory(catName, FALLBACK_ORPHAN_CATEGORY);
    setDraftOrder((prev) => prev.filter((c) => !isSameCatalogText(c, catName)));
  };

  const handleConfirmOrphanMoveAndDelete = async () => {
    if (!categoryPendingDelete) return;
    const targetName = categoryPendingDelete.name;
    await deleteCategory(targetName, FALLBACK_ORPHAN_CATEGORY);
    setDraftOrder((prev) => {
      const filtered = prev.filter((c) => !isSameCatalogText(c, targetName));
      if (!filtered.some((c) => isSameCatalogText(c, FALLBACK_ORPHAN_CATEGORY))) {
        filtered.push(FALLBACK_ORPHAN_CATEGORY);
      }
      return filtered;
    });
    setCategoryPendingDelete(null);
  };

  // Guardar el orden actual y cerrar instantáneamente (Check ✓ en cabecera)
  const handleSaveAndClose = () => {
    updateCategoryOrder(draftOrder);
    onClose();
  };

  const handleResetDefaults = () => {
    resetCatalogConfigToDefault();
    setDraftOrder([...FACTORY_BASE_CATEGORIES]);
  };

  return (
    <>
      <ModalSheet
        title="Organizar Categorías"
        onClose={onClose}
        enableDragToDismiss={false}
        headerRight={
          <button
            type="button"
            onClick={handleSaveAndClose}
            aria-label="Guardar orden de categorías"
            title="Confirmar y guardar cambios"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#30d158] text-white shadow-md shadow-[#30d158]/25 transition-transform active:scale-95 hover:bg-[#28cd41]"
          >
            <Check size={20} strokeWidth={2.75} />
          </button>
        }
        footer={
          <button
            type="button"
            onClick={handleSaveAndClose}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#007aff] text-sm sm:text-base font-bold text-white shadow-lg active:scale-[0.98] transition-transform duration-75"
          >
            <Check size={18} />
            <span>Confirmar y guardar orden</span>
          </button>
        }
      >
        <div className="space-y-4 py-1">
          {/* Alerta Modal de Protección contra Categorías Huérfanas (Riesgo 1) */}
          {categoryPendingDelete && (
            <div
              role="alertdialog"
              aria-label="Alerta de categoría con productos activos"
              className="rounded-2xl border border-[#ff9500]/50 bg-[#ff9500]/10 dark:bg-[#ff9500]/15 p-4 space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-start gap-2.5 text-[#ff9500]">
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-bold text-sm text-[var(--text-primary)] dark:text-white">
                    Protección contra productos huérfanos
                  </p>
                  <p className="mt-1 text-[var(--text-secondary)] dark:text-zinc-300">
                    La categoría{" "}
                    <strong className="text-[var(--text-primary)] dark:text-white">
                      «{categoryPendingDelete.name}»
                    </strong>{" "}
                    tiene{" "}
                    <strong className="text-[#ff9500]">
                      {categoryPendingDelete.productCount} productos activos
                    </strong>
                    . ¿Deseas moverlos a la categoría{" "}
                    <strong className="text-[var(--text-primary)] dark:text-white">
                      «{FALLBACK_ORPHAN_CATEGORY}»
                    </strong>{" "}
                    antes de eliminarla?
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryPendingDelete(null)}
                  className="flex min-h-10 items-center justify-center rounded-xl border border-[var(--border-color)] dark:border-zinc-700 bg-[var(--bg-elevated)] dark:bg-zinc-900 text-xs font-bold text-[var(--text-primary)] dark:text-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOrphanMoveAndDelete}
                  className="flex min-h-10 items-center justify-center rounded-xl bg-[#ff3b30] px-2.5 text-xs font-bold text-white shadow-sm active:scale-95 transition-transform"
                >
                  Mover a General / Otros
                </button>
              </div>
            </div>
          )}

          {/* Crear nueva categoría rápida */}
          <form onSubmit={handleCreateCategory} className="flex items-center gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nueva categoría (ej. Relojes, Baterías Portátiles)..."
              aria-label="Nombre de nueva categoría"
              className="flex-1 rounded-xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-primary)] dark:text-zinc-100 placeholder:text-[var(--text-secondary)] dark:placeholder:text-zinc-500 outline-none focus:border-[#007aff]"
            />
            <button
              type="submit"
              disabled={!newCategoryName.trim()}
              aria-label="Añadir categoría personalizada"
              className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-[#007aff] px-3.5 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition-transform disabled:opacity-40 shrink-0"
            >
              <Plus size={16} />
              <span>Crear</span>
            </button>
          </form>

          {/* Regla de Oro: Categoría "Todos" fija e inamovible al inicio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                Prioridad en Barra de Filtros
              </span>
              <button
                type="button"
                onClick={() => setIsAttributeModalOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#007aff] dark:text-[#0a84ff] hover:underline"
              >
                <Sliders size={12} />
                <span>Banco de atributos</span>
              </button>
            </div>

            {/* Píldora Fija "Todos" */}
            <div className="flex items-center justify-between rounded-2xl border border-[#007aff]/30 bg-[#007aff]/10 dark:bg-[#007aff]/15 px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#007aff] text-white">
                  <Lock size={12} />
                </span>
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-[#007aff] dark:text-[#0a84ff]">
                    Todos
                  </p>
                  <p className="text-[10px] font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                    Fija e inamovible al inicio de la barra
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#007aff]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#007aff] dark:text-[#0a84ff]">
                Posición #1
              </span>
            </div>

            {/* Lista Interactiva Reordenable (Estilo WhatsApp / iOS) */}
            <div className="max-h-[38vh] overflow-y-auto space-y-2 pr-0.5">
              {draftOrder.map((catName, idx) => {
                const isFactory = isFactoryCategory(catName);
                const prodCount = productCountByCategory(catName);
                const catConfig = catalogConfig.categories.find((c) =>
                  isSameCatalogText(c.name, catName)
                );
                const attrLabels = (catConfig?.attributeKeys || [])
                  .map((k) => catalogConfig.attributes[k]?.label)
                  .filter(Boolean)
                  .join(" · ");

                const isDraggedOver = dragOverIndex === idx && draggedIndex !== idx;

                return (
                  <div
                    key={catName}
                    draggable
                    onDragStart={() => setDraggedIndex(idx)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIndex(idx);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedIndex !== null) {
                        handleDropAt(draggedIndex, idx);
                      }
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    data-testid={`category-row-${idx}`}
                    className={`flex items-center justify-between gap-2.5 rounded-2xl border px-3 py-2.5 transition-all select-none ${
                      isDraggedOver
                        ? "border-[#007aff] bg-[#007aff]/10 scale-[1.01]"
                        : "border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900/90"
                    }`}
                  >
                    {/* Lado Izquierdo: Botón rojo (-) para eliminar personalizadas, o indicador de base */}
                    <div className="shrink-0">
                      {!isFactory ? (
                        <button
                          type="button"
                          onClick={() => handleRequestDeleteCategory(catName)}
                          aria-label={`Eliminar categoría ${catName}`}
                          title={`Eliminar ${catName}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ff3b30]/15 text-[#ff3b30] hover:bg-[#ff3b30] hover:text-white active:scale-90 transition-all"
                        >
                          <Minus size={15} strokeWidth={2.75} />
                        </button>
                      ) : (
                        <span
                          title="Categoría base de fábrica (protegida)"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 dark:bg-zinc-800 text-[var(--text-secondary)] dark:text-zinc-400"
                        >
                          <Lock size={13} />
                        </span>
                      )}
                    </div>

                    {/* Centro: Nombre de la categoría + Metadatos */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs sm:text-sm font-bold text-[var(--text-primary)] dark:text-zinc-100">
                          {catName}
                        </p>
                        <span className="shrink-0 rounded-full bg-black/5 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)] dark:text-zinc-400 tabular-nums">
                          {prodCount} prod.
                        </span>
                      </div>
                      {attrLabels && (
                        <p className="truncate text-[10px] font-medium text-[var(--text-secondary)] dark:text-zinc-400 mt-0.5">
                          Atributos: {attrLabels}
                        </p>
                      )}
                    </div>

                    {/* Lado Derecho: Controles de prioridad + Asa de arrastre de 3 líneas horizontales anchas */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveCategory(idx, -1)}
                        aria-label={`Subir categoría ${catName}`}
                        title="Subir prioridad"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)]/50 dark:bg-zinc-800/70 text-[var(--text-primary)] dark:text-zinc-200 disabled:opacity-25 active:scale-90 transition-transform"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === draftOrder.length - 1}
                        onClick={() => moveCategory(idx, 1)}
                        aria-label={`Bajar categoría ${catName}`}
                        title="Bajar prioridad"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)]/50 dark:bg-zinc-800/70 text-[var(--text-primary)] dark:text-zinc-200 disabled:opacity-25 active:scale-90 transition-transform"
                      >
                        <ArrowDown size={13} />
                      </button>

                      {/* Asa de arrastre: 3 líneas horizontales anchas estilo iOS / WhatsApp */}
                      <div
                        aria-label={`Asa de arrastre ${catName}`}
                        title="Mantén presionado y arrastra para reordenar"
                        className="flex h-8 w-8 cursor-grab active:cursor-grabbing flex-col items-center justify-center gap-[3.5px] rounded-lg px-1.5 text-[var(--text-secondary)] dark:text-zinc-400 hover:text-[var(--text-primary)]"
                      >
                        <span className="block h-[2px] w-5 rounded-full bg-current" />
                        <span className="block h-[2px] w-5 rounded-full bg-current" />
                        <span className="block h-[2px] w-5 rounded-full bg-current" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sección Inferior Fija: Valores Predeterminados de Fábrica (Respaldo Seguro) */}
          <div className="rounded-2xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)]/50 dark:bg-zinc-900/50 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                  Valores Predeterminados Fijos (Respaldo)
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] dark:text-zinc-400 mt-0.5">
                  Categorías base de fábrica protegidas e inalterables.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetDefaults}
                aria-label="Restablecer orden predeterminado"
                className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[var(--border-color)] dark:border-zinc-700 bg-[var(--bg-elevated)] dark:bg-zinc-800 px-2.5 py-1.5 text-[11px] font-bold text-[var(--text-primary)] dark:text-zinc-200 active:scale-95 transition-transform"
              >
                <RotateCcw size={12} />
                <span>Restaurar base</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {FACTORY_BASE_CATEGORIES.map((baseCat) => (
                <span
                  key={baseCat}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] dark:text-zinc-300"
                >
                  <Lock size={10} className="opacity-70" />
                  <span>{baseCat}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </ModalSheet>

      {isAttributeModalOpen && (
        <AttributeConfigModal onClose={() => setIsAttributeModalOpen(false)} />
      )}
    </>
  );
}
