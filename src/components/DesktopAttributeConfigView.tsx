import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Minus,
  Pencil,
  Plus,
  Sliders,
  Tag,
  X,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { ProductCategory } from "../types/domain";
import {
  inferAttributeKeysForCategory,
  isSameCatalogText,
  normalizeCatalogText,
} from "../utils/catalogConfig";

interface DesktopAttributeConfigViewProps {
  onBack: () => void;
  activeCategory?: ProductCategory;
  initialAttributeKey?: string;
  initialTab?: "category-order" | "attribute-options";
}

export default function DesktopAttributeConfigView({
  onBack,
  activeCategory,
  initialAttributeKey,
  initialTab = "attribute-options",
}: DesktopAttributeConfigViewProps) {
  const {
    catalogConfig,
    updateCategoryAttributes,
    addAttributeOption,
    renameAttributeOption,
    deleteAttributeOption,
    reorderAttributeOptions,
    createCustomAttribute,
  } = useInventory();

  const [tab, setTab] = useState<"category-order" | "attribute-options">(initialTab);
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

  // Creación de un nuevo atributo
  const [isCreatingBlock, setIsCreatingBlock] = useState(false);
  const [newBlockLabel, setNewBlockLabel] = useState("");
  const [newBlockFirstOption, setNewBlockFirstOption] = useState("");

  const activeAttr = catalogConfig.attributes[selectedKey] || attributeList[0];

  const currentCategoryConfig = catalogConfig.categories.find((c) =>
    isSameCatalogText(c.name, selectedCategory)
  );
  const categoryAttrKeys =
    currentCategoryConfig?.attributeKeys ?? inferAttributeKeysForCategory(selectedCategory);

  const showFeedback = (type: "success" | "warning", text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg((prev) => (prev?.text === text ? null : prev));
    }, 2800);
  };

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

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newOptionInput.trim();
    if (!trimmed || !activeAttr) return;

    const added = addAttributeOption(activeAttr.key, trimmed);
    if (!added) {
      showFeedback("warning", "Esa opción ya existe.");
      return;
    }
    setNewOptionInput("");
    showFeedback("success", `Opción "${trimmed}" agregada.`);
  };

  const handleStartEdit = (option: string) => {
    setEditingOption(option);
    setEditingValue(option);
  };

  const handleSaveEdit = (oldOption: string) => {
    const trimmed = editingValue.trim();
    if (!trimmed || !activeAttr) {
      setEditingOption(null);
      return;
    }
    if (trimmed === oldOption) {
      setEditingOption(null);
      return;
    }
    const ok = renameAttributeOption(activeAttr.key, oldOption, trimmed);
    if (!ok) {
      showFeedback("warning", "Ya existe una opción con ese nombre.");
      return;
    }
    setEditingOption(null);
    showFeedback("success", "Opción actualizada.");
  };

  const handleDeleteOption = (option: string) => {
    if (!activeAttr) return;
    if (activeAttr.options.length <= 1) {
      showFeedback("warning", "Un atributo debe tener al menos una opción.");
      return;
    }
    deleteAttributeOption(activeAttr.key, option);
    showFeedback("success", `"${option}" eliminada.`);
  };

  const moveOption = (index: number, direction: "up" | "down") => {
    if (!activeAttr) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeAttr.options.length) return;

    const nextOptions = [...activeAttr.options];
    const [moved] = nextOptions.splice(index, 1);
    nextOptions.splice(targetIndex, 0, moved);
    reorderAttributeOptions(activeAttr.key, nextOptions);
  };

  const handleCreateNewBlock = (e: React.FormEvent) => {
    e.preventDefault();
    const labelTrimmed = newBlockLabel.trim();
    const firstTrimmed = newBlockFirstOption.trim();
    if (!labelTrimmed) return;

    const newKey = createCustomAttribute(
      labelTrimmed,
      firstTrimmed ? [firstTrimmed] : undefined
    );
    if (!newKey) {
      showFeedback("warning", "Ya existe un atributo con ese nombre.");
      return;
    }

    setIsCreatingBlock(false);
    setNewBlockLabel("");
    setNewBlockFirstOption("");
    setSelectedKey(newKey);
    showFeedback("success", `Atributo "${labelTrimmed}" creado.`);
  };

  return (
    <div
      data-testid="desktop-attribute-config-view"
      className="w-full h-full flex flex-col overflow-hidden bg-[var(--bg-primary)] pt-[var(--quiral-header-offset,4rem)]"
    >
      {/* Cabecera de la vista de pantalla completa */}
      <div className="shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent/40 active:scale-95 transition-all"
          >
            <ArrowLeft size={16} />
            <span>Regresar al Inventario</span>
          </button>
          <div className="h-5 w-px bg-[var(--border-color)]" />
          <div>
            <h1 className="text-lg font-black text-[var(--text-primary)]">
              Banco Maestro de Atributos y Modularidad
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Configura los atributos y valores desplegables por categoría de productos
            </p>
          </div>
        </div>

        {/* Selector de Pestaña Principal */}
        <div className="flex items-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-1">
          <button
            type="button"
            onClick={() => setTab("attribute-options")}
            className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
              tab === "attribute-options"
                ? "bg-accent text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Valores y Opciones
          </button>
          <button
            type="button"
            onClick={() => setTab("category-order")}
            className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
              tab === "category-order"
                ? "bg-accent text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Atributos por Categoría
          </button>
        </div>
      </div>

      {/* Banner de feedback */}
      {feedbackMsg && (
        <div
          className={`shrink-0 px-6 py-2 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150 ${
            feedbackMsg.type === "success"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-b border-emerald-500/25"
              : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-b border-amber-500/25"
          }`}
        >
          <Check size={14} />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Contenido según la pestaña activa */}
      <div className="flex-1 overflow-hidden p-6 lg:p-8">
        {tab === "attribute-options" ? (
          <div className="h-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Columna Izquierda: Lista de Atributos */}
            <div className="md:col-span-4 flex flex-col h-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                  Atributos ({attributeList.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreatingBlock(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-accent px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-accent-hover transition-all"
                >
                  <Plus size={13} />
                  <span>Nuevo Atributo</span>
                </button>
              </div>

              {isCreatingBlock && (
                <form
                  onSubmit={handleCreateNewBlock}
                  className="mt-3 p-3 rounded-2xl border border-accent/30 bg-accent-subtle space-y-2 animate-in fade-in duration-150"
                >
                  <input
                    type="text"
                    value={newBlockLabel}
                    onChange={(e) => setNewBlockLabel(e.target.value)}
                    placeholder="Ej. Material, Color, etc."
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-accent"
                  />
                  <input
                    type="text"
                    value={newBlockFirstOption}
                    onChange={(e) => setNewBlockFirstOption(e.target.value)}
                    placeholder="Primera opción (opcional)"
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-accent"
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreatingBlock(false)}
                      className="px-2 py-1 text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!newBlockLabel.trim()}
                      className="px-3 py-1 rounded-lg bg-accent text-[11px] font-bold text-white disabled:opacity-50"
                    >
                      Crear
                    </button>
                  </div>
                </form>
              )}

              <div className="flex-1 overflow-y-auto mt-3 space-y-1.5 pr-1">
                {attributeList.map((attr) => {
                  const isActive = attr.key === selectedKey;
                  return (
                    <button
                      key={attr.key}
                      type="button"
                      onClick={() => setSelectedKey(attr.key)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all ${
                        isActive
                          ? "bg-accent text-white shadow-xs font-bold"
                          : "border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent/40"
                      }`}
                    >
                      <span className="text-xs truncate">{attr.label}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full tabular-nums font-bold ${
                          isActive ? "bg-white/20 text-white" : "bg-black/5 dark:bg-white/10"
                        }`}
                      >
                        {attr.options.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Columna Derecha: Opciones y Gestión del Atributo Seleccionado */}
            <div className="md:col-span-8 flex flex-col h-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
                <div>
                  <h2 className="text-base font-black text-[var(--text-primary)]">
                    {activeAttr?.label || "Atributo"}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {activeAttr?.options.length ?? 0} opciones configuradas en el catálogo
                  </p>
                </div>

                <form onSubmit={handleAddOption} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newOptionInput}
                    onChange={(e) => setNewOptionInput(e.target.value)}
                    placeholder="Nueva opción..."
                    className="w-56 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={!newOptionInput.trim()}
                    className="inline-flex items-center gap-1 rounded-xl bg-accent px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-accent-hover transition-all disabled:opacity-50"
                  >
                    <Plus size={14} />
                    <span>Agregar</span>
                  </button>
                </form>
              </div>

              {/* Lista de opciones con controles de reordenamiento */}
              <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1">
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
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingOption(null)}
                            className="rounded-lg border border-[var(--border-color)] px-2 py-1 text-xs text-[var(--text-secondary)]"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="text-xs font-extrabold text-[var(--text-primary)] truncate">
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
                            className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveOption(index, "down")}
                            disabled={index === activeAttr.options.length - 1}
                            title="Bajar opción"
                            className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30"
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(option)}
                            title="Renombrar opción"
                            className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-accent ml-1"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOption(option)}
                            disabled={activeAttr.options.length <= 1}
                            title="Eliminar opción"
                            className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-red-500 disabled:opacity-30"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Pestaña: Atributos por Categoría */
          <div className="h-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 flex flex-col h-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-xs overflow-hidden">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] pb-3 border-b border-[var(--border-color)]">
                Categorías de Catálogo
              </h3>
              <div className="flex-1 overflow-y-auto mt-3 space-y-1.5 pr-1">
                {catalogConfig.categoryOrder.map((cat) => {
                  const isActive = isSameCatalogText(cat, selectedCategory);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left p-3 rounded-2xl text-xs transition-all ${
                        isActive
                          ? "bg-accent text-white font-bold shadow-xs"
                          : "border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent/40"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-8 flex flex-col h-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 shadow-xs overflow-hidden">
              <div className="pb-4 border-b border-[var(--border-color)]">
                <h2 className="text-base font-black text-[var(--text-primary)]">
                  Atributos activos en: {selectedCategory}
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Define el orden en que se solicitan y muestran los atributos para esta categoría
                </p>
              </div>

              <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1">
                {categoryAttrKeys.map((key, idx) => {
                  const attr = catalogConfig.attributes[key];
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums flex h-6 w-6 items-center justify-center rounded-lg bg-black/5 dark:bg-white/10 text-[11px] font-black text-[var(--text-secondary)]">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-black text-[var(--text-primary)]">
                          {attr?.label || key}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveCategoryAttr(idx, idx - 1)}
                          disabled={idx === 0}
                          className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCategoryAttr(idx, idx + 1)}
                          disabled={idx === categoryAttrKeys.length - 1}
                          className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCategoryAttr(key)}
                          disabled={categoryAttrKeys.length <= 1}
                          className="p-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-red-500 disabled:opacity-30 ml-1"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Atributos disponibles para agregar */}
              {attributeList.some((a) => !categoryAttrKeys.includes(a.key)) && (
                <div className="pt-4 border-t border-[var(--border-color)]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                    Agregar otro atributo a esta categoría:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {attributeList
                      .filter((a) => !categoryAttrKeys.includes(a.key))
                      .map((a) => (
                        <button
                          key={a.key}
                          type="button"
                          onClick={() => addCategoryAttr(a.key)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:border-accent hover:text-accent transition-all"
                        >
                          <Plus size={13} />
                          <span>{a.label}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
