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
 * DesktopCategoryManagerView — Estación de Trabajo Desktop en 3 Columnas Claras
 * Cero Scroll Horizontal (100% vertical y adaptativo), Platform Split (>= 768px),
 * Paleta Dual OLED (#000000) y consistencia total con el Banco Maestro de Catálogo.
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
    createCustomAttribute,
    resetCatalogConfigToDefault,
  } = useInventory();

  // Orden editable de categorías activas
  const [draftOrder, setDraftOrder] = useState<ProductCategory[]>(() => [
    ...catalogConfig.categoryOrder,
  ]);

  // Categoría actualmente seleccionada en Columna 1
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

  // Creación de nueva categoría en Columna 1
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Creación de nuevo atributo personalizado en Columna 2
  const [isCreatingAttribute, setIsCreatingAttribute] = useState(false);
  const [newAttributeLabel, setNewAttributeLabel] = useState("");
  const [newAttributeFirstOption, setNewAttributeFirstOption] = useState("");

  // Opciones de atributos en Columna 3
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

  // Atributo activo actualmente seleccionado en Columna 2 para inspeccionar en Columna 3
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

  // Atributos disponibles que aún NO están vinculados a selectedCategory
  const availableAttrsToLink = useMemo(() => {
    return allAttributesList.filter(
      (attr) => !categoryAttrKeys.includes(attr.key)
    );
  }, [allAttributesList, categoryAttrKeys]);

  // Atributo activo seleccionado
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
        } else if (isCreatingAttribute) {
          setIsCreatingAttribute(false);
        } else if (editingOption) {
          setEditingOption(null);
        } else {
          handleSaveAndClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    categoryPendingDelete,
    isCreatingCategory,
    isCreatingAttribute,
    editingOption,
    draftOrder,
  ]);

  // Guardar orden y cerrar
  const handleSaveAndClose = () => {
    updateCategoryOrder(draftOrder);
    onBack();
  };

  // Reordenar categoría en Columna 1
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

  // Crear nueva categoría en Columna 1
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

  // Confirmar eliminación de categoría con productos huérfanos
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

  // Reordenar atributos de la categoría seleccionada en Columna 2
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
    showFeedback("success", "Prioridad de atributo actualizada.");
  };

  // Desvincular atributo de la categoría
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

  // Vincular atributo existente a la categoría
  const addCategoryAttr = (keyToAdd: string) => {
    if (categoryAttrKeys.includes(keyToAdd)) return;
    const next = [...categoryAttrKeys, keyToAdd];
    updateCategoryAttributes(selectedCategory, next);
    setActiveAttrKey(keyToAdd);
    showFeedback("success", "Atributo vinculado a la categoría.");
  };

  // Crear y vincular un nuevo atributo personalizado en el banco maestro
  const handleCreateCustomAttr = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = normalizeCatalogText(newAttributeLabel);
    if (!cleanLabel) return;

    const initialOpts = newAttributeFirstOption.trim()
      ? [normalizeCatalogText(newAttributeFirstOption)]
      : undefined;

    const newKey = createCustomAttribute(cleanLabel, initialOpts);
    if (!newKey) {
      showFeedback(
        "warning",
        `Ya existe un atributo con el nombre "${cleanLabel}".`
      );
      return;
    }

    // Vincular automáticamente a la categoría actual
    const next = [...categoryAttrKeys, newKey];
    updateCategoryAttributes(selectedCategory, next);
    setActiveAttrKey(newKey);
    setIsCreatingAttribute(false);
    setNewAttributeLabel("");
    setNewAttributeFirstOption("");
    showFeedback("success", `Atributo "${cleanLabel}" creado y vinculado.`);
  };

  // Opciones del atributo en Columna 3: agregar opción rápida
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
    showFeedback(
      "success",
      `Opción "${trimmed}" agregada a «${activeAttr.label}».`
    );
  };

  // Opciones del atributo en Columna 3: reordenar
  const moveOption = (index: number, direction: "up" | "down") => {
    if (!activeAttr) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeAttr.options.length) return;

    const next = [...activeAttr.options];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    reorderAttributeOptions(activeAttr.key, next);
  };

  // Opciones del atributo en Columna 3: guardar edición
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

  // Opciones del atributo en Columna 3: eliminar opción
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
      {/* ======================================================== */}
      {/* CABECERA SUPERIOR: Título, Atajos y Acciones Maestras    */}
      {/* ======================================================== */}
      <div className="shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="back-category-manager-btn"
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
              Banco Maestro en 3 columnas: Categorías · Atributos · Opciones
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

      {/* Alerta de Protección contra Categorías Huérfanas */}
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
              className="rounded-xl bg-[#ff3b30] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-transform cursor-pointer"
            >
              Mover a General / Otros y Eliminar
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CUERPO PRINCIPAL: 3 COLUMNAS LIMPIAS (CERO SCROLL HORIZONTAL) */}
      {/* ======================================================== */}
      <div className="flex-1 min-h-0 overflow-hidden p-5 lg:p-6">
        <div className="h-full w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 min-h-0 overflow-hidden">
          {/* ======================================================== */}
          {/* COLUMNA 1 (IZQUIERDA): Listado de Categorías             */}
          {/* ======================================================== */}
          <div className="flex flex-col h-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 lg:p-5 shadow-xs overflow-hidden min-h-0">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] shrink-0">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                  1. Categorías ({draftOrder.length})
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Jerarquía en la barra de navegación
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
                className="mt-3 p-3 rounded-2xl border border-accent/30 bg-accent-subtle space-y-2 animate-in fade-in duration-150 shrink-0"
              >
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ej. Accesorios, Fundas..."
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

            {/* Listado Vertical Scrollable de Categorías */}
            <div className="flex-1 overflow-y-auto mt-3 space-y-1.5 pr-1 custom-scrollbar min-h-0">
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
                    {/* Botón de Selección de Categoría */}
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

            {/* Categorías de Fábrica / Respaldo (Flujo Vertical Adaptativo) */}
            {backupCategories.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--border-color)] shrink-0">
                <h4 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Valores Predeterminados Fijos (Respaldo)
                </h4>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-0.5">
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
          {/* COLUMNA 2 (CENTRO): Atributos de la Categoría Activa     */}
          {/* ======================================================== */}
          <div className="flex flex-col h-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 lg:p-5 shadow-xs overflow-hidden min-h-0">
            {/* Cabecera de Columna 2 */}
            <div className="pb-3 border-b border-[var(--border-color)] shrink-0">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                    2. Atributos en Categoría
                  </h3>
                  <h2 className="text-sm lg:text-base font-black text-[var(--text-primary)] truncate mt-0.5">
                    {selectedCategory}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingAttribute((prev) => !prev)}
                  className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-1 text-[11px] font-bold text-accent hover:border-accent transition-all cursor-pointer shrink-0"
                >
                  <Plus size={12} />
                  <span>Crear Atributo</span>
                </button>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                {categoryAttrKeys.length} atributos vinculados · Define el orden
                en filtros y Nuevo Producto
              </p>
            </div>

            {/* Formulario Inline para Crear Nuevo Atributo */}
            {isCreatingAttribute && (
              <form
                onSubmit={handleCreateCustomAttr}
                className="mt-3 p-3 rounded-2xl border border-accent/30 bg-accent-subtle space-y-2 animate-in fade-in duration-150 shrink-0"
              >
                <div className="text-[11px] font-bold text-accent uppercase tracking-wider">
                  Nuevo Atributo Maestro:
                </div>
                <input
                  type="text"
                  value={newAttributeLabel}
                  onChange={(e) => setNewAttributeLabel(e.target.value)}
                  placeholder="Nombre (ej. Material, Conexión, Potencia...)"
                  autoFocus
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-accent"
                />
                <input
                  type="text"
                  value={newAttributeFirstOption}
                  onChange={(e) => setNewAttributeFirstOption(e.target.value)}
                  placeholder="Primera opción / valor (opcional)"
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-accent"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingAttribute(false);
                      setNewAttributeLabel("");
                      setNewAttributeFirstOption("");
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!newAttributeLabel.trim()}
                    className="px-3 py-1 rounded-lg bg-accent text-[11px] font-bold text-white disabled:opacity-50 cursor-pointer"
                  >
                    Crear y Vincular
                  </button>
                </div>
              </form>
            )}

            {/* Sección Superior: Listado Vertical de Atributos Activos Vinculados */}
            <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 custom-scrollbar min-h-0">
              {categoryAttrKeys.map((key, idx) => {
                const attr = catalogConfig.attributes[key];
                const isSelected = activeAttrKey === key;
                return (
                  <div
                    key={key}
                    className={`group flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                      isSelected
                        ? "border-accent bg-accent/15 text-[var(--text-primary)] shadow-xs"
                        : "border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent/40"
                    }`}
                  >
                    {/* Botón de Selección del Atributo para inspeccionar en Columna 3 */}
                    <button
                      type="button"
                      onClick={() => setActiveAttrKey(key)}
                      className="flex-1 flex items-center justify-between min-w-0 pr-2 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="tabular-nums flex h-5 w-5 items-center justify-center rounded-md bg-black/5 dark:bg-white/10 text-[10px] font-black text-[var(--text-secondary)] shrink-0">
                          {idx + 1}
                        </span>
                        <span
                          className={`text-xs truncate ${
                            isSelected ? "font-black text-accent" : "font-bold"
                          }`}
                        >
                          {attr?.label || key}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full tabular-nums font-bold shrink-0 ml-2 ${
                          isSelected
                            ? "bg-accent text-white"
                            : "bg-black/5 dark:bg-white/10 text-[var(--text-secondary)]"
                        }`}
                      >
                        {attr?.options.length ?? 0} valores
                      </span>
                    </button>

                    {/* Controles de Orden Vertical y Desvinculación */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        aria-label={`Subir atributo ${attr?.label || key}`}
                        onClick={() => moveCategoryAttr(idx, idx - 1)}
                        disabled={idx === 0}
                        title="Subir prioridad en filtros y orden"
                        className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Bajar atributo ${attr?.label || key}`}
                        onClick={() => moveCategoryAttr(idx, idx + 1)}
                        disabled={idx === categoryAttrKeys.length - 1}
                        title="Bajar prioridad en filtros y orden"
                        className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Desvincular atributo ${attr?.label || key}`}
                        onClick={() => removeCategoryAttr(key)}
                        disabled={categoryAttrKeys.length <= 1}
                        title="Desvincular de esta categoría"
                        className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/50 disabled:opacity-20 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sección Inferior: Panel de Vinculación de Atributos Disponibles (CERO SCROLL HORIZONTAL) */}
            <div className="mt-3 pt-3 border-t border-[var(--border-color)] shrink-0">
              <h4 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Vincular Atributos Disponibles ({availableAttrsToLink.length})
              </h4>
              {availableAttrsToLink.length === 0 ? (
                <p className="text-[11px] text-[var(--text-secondary)] italic">
                  Todos los atributos del catálogo están vinculados a esta
                  categoría.
                </p>
              ) : (
                /* Grid Vertical / Flex Wrap sin desbordamiento */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-0.5">
                  {availableAttrsToLink.map((attr) => (
                    <button
                      key={attr.key}
                      type="button"
                      onClick={() => addCategoryAttr(attr.key)}
                      className="inline-flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:border-accent hover:text-accent transition-all cursor-pointer text-left min-w-0"
                    >
                      <span className="truncate">{attr.label}</span>
                      <Plus size={12} className="shrink-0 ml-1 opacity-70" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* COLUMNA 3 (DERECHA): Valores del Atributo Seleccionado   */}
          {/* ======================================================== */}
          <div className="flex flex-col h-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 lg:p-5 shadow-xs overflow-hidden min-h-0">
            {/* Cabecera de Columna 3 */}
            <div className="pb-3 border-b border-[var(--border-color)] shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                    3. Valores y Opciones
                  </h3>
                  <h4 className="text-sm lg:text-base font-black text-[var(--text-primary)] truncate mt-0.5">
                    {activeAttr?.label || activeAttrKey}
                  </h4>
                </div>
                <span className="text-[11px] text-[var(--text-secondary)] font-bold">
                  {activeAttr?.options.length ?? 0} opciones
                </span>
              </div>

              {/* Formulario de Adición Rápida de Opción */}
              <form
                onSubmit={handleAddOption}
                className="mt-3 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={newOptionInput}
                  onChange={(e) => setNewOptionInput(e.target.value)}
                  placeholder="Nueva opción..."
                  className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={!newOptionInput.trim()}
                  className="inline-flex items-center gap-1 rounded-xl bg-accent px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-accent-hover transition-all disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <Plus size={13} />
                  <span>Agregar</span>
                </button>
              </form>
            </div>

            {/* Listado Vertical Scrollable de Opciones */}
            <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 custom-scrollbar min-h-0">
              {activeAttr?.options.map((option, index) => {
                const isEditing = editingOption === option;
                return (
                  <div
                    key={option}
                    className="group flex items-center justify-between p-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] transition-all hover:border-accent/40"
                  >
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-2 mr-2">
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
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white cursor-pointer shrink-0"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingOption(null)}
                          className="rounded-lg border border-[var(--border-color)] px-2 py-1 text-xs text-[var(--text-secondary)] cursor-pointer shrink-0"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        <span className="tabular-nums text-[10px] text-[var(--text-secondary)] font-mono shrink-0">
                          {index + 1}.
                        </span>
                        <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                          {option}
                        </span>
                      </div>
                    )}

                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveOption(index, "up")}
                          disabled={index === 0}
                          title="Subir opción"
                          className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveOption(index, "down")}
                          disabled={index === activeAttr.options.length - 1}
                          title="Bajar opción"
                          className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent disabled:opacity-20 cursor-pointer"
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
                          className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/50 cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Nota de Integridad de Datos en la Base de la Columna 3 */}
            <div className="mt-3 pt-3 border-t border-[var(--border-color)] text-[10px] text-[var(--text-secondary)] leading-tight shrink-0">
              <p>
                💡 Los cambios se sincronizan automáticamente para nuevos
                productos en esta categoría. Los productos históricos preservan
                su nomenclatura original.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
