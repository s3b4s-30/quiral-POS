import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Check,
  Minus,
  Pencil,
  Plus,
  Tag,
  X,
} from "lucide-react";
import React, { useMemo, useRef, useState } from "react";
import ModalSheet from "../../../components/ModalSheet";
import HorizontalScrollNav from "../../../components/HorizontalScrollNav";
import { useInventory } from "../../../context/InventoryContext";
import { ProductCategory } from "../../../types/domain";
import {
  getAttributePresets,
  getEffectiveAttributeOptions,
  inferAttributeKeysForCategory,
  isSameCatalogText,
  normalizeCatalogText,
} from "../../../utils/catalogConfig";

interface AttributeConfigModalProps {
  onClose: () => void;
  initialAttributeKey?: string;
  activeCategory?: ProductCategory;
  initialTab?: "category-order" | "attribute-options";
}

export default function AttributeConfigModal({
  onClose,
  initialAttributeKey,
  activeCategory,
  initialTab = "attribute-options",
}: AttributeConfigModalProps) {
  const {
    catalogConfig,
    updateCategoryAttributes,
    addAttributeOption,
    renameAttributeOption,
    deleteAttributeOption,
    reorderAttributeOptions,
    createCustomAttribute,
  } = useInventory();

  const [tab, setTab] = useState<"category-order" | "attribute-options">(
    initialTab
  );
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(
    activeCategory || catalogConfig.categoryOrder[0] || "Cargadores y Cables"
  );

  const attributeList = Object.values(catalogConfig.attributes);
  const [selectedKey, setSelectedKey] = useState<string>(
    initialAttributeKey && catalogConfig.attributes[initialAttributeKey]
      ? initialAttributeKey
      : attributeList[0]?.key || "brands"
  );

  const [newOptionInput, setNewOptionInput] = useState("");
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "warning";
    text: string;
  } | null>(null);

  // Creación de un nuevo atributo (sin usar el término "familia")
  const [isCreatingBlock, setIsCreatingBlock] = useState(false);
  const [newBlockLabel, setNewBlockLabel] = useState("");
  const [newBlockFirstOption, setNewBlockFirstOption] = useState("");

  // Estado de Drag & Drop / Deslizamiento Táctil para la lista de atributos de la categoría
  const [catAttrTouchIndex, setCatAttrTouchIndex] = useState<number | null>(
    null
  );
  const catAttrTouchIndexRef = useRef<number | null>(null);
  const catAttrListRef = useRef<HTMLDivElement | null>(null);
  const [catAttrDragIndex, setCatAttrDragIndex] = useState<number | null>(null);
  const [catAttrDragOverIndex, setCatAttrDragOverIndex] = useState<
    number | null
  >(null);

  // Estado de Drag & Drop / Deslizamiento Táctil para la lista de opciones de un atributo
  const [optTouchIndex, setOptTouchIndex] = useState<number | null>(null);
  const optTouchIndexRef = useRef<number | null>(null);
  const optListRef = useRef<HTMLDivElement | null>(null);
  const [optDragIndex, setOptDragIndex] = useState<number | null>(null);
  const [optDragOverIndex, setOptDragOverIndex] = useState<number | null>(null);

  const activeAttr = catalogConfig.attributes[selectedKey] || attributeList[0];

  const effectiveOptions = useMemo(() => {
    const scoped = getEffectiveAttributeOptions(
      catalogConfig,
      selectedCategory,
      activeAttr?.key
    );
    if (scoped.length > 0) return scoped;
    return activeAttr?.options ?? [];
  }, [catalogConfig, selectedCategory, activeAttr]);

  const masterPresets = useMemo(() => {
    return activeAttr?.key
      ? getAttributePresets(catalogConfig, activeAttr.key)
      : [];
  }, [catalogConfig, activeAttr?.key]);

  const availablePresets = useMemo(() => {
    return masterPresets.filter(
      (preset) =>
        !effectiveOptions.some((opt) => isSameCatalogText(opt, preset))
    );
  }, [masterPresets, effectiveOptions]);

  const currentCategoryConfig = catalogConfig.categories.find((c) =>
    isSameCatalogText(c.name, selectedCategory)
  );
  const categoryAttrKeys =
    currentCategoryConfig?.attributeKeys ??
    inferAttributeKeysForCategory(selectedCategory);

  const showFeedback = (type: "success" | "warning", text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg((prev) => (prev?.text === text ? null : prev));
    }, 2800);
  };

  // --- Reordenamiento y gestión de atributos dentro de la Categoría seleccionada ---
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

  const removeCategoryAttr = (keyToRemove: string) => {
    if (categoryAttrKeys.length <= 1) return;
    const next = categoryAttrKeys.filter((k) => k !== keyToRemove);
    updateCategoryAttributes(selectedCategory, next);
  };

  const addCategoryAttr = (keyToAdd: string) => {
    if (categoryAttrKeys.includes(keyToAdd)) return;
    updateCategoryAttributes(selectedCategory, [...categoryAttrKeys, keyToAdd]);
  };

  const handleCatAttrTouchMove = (
    clientX: number,
    clientY: number,
    e: React.TouchEvent
  ) => {
    const activeIdx = catAttrTouchIndexRef.current;
    if (activeIdx === null) return;
    if (e.cancelable) e.preventDefault();

    let targetIdx: number | null = null;
    const el = document.elementFromPoint(clientX, clientY);
    const rowEl = el?.closest("[data-cat-attr-index]") as HTMLElement | null;
    if (rowEl?.dataset.catAttrIndex !== undefined) {
      const parsed = parseInt(rowEl.dataset.catAttrIndex, 10);
      if (!Number.isNaN(parsed)) targetIdx = parsed;
    } else if (catAttrListRef.current) {
      const rows = Array.from(
        catAttrListRef.current.querySelectorAll<HTMLElement>(
          "[data-cat-attr-index]"
        )
      );
      for (const r of rows) {
        const rect = r.getBoundingClientRect();
        if (clientY >= rect.top && clientY <= rect.bottom) {
          const parsed = parseInt(r.dataset.catAttrIndex || "", 10);
          if (!Number.isNaN(parsed)) {
            targetIdx = parsed;
            break;
          }
        }
      }
    }

    if (targetIdx !== null && targetIdx !== activeIdx) {
      moveCategoryAttr(activeIdx, targetIdx);
      catAttrTouchIndexRef.current = targetIdx;
      setCatAttrTouchIndex(targetIdx);
    }
  };

  // --- Reordenamiento y gestión de valores/opciones dentro de un Atributo ---
  const moveOptionAt = (fromIdx: number, toIdx: number) => {
    if (!activeAttr) return;
    const opts = effectiveOptions;
    if (
      fromIdx === toIdx ||
      fromIdx < 0 ||
      toIdx < 0 ||
      fromIdx >= opts.length ||
      toIdx >= opts.length
    ) {
      return;
    }
    const next = [...opts];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    reorderAttributeOptions(activeAttr.key, next, selectedCategory);
  };

  const handleOptionTouchMove = (
    clientX: number,
    clientY: number,
    e: React.TouchEvent
  ) => {
    const activeIdx = optTouchIndexRef.current;
    if (activeIdx === null) return;
    if (e.cancelable) e.preventDefault();

    let targetIdx: number | null = null;
    const el = document.elementFromPoint(clientX, clientY);
    const rowEl = el?.closest("[data-opt-index]") as HTMLElement | null;
    if (rowEl?.dataset.optIndex !== undefined) {
      const parsed = parseInt(rowEl.dataset.optIndex, 10);
      if (!Number.isNaN(parsed)) targetIdx = parsed;
    } else if (optListRef.current) {
      const rows = Array.from(
        optListRef.current.querySelectorAll<HTMLElement>("[data-opt-index]")
      );
      for (const r of rows) {
        const rect = r.getBoundingClientRect();
        if (clientY >= rect.top && clientY <= rect.bottom) {
          const parsed = parseInt(r.dataset.optIndex || "", 10);
          if (!Number.isNaN(parsed)) {
            targetIdx = parsed;
            break;
          }
        }
      }
    }

    if (targetIdx !== null && targetIdx !== activeIdx) {
      moveOptionAt(activeIdx, targetIdx);
      optTouchIndexRef.current = targetIdx;
      setOptTouchIndex(targetIdx);
    }
  };

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAttr) return;

    const clean = normalizeCatalogText(newOptionInput);
    if (!clean) return;

    const alreadyExists = effectiveOptions.some((opt) =>
      isSameCatalogText(opt, clean)
    );

    const saved = addAttributeOption(activeAttr.key, clean, selectedCategory);
    setNewOptionInput("");

    if (alreadyExists) {
      showFeedback(
        "warning",
        `«${saved || clean}» ya existe en ${activeAttr.label}.`
      );
    } else if (saved) {
      showFeedback("success", `«${saved}» agregado a ${activeAttr.label}.`);
    }
  };

  const startRename = (opt: string) => {
    setEditingOption(opt);
    setEditingValue(opt);
  };

  const confirmRename = (oldOpt: string) => {
    if (!activeAttr) return;
    const clean = normalizeCatalogText(editingValue);
    if (!clean || isSameCatalogText(oldOpt, clean)) {
      setEditingOption(null);
      return;
    }

    const ok = renameAttributeOption(
      activeAttr.key,
      oldOpt,
      clean,
      selectedCategory
    );
    if (ok) {
      showFeedback("success", `Renombrado a «${clean}».`);
      setEditingOption(null);
    } else {
      showFeedback("warning", `El valor «${clean}» ya existe en esta lista.`);
    }
  };

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = normalizeCatalogText(newBlockLabel);
    if (!cleanLabel) return;

    const firstOpt = normalizeCatalogText(newBlockFirstOption) || "Estándar";
    const createdKey = createCustomAttribute(cleanLabel, [firstOpt]);
    if (createdKey) {
      setSelectedKey(createdKey);
      setNewBlockLabel("");
      setNewBlockFirstOption("");
      setIsCreatingBlock(false);
      setTab("attribute-options");
      showFeedback("success", `Atributo «${cleanLabel}» creado.`);
    }
  };

  return (
    <ModalSheet
      title="Configurar Atributos"
      onClose={onClose}
      enableDragToDismiss={false}
      headerRight={
        <button
          type="button"
          onClick={onClose}
          aria-label="Confirmar cambios de atributos"
          title="Confirmar y cerrar"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#30d158] text-white shadow-md shadow-[#30d158]/25 transition-transform active:scale-95 hover:bg-[#28cd41]"
        >
          <Check size={20} strokeWidth={2.75} />
        </button>
      }
      footer={
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent hover:bg-accent-hover text-sm sm:text-base font-bold text-white shadow-lg active:scale-[0.98] transition-all duration-200"
        >
          Listo
        </button>
      }
    >
      <div className="space-y-4 py-1">
        {/* Selector de modo: Opciones de Atributos vs Orden por Categoría */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/5 dark:bg-zinc-900 p-1 border border-[var(--border-color)] dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setTab("attribute-options")}
            className={`rounded-xl py-2 text-xs font-bold transition-colors duration-200 ${
              tab === "attribute-options"
                ? "bg-accent text-white shadow-sm"
                : "text-[var(--text-secondary)] dark:text-zinc-400 hover:text-[var(--text-primary)]"
            }`}
          >
            Valores de Atributos
          </button>
          <button
            type="button"
            onClick={() => setTab("category-order")}
            className={`rounded-xl py-2 text-xs font-bold transition-colors duration-200 ${
              tab === "category-order"
                ? "bg-accent text-white shadow-sm"
                : "text-[var(--text-secondary)] dark:text-zinc-400 hover:text-[var(--text-primary)]"
            }`}
          >
            Orden por Categoría
          </button>
        </div>

        {tab === "category-order" ? (
          <div className="space-y-3">
            {/* Selector de categoría a configurar */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                Categoría seleccionada
              </label>
              <HorizontalScrollNav
                testId="attribute-config-category-nav"
                className="flex items-center gap-1.5 overflow-x-auto scroll-smooth custom-scrollbar pb-1 flex-1"
                containerClassName="relative flex items-center w-full min-w-0"
                scrollAmount={220}
              >
                {catalogConfig.categoryOrder.map((cat) => {
                  const isSel = isSameCatalogText(selectedCategory, cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors duration-200 ${
                        isSel
                          ? "bg-accent text-white shadow-sm"
                          : "border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 text-[var(--text-primary)] dark:text-zinc-200"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </HorizontalScrollNav>
            </div>

            {/* Lista Reordenable de Atributos de la Categoría (Mismo estilo que Categorías) */}
            <div className="space-y-1.5">
              <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                Atributos de «{selectedCategory}» (Desliza para ordenar)
              </p>

              <div
                ref={catAttrListRef}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  if (touch) {
                    handleCatAttrTouchMove(touch.clientX, touch.clientY, e);
                  }
                }}
                onTouchEnd={() => {
                  catAttrTouchIndexRef.current = null;
                  setCatAttrTouchIndex(null);
                }}
                onTouchCancel={() => {
                  catAttrTouchIndexRef.current = null;
                  setCatAttrTouchIndex(null);
                }}
                className="max-h-[34vh] overflow-y-auto space-y-2 pr-0.5"
              >
                {categoryAttrKeys.map((attrKey, idx) => {
                  const attrDef = catalogConfig.attributes[attrKey];
                  if (!attrDef) return null;
                  const isDragging =
                    catAttrTouchIndex === idx ||
                    (catAttrDragOverIndex === idx && catAttrDragIndex !== idx);

                  return (
                    <div
                      key={attrKey}
                      data-cat-attr-index={idx}
                      draggable
                      onDragStart={() => setCatAttrDragIndex(idx)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setCatAttrDragOverIndex(idx);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (catAttrDragIndex !== null) {
                          moveCategoryAttr(catAttrDragIndex, idx);
                        }
                        setCatAttrDragIndex(null);
                        setCatAttrDragOverIndex(null);
                      }}
                      onDragEnd={() => {
                        setCatAttrDragIndex(null);
                        setCatAttrDragOverIndex(null);
                      }}
                      className={`flex items-center justify-between gap-2.5 rounded-2xl border px-3 py-2.5 transition-all select-none ${
                        isDragging
                          ? "border-accent bg-accent-subtle scale-[1.01] shadow-md z-10"
                          : "border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900"
                      }`}
                    >
                      {/* Izquierda: Botón rojo (-) para quitar atributo de la categoría */}
                      <button
                        type="button"
                        disabled={categoryAttrKeys.length <= 1}
                        onClick={() => removeCategoryAttr(attrKey)}
                        aria-label={`Quitar atributo ${attrDef.label}`}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ff3b30]/15 text-[#ff3b30] hover:bg-[#ff3b30] hover:text-white disabled:opacity-30 active:scale-90 transition-all"
                      >
                        <Minus size={15} strokeWidth={2.75} />
                      </button>

                      {/* Centro: Nombre del atributo y vista previa de valores */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs sm:text-sm font-bold text-[var(--text-primary)] dark:text-zinc-100">
                          {idx + 1}. {attrDef.label}
                        </p>
                        <p className="truncate text-[10px] text-[var(--text-secondary)] dark:text-zinc-400">
                          {attrDef.options.slice(0, 4).join(" · ")}
                        </p>
                      </div>

                      {/* Derecha: Flechas + Asa táctil de 3 líneas */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveCategoryAttr(idx, idx - 1)}
                          aria-label={`Subir atributo ${attrDef.label}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)]/50 dark:bg-zinc-800/70 text-[var(--text-primary)] dark:text-zinc-200 disabled:opacity-25 active:scale-90 transition-transform"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === categoryAttrKeys.length - 1}
                          onClick={() => moveCategoryAttr(idx, idx + 1)}
                          aria-label={`Bajar atributo ${attrDef.label}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)]/50 dark:bg-zinc-800/70 text-[var(--text-primary)] dark:text-zinc-200 disabled:opacity-25 active:scale-90 transition-transform"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <div
                          aria-label={`Asa de arrastre ${attrDef.label}`}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            catAttrTouchIndexRef.current = idx;
                            setCatAttrTouchIndex(idx);
                          }}
                          style={{ touchAction: "none" }}
                          className="flex h-8 w-8 cursor-grab active:cursor-grabbing flex-col items-center justify-center gap-[3.5px] rounded-lg px-1.5 text-[var(--text-secondary)] dark:text-zinc-400"
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

            {/* Atributos disponibles para agregar con un toque */}
            <div className="rounded-2xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)]/50 dark:bg-zinc-900/50 p-3 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                Otros atributos disponibles (Toca para agregar)
              </p>
              <HorizontalScrollNav
                testId="attribute-config-available-attrs-nav"
                className="flex items-center gap-1.5 overflow-x-auto scroll-smooth custom-scrollbar py-1"
                containerClassName="relative flex items-center w-full min-w-0"
                scrollAmount={200}
              >
                {attributeList
                  .filter((a) => !categoryAttrKeys.includes(a.key))
                  .map((attr) => (
                    <button
                      key={attr.key}
                      type="button"
                      onClick={() => addCategoryAttr(attr.key)}
                      className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent-subtle px-2.5 py-1 text-[11px] font-bold text-accent active:scale-95 transition-all duration-200"
                    >
                      <Plus size={12} />
                      <span>{attr.label}</span>
                    </button>
                  ))}
              </HorizontalScrollNav>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* Cabecera para crear un nuevo atributo */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                Desliza las opciones para cambiar su orden o elimina las que no
                uses.
              </p>
              <button
                type="button"
                onClick={() => setIsCreatingBlock((prev) => !prev)}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-accent/30 bg-accent-subtle px-2.5 py-1.5 text-xs font-bold text-accent active:scale-95 transition-all duration-200"
              >
                <Plus size={14} />
                <span>Nuevo atributo</span>
              </button>
            </div>

            {isCreatingBlock && (
              <form
                onSubmit={handleCreateBlock}
                className="rounded-2xl border border-accent/30 bg-accent-subtle/50 dark:bg-zinc-900 p-3.5 space-y-2.5 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-accent flex items-center gap-1.5 transition-colors duration-200">
                    <Tag size={14} />
                    Crear nuevo atributo
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingBlock(false)}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <X size={15} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newBlockLabel}
                    onChange={(e) => setNewBlockLabel(e.target.value)}
                    placeholder="Nombre (ej. Resistencia, Pulgadas)"
                    className="w-full rounded-xl border border-[var(--border-color)] dark:border-zinc-700 bg-[var(--bg-elevated)] dark:bg-zinc-950 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] dark:text-zinc-100 placeholder:text-[var(--text-secondary)] dark:placeholder:text-zinc-500 outline-none focus:border-accent transition-colors"
                  />
                  <input
                    type="text"
                    value={newBlockFirstOption}
                    onChange={(e) => setNewBlockFirstOption(e.target.value)}
                    placeholder="Primer valor (ej. IP68, 45mm)"
                    className="w-full rounded-xl border border-[var(--border-color)] dark:border-zinc-700 bg-[var(--bg-elevated)] dark:bg-zinc-950 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] dark:text-zinc-100 placeholder:text-[var(--text-secondary)] dark:placeholder:text-zinc-500 outline-none focus:border-accent transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newBlockLabel.trim()}
                  className="flex min-h-9 w-full items-center justify-center rounded-xl bg-accent hover:bg-accent-hover text-xs font-bold text-white shadow-sm transition-all duration-200 disabled:opacity-40"
                >
                  Guardar atributo
                </button>
              </form>
            )}

            {/* Selector horizontal de atributos */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                Atributo seleccionado
              </label>
              <HorizontalScrollNav
                testId="attribute-config-attr-list-nav"
                className="flex items-center gap-1.5 overflow-x-auto scroll-smooth custom-scrollbar pb-1.5 flex-1"
                containerClassName="relative flex items-center w-full min-w-0"
                scrollAmount={220}
              >
                {attributeList.map((attr) => {
                  const isSelected = activeAttr?.key === attr.key;
                  return (
                    <button
                      key={attr.key}
                      type="button"
                      onClick={() => {
                        setSelectedKey(attr.key);
                        setEditingOption(null);
                      }}
                      className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-colors duration-200 ${
                        isSelected
                          ? "bg-accent text-white shadow-sm"
                          : "border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 text-[var(--text-primary)] dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {attr.label} ({attr.options.length})
                    </button>
                  );
                })}
              </HorizontalScrollNav>
            </div>

            {feedbackMsg && (
              <div
                className={`rounded-xl px-3 py-2 text-xs font-semibold animate-in fade-in duration-150 ${
                  feedbackMsg.type === "success"
                    ? "bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30"
                    : "bg-[#ff9500]/15 text-[#ff9500] border border-[#ff9500]/30"
                }`}
              >
                {feedbackMsg.text}
              </div>
            )}

            {/* Lista Reordenable de Opciones del Atributo Activo */}
            {activeAttr && (
              <div className="rounded-2xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900/60 p-3.5 space-y-3">
                <form
                  onSubmit={handleAddOption}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    placeholder={`Nuevo valor para ${activeAttr.label}...`}
                    aria-label={`Nuevo valor para ${activeAttr.label}`}
                    className="flex-1 rounded-xl border border-[var(--border-color)] dark:border-zinc-700 bg-[var(--bg-primary)]/60 dark:bg-zinc-900 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-primary)] dark:text-zinc-100 placeholder:text-[var(--text-secondary)] dark:placeholder:text-zinc-500 outline-none focus:border-accent transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newOptionInput.trim()}
                    aria-label="Agregar valor al atributo"
                    className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-accent hover:bg-accent-hover px-3.5 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition-all duration-200 disabled:opacity-40 shrink-0"
                  >
                    <Plus size={16} />
                    <span>Agregar</span>
                  </button>
                </form>

                {/* Presets del Banco Maestro disponibles para vincular a esta categoría */}
                {availablePresets.length > 0 && (
                  <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-2.5 space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-accent">
                      <Bookmark size={12} className="shrink-0" />
                      <span>
                        Presets del Banco Maestro ({availablePresets.length}):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-0.5">
                      {availablePresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            addAttributeOption(
                              activeAttr.key,
                              preset,
                              selectedCategory
                            );
                            showFeedback(
                              "success",
                              `Preset «${preset}» vinculado a ${selectedCategory}.`
                            );
                          }}
                          className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] hover:border-accent hover:bg-accent/15 hover:text-accent px-2.5 py-1 text-[11px] font-bold text-[var(--text-primary)] active:scale-95 transition-all cursor-pointer min-h-[30px]"
                          title={`Vincular preset ${preset} a ${selectedCategory}`}
                        >
                          <Plus size={11} className="text-accent" />
                          <span>{preset}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista interactiva con botón (-) a la izquierda y asa de 3 líneas a la derecha */}
                <div
                  ref={optListRef}
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    if (touch) {
                      handleOptionTouchMove(touch.clientX, touch.clientY, e);
                    }
                  }}
                  onTouchEnd={() => {
                    optTouchIndexRef.current = null;
                    setOptTouchIndex(null);
                  }}
                  onTouchCancel={() => {
                    optTouchIndexRef.current = null;
                    setOptTouchIndex(null);
                  }}
                  className="max-h-[38vh] overflow-y-auto space-y-1.5 pr-0.5"
                >
                  {effectiveOptions.map((opt, idx) => {
                    const isEditing = editingOption === opt;
                    const isDragging =
                      optTouchIndex === idx ||
                      (optDragOverIndex === idx && optDragIndex !== idx);

                    return (
                      <div
                        key={opt}
                        data-opt-index={idx}
                        draggable={!isEditing}
                        onDragStart={() => setOptDragIndex(idx)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setOptDragOverIndex(idx);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (optDragIndex !== null) {
                            moveOptionAt(optDragIndex, idx);
                          }
                          setOptDragIndex(null);
                          setOptDragOverIndex(null);
                        }}
                        onDragEnd={() => {
                          setOptDragIndex(null);
                          setOptDragOverIndex(null);
                        }}
                        className={`flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 transition-all select-none ${
                          isDragging
                            ? "border-accent bg-accent-subtle scale-[1.01] shadow-md z-10"
                            : "border-[var(--border-color)] dark:border-zinc-800/80 bg-[var(--bg-primary)]/40 dark:bg-zinc-900"
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex flex-1 items-center gap-1.5">
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  confirmRename(opt);
                                } else if (e.key === "Escape") {
                                  setEditingOption(null);
                                }
                              }}
                              autoFocus
                              className="flex-1 rounded-lg border border-accent bg-[var(--bg-elevated)] dark:bg-zinc-950 px-2.5 py-1 text-xs font-bold text-[var(--text-primary)] dark:text-zinc-100 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => confirmRename(opt)}
                              aria-label={`Confirmar renombre de ${opt}`}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#30d158] text-white"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingOption(null)}
                              aria-label="Cancelar edición"
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/5 dark:bg-zinc-800 text-[var(--text-secondary)]"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Izquierda: Botón rojo (-) para eliminar opción */}
                            <button
                              type="button"
                              disabled={effectiveOptions.length <= 1}
                              onClick={() =>
                                deleteAttributeOption(
                                  activeAttr.key,
                                  opt,
                                  selectedCategory
                                )
                              }
                              aria-label={`Eliminar opción ${opt}`}
                              title="Eliminar opción"
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ff3b30]/15 text-[#ff3b30] hover:bg-[#ff3b30] hover:text-white disabled:opacity-25 active:scale-90 transition-all"
                            >
                              <Minus size={13} strokeWidth={2.75} />
                            </button>

                            {/* Centro: Nombre de la opción + lápiz de edición */}
                            <div className="min-w-0 flex-1 flex items-center gap-1.5">
                              <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] dark:text-zinc-100 truncate">
                                {opt}
                              </span>
                              <button
                                type="button"
                                onClick={() => startRename(opt)}
                                aria-label={`Renombrar ${opt}`}
                                title="Renombrar"
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-zinc-800 hover:text-accent transition-colors duration-200"
                              >
                                <Pencil size={12} />
                              </button>
                            </div>

                            {/* Derecha: Subir / Bajar + Asa táctil de 3 líneas */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveOptionAt(idx, idx - 1)}
                                aria-label={`Subir opción ${opt}`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)]/50 dark:bg-zinc-800/70 text-[var(--text-primary)] dark:text-zinc-200 disabled:opacity-25 active:scale-90"
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === effectiveOptions.length - 1}
                                onClick={() => moveOptionAt(idx, idx + 1)}
                                aria-label={`Bajar opción ${opt}`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)]/50 dark:bg-zinc-800/70 text-[var(--text-primary)] dark:text-zinc-200 disabled:opacity-25 active:scale-90"
                              >
                                <ArrowDown size={12} />
                              </button>
                              <div
                                aria-label={`Asa de arrastre opción ${opt}`}
                                onTouchStart={(e) => {
                                  e.stopPropagation();
                                  optTouchIndexRef.current = idx;
                                  setOptTouchIndex(idx);
                                }}
                                style={{ touchAction: "none" }}
                                className="flex h-7 w-7 cursor-grab active:cursor-grabbing flex-col items-center justify-center gap-[3px] rounded-lg px-1 text-[var(--text-secondary)] dark:text-zinc-400"
                              >
                                <span className="block h-[2px] w-4 rounded-full bg-current" />
                                <span className="block h-[2px] w-4 rounded-full bg-current" />
                                <span className="block h-[2px] w-4 rounded-full bg-current" />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ModalSheet>
  );
}
