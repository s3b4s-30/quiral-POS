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
import React, { useRef, useState } from "react";
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
    updateCategoryAttributes,
    resetCatalogConfigToDefault,
  } = useInventory();

  const [draftOrder, setDraftOrder] = useState<ProductCategory[]>(() => [
    ...catalogConfig.categoryOrder,
  ]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Estado para arrastre táctil directo por deslizamiento (iOS / móvil)
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);
  const touchDragIndexRef = useRef<number | null>(null);
  const longPressRowTimerRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number>(0);
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  // Categoría cuyo orden de atributos se está configurando en vivo
  const [editingAttrCategory, setEditingAttrCategory] = useState<ProductCategory | null>(
    null
  );

  // Estado para alerta de protección contra categorías huérfanas (Riesgo 1)
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<{
    name: ProductCategory;
    productCount: number;
  } | null>(null);

  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);

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

  // Reordenamiento directo entre dos índices
  const handleDropAt = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return;
    setDraftOrder((prev) => {
      if (fromIdx >= prev.length || toIdx >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  // Limpiar temporizador de long-press en fila
  const clearRowLongPressTimer = () => {
    if (longPressRowTimerRef.current !== null) {
      window.clearTimeout(longPressRowTimerRef.current);
      longPressRowTimerRef.current = null;
    }
  };

  // Iniciar arrastre táctil inmediato desde el asa de 3 líneas
  const handleHandleTouchStart = (idx: number, clientY: number) => {
    clearRowLongPressTimer();
    touchStartYRef.current = clientY;
    touchDragIndexRef.current = idx;
    setTouchDragIndex(idx);
  };

  // Iniciar long-press en cualquier parte de la fila para activar deslizamiento táctil
  const handleRowTouchStart = (idx: number, clientY: number) => {
    clearRowLongPressTimer();
    touchStartYRef.current = clientY;
    longPressRowTimerRef.current = window.setTimeout(() => {
      touchDragIndexRef.current = idx;
      setTouchDragIndex(idx);
      longPressRowTimerRef.current = null;
    }, 220);
  };

  // Procesar deslizamiento vertical del dedo sobre la lista para reordenar en tiempo real
  const handleTouchMovePoint = (clientX: number, clientY: number, e?: React.TouchEvent) => {
    const activeIdx = touchDragIndexRef.current;
    if (activeIdx === null) {
      // Si el usuario movió el dedo antes de cumplirse el long-press, cancelar timer para permitir scroll normal
      if (Math.abs(clientY - touchStartYRef.current) > 10) {
        clearRowLongPressTimer();
      }
      return;
    }

    if (e && e.cancelable) {
      e.preventDefault();
    }

    // Buscar sobre qué fila se encuentra el dedo por coordenadas o por hit-testing
    let targetIdx: number | null = null;
    const elUnderFinger = document.elementFromPoint(clientX, clientY);
    const rowEl = elUnderFinger?.closest("[data-category-index]") as HTMLElement | null;
    if (rowEl && rowEl.dataset.categoryIndex !== undefined) {
      const parsed = parseInt(rowEl.dataset.categoryIndex, 10);
      if (!Number.isNaN(parsed)) {
        targetIdx = parsed;
      }
    } else if (listContainerRef.current) {
      const rows = Array.from(
        listContainerRef.current.querySelectorAll<HTMLElement>("[data-category-index]")
      );
      for (const r of rows) {
        const rect = r.getBoundingClientRect();
        if (clientY >= rect.top && clientY <= rect.bottom) {
          const parsed = parseInt(r.dataset.categoryIndex || "", 10);
          if (!Number.isNaN(parsed)) {
            targetIdx = parsed;
            break;
          }
        }
      }
    }

    if (targetIdx !== null && targetIdx !== activeIdx) {
      handleDropAt(activeIdx, targetIdx);
      touchDragIndexRef.current = targetIdx;
      setTouchDragIndex(targetIdx);
    }
  };

  const handleTouchEndOrCancel = () => {
    clearRowLongPressTimer();
    touchDragIndexRef.current = null;
    setTouchDragIndex(null);
  };

  // Crear nueva categoría desde el modal de organización (respeta jerarquía añadiéndose al final)
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeCatalogText(newCategoryName);
    if (!clean || clean.toLowerCase() === "todos") return;

    const created = addCategory(clean, inferAttributeKeysForCategory(clean));
    if (created) {
      setDraftOrder((prev) => {
        if (prev.some((c) => isSameCatalogText(c, created.name))) return prev;
        return [...prev, created.name];
      });
      setNewCategoryName("");
    }
  };

  // Eliminación de cualquier categoría (personalizada o predeterminada) de la barra activa
  const handleRequestDeleteCategory = async (catName: ProductCategory) => {
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

  // Restaurar con un solo toque una categoría predeterminada eliminada desde la sección de Respaldo
  const handleRestoreDefaultCategory = (baseCat: ProductCategory) => {
    addCategory(baseCat, inferAttributeKeysForCategory(baseCat));
    setDraftOrder((prev) => {
      if (prev.some((c) => isSameCatalogText(c, baseCat))) return prev;
      return [...prev, baseCat];
    });
  };

  // Alternar atributo en una categoría respetando el orden exacto de clic/selección
  const handleToggleCategoryAttributeOrder = (
    catName: ProductCategory,
    attrKey: string
  ) => {
    const catConfig = catalogConfig.categories.find((c) =>
      isSameCatalogText(c.name, catName)
    );
    const currentKeys =
      catConfig?.attributeKeys ?? inferAttributeKeysForCategory(catName);
    const exists = currentKeys.includes(attrKey);
    const nextKeys = exists
      ? currentKeys.length > 1
        ? currentKeys.filter((k) => k !== attrKey)
        : currentKeys
      : [...currentKeys, attrKey];

    updateCategoryAttributes(catName, nextKeys);
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
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent hover:bg-accent-hover text-sm sm:text-base font-bold text-white shadow-lg active:scale-[0.98] transition-all duration-200"
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
              data-testid="orphan-category-alert"
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
                  data-testid="confirm-orphan-category-delete"
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
              className="flex-1 rounded-xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-primary)] dark:text-zinc-100 placeholder:text-[var(--text-secondary)] dark:placeholder:text-zinc-500 outline-none focus:border-accent transition-colors"
            />
            <button
              type="submit"
              disabled={!newCategoryName.trim()}
              aria-label="Añadir categoría personalizada"
              className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-accent hover:bg-accent-hover px-3.5 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition-all duration-200 disabled:opacity-40 shrink-0"
            >
              <Plus size={16} />
              <span>Crear</span>
            </button>
          </form>

          {/* Regla de Oro: Categoría "Todos" fija e inamovible al inicio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                Prioridad en Barra de Filtros (Desliza para ordenar)
              </span>
              <button
                type="button"
                onClick={() => setIsAttributeModalOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline transition-colors duration-200"
              >
                <Sliders size={12} />
                <span>Banco de atributos</span>
              </button>
            </div>

            {/* Píldora Fija "Todos" */}
            <div className="flex items-center justify-between rounded-2xl border border-accent/30 bg-accent-subtle px-3.5 py-2.5 transition-colors duration-200">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white transition-colors duration-200">
                  <Lock size={12} />
                </span>
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-accent transition-colors duration-200">
                    Todos
                  </p>
                  <p className="text-[10px] font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                    Fija e inamovible al inicio de la barra
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-accent-subtle px-2.5 py-0.5 text-[10px] font-bold text-accent transition-colors duration-200">
                Posición #1
              </span>
            </div>

            {/* Lista Interactiva Reordenable por Deslizamiento Táctil Directo y Drag & Drop */}
            <div
              ref={listContainerRef}
              data-testid="category-manager-list"
              onTouchMove={(e) => {
                const touch = e.touches[0];
                if (touch) {
                  handleTouchMovePoint(touch.clientX, touch.clientY, e);
                }
              }}
              onTouchEnd={handleTouchEndOrCancel}
              onTouchCancel={handleTouchEndOrCancel}
              className="max-h-[38vh] overflow-y-auto space-y-2 pr-0.5"
            >
              {draftOrder.map((catName, idx) => {
                const isFactory = isFactoryCategory(catName);
                const prodCount = productCountByCategory(catName);
                const catConfig = catalogConfig.categories.find((c) =>
                  isSameCatalogText(c.name, catName)
                );
                const currentAttrKeys =
                  catConfig?.attributeKeys ?? inferAttributeKeysForCategory(catName);
                const attrLabels = currentAttrKeys
                  .map((k, i) => `${i + 1}. ${catalogConfig.attributes[k]?.label || k}`)
                  .filter(Boolean)
                  .join(" · ");

                const isDraggedOver = dragOverIndex === idx && draggedIndex !== idx;
                const isTouchDragging = touchDragIndex === idx;
                const isEditingAttrs =
                  editingAttrCategory !== null &&
                  isSameCatalogText(editingAttrCategory, catName);

                return (
                  <div
                    key={catName}
                    data-category-index={idx}
                    data-testid={`category-row-${idx}`}
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
                    onTouchStart={(e) => {
                      const touch = e.touches[0];
                      if (touch) {
                        handleRowTouchStart(idx, touch.clientY);
                      }
                    }}
                    className={`rounded-2xl border px-3 py-2.5 transition-all select-none ${
                      isTouchDragging || isDraggedOver
                        ? "border-accent bg-accent-subtle scale-[1.01] shadow-md z-10"
                        : "border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900/90"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Lado Izquierdo: Botón rojo (-) para quitar cualquier categoría (predeterminada o personalizada) */}
                      <button
                        type="button"
                        onClick={() => handleRequestDeleteCategory(catName)}
                        aria-label={`Eliminar categoría ${catName}`}
                        title={
                          isFactory
                            ? `Quitar ${catName} de la barra activa (pasa a Respaldo)`
                            : `Eliminar ${catName}`
                        }
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ff3b30]/15 text-[#ff3b30] hover:bg-[#ff3b30] hover:text-white active:scale-90 transition-all"
                      >
                        <Minus size={15} strokeWidth={2.75} className="shrink-0" />
                      </button>

                      {/* Centro: Nombre de la categoría + Metadatos y Orden de Atributos */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs sm:text-sm font-bold text-[var(--text-primary)] dark:text-zinc-100">
                            {catName}
                          </p>
                          <span className="shrink-0 rounded-full bg-black/5 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)] dark:text-zinc-400 tabular-nums">
                            {prodCount} prod.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAttrCategory(catName);
                            setIsAttributeModalOpen(true);
                          }}
                          aria-label={`Ordenar atributos de ${catName}`}
                          className="mt-0.5 block max-w-full truncate text-left text-[10px] font-medium text-[var(--text-secondary)] dark:text-zinc-400 hover:text-accent transition-colors duration-200"
                        >
                          {attrLabels ? `Atributos: ${attrLabels}` : "Configurar atributos"}
                        </button>
                      </div>

                      {/* Lado Derecho: Controles rápidos + Asa de arrastre táctil directo de 3 líneas horizontales */}
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

                        {/* Asa de arrastre: 3 líneas horizontales anchas con soporte táctil directo */}
                        <div
                          aria-label={`Asa de arrastre ${catName}`}
                          title="Mantén presionado y desliza hacia arriba o abajo para reordenar"
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            const touch = e.touches[0];
                            if (touch) {
                              handleHandleTouchStart(idx, touch.clientY);
                            }
                          }}
                          style={{ touchAction: "none" }}
                          className="flex h-8 w-8 cursor-grab active:cursor-grabbing flex-col items-center justify-center gap-[3.5px] rounded-lg px-1.5 text-[var(--text-secondary)] dark:text-zinc-400 hover:text-[var(--text-primary)]"
                        >
                          <span className="block h-[2px] w-5 rounded-full bg-current" />
                          <span className="block h-[2px] w-5 rounded-full bg-current" />
                          <span className="block h-[2px] w-5 rounded-full bg-current" />
                        </div>
                      </div>
                    </div>

                    {/* Panel desplegable para reordenar los atributos de esta categoría según secuencia de clic */}
                    {isEditingAttrs && (
                      <div className="mt-2.5 border-t border-[var(--border-color)] dark:border-zinc-800 pt-2.5 space-y-1.5 animate-in fade-in duration-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                          Toca los atributos en el orden exacto en que deseas verlos:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.values(catalogConfig.attributes).map((attr) => {
                            const orderIdx = currentAttrKeys.indexOf(attr.key);
                            const isSelected = orderIdx !== -1;
                            return (
                              <button
                                key={attr.key}
                                type="button"
                                onClick={() =>
                                  handleToggleCategoryAttributeOrder(catName, attr.key)
                                }
                                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors duration-200 ${
                                  isSelected
                                    ? "bg-accent text-white shadow-sm"
                                    : "border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)] dark:bg-zinc-950 text-[var(--text-secondary)] dark:text-zinc-400"
                                }`}
                              >
                                {isSelected && (
                                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[10px] font-extrabold">
                                    {orderIdx + 1}
                                  </span>
                                )}
                                <span>{attr.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sección Inferior Fija: Valores Predeterminados (Respaldo Interactivos) */}
          <div className="rounded-2xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)]/50 dark:bg-zinc-900/50 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                  Valores Predeterminados Fijos (Respaldo)
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] dark:text-zinc-400 mt-0.5">
                  Toca cualquier categoría en respaldo para volver a agregarla a la barra.
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
              {FACTORY_BASE_CATEGORIES.map((baseCat) => {
                const isActiveInBar = draftOrder.some((c) =>
                  isSameCatalogText(c, baseCat)
                );
                if (!isActiveInBar) {
                  return (
                    <button
                      key={baseCat}
                      type="button"
                      onClick={() => handleRestoreDefaultCategory(baseCat)}
                      aria-label={`Recuperar categoría ${baseCat}`}
                      title={`Volver a agregar ${baseCat} a la barra activa`}
                      className="inline-flex items-center gap-1 rounded-full border border-accent/50 bg-accent-subtle px-2.5 py-1 text-[11px] font-bold text-accent hover:bg-accent hover:text-white active:scale-95 transition-all duration-200"
                    >
                      <Plus size={12} strokeWidth={2.5} />
                      <span>{baseCat}</span>
                    </button>
                  );
                }

                return (
                  <span
                    key={baseCat}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] dark:text-zinc-400 opacity-75"
                  >
                    <Check size={10} className="text-[#30d158]" />
                    <span>{baseCat}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </ModalSheet>

      {isAttributeModalOpen && (
        <AttributeConfigModal
          activeCategory={editingAttrCategory || undefined}
          initialTab={editingAttrCategory ? "category-order" : "attribute-options"}
          onClose={() => {
            setIsAttributeModalOpen(false);
            setEditingAttrCategory(null);
          }}
        />
      )}
    </>
  );
}
