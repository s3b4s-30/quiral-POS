import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  Sliders,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import HorizontalScrollNav from "../../../components/HorizontalScrollNav";
import { useInventory } from "../../../context/InventoryContext";
import { ProductCategory } from "../../../types/domain";
import {
  FACTORY_BASE_CATEGORIES,
  FALLBACK_ORPHAN_CATEGORY,
  inferAttributeKeysForCategory,
  isSameCatalogText,
  normalizeCatalogText,
} from "../../../utils/catalogConfig";

export interface DesktopCategoryManagerViewProps {
  onBack: () => void;
  initialCategory?: ProductCategory;
}

/**
 * DesktopCategoryManagerView — Estación de Trabajo en Panel Dual para Gestión de Categorías
 * Cumple con el estándar de Banco Maestro, Platform Split (>= 768px) y Paleta Dual OLED.
 */
export default function DesktopCategoryManagerView({
  onBack,
  initialCategory,
}: DesktopCategoryManagerViewProps) {
  const {
    products,
    catalogConfig,
    updateCategoryOrder,
    addCategory,
    deleteCategory,
    updateCategoryAttributes,
    addAttributeOption,
    renameAttributeOption,
    deleteAttributeOption,
    reorderAttributeOptions,
    resetCatalogConfigToDefault,
  } = useInventory();

  // Orden editable de categorías activas
  const [draftOrder, setDraftOrder] = useState<ProductCategory[]>(() => [
    ...catalogConfig.categoryOrder,
  ]);

  // Categoría actualmente seleccionada para inspección/detalle
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(
    () => {
      if (
        initialCategory &&
        initialCategory !== "Todos" &&
        draftOrder.some((c) => isSameCatalogText(c, initialCategory))
      ) {
        return initialCategory;
      }
      return draftOrder[0] || "Cargadores y Cables";
    }
  );

  // Creación de nueva categoría en panel izquierdo
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Opciones de atributos en panel derecho
  const [newOptionInput, setNewOptionInput] = useState("");
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // Alerta modal de protección contra huérfanos
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<{
    name: ProductCategory;
    productCount: number;
  } | null>(null);

  // Banner temporal de feedback
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "warning";
    text: string;
  } | null>(null);

  const showFeedback = (type: "success" | "warning", text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg((prev) => (prev?.text === text ? null : prev));
    }, 2800);
  };

  // Cantidad de productos activos por categoría
  const productCountByCategory = (catName: ProductCategory): number => {
    return products.filter((p) => isSameCatalogText(p.category, catName))
      .length;
  };

  // Atributos vinculados a la categoría seleccionada
  const currentCategoryConfig = catalogConfig.categories.find((c) =>
    isSameCatalogText(c.name, selectedCategory)
  );
  const categoryAttrKeys = useMemo(() => {
    return (
      currentCategoryConfig?.attributeKeys ??
      inferAttributeKeysForCategory(selectedCategory)
    );
  }, [currentCategoryConfig, selectedCategory]);

  // Atributo activo dentro del panel derecho para gestionar sus opciones
  const [activeAttrKey, setActiveAttrKey] = useState<string>(
    categoryAttrKeys[0] || "chargerSubtypes"
  );

  useEffect(() => {
    if (
      !categoryAttrKeys.includes(activeAttrKey) &&
      categoryAttrKeys.length > 0
    ) {
      setActiveAttrKey(categoryAttrKeys[0]);
    }
  }, [categoryAttrKeys, activeAttrKey]);

  // Atributos del banco maestro disponibles en todo el catálogo
  const allAttributesList = Object.values(catalogConfig.attributes);

  // Atributo activo actualmente inspeccionado
  const activeAttr =
    catalogConfig.attributes[activeAttrKey] || allAttributesList[0];

  // Categorías de fábrica que no están actualmente en el borrador activo (para respaldo)
  const backupCategories = useMemo(() => {
    return FACTORY_BASE_CATEGORIES.filter(
      (baseCat) =>
        !draftOrder.some((active) => isSameCatalogText(active, baseCat))
    );
  }, [draftOrder]);

  // Atajo <Esc> para cerrar o cancelar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (categoryPendingDelete) {
          setCategoryPendingDelete(null);
        } else if (isCreatingCategory) {
          setIsCreatingCategory(false);
        } else if (editingOption) {
          setEditingOption(null);
        } else {
          handleSaveAndClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [categoryPendingDelete, isCreatingCategory, editingOption, draftOrder]);

  // Guardar y cerrar
  const handleSaveAndClose = () => {
    updateCategoryOrder(draftOrder);
    onBack();
  };

  // Reordenar categoría en panel izquierdo
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

  // Crear nueva categoría
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeCatalogText(newCategoryName);
    if (!clean || clean.toLowerCase() === "todos") return;

    if (draftOrder.some((c) => isSameCatalogText(c, clean))) {
      showFeedback("warning", `La categoría "${clean}" ya existe.`);
      return;
    }

    const created = addCategory(clean, inferAttributeKeysForCategory(clean));
    if (created) {
      setDraftOrder((prev) => [...prev, created.name]);
      setSelectedCategory(created.name);
      setNewCategoryName("");
      setIsCreatingCategory(false);
      showFeedback("success", `Categoría "${clean}" creada con éxito.`);
    }
  };

  // Solicitud de eliminación de categoría
  const handleRequestDeleteCategory = async (catName: ProductCategory) => {
    const count = productCountByCategory(catName);
    if (count > 0) {
      setCategoryPendingDelete({ name: catName, productCount: count });
      return;
    }
    await deleteCategory(catName, FALLBACK_ORPHAN_CATEGORY);
    const updatedOrder = draftOrder.filter(
      (c) => !isSameCatalogText(c, catName)
    );
    setDraftOrder(updatedOrder);
    if (isSameCatalogText(selectedCategory, catName)) {
      setSelectedCategory(updatedOrder[0] || "General / Otros");
    }
    showFeedback("success", `Categoría "${catName}" eliminada.`);
  };

  // Confirmar eliminación de categoría con huérfanos
  const handleConfirmOrphanMoveAndDelete = async () => {
    if (!categoryPendingDelete) return;
    const catName = categoryPendingDelete.name;
    await deleteCategory(catName, FALLBACK_ORPHAN_CATEGORY);
    const updatedOrder = draftOrder.filter(
      (c) => !isSameCatalogText(c, catName)
    );
    setDraftOrder(updatedOrder);
    if (isSameCatalogText(selectedCategory, catName)) {
      setSelectedCategory(updatedOrder[0] || "General / Otros");
    }
    setCategoryPendingDelete(null);
    showFeedback(
      "success",
      `Categoría eliminada y productos trasladados a "${FALLBACK_ORPHAN_CATEGORY}".`
    );
  };

  // Restaurar categoría de respaldo
  const handleRestoreBackupCategory = (catName: ProductCategory) => {
    addCategory(catName, inferAttributeKeysForCategory(catName));
    setDraftOrder((prev) => {
      if (prev.some((c) => isSameCatalogText(c, catName))) return prev;
      return [...prev, catName];
    });
    setSelectedCategory(catName);
    showFeedback(
      "success",
      `Categoría "${catName}" restaurada a la barra activa.`
    );
  };

  // Restablecer categorías a las de fábrica
  const handleResetDefaults = () => {
    resetCatalogConfigToDefault();
    setDraftOrder([...FACTORY_BASE_CATEGORIES]);
    setSelectedCategory(FACTORY_BASE_CATEGORIES[0]);
    showFeedback("success", "Categorías restablecidas a valores de fábrica.");
  };

  // Atributos de categoría: mover orden
  const moveCategoryAttr = (fromIdx: number, toIdx: number) => {
    if (
      fromIdx === toIdx ||
      fromIdx < 0 ||
      toIdx < 0 ||
      fromIdx >= categoryAttrKeys.length ||
      toIdx >= categoryAttrKeys.length
    ) {
      return;
    }
    const next = [...categoryAttrKeys];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    updateCategoryAttributes(selectedCategory, next);
  };

  // Atributos de categoría: desvincular
  const removeCategoryAttr = (keyToRemove: string) => {
    if (categoryAttrKeys.length <= 1) {
      showFeedback(
        "warning",
        "La categoría debe tener al menos un atributo vinculado."
      );
      return;
    }
    const next = categoryAttrKeys.filter((k) => k !== keyToRemove);
    updateCategoryAttributes(selectedCategory, next);
    if (activeAttrKey === keyToRemove) {
      setActiveAttrKey(next[0] || "brands");
    }
    showFeedback("success", "Atributo desvinculado de la categoría.");
  };

  // Atributos de categoría: vincular nuevo
  const addCategoryAttr = (keyToAdd: string) => {
    if (categoryAttrKeys.includes(keyToAdd)) return;
    const next = [...categoryAttrKeys, keyToAdd];
    updateCategoryAttributes(selectedCategory, next);
    setActiveAttrKey(keyToAdd);
    showFeedback("success", "Atributo vinculado a la categoría.");
  };

  // Opciones del atributo activo: agregar opción rápida
  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newOptionInput.trim();
    if (!trimmed || !activeAttr) return;

    if (activeAttr.options.some((o) => isSameCatalogText(o, trimmed))) {
      showFeedback(
        "warning",
        `La opción "${trimmed}" ya existe en este atributo.`
      );
      return;
    }

    addAttributeOption(activeAttr.key, trimmed);
    setNewOptionInput("");
    showFeedback("success", `Opción "${trimmed}" agregada.`);
  };

  // Opciones del atributo activo: reordenar
  const moveOption = (index: number, direction: "up" | "down") => {
    if (!activeAttr) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeAttr.options.length) return;

    const next = [...activeAttr.options];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    reorderAttributeOptions(activeAttr.key, next);
  };

  // Opciones del atributo activo: guardar edición
  const handleSaveEdit = (oldOption: string) => {
    const trimmed = editingValue.trim();
    if (!trimmed || !activeAttr) {
      setEditingOption(null);
      return;
    }
    if (
      !isSameCatalogText(oldOption, trimmed) &&
      activeAttr.options.some((o) => isSameCatalogText(o, trimmed))
    ) {
      showFeedback("warning", `Ya existe una opción llamada "${trimmed}".`);
      return;
    }
    renameAttributeOption(activeAttr.key, oldOption, trimmed);
    setEditingOption(null);
    setEditingValue("");
    showFeedback("success", "Opción actualizada.");
  };

  // Opciones del atributo activo: eliminar
  const handleDeleteOption = (option: string) => {
    if (!activeAttr) return;
    if (activeAttr.options.length <= 1) {
      showFeedback(
        "warning",
        "El atributo debe conservar al menos una opción."
      );
      return;
    }
    deleteAttributeOption(activeAttr.key, option);
    showFeedback("success", `Opción "${option}" eliminada.`);
  };

  return (
    <div
      data-testid="desktop-category-manager-view"
      className="fixed inset-0 z-40 w-full h-full flex flex-col overflow-hidden bg-[var(--bg-primary)] pt-[var(--quiral-header-offset,4rem)] antialiased-hd"
    >
      {/* Cabecera Superior de la Vista de Pantalla Completa */}
      <div className="shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Regresar al Inventario"
            onClick={handleSaveAndClose}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent/40 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Regresar</span>
          </button>
          <div className="h-5 w-px bg-[var(--border-color)]" />
          <div>
            <h1 className="text-lg font-black text-[var(--text-primary)] tracking-tight">
              Organizar Categorías
            </h1>
            <p className="text-xs text-[var(--text-secondary)] font-medium">
              Banco Maestro de Categorías, jerarquía y configuración de
              atributos
            </p>
          </div>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            title="Restablecer categorías y orden de fábrica"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent/40 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Restablecer Fábrica</span>
          </button>
          <button
            type="button"
            data-testid="save-category-order-btn"
            aria-label="Guardar orden de categorías"
            onClick={handleSaveAndClose}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent hover:bg-accent-hover px-4 py-1.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Check size={15} strokeWidth={2.5} />
            <span>Guardar y Confirmar</span>
          </button>
        </div>
      </div>

      {/* Banner de Feedback */}
      {feedbackMsg && (
        <div
          className={`shrink-0 px-6 py-2 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150 ${
            feedbackMsg.type === "success"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-b border-emerald-500/25"
              : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-b border-amber-500/25"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <Check size={14} />
          ) : (
            <AlertTriangle size={14} />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Alerta Modal de Protección contra Categorías Huérfanas */}
      {categoryPendingDelete && (
        <div
          role="alertdialog"
          aria-label="Alerta de categoría con productos activos"
          data-testid="orphan-category-alert"
          className="shrink-0 m-6 mb-0 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex items-start gap-2.5 text-amber-500">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-bold text-sm text-[var(--text-primary)]">
                Protección contra productos huérfanos
              </p>
              <p className="mt-1 text-[var(--text-secondary)]">
                La categoría{" "}
                <strong className="text-[var(--text-primary)]">
                  «{categoryPendingDelete.name}»
                </strong>{" "}
                tiene{" "}
                <strong className="text-amber-500 tabular-nums">
                  {categoryPendingDelete.productCount} productos activos
                </strong>
                . ¿Deseas moverlos a la categoría{" "}
                <strong className="text-[var(--text-primary)]">
                  «{FALLBACK_ORPHAN_CATEGORY}»
                </strong>{" "}
                antes de eliminarla?
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCategoryPendingDelete(null)}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:border-accent"
            >
              Cancelar
            </button>
            <button
              type="button"
              data-testid="confirm-orphan-category-delete"
              onClick={handleConfirmOrphanMoveAndDelete}
              className="rounded-xl bg-[#ff3b30] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-transform"
            >
              Mover a General / Otros y Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Contenedor Principal: Panel Dual Simétrico de Escritorio */}
      <div className="flex-1 overflow-hidden p-6 lg:p-8">
        <div className="h-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* ======================================================== */}
          {/* PANEL IZQUIERDO: Selector Maestro de Categorías (5 Cols) */}
          {/* ======================================================== */}
          <div className="md:col-span-5 flex flex-col h-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                  Categorías ({draftOrder.length})
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Fija e inamovible al inicio de la barra
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingCategory((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-xl bg-accent px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-accent-hover transition-all cursor-pointer"
              >
                <Plus size={13} />
                <span>Nueva Categoría</span>
              </button>
            </div>

            {/* Formulario Inline para Crear Nueva Categoría */}
            {isCreatingCategory && (
              <form
                onSubmit={handleCreateCategory}
                className="mt-3 p-3 rounded-2xl border border-accent/30 bg-accent-subtle space-y-2 animate-in fade-in duration-150"
              >
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ej. Accesorios, Fundas, etc."
                  autoFocus
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-accent"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingCategory(false);
                      setNewCategoryName("");
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!newCategoryName.trim()}
                    className="px-3 py-1 rounded-lg bg-accent text-[11px] font-bold text-white disabled:opacity-50 cursor-pointer"
                  >
                    Crear Categoría
                  </button>
                </div>
              </form>
            )}

            {/* Listado Scrollable de Categorías */}
            <div className="flex-1 overflow-y-auto mt-3 space-y-1.5 pr-1 custom-scrollbar">
              {draftOrder.map((cat, index) => {
                const isActive = isSameCatalogText(cat, selectedCategory);
                const count = productCountByCategory(cat);
                return (
                  <div
                    key={cat}
                    className={`group flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                      isActive
                        ? "border-accent bg-accent/15 text-[var(--text-primary)] shadow-xs"
                        : "border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent/40"
                    }`}
                  >
                    {/* Botón Principal para Seleccionar la Categoría */}
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className="flex-1 flex items-center justify-between min-w-0 pr-2 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="tabular-nums text-[10px] font-mono text-[var(--text-secondary)]">
                          {index + 1}.
                        </span>
                        <span
                          className={`text-xs truncate ${
                            isActive ? "font-black text-accent" : "font-bold"
                          }`}
                        >
                          {cat}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full tabular-nums font-bold shrink-0 ml-2 ${
                          isActive
                            ? "bg-accent text-white"
                            : "bg-black/5 dark:bg-white/10 text-[var(--text-secondary)]"
                        }`}
                      >
                        {count} prods
                      </span>
                    </button>

                    {/* Controles de Orden y Eliminación por Fila */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        aria-label={`Subir categoría ${cat}`}
                        onClick={() => moveCategory(index, -1)}
                        disabled={index === 0}
                        title="Subir en el orden de la barra"
                        className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Bajar categoría ${cat}`}
                        onClick={() => moveCategory(index, 1)}
                        disabled={index === draftOrder.length - 1}
                        title="Bajar en el orden de la barra"
                        className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Eliminar categoría ${cat}`}
                        onClick={() => handleRequestDeleteCategory(cat)}
                        title="Eliminar categoría"
                        className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/50 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Categorías de Fábrica / Respaldo */}
            {backupCategories.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                <h4 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Valores Predeterminados Fijos (Respaldo)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {backupCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      aria-label={`Recuperar categoría ${cat}`}
                      onClick={() => handleRestoreBackupCategory(cat)}
                      className="inline-flex items-center gap-1 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-1 text-[11px] font-bold text-[var(--text-secondary)] hover:text-accent hover:border-accent active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus size={11} />
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* PANEL DERECHO: Detalle, Atributos y Opciones (7 Cols)     */}
          {/* ======================================================== */}
          <div className="md:col-span-7 flex flex-col h-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 shadow-xs overflow-hidden">
            {/* Header del Panel Derecho */}
            <div className="pb-4 border-b border-[var(--border-color)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-[var(--text-primary)]">
                    {selectedCategory}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {productCountByCategory(selectedCategory)} productos activos
                    · {categoryAttrKeys.length} atributos vinculados
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleRequestDeleteCategory(selectedCategory)
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Eliminar Categoría</span>
                  </button>
                </div>
              </div>

              {/* Selector de Pestañas de Atributos de esta Categoría */}
              <div className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Atributos activos en esta categoría:
                </p>
                <HorizontalScrollNav
                  testId="desktop-category-attributes-nav"
                  className="flex items-center gap-1.5 overflow-x-auto scroll-smooth custom-scrollbar py-1"
                  containerClassName="relative flex items-center w-full min-w-0"
                  scrollAmount={200}
                >
                  {categoryAttrKeys.map((key, idx) => {
                    const attr = catalogConfig.attributes[key];
                    const isAttrActive = activeAttrKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveAttrKey(key)}
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          isAttrActive
                            ? "bg-accent text-white shadow-xs"
                            : "border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent/40"
                        }`}
                      >
                        <span className="tabular-nums text-[10px] opacity-70">
                          {idx + 1}.
                        </span>
                        <span>{attr?.label || key}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                            isAttrActive
                              ? "bg-white/20"
                              : "bg-black/5 dark:bg-white/10"
                          }`}
                        >
                          {attr?.options.length ?? 0}
                        </span>
                      </button>
                    );
                  })}
                </HorizontalScrollNav>
              </div>
            </div>

            {/* Configuración de Opciones del Atributo Activo */}
            <div className="flex-1 flex flex-col min-h-0 pt-4">
              <div className="flex items-center justify-between pb-3">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                    Valores de «{activeAttr?.label || activeAttrKey}»
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {activeAttr?.options.length ?? 0} opciones desplegables
                    configuradas
                  </p>
                </div>

                {/* Formulario de Adición Rápida de Opción */}
                <form
                  onSubmit={handleAddOption}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    placeholder="Nueva opción..."
                    className="w-48 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={!newOptionInput.trim()}
                    className="inline-flex items-center gap-1 rounded-xl bg-accent px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-accent-hover transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Agregar</span>
                  </button>
                </form>
              </div>

              {/* Lista Scrollable de Opciones del Atributo */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {activeAttr?.options.map((option, index) => {
                  const isEditing = editingOption === option;
                  return (
                    <div
                      key={option}
                      className="group flex items-center justify-between p-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] transition-all hover:border-accent/40"
                    >
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2 mr-3">
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(option);
                              if (e.key === "Escape") setEditingOption(null);
                            }}
                            autoFocus
                            className="flex-1 rounded-xl border border-accent bg-[var(--bg-elevated)] px-3 py-1 text-xs font-bold text-[var(--text-primary)] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(option)}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white cursor-pointer"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingOption(null)}
                            className="rounded-lg border border-[var(--border-color)] px-2 py-1 text-xs text-[var(--text-secondary)] cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="tabular-nums text-[10px] text-[var(--text-secondary)] font-mono">
                            {index + 1}.
                          </span>
                          <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {option}
                          </span>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveOption(index, "up")}
                            disabled={index === 0}
                            title="Subir opción"
                            className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveOption(index, "down")}
                            disabled={index === activeAttr.options.length - 1}
                            title="Bajar opción"
                            className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingOption(option);
                              setEditingValue(option);
                            }}
                            title="Editar opción"
                            className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-accent hover:border-accent cursor-pointer"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOption(option)}
                            title="Eliminar opción"
                            className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/50 cursor-pointer ml-1"
                          >
                            <Minus size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Atributos Disponibles para Vincular a esta Categoría */}
              {allAttributesList.some(
                (a) => !categoryAttrKeys.includes(a.key)
              ) && (
                <div className="pt-3 mt-3 border-t border-[var(--border-color)]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                    Vincular otro atributo a {selectedCategory}:
                  </p>
                  <HorizontalScrollNav
                    testId="desktop-category-available-attr-nav"
                    className="flex items-center gap-1.5 overflow-x-auto scroll-smooth custom-scrollbar py-1"
                    containerClassName="relative flex items-center w-full min-w-0"
                    scrollAmount={200}
                  >
                    {allAttributesList
                      .filter((a) => !categoryAttrKeys.includes(a.key))
                      .map((a) => (
                        <button
                          key={a.key}
                          type="button"
                          onClick={() => addCategoryAttr(a.key)}
                          className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-1 text-xs font-bold text-[var(--text-primary)] hover:border-accent hover:text-accent transition-all cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>{a.label}</span>
                        </button>
                      ))}
                  </HorizontalScrollNav>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
