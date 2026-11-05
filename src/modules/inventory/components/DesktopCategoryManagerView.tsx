import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bookmark,
  Check,
  FolderTree,
  Link2,
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
  getAttributePresets,
  getEffectiveAttributeOptions,
  inferAttributeKeysForCategory,
  isSameCatalogText,
  normalizeCatalogText,
} from "../../../utils/catalogConfig";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_TERTIARY,
} from "../../../constants/uiButtons";

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
    resetCategoryAttributeOptionsToGlobal,
    importAttributePresetsToCategory,
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

  // Modo de visualización superior: "categories" (Gestionar Categorías en 3 columnas) vs "presets" (Banco Maestro en 2 paneles)
  type CatalogViewMode = "categories" | "presets";
  const [viewMode, setViewMode] = useState<CatalogViewMode>("categories");

  // Creación de nueva categoría en Columna 1
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Creación de nuevo atributo personalizado en Columna 2
  const [isCreatingAttribute, setIsCreatingAttribute] = useState(false);
  const [newAttributeLabel, setNewAttributeLabel] = useState("");
  const [newAttributeFirstOption, setNewAttributeFirstOption] = useState("");
  const [linkToActiveCategory, setLinkToActiveCategory] = useState(true);

  // Popover para vincular atributos existentes a la categoría activa en Columna 2
  const [isLinkingAttrOpen, setIsLinkingAttrOpen] = useState(false);

  // Creación directa en el Banco Global (Panel Izquierdo en Modo Banco Maestro)
  const [isCreatingGlobalAttribute, setIsCreatingGlobalAttribute] =
    useState(false);
  const [newGlobalAttributeLabel, setNewGlobalAttributeLabel] = useState("");
  const [newGlobalAttributeFirstOption, setNewGlobalAttributeFirstOption] =
    useState("");

  // Estado del Popover de Presets en Columna 3
  const [isPresetsPopoverOpen, setIsPresetsPopoverOpen] = useState(false);

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
    return currentCategoryConfig?.attributeKeys ?? [];
  }, [currentCategoryConfig]);

  // Atributos del banco maestro disponibles en todo el catálogo global
  const allAttributesList = Object.values(catalogConfig.attributes);

  // Atributo activo actualmente seleccionado en Columna 2 para inspeccionar en Columna 3
  const [activeAttrKey, setActiveAttrKey] = useState<string>(
    categoryAttrKeys[0] || allAttributesList[0]?.key || "brands"
  );

  // Garantizar que activeAttrKey apunte a un atributo existente en el catálogo global
  useEffect(() => {
    if (
      (!activeAttrKey || !catalogConfig.attributes[activeAttrKey]) &&
      allAttributesList.length > 0
    ) {
      setActiveAttrKey(allAttributesList[0].key);
    }
  }, [catalogConfig.attributes, activeAttrKey, allAttributesList]);

  // Garantizar que en modo "categories", activeAttrKey apunte a un atributo vinculado si existen
  useEffect(() => {
    if (viewMode === "categories") {
      if (
        categoryAttrKeys.length > 0 &&
        !categoryAttrKeys.includes(activeAttrKey)
      ) {
        setActiveAttrKey(categoryAttrKeys[0]);
      }
    }
  }, [viewMode, selectedCategory, categoryAttrKeys, activeAttrKey]);

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

    const created = addCategory(clean, []);
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

  // Cálculo de ámbito (scope) y opciones efectivas
  const isAttrLinkedToSelectedCat = categoryAttrKeys.includes(activeAttrKey);
  const activeScopeCategory =
    viewMode === "categories" && isAttrLinkedToSelectedCat
      ? selectedCategory
      : undefined;

  const effectiveOptions = useMemo(() => {
    if (!activeAttrKey) return [];
    if (activeScopeCategory) {
      return getEffectiveAttributeOptions(
        catalogConfig,
        activeScopeCategory,
        activeAttrKey
      );
    }
    return catalogConfig.attributes[activeAttrKey]?.options ?? [];
  }, [catalogConfig, activeScopeCategory, activeAttrKey]);

  const isCustomizedForCategory = useMemo(() => {
    if (!isAttrLinkedToSelectedCat || !catalogConfig.categoryAttributeValues)
      return false;
    const cleanCat = normalizeCatalogText(selectedCategory);
    return (
      catalogConfig.categoryAttributeValues[cleanCat]?.[activeAttrKey] !==
      undefined
    );
  }, [
    catalogConfig.categoryAttributeValues,
    selectedCategory,
    isAttrLinkedToSelectedCat,
    activeAttrKey,
  ]);

  // Presets Históricos maestros disponibles en el Banco Global para este atributo
  const masterPresets = useMemo(() => {
    if (!activeAttrKey) return [];
    return getAttributePresets(catalogConfig, activeAttrKey);
  }, [catalogConfig, activeAttrKey]);

  // Presets Disponibles: cálculo estricto de presets maestros que aún NO están presentes en la categoría
  const availablePresets = useMemo(() => {
    if (!activeScopeCategory) return [];
    return masterPresets.filter(
      (p) => !effectiveOptions.some((o) => isSameCatalogText(o, p))
    );
  }, [masterPresets, effectiveOptions, activeScopeCategory]);

  // Crear atributo desde Columna 2 Superior (con toggle de vinculación opcional)
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

    if (linkToActiveCategory) {
      const next = [...categoryAttrKeys, newKey];
      updateCategoryAttributes(selectedCategory, next);
      showFeedback(
        "success",
        `Atributo "${cleanLabel}" creado y vinculado a «${selectedCategory}».`
      );
    } else {
      showFeedback(
        "success",
        `Atributo "${cleanLabel}" creado en el Banco Global.`
      );
    }

    setActiveAttrKey(newKey);
    setIsCreatingAttribute(false);
    setNewAttributeLabel("");
    setNewAttributeFirstOption("");
    setLinkToActiveCategory(true);
  };

  // Crear directamente en el Banco Global sin vincular a la categoría activa
  const handleCreateGlobalAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = normalizeCatalogText(newGlobalAttributeLabel);
    if (!cleanLabel) return;

    const initialOpts = newGlobalAttributeFirstOption.trim()
      ? [normalizeCatalogText(newGlobalAttributeFirstOption)]
      : undefined;

    const newKey = createCustomAttribute(cleanLabel, initialOpts);
    if (!newKey) {
      showFeedback(
        "warning",
        `Ya existe un atributo con el nombre "${cleanLabel}".`
      );
      return;
    }

    setActiveAttrKey(newKey);
    setIsCreatingGlobalAttribute(false);
    setNewGlobalAttributeLabel("");
    setNewGlobalAttributeFirstOption("");
    showFeedback(
      "success",
      `Atributo maestro "${cleanLabel}" añadido al Banco Global.`
    );
  };

  // Opciones del atributo en Columna 3: agregar opción rápida
  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newOptionInput.trim();
    if (!trimmed || !activeAttr) return;

    if (effectiveOptions.some((o) => isSameCatalogText(o, trimmed))) {
      showFeedback(
        "warning",
        `La opción "${trimmed}" ya existe en este atributo.`
      );
      return;
    }

    addAttributeOption(activeAttr.key, trimmed, activeScopeCategory);
    setNewOptionInput("");
    showFeedback(
      "success",
      activeScopeCategory
        ? `Opción "${trimmed}" agregada a «${activeAttr.label}» en ${activeScopeCategory}.`
        : `Opción "${trimmed}" agregada al Banco Global maestro.`
    );
  };

  // Opciones del atributo en Columna 3: reordenar
  const moveOption = (index: number, direction: "up" | "down") => {
    if (!activeAttr) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= effectiveOptions.length) return;

    const next = [...effectiveOptions];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    reorderAttributeOptions(activeAttr.key, next, activeScopeCategory);
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
      effectiveOptions.some((o) => isSameCatalogText(o, trimmed))
    ) {
      showFeedback("warning", `Ya existe una opción llamada "${trimmed}".`);
      return;
    }
    renameAttributeOption(
      activeAttr.key,
      oldOption,
      trimmed,
      activeScopeCategory
    );
    setEditingOption(null);
    setEditingValue("");
    showFeedback("success", "Opción actualizada.");
  };

  // Opciones del atributo en Columna 3: eliminar opción
  const handleDeleteOption = (option: string) => {
    if (!activeAttr) return;
    if (!activeScopeCategory && activeAttr.options.length <= 1) {
      showFeedback(
        "warning",
        "El Banco Global debe conservar al menos una opción maestra."
      );
      return;
    }
    deleteAttributeOption(activeAttr.key, option, activeScopeCategory);
    showFeedback(
      "success",
      activeScopeCategory
        ? `Opción "${option}" removida de «${selectedCategory}».`
        : `Opción "${option}" eliminada del Banco Global.`
    );
  };

  return (
    <div
      data-testid="desktop-category-manager-view"
      className="fixed inset-0 z-40 w-full h-full flex flex-col overflow-hidden bg-[var(--bg-primary)] pt-0 antialiased-hd"
    >
      {/* ======================================================== */}
      {/* CABECERA SUPERIOR: Título, Switch de Enfoque y Acciones */}
      {/* ======================================================== */}
      <div className="shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-primary)] px-5 lg:px-6 py-2.5 flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            data-testid="back-category-manager-btn"
            aria-label="Regresar al Inventario"
            onClick={handleSaveAndClose}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent/40 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Regresar</span>
          </button>
          <div className="h-5 w-px bg-[var(--border-color)]" />
          <div>
            <h1 className="text-lg font-black text-[var(--text-primary)] tracking-tight">
              Configuración y Ajustes de Catálogo
            </h1>
            <p className="text-xs text-[var(--text-secondary)] font-medium">
              {viewMode === "categories"
                ? "Gestión jerárquica de categorías y atributos activos"
                : "Banco maestro universal de atributos y plantillas de presets"}
            </p>
          </div>
        </div>

        {/* SWITCH / TOGGLE DE ENFOQUE (Estilo Apple HIG / Linear) */}
        <div className="flex items-center p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] shrink-0">
          <button
            type="button"
            data-testid="mode-tab-categories"
            onClick={() => {
              setViewMode("categories");
              setIsPresetsPopoverOpen(false);
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "categories"
                ? "bg-accent text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <FolderTree size={14} />
            <span>Gestionar Categorías</span>
            <span className="text-[10px] font-mono opacity-80 tabular-nums">
              ({draftOrder.length})
            </span>
          </button>
          <button
            type="button"
            data-testid="mode-tab-presets"
            onClick={() => {
              setViewMode("presets");
              setIsPresetsPopoverOpen(false);
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "presets"
                ? "bg-accent text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Bookmark size={14} />
            <span>Banco Maestro (Presets)</span>
            <span className="text-[10px] font-mono opacity-80 tabular-nums">
              ({allAttributesList.length})
            </span>
          </button>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            title="Restablecer categorías y orden de fábrica"
            className={BTN_TERTIARY}
          >
            <RotateCcw size={14} />
            <span>Restablecer Fábrica</span>
          </button>
          <button
            type="button"
            data-testid="save-category-order-btn"
            aria-label="Guardar orden de categorías"
            onClick={handleSaveAndClose}
            className={BTN_PRIMARY}
          >
            <Check size={14} strokeWidth={2.5} />
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
          className="shrink-0 mx-5 my-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3 animate-in fade-in duration-150"
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
      <div className="flex-1 min-h-0 w-full overflow-hidden px-5 lg:px-6 py-3">
        {viewMode === "categories" ? (
          <div className="h-full w-full grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 min-h-0 overflow-hidden">
            {/* ======================================================== */}
            {/* COLUMNA 1 (IZQUIERDA): Listado de Categorías             */}
            {/* ======================================================== */}
            <div className="flex flex-col h-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-sm overflow-hidden min-h-0">
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
                  data-testid="create-category-btn"
                  onClick={() => setIsCreatingCategory((prev) => !prev)}
                  className={BTN_SECONDARY}
                  title="Crear una nueva categoría de catálogo"
                >
                  <Plus size={14} strokeWidth={2.5} />
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
                      className={BTN_TERTIARY}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!newCategoryName.trim()}
                      className={BTN_PRIMARY}
                    >
                      <Plus size={14} strokeWidth={2.5} />
                      <span>Crear Categoría</span>
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
                          className="p-1.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer"
                        >
                          <Trash2 size={13} />
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
            <div className="flex flex-col h-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-sm overflow-hidden min-h-0">
              {/* Cabecera de Columna 2 */}
              <div className="pb-3 border-b border-[var(--border-color)] shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                      2. Atributos en Categoría
                    </h3>
                    <h2 className="text-sm lg:text-base font-black text-[var(--text-primary)] truncate mt-0.5">
                      {selectedCategory}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {availableAttrsToLink.length > 0 && (
                      <button
                        type="button"
                        data-testid="link-attribute-to-category-btn"
                        onClick={() => {
                          setIsLinkingAttrOpen((prev) => !prev);
                          setIsCreatingAttribute(false);
                        }}
                        className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                          isLinkingAttrOpen
                            ? "border-accent bg-accent text-white shadow-xs"
                            : "border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-accent/40"
                        }`}
                        title="Vincular un atributo del Banco Maestro a esta categoría"
                      >
                        <Link2 size={12} />
                        <span>+ Vincular ({availableAttrsToLink.length})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      data-testid="create-attribute-btn"
                      onClick={() => {
                        setIsCreatingAttribute((prev) => !prev);
                        setIsLinkingAttrOpen(false);
                      }}
                      className={BTN_SECONDARY}
                      title="Crear un nuevo atributo personalizado"
                    >
                      <Plus size={14} strokeWidth={2.5} />
                      <span>Crear Atributo</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                  {categoryAttrKeys.length} atributos vinculados · Define el
                  orden en filtros y Nuevo Producto
                </p>
              </div>

              {/* Popover / Panel para Vincular Atributo Existente del Banco Maestro */}
              {isLinkingAttrOpen && availableAttrsToLink.length > 0 && (
                <div
                  data-testid="link-attr-popover"
                  className="mt-3 p-3 rounded-2xl border border-accent/40 bg-[var(--bg-elevated)]/95 backdrop-blur-md space-y-2 shadow-2xl animate-in fade-in duration-150 shrink-0"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[var(--text-primary)]">
                      <Bookmark size={12} className="text-accent" />
                      <span>Vincular del Banco Maestro:</span>
                    </div>
                    <button
                      type="button"
                      data-testid="close-link-attr-popover"
                      onClick={() => setIsLinkingAttrOpen(false)}
                      className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                      title="Cerrar vinculación de atributos"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-0.5">
                    {availableAttrsToLink.map((attr) => (
                      <button
                        key={attr.key}
                        type="button"
                        data-testid={`link-attr-chip-${attr.key}`}
                        onClick={() => {
                          addCategoryAttr(attr.key);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-accent hover:bg-accent/15 hover:text-accent px-2.5 py-1 text-[11px] font-bold text-[var(--text-primary)] transition-all cursor-pointer active:scale-95"
                      >
                        <Plus size={11} className="text-accent" />
                        <span>{attr.label}</span>
                        <span className="text-[10px] text-[var(--text-secondary)]">
                          ({attr.options.length})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setLinkToActiveCategory((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
                        linkToActiveCategory
                          ? "border-accent bg-accent/20 text-accent"
                          : "border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <span>
                        {linkToActiveCategory
                          ? `✓ Vincular a «${selectedCategory}»`
                          : "Solo en Banco Global"}
                      </span>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingAttribute(false);
                          setNewAttributeLabel("");
                          setNewAttributeFirstOption("");
                        }}
                        className={BTN_TERTIARY}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!newAttributeLabel.trim()}
                        className={BTN_PRIMARY}
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>
                          {linkToActiveCategory
                            ? "Crear y Vincular"
                            : "Crear en Banco"}
                        </span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Listado Vertical de Atributos Activos Vinculados */}
              <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 custom-scrollbar min-h-0">
                {categoryAttrKeys.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-primary)] text-center space-y-2">
                    <Bookmark
                      size={22}
                      className="text-[var(--text-secondary)] opacity-60"
                    />
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      Sin atributos vinculados
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] max-w-xs">
                      Esta categoría no tiene atributos asignados. Vincula uno
                      del Banco Maestro o crea un nuevo atributo personalizado.
                    </p>
                  </div>
                ) : (
                  categoryAttrKeys.map((key, idx) => {
                    const attr = catalogConfig.attributes[key];
                    const isSelected = activeAttrKey === key;
                    const localCount =
                      catalogConfig.categoryAttributeValues?.[
                        normalizeCatalogText(selectedCategory)
                      ]?.[key]?.length ?? 0;
                    return (
                      <div
                        key={key}
                        className={`group flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                          isSelected
                            ? "border-accent bg-accent/15 text-[var(--text-primary)] shadow-xs ring-1 ring-accent/30"
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
                                isSelected
                                  ? "font-black text-accent"
                                  : "font-bold"
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
                            {localCount} valores
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
                            title="Desvincular atributo de esta categoría"
                            className="p-1.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Acceso directo inferior si hay atributos del banco maestro por vincular */}
              {availableAttrsToLink.length > 0 && !isLinkingAttrOpen && (
                <div className="mt-3 pt-3 border-t border-[var(--border-color)] shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsLinkingAttrOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-dashed border-[var(--border-color)] hover:border-accent/40 bg-[var(--bg-primary)] hover:bg-[var(--bg-elevated)] text-xs font-bold text-accent transition-all cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>
                      Vincular otro atributo ({availableAttrsToLink.length} en
                      Banco Maestro)
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* COLUMNA 3 (DERECHA): Valores del Atributo Seleccionado   */}
            {/* ======================================================== */}
            <div className="flex flex-col h-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-sm overflow-hidden min-h-0">
              {/* Cabecera de Columna 3 */}
              <div className="pb-3 border-b border-[var(--border-color)] shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                      3. Valores y Opciones locales
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <h4 className="text-sm lg:text-base font-black text-[var(--text-primary)] truncate">
                        {activeAttr?.label || activeAttrKey}
                      </h4>
                      <span className="text-[10px] font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full shrink-0">
                        En «{selectedCategory}»
                      </span>
                      {isCustomizedForCategory && (
                        <button
                          type="button"
                          onClick={() => {
                            resetCategoryAttributeOptionsToGlobal(
                              selectedCategory,
                              activeAttrKey
                            );
                            showFeedback(
                              "success",
                              `Valores de «${activeAttr?.label}» restablecidos a la plantilla global.`
                            );
                          }}
                          title="Restablecer opciones a las del Banco Global"
                          className="text-[10px] font-bold text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                        >
                          Restablecer a Global
                        </button>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-[var(--text-secondary)] font-bold tabular-nums">
                    {effectiveOptions.length} opciones
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
                    className={BTN_PRIMARY}
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    <span>Agregar</span>
                  </button>
                </form>

                {/* Botón y Desplegable de Presets Disponibles en Ámbito de Categoría */}
                {activeScopeCategory && (
                  <div className="mt-2.5 flex items-center justify-between">
                    <button
                      type="button"
                      data-testid="toggle-manager-presets-btn"
                      onClick={() => setIsPresetsPopoverOpen((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                        isPresetsPopoverOpen
                          ? "border-accent bg-accent text-white shadow-xs"
                          : "border-accent/40 bg-accent/10 text-accent hover:bg-accent/20"
                      }`}
                      title="Ver Presets Históricos disponibles en el Banco Global"
                    >
                      <Bookmark size={12} />
                      <span>
                        Presets Disponibles ({availablePresets.length})
                      </span>
                    </button>
                  </div>
                )}

                {/* Popover / Panel de Presets Disponibles */}
                {activeScopeCategory && isPresetsPopoverOpen && (
                  <div
                    data-testid="manager-presets-popover"
                    className="mt-2.5 rounded-2xl border border-accent/40 bg-[var(--bg-elevated)]/95 backdrop-blur-md p-3.5 space-y-2.5 shadow-2xl animate-in fade-in duration-150 shrink-0"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                      <div className="flex items-center gap-1.5">
                        <Bookmark size={13} className="text-accent" />
                        <span className="text-xs font-black text-[var(--text-primary)]">
                          Presets Históricos:{" "}
                          {activeAttr?.label || activeAttrKey}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)] font-medium tabular-nums">
                          ({availablePresets.length} disponibles)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {availablePresets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              importAttributePresetsToCategory(
                                selectedCategory,
                                activeAttrKey,
                                availablePresets
                              );
                              showFeedback(
                                "success",
                                `Se importaron todos los presets a «${selectedCategory}».`
                              );
                              setIsPresetsPopoverOpen(false);
                            }}
                            className="text-[10px] font-bold text-accent hover:underline cursor-pointer"
                          >
                            + Añadir todos
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsPresetsPopoverOpen(false)}
                          className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>

                    {availablePresets.length === 0 ? (
                      <p className="text-[11px] text-[var(--text-secondary)] py-1 italic">
                        Todos los presets del Banco Global ya están presentes en
                        esta categoría.
                      </p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-0.5">
                        {availablePresets.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            data-testid={`manager-pick-preset-${preset.replace(/\s+/g, "_")}`}
                            onClick={() => {
                              addAttributeOption(
                                activeAttrKey,
                                preset,
                                selectedCategory
                              );
                              showFeedback(
                                "success",
                                `Preset "${preset}" añadido a «${selectedCategory}».`
                              );
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-accent hover:bg-accent/15 hover:text-accent px-2.5 py-1 text-[11px] font-semibold text-[var(--text-primary)] transition-all cursor-pointer select-none active:scale-95"
                          >
                            <Plus size={11} className="text-accent" />
                            <span>{preset}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Listado Vertical Scrollable de Opciones */}
              <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 custom-scrollbar min-h-0">
                {effectiveOptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-primary)] text-center space-y-2">
                    <Bookmark size={22} className="text-accent opacity-60" />
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      Sin valores locales en «{selectedCategory}»
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] max-w-xs">
                      Este atributo está instanciado limpio y aislado. Agrega
                      una nueva opción arriba o importa presets históricos sin
                      contaminar otras categorías.
                    </p>
                    {availablePresets.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsPresetsPopoverOpen(true)}
                        className="mt-1 text-xs font-bold text-accent hover:underline cursor-pointer"
                      >
                        Ver {availablePresets.length} presets disponibles
                      </button>
                    )}
                  </div>
                ) : (
                  effectiveOptions.map((option, index) => {
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
                              disabled={index === effectiveOptions.length - 1}
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
                              aria-label={`Eliminar opción ${option}`}
                              onClick={() => handleDeleteOption(option)}
                              title="Eliminar opción del catálogo"
                              className="p-1.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Nota de Integridad de Datos en la Base de la Columna 3 */}
              <div className="mt-3 pt-3 border-t border-[var(--border-color)] text-[10px] text-[var(--text-secondary)] leading-tight shrink-0">
                <p>
                  💡 Los cambios se sincronizan automáticamente para nuevos
                  productos en esta categoría. Los productos históricos
                  preservan su nomenclatura original.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* MODO BANCO MAESTRO (PRESETS): 2 PANELES AMPLIOS DEDICADOS */
          /* ======================================================== */
          <div className="h-full w-full grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5 min-h-0 overflow-hidden">
            {/* Panel Izquierdo (5 cols): Banco Global de Atributos */}
            <div className="md:col-span-5 flex flex-col h-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-sm overflow-hidden min-h-0">
              <div className="pb-3 border-b border-[var(--border-color)] shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                      Banco Global de Atributos
                    </h3>
                    <h2 className="text-sm lg:text-base font-black text-[var(--text-primary)] truncate mt-0.5">
                      Plantillas Maestras ({allAttributesList.length})
                    </h2>
                  </div>
                  <button
                    type="button"
                    data-testid="create-global-attribute-btn"
                    onClick={() =>
                      setIsCreatingGlobalAttribute((prev) => !prev)
                    }
                    className={BTN_SECONDARY}
                    title="Crear un nuevo atributo maestro en el Banco Global"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    <span>+ Atributo Global</span>
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                  Cascarones globales independientes para estructurar las
                  categorías del sistema
                </p>
              </div>

              {/* Formulario Inline para Crear Atributo Directo en Banco Global */}
              {isCreatingGlobalAttribute && (
                <form
                  onSubmit={handleCreateGlobalAttribute}
                  data-testid="global-attribute-create-form"
                  className="mt-3 p-3.5 rounded-2xl border border-accent/30 bg-accent-subtle space-y-2.5 animate-in fade-in duration-150 shrink-0"
                >
                  <div className="text-[11px] font-bold text-accent uppercase tracking-wider">
                    Nuevo Atributo Maestro (Banco Global):
                  </div>
                  <input
                    type="text"
                    data-testid="global-attribute-name-input"
                    value={newGlobalAttributeLabel}
                    onChange={(e) => setNewGlobalAttributeLabel(e.target.value)}
                    placeholder="Nombre (ej. Talla, Voltaje, Capacidad...)"
                    autoFocus
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-accent"
                  />
                  <input
                    type="text"
                    value={newGlobalAttributeFirstOption}
                    onChange={(e) =>
                      setNewGlobalAttributeFirstOption(e.target.value)
                    }
                    placeholder="Primera opción / valor maestro (opcional)"
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-accent"
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingGlobalAttribute(false);
                        setNewGlobalAttributeLabel("");
                        setNewGlobalAttributeFirstOption("");
                      }}
                      className={BTN_TERTIARY}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      data-testid="confirm-create-global-attr-btn"
                      disabled={!newGlobalAttributeLabel.trim()}
                      className={BTN_PRIMARY}
                    >
                      <Plus size={14} strokeWidth={2.5} />
                      <span>Crear en Banco Global</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Atributos del Banco Global */}
              <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 custom-scrollbar min-h-0">
                {allAttributesList.map((attr) => {
                  const isSelected = activeAttrKey === attr.key;
                  const linkedCount = catalogConfig.categories.filter((c) =>
                    c.attributeKeys.includes(attr.key)
                  ).length;
                  return (
                    <div
                      key={attr.key}
                      onClick={() => setActiveAttrKey(attr.key)}
                      className={`group flex items-center justify-between rounded-xl border p-3 transition-all cursor-pointer ${
                        isSelected
                          ? "border-accent bg-accent/15 text-accent shadow-xs ring-1 ring-accent/30"
                          : "border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-accent/40 text-[var(--text-primary)]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs truncate">
                            {attr.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-secondary)]">
                          <span className="tabular-nums font-semibold">
                            {attr.options.length} presets
                          </span>
                          <span>•</span>
                          <span className="tabular-nums">
                            En {linkedCount} categoría
                            {linkedCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                      <Bookmark
                        size={14}
                        className={
                          isSelected
                            ? "text-accent fill-accent/20"
                            : "text-[var(--text-secondary)] opacity-40 group-hover:opacity-100 transition-opacity"
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel Derecho (7 cols): Presets Históricos del Atributo Maestro */}
            <div className="md:col-span-7 flex flex-col h-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-sm overflow-hidden min-h-0">
              <div className="pb-3 border-b border-[var(--border-color)] shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Bookmark size={10} className="fill-accent/20" />
                        <span>Banco Global Maestro</span>
                      </span>
                    </div>
                    <h2 className="text-sm lg:text-base font-black text-[var(--text-primary)] truncate mt-1">
                      Presets Maestros: {activeAttr?.label || activeAttrKey}
                    </h2>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] font-bold tabular-nums">
                    {effectiveOptions.length} presets registrados
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                  Valores base que sirven como sugerencias inteligentes para
                  este atributo en cualquier categoría
                </p>

                {/* Formulario de Adición de Preset al Banco Maestro */}
                <form
                  onSubmit={handleAddOption}
                  className="mt-3 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    placeholder="Nuevo preset maestro para este atributo..."
                    className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={!newOptionInput.trim()}
                    className={BTN_PRIMARY}
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    <span>+ Agregar Preset</span>
                  </button>
                </form>
              </div>

              {/* Listado Scrollable de Presets Maestros */}
              <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 custom-scrollbar min-h-0">
                {effectiveOptions.map((opt, idx) => {
                  const isEditing = editingOption === opt;
                  return (
                    <div
                      key={`${opt}-${idx}`}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-accent/40 transition-all group"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(opt);
                              if (e.key === "Escape") setEditingOption(null);
                            }}
                            className="flex-1 rounded-lg border border-accent bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-bold text-[var(--text-primary)] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(opt)}
                            className={BTN_PRIMARY}
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingOption(null)}
                            className={BTN_TERTIARY}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="tabular-nums text-[10px] text-[var(--text-secondary)] font-mono shrink-0">
                            {idx + 1}.
                          </span>
                          <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {opt}
                          </span>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveOption(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveOption(idx, "down")}
                            disabled={idx === effectiveOptions.length - 1}
                            className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingOption(opt);
                              setEditingValue(opt);
                            }}
                            className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-accent hover:bg-accent/10 cursor-pointer"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOption(opt)}
                            disabled={effectiveOptions.length <= 1}
                            className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 disabled:opacity-20 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pie con Categorías Vinculadas */}
              <div className="mt-3 pt-3 border-t border-[var(--border-color)] shrink-0 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold">
                    Categorías que usan este atributo:
                  </span>
                  {catalogConfig.categories
                    .filter((c) => c.attributeKeys.includes(activeAttrKey))
                    .map((c) => (
                      <span
                        key={c.name}
                        className="px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] font-medium"
                      >
                        {c.name}
                      </span>
                    ))}
                  {catalogConfig.categories.filter((c) =>
                    c.attributeKeys.includes(activeAttrKey)
                  ).length === 0 && (
                    <span className="italic text-[var(--text-secondary)]">
                      No vinculado a ninguna categoría todavía.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
