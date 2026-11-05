import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bookmark,
  Check,
  Info,
  Minus,
  Plus,
  Sliders,
  Tag,
  X,
  Zap,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useInventory } from "../../../context/InventoryContext";
import {
  CatalogConfig,
  Product,
  ProductCategory,
  Supplier,
} from "../../../types/domain";
import {
  getAttributePresets,
  getEffectiveAttributeOptions,
  inferAttributeKeysForCategory,
  isSameCatalogText,
  normalizeCatalogText,
} from "../../../utils/catalogConfig";
import { formatCOP, parseCOPInput } from "../../../utils/formatters";

export interface DesktopNewProductModalProps {
  onClose: () => void;
  initialCategory?: ProductCategory;
  initialProduct?: Product | null;
  onOpenSuppliers?: () => void;
}

// Estándar de diseño para botones de acción principal, creación y guardado (Design System UI)
const PRIMARY_ACTION_BTN_CLASS =
  "inline-flex items-center gap-1.5 rounded-xl bg-accent hover:bg-accent-hover px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:shadow-accent-glow active:scale-95 transition-all duration-150 cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none shrink-0 tabular-nums";

/**
 * Extrae de forma segura los atributos existentes desde un producto de origen
 */
function extractProductAttributes(
  prod: Product | null | undefined,
  config: CatalogConfig
): Record<string, string> {
  if (!prod) return {};
  const subtitleParts = (prod.subtitle || "")
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);

  const catCfg = config.categories.find((c) =>
    isSameCatalogText(c.name, prod.category)
  );
  const attrKeys =
    catCfg?.attributeKeys ?? inferAttributeKeysForCategory(prod.category);

  const selections: Record<string, string> = {};
  for (const key of attrKeys) {
    const opts = getEffectiveAttributeOptions(config, prod.category, key);
    let matched = subtitleParts.find((part) =>
      opts.some((o) => isSameCatalogText(o, part))
    );
    if (!matched) {
      matched = opts.find((o) =>
        prod.name.toLowerCase().includes(o.toLowerCase())
      );
    }
    if (matched) {
      const canonical = opts.find((o) => isSameCatalogText(o, matched!));
      selections[key] = canonical || matched;
    }
  }
  return selections;
}

/**
 * DesktopNewProductModal — Estación de Trabajo Desktop para Creación Avanzada de Productos
 * Arquitectura Split-Layout (2 Columnas Fijas):
 * - Columna Izquierda: Taxonomía de Catálogo, Selección de Categorías y Atributos Dinámicos (Zero Horizontal Scroll).
 * - Columna Derecha: Panel Fijo de Control, Proveedor, Stock, Precios y Márgenes en Tiempo Real.
 * Desacoplado 100% de componentes móviles táctiles, Glassmorfismo Avanzado y paleta Dual OLED (#000000).
 */
export default function DesktopNewProductModal({
  onClose,
  initialCategory,
  initialProduct,
  onOpenSuppliers,
}: DesktopNewProductModalProps) {
  const {
    suppliers,
    addProduct,
    catalogConfig,
    addCategory,
    createCustomAttribute,
    updateCategoryAttributes,
    addAttributeOption,
    deleteAttributeOption,
    importAttributePresetsToCategory,
    showCosts,
  } = useInventory();

  // 1. Categoría Activa: Inicia con la categoría del producto a clonar o la inicial si está definida
  const [category, setCategory] = useState<ProductCategory | "">(() => {
    if (initialProduct?.category) return initialProduct.category;
    if (initialCategory && initialCategory !== "Todos") return initialCategory;
    return "";
  });

  // 2. Creación rápida inline de nueva categoría
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatNameInput, setNewCatNameInput] = useState("");

  // 3. Creación in-situ de nuevo atributo maestro
  const [isCreatingAttribute, setIsCreatingAttribute] = useState(false);
  const [newAttrLabel, setNewAttrLabel] = useState("");
  const [newAttrFirstOption, setNewAttrFirstOption] = useState("");

  // 4. Atributos dinámicos de la categoría activa
  const activeCategoryConfig = useMemo(() => {
    if (!category) return null;
    return catalogConfig.categories.find((c) =>
      isSameCatalogText(c.name, category)
    );
  }, [catalogConfig.categories, category]);

  const activeAttributeKeys = useMemo(() => {
    if (!category) return [];
    return (
      activeCategoryConfig?.attributeKeys ??
      inferAttributeKeysForCategory(category)
    );
  }, [activeCategoryConfig, category]);

  // Atributos del Banco Global maestro que aún no han sido vinculados a esta categoría
  const unlinkedGlobalAttributes = useMemo(() => {
    if (!category) return [];
    return Object.values(catalogConfig.attributes).filter(
      (attr) => !activeAttributeKeys.includes(attr.key)
    );
  }, [category, catalogConfig.attributes, activeAttributeKeys]);

  // Estado de selecciones dinámicas de atributos: { [attrKey]: string }
  // Precargado con los atributos del producto a clonar si existe
  const [attributeSelections, setAttributeSelections] = useState<
    Record<string, string>
  >(() => extractProductAttributes(initialProduct, catalogConfig));

  // Input inline para añadir una nueva opción a un atributo (+ Nueva Opción)
  const [addingOptionKey, setAddingOptionKey] = useState<string | null>(null);
  const [newOptionValue, setNewOptionValue] = useState("");

  // Estado del Popover de Presets inteligentes activos: attrKey o null
  const [openPresetsAttrKey, setOpenPresetsAttrKey] = useState<string | null>(
    null
  );

  // Sincronizar selecciones dinámicas al cambiar de categoría.
  // IMPORTANTE: Los atributos son 100% opcionales. NO se fuerza selección de opts[0].
  useEffect(() => {
    if (!category) return;
    setAttributeSelections((prev) => {
      const next = { ...prev };
      // Limpiar claves de atributos que ya no pertenezcan a la categoría activa
      for (const key of Object.keys(next)) {
        if (!activeAttributeKeys.includes(key)) {
          delete next[key];
        }
      }
      return next;
    });
  }, [category, activeAttributeKeys]);

  // 5. Nombre y Nomenclatura del Producto
  const [name, setName] = useState<string>(() => {
    if (initialProduct?.name) return `${initialProduct.name} (Copia)`;
    return "";
  });
  const [autoGenerateName, setAutoGenerateName] = useState<boolean>(
    () => !initialProduct
  );

  // 6. Gestión Multi-Lote Inicial (precargado si viene de clonación)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(() => {
    if (initialProduct?.batches && initialProduct.batches[0]?.supplierId) {
      return initialProduct.batches[0].supplierId;
    }
    return suppliers[0]?.id || "";
  });
  const [stockInput, setStockInput] = useState<string>(() => {
    if (initialProduct?.batches && initialProduct.batches.length > 0) {
      const totalStock = initialProduct.batches.reduce(
        (sum, b) => sum + b.stock,
        0
      );
      return String(totalStock);
    }
    return "1";
  });
  const [warrantyDays, setWarrantyDays] = useState<number>(() => {
    if (initialProduct?.warrantyDays !== undefined) {
      return initialProduct.warrantyDays;
    }
    return 15;
  });

  // 7. Precios y Costos Financieros (COP) (precargados si viene de clonación)
  const [costInput, setCostInput] = useState<string>(() => {
    if (
      initialProduct?.batches &&
      initialProduct.batches[0]?.cost !== undefined &&
      initialProduct.batches[0].cost > 0
    ) {
      return formatCOP(initialProduct.batches[0].cost);
    }
    return "";
  });
  const [priceInput, setPriceInput] = useState<string>(() => {
    if (initialProduct?.price && initialProduct.price > 0) {
      return formatCOP(initialProduct.price);
    }
    return "";
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cálculos financieros derivados en tiempo real
  const parsedCost = parseCOPInput(costInput);
  const parsedPrice = parseCOPInput(priceInput);
  const parsedStock = Math.max(0, parseInt(stockInput, 10) || 0);

  const unitProfit = parsedPrice - parsedCost;
  const marginPct =
    parsedCost > 0 ? Math.round((unitProfit / parsedCost) * 100) : 0;
  const isCostHigherThanPrice = parsedPrice > 0 && parsedCost > parsedPrice;
  const totalBatchCost = parsedCost * parsedStock;
  const totalBatchRevenue = parsedPrice * parsedStock;
  const totalBatchProfit = unitProfit * parsedStock;

  // Construir descriptor técnico / subtítulo única y exclusivamente con atributos explícitamente seleccionados
  const technicalSubtitle = useMemo(() => {
    if (!category) return "Sin categoría seleccionada";
    const vals = activeAttributeKeys
      .map((k) => attributeSelections[k])
      .filter((v): v is string => Boolean(v && v.trim()));
    return vals.length > 0 ? vals.join(" · ") : category;
  }, [activeAttributeKeys, attributeSelections, category]);

  // Construir nombre autogenerado única y exclusivamente con atributos explícitamente seleccionados
  const autoGeneratedName = useMemo(() => {
    if (!category) return "";
    const vals = activeAttributeKeys
      .map((k) => attributeSelections[k])
      .filter((v): v is string => Boolean(v && v.trim()));
    if (vals.length === 0) return category;
    return `${category} ${vals.join(" ")}`;
  }, [category, activeAttributeKeys, attributeSelections]);

  // Sincronizar nombre cuando autoGenerateName está activo
  useEffect(() => {
    if (autoGenerateName && autoGeneratedName) {
      setName(autoGeneratedName);
    }
  }, [autoGenerateName, autoGeneratedName]);

  // Mantener proveedor válido
  useEffect(() => {
    if (!selectedSupplierId && suppliers.length > 0) {
      setSelectedSupplierId(suppliers[0].id);
    }
  }, [suppliers, selectedSupplierId]);

  // Manejador para agregar opción inline a un atributo (Scope aislado por categoría)
  const handleConfirmInlineOption = (attrKey: string) => {
    const clean = normalizeCatalogText(newOptionValue);
    if (!clean) {
      setAddingOptionKey(null);
      return;
    }
    const saved = addAttributeOption(attrKey, clean, category || undefined);
    if (saved) {
      setAttributeSelections((prev) => ({ ...prev, [attrKey]: saved }));
    }
    setNewOptionValue("");
    setAddingOptionKey(null);
  };

  // Manejador para eliminar/ocultar opción en la categoría activa sin contaminar el banco global
  const handleDeleteCategoryOption = (attrKey: string, opt: string) => {
    if (!category) return;
    deleteAttributeOption(attrKey, opt, category);
    if (attributeSelections[attrKey] === opt) {
      setAttributeSelections((prev) => {
        const next = { ...prev };
        delete next[attrKey];
        return next;
      });
    }
  };

  // Manejador para desvincular un atributo entero de esta categoría in-situ (×)
  const handleUnlinkAttribute = (attrKeyToRemove: string) => {
    if (!category) return;
    const nextKeys = activeAttributeKeys.filter((k) => k !== attrKeyToRemove);
    updateCategoryAttributes(category, nextKeys);
    setAttributeSelections((prev) => {
      const next = { ...prev };
      delete next[attrKeyToRemove];
      return next;
    });
    if (openPresetsAttrKey === attrKeyToRemove) {
      setOpenPresetsAttrKey(null);
    }
  };

  // Manejador para crear nueva categoría in-situ
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeCatalogText(newCatNameInput);
    if (!clean || clean.toLowerCase() === "todos") return;

    const keys = inferAttributeKeysForCategory(clean);
    const created = addCategory(clean, keys);
    if (created) {
      setCategory(created.name);
      setNewCatNameInput("");
      setIsAddingCategory(false);
    }
  };

  // Manejador para crear un nuevo atributo maestro in-situ
  const handleCreateAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = normalizeCatalogText(newAttrLabel);
    if (!cleanLabel || !category) return;

    const cleanOption = normalizeCatalogText(newAttrFirstOption);
    const newKey = createCustomAttribute(
      cleanLabel,
      cleanOption ? [cleanOption] : []
    );

    if (newKey) {
      const currentKeys = activeAttributeKeys;
      if (!currentKeys.includes(newKey)) {
        updateCategoryAttributes(category, [...currentKeys, newKey]);
      }
      if (cleanOption) {
        setAttributeSelections((prev) => ({ ...prev, [newKey]: cleanOption }));
      }
      setIsCreatingAttribute(false);
      setNewAttrLabel("");
      setNewAttrFirstOption("");
    }
  };

  // Manejador para reordenar la prioridad de los atributos in-situ
  const handleMoveAttribute = (index: number, direction: -1 | 1) => {
    if (!category) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= activeAttributeKeys.length) return;

    const nextKeys = [...activeAttributeKeys];
    const [removed] = nextKeys.splice(index, 1);
    nextKeys.splice(targetIndex, 0, removed);
    updateCategoryAttributes(category, nextKeys);
  };

  // Envío final del producto
  const submitProduct = () => {
    setErrorMessage(null);

    if (!category) {
      setErrorMessage(
        "Debes seleccionar una categoría de catálogo para el producto."
      );
      return;
    }

    const finalName = name.trim();
    if (!finalName) {
      setErrorMessage("El nombre o referencia del producto es obligatorio.");
      return;
    }

    if (parsedPrice <= 0) {
      setErrorMessage("Debes ingresar un precio de venta sugerido mayor a $0.");
      return;
    }

    if (!selectedSupplierId) {
      setErrorMessage("Debes asignar un proveedor obligatorio para el lote.");
      return;
    }

    addProduct({
      name: finalName,
      category,
      subtitle: technicalSubtitle,
      price: parsedPrice,
      warrantyDays,
      batches: [
        {
          id: "batch-" + Date.now(),
          supplierId: selectedSupplierId,
          cost: parsedCost,
          stock: parsedStock,
        },
      ],
    });

    onClose();
  };

  // Atajo de teclado: Escape para cerrar, Ctrl+Enter para guardar
  const submitProductRef = useRef(submitProduct);
  submitProductRef.current = submitProduct;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        submitProductRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="region"
      aria-label="Nuevo Producto — Estación de Trabajo Desktop"
      data-testid="desktop-new-product-modal"
      className="w-full h-full flex flex-col overflow-hidden bg-[var(--bg-primary)] pt-[var(--quiral-header-offset,4rem)] antialiased-hd"
    >
      {/* 1. Cabecera Fija de la Estación de Trabajo con Glassmorfismo Avanzado */}
      <div className="shrink-0 border-b border-white/10 bg-black/60 backdrop-blur-md px-6 py-4 flex items-center justify-between select-none shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-white hover:border-white/20 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Regresar al Inventario</span>
            <kbd className="rounded border border-white/10 bg-black/40 px-1 py-0.5 text-[10px] text-[var(--text-secondary)]">
              Esc
            </kbd>
          </button>
          <div className="h-5 w-px bg-white/10" />
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="desktop-new-product-title"
                className="text-lg font-black text-white"
              >
                {initialProduct ? "Clonar Producto" : "Nuevo Producto"}
              </h2>
              <span className="rounded-md bg-accent/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-accent border border-accent/30">
                {initialProduct ? "Plantilla Clonada" : "Estación Desktop"}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {initialProduct
                ? `Plantilla precargada desde «${initialProduct.name}». Ajusta cualquier campo antes de registrar.`
                : "Registro integral con taxonomía modular, multi-lote y análisis financiero en tiempo real"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {category && (
            <span className="hidden sm:inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-accent tabular-nums">
              {technicalSubtitle}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de creación"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[var(--text-secondary)] hover:text-white hover:border-white/20 active:scale-95 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 2. Cuerpo en Formato Split-Layout (2 Columnas Fijas con Glassmorfismo) */}
      <div className="flex-1 min-h-0 overflow-hidden max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA (7 cols): Taxonomía y Atributos Dinámicos (CERO SCROLL HORIZONTAL) */}
        <div className="md:col-span-7 flex flex-col min-h-0 overflow-y-auto custom-scrollbar rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 space-y-6 shadow-2xl">
          {/* SECCIÓN A: Categoría de Producto y Creación Rápida */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Tag size={13} className="text-accent" />
                <span>1. Categoría de Catálogo</span>
              </label>

              {!isAddingCategory ? (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-accent/15 border border-accent/30 px-2.5 py-1 text-[11px] font-bold text-accent hover:bg-accent hover:text-white transition-all cursor-pointer"
                >
                  <Plus size={12} strokeWidth={2.5} />
                  <span>Nueva Categoría</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="text-[11px] font-bold text-[var(--text-secondary)] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>

            {/* Formulario Inline para Crear Nueva Categoría */}
            {isAddingCategory && (
              <form
                onSubmit={handleCreateCategory}
                className="flex items-center gap-2 p-3 rounded-2xl border border-accent/40 bg-accent-subtle animate-in fade-in duration-150"
              >
                <input
                  type="text"
                  autoFocus
                  value={newCatNameInput}
                  onChange={(e) => setNewCatNameInput(e.target.value)}
                  placeholder="Nombre de la nueva categoría..."
                  className="flex-1 rounded-xl border border-accent bg-black/40 px-3 py-1.5 text-xs font-bold text-white outline-none"
                />
                <button
                  type="submit"
                  disabled={!newCatNameInput.trim()}
                  className={PRIMARY_ACTION_BTN_CLASS}
                >
                  Crear
                </button>
              </form>
            )}

            {/* Selector de Categorías en Grilla Fluida / Flex-Wrap (CERO SCROLL HORIZONTAL) */}
            <div className="flex flex-wrap items-center gap-2">
              {catalogConfig.categoryOrder.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                    }}
                    className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-150 select-none cursor-pointer ${
                      isSelected
                        ? "bg-accent text-white shadow-accent-glow border border-accent"
                        : "border border-white/10 bg-white/5 text-[var(--text-secondary)] hover:text-white hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN B: Banco de Atributos Dinámicos de la Categoría */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Sliders size={13} className="text-accent" />
                <span>
                  2. Atributos Dinámicos {category ? `de ${category}` : ""}
                </span>
              </label>

              {category && !isCreatingAttribute && (
                <button
                  type="button"
                  onClick={() => setIsCreatingAttribute(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-accent/15 border border-accent/30 px-2.5 py-1 text-[11px] font-bold text-accent hover:bg-accent hover:text-white transition-all cursor-pointer"
                >
                  <Plus size={12} strokeWidth={2.5} />
                  <span>Nuevo Atributo</span>
                </button>
              )}
            </div>

            {/* Formulario Inline para Crear Nuevo Atributo Maestro */}
            {isCreatingAttribute && category && (
              <form
                onSubmit={handleCreateAttribute}
                className="p-3.5 rounded-2xl border border-accent/30 bg-accent-subtle space-y-2.5 animate-in fade-in duration-150"
              >
                <div className="text-[11px] font-bold text-accent uppercase tracking-wider">
                  Nuevo Atributo Maestro para «{category}»:
                </div>
                <input
                  type="text"
                  autoFocus
                  value={newAttrLabel}
                  onChange={(e) => setNewAttrLabel(e.target.value)}
                  placeholder="Nombre del atributo (ej. Conexión, Material, Potencia...)"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-accent"
                />
                <input
                  type="text"
                  value={newAttrFirstOption}
                  onChange={(e) => setNewAttrFirstOption(e.target.value)}
                  placeholder="Primera opción / valor (ej. USB-C, MagSafe...)"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white outline-none focus:border-accent"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingAttribute(false);
                      setNewAttrLabel("");
                      setNewAttrFirstOption("");
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold text-[var(--text-secondary)] hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!newAttrLabel.trim()}
                    className={PRIMARY_ACTION_BTN_CLASS}
                  >
                    <Plus size={13} strokeWidth={2.5} />
                    <span>Crear y Vincular</span>
                  </button>
                </div>
              </form>
            )}

            {!category ? (
              /* Estado Inicial en Blanco: Despliegue Progresivo */
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-center space-y-2">
                <Tag
                  size={24}
                  className="text-[var(--text-secondary)] opacity-40 mb-1"
                />
                <p className="text-xs font-bold text-white">
                  Selecciona una categoría de catálogo
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] max-w-xs">
                  Elige una categoría arriba para desplegar sus atributos
                  dinámicos y configurar la taxonomía del producto.
                </p>
              </div>
            ) : activeAttributeKeys.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-white/10 text-center text-xs text-[var(--text-secondary)]">
                Esta categoría no tiene atributos dinámicos configurados. Puedes
                crear uno con el botón superior.
              </div>
            ) : (
              <div className="space-y-3.5">
                {activeAttributeKeys.map((attrKey, idx) => {
                  const attrConfig = catalogConfig.attributes[attrKey];
                  const label = attrConfig?.label || attrKey;
                  const options = getEffectiveAttributeOptions(
                    catalogConfig,
                    category,
                    attrKey
                  );
                  const currentSelected = attributeSelections[attrKey] || "";
                  const isAddingThis = addingOptionKey === attrKey;

                  return (
                    <div
                      key={attrKey}
                      data-testid={`active-attribute-card-${attrKey}`}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              currentSelected ? "bg-accent" : "bg-white/30"
                            }`}
                          />
                          <span>{label}</span>
                          {currentSelected ? (
                            <span className="text-[10px] text-accent font-semibold ml-1">
                              ({currentSelected})
                            </span>
                          ) : (
                            <span className="text-[10px] text-[var(--text-secondary)] italic ml-1">
                              (Opcional)
                            </span>
                          )}
                        </span>

                        <div className="flex items-center gap-1">
                          {currentSelected && (
                            <button
                              type="button"
                              onClick={() =>
                                setAttributeSelections((prev) => ({
                                  ...prev,
                                  [attrKey]: "",
                                }))
                              }
                              title={`Desmarcar selección de ${label}`}
                              data-testid={`clear-selection-${attrKey}`}
                              className="text-[10px] text-[var(--text-secondary)] hover:text-white hover:underline cursor-pointer px-1 mr-1"
                            >
                              Desmarcar
                            </button>
                          )}
                          {/* Reordenar prioridad in-situ */}
                          <button
                            type="button"
                            onClick={() => handleMoveAttribute(idx, -1)}
                            disabled={idx === 0}
                            title="Subir prioridad del atributo"
                            className="p-1 rounded-lg border border-white/10 text-[var(--text-secondary)] hover:text-white hover:border-white/20 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveAttribute(idx, 1)}
                            disabled={idx === activeAttributeKeys.length - 1}
                            title="Bajar prioridad del atributo"
                            className="p-1 rounded-lg border border-white/10 text-[var(--text-secondary)] hover:text-white hover:border-white/20 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown size={12} />
                          </button>

                          {/* Desvincular atributo de esta categoría in-situ (×) */}
                          <button
                            type="button"
                            onClick={() => handleUnlinkAttribute(attrKey)}
                            title={`Desvincular "${label}" de «${category}»`}
                            aria-label={`Desvincular atributo ${label}`}
                            data-testid={`unlink-attr-${attrKey}`}
                            className="p-1 rounded-lg border border-white/10 text-[var(--text-secondary)] hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/10 cursor-pointer transition-all"
                          >
                            <X size={12} strokeWidth={2.5} />
                          </button>

                          {/* Botón Popover Presets Inteligentes */}
                          {(() => {
                            const masterPresets = getAttributePresets(
                              catalogConfig,
                              attrKey
                            );
                            const availablePresets = masterPresets.filter(
                              (p) =>
                                !options.some((o) => isSameCatalogText(o, p))
                            );
                            const isPresetsOpen =
                              openPresetsAttrKey === attrKey;
                            return (
                              <button
                                type="button"
                                data-testid={`toggle-presets-btn-${attrKey}`}
                                onClick={() =>
                                  setOpenPresetsAttrKey((prev) =>
                                    prev === attrKey ? null : attrKey
                                  )
                                }
                                className={`ml-1 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer select-none ${
                                  isPresetsOpen
                                    ? "border-accent bg-accent text-white shadow-2xs"
                                    : "border-white/10 bg-white/5 text-accent hover:bg-white/10 hover:border-accent/40"
                                }`}
                                title="Ver Presets Históricos disponibles para este atributo"
                              >
                                <Bookmark
                                  size={11}
                                  className={
                                    isPresetsOpen ? "text-white" : "text-accent"
                                  }
                                />
                                <span>Presets ({availablePresets.length})</span>
                              </button>
                            );
                          })()}

                          {!isAddingThis ? (
                            <button
                              type="button"
                              onClick={() => {
                                setAddingOptionKey(attrKey);
                                setNewOptionValue("");
                              }}
                              className="ml-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-accent hover:underline cursor-pointer"
                            >
                              <Plus size={11} />
                              <span>Nueva opción</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAddingOptionKey(null)}
                              className="ml-1 text-[10px] font-bold text-[var(--text-secondary)] hover:text-white cursor-pointer"
                            >
                              Cerrar
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Popover Inteligente de Presets Históricos */}
                      {openPresetsAttrKey === attrKey &&
                        (() => {
                          const masterPresets = getAttributePresets(
                            catalogConfig,
                            attrKey
                          );
                          const availablePresets = masterPresets.filter(
                            (p) => !options.some((o) => isSameCatalogText(o, p))
                          );
                          return (
                            <div
                              data-testid={`presets-popover-${attrKey}`}
                              className="rounded-2xl border border-accent/40 bg-black/90 backdrop-blur-md p-3.5 space-y-2.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                            >
                              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <div className="flex items-center gap-1.5">
                                  <Bookmark size={13} className="text-accent" />
                                  <span className="text-xs font-black text-white">
                                    Presets Históricos: {label}
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
                                          category,
                                          attrKey,
                                          availablePresets
                                        );
                                        if (availablePresets[0]) {
                                          setAttributeSelections((prev) => ({
                                            ...prev,
                                            [attrKey]: availablePresets[0],
                                          }));
                                        }
                                        setOpenPresetsAttrKey(null);
                                      }}
                                      className="text-[10px] font-bold text-accent hover:underline cursor-pointer"
                                    >
                                      + Añadir todos
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setOpenPresetsAttrKey(null)}
                                    className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 cursor-pointer"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>

                              {availablePresets.length === 0 ? (
                                <p className="text-[11px] text-[var(--text-secondary)] py-1 italic">
                                  Todos los presets históricos ya han sido
                                  incorporados a esta categoría.
                                </p>
                              ) : (
                                <div className="flex flex-wrap items-center gap-1.5 max-h-40 overflow-y-auto custom-scrollbar p-0.5">
                                  {availablePresets.map((preset) => (
                                    <button
                                      key={preset}
                                      type="button"
                                      data-testid={`pick-preset-${preset.replace(/\s+/g, "_")}`}
                                      onClick={() => {
                                        addAttributeOption(
                                          attrKey,
                                          preset,
                                          category
                                        );
                                        setAttributeSelections((prev) => ({
                                          ...prev,
                                          [attrKey]: preset,
                                        }));
                                      }}
                                      className="inline-flex items-center gap-1 rounded-lg border border-dashed border-white/20 bg-white/5 hover:border-accent hover:bg-accent/20 hover:text-white px-2.5 py-1 text-[11px] font-semibold text-white/80 transition-all cursor-pointer select-none active:scale-95"
                                    >
                                      <Plus size={11} className="text-accent" />
                                      <span>{preset}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                      {/* Estado Vacío de Opciones en esta Categoría */}
                      {options.length === 0 &&
                        openPresetsAttrKey !== attrKey && (
                          <div className="py-2 px-3 rounded-xl border border-dashed border-white/10 bg-white/[0.015] flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                            <span>Sin valores asignados a esta categoría.</span>
                            <button
                              type="button"
                              onClick={() => setOpenPresetsAttrKey(attrKey)}
                              className="inline-flex items-center gap-1 text-accent font-bold hover:underline cursor-pointer"
                            >
                              <Bookmark size={11} />
                              <span>Abrir Presets</span>
                            </button>
                          </div>
                        )}

                      {/* Input inline para agregar nueva opción */}
                      {isAddingThis && (
                        <div className="flex items-center gap-1.5 py-1">
                          <input
                            type="text"
                            autoFocus
                            value={newOptionValue}
                            onChange={(e) => setNewOptionValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleConfirmInlineOption(attrKey);
                              }
                            }}
                            placeholder={`Nuevo valor para ${label}...`}
                            className="flex-1 rounded-xl border border-accent bg-black/40 px-2.5 py-1 text-xs font-semibold text-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleConfirmInlineOption(attrKey)}
                            disabled={!newOptionValue.trim()}
                            className={PRIMARY_ACTION_BTN_CLASS}
                          >
                            Guardar
                          </button>
                        </div>
                      )}

                      {/* Lista de Opciones en Flex-Wrap Fluido (CERO SCROLL HORIZONTAL) */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {options.map((opt) => {
                          const isOptSelected = currentSelected === opt;
                          return (
                            <span
                              key={opt}
                              data-testid={`active-option-pill-${opt.replace(/\s+/g, "_")}`}
                              className={`inline-flex items-center rounded-lg text-[11px] transition-all duration-150 select-none ${
                                isOptSelected
                                  ? "bg-accent text-white font-bold shadow-2xs border border-accent"
                                  : "border border-white/10 bg-white/5 text-[var(--text-secondary)] hover:text-white hover:border-white/20"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setAttributeSelections((prev) => ({
                                    ...prev,
                                    [attrKey]: prev[attrKey] === opt ? "" : opt,
                                  }));
                                }}
                                className="px-2.5 py-1 cursor-pointer"
                              >
                                {opt}
                              </button>
                              <button
                                type="button"
                                title={`Quitar "${opt}" de «${category}»`}
                                aria-label={`Quitar opción ${opt}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCategoryOption(attrKey, opt);
                                }}
                                className="pr-1.5 pl-0.5 py-1 text-white/50 hover:text-red-400 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <X size={11} strokeWidth={2.5} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bloque Dinámico Auto-Reductible: Atributos Disponibles en el Banco Global */}
            {category && unlinkedGlobalAttributes.length > 0 && (
              <div
                data-testid="unlinked-global-attributes-block"
                className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-3.5 space-y-2.5 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Plus size={12} className="text-accent" />
                    <span>
                      Atributos disponibles en el Banco Global (
                      {unlinkedGlobalAttributes.length}):
                    </span>
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    Clic para incorporar al producto
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {unlinkedGlobalAttributes.map((attr) => (
                    <button
                      key={attr.key}
                      type="button"
                      data-testid={`link-global-attr-${attr.key}`}
                      onClick={() => {
                        updateCategoryAttributes(category, [
                          ...activeAttributeKeys,
                          attr.key,
                        ]);
                        const defaultOpts = getEffectiveAttributeOptions(
                          catalogConfig,
                          category,
                          attr.key
                        );
                        if (defaultOpts[0]) {
                          setAttributeSelections((prev) => ({
                            ...prev,
                            [attr.key]: defaultOpts[0],
                          }));
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-dashed border-white/20 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:border-accent hover:text-white hover:bg-accent/10 active:scale-95 transition-all cursor-pointer select-none"
                    >
                      <Plus size={11} className="text-accent" />
                      <span>{attr.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA (5 cols): Panel Fijo de Control y Datos Críticos */}
        <div className="md:col-span-5 flex flex-col min-h-0 overflow-y-auto custom-scrollbar rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 space-y-5 justify-between shadow-2xl">
          <div className="space-y-5">
            {/* SECCIÓN C: Nombre Comercial y Switch de Autogeneración (Zap Icon) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                  3. Nombre / Referencia Comercial
                </label>

                <button
                  type="button"
                  onClick={() => {
                    const nextState = !autoGenerateName;
                    setAutoGenerateName(nextState);
                    if (nextState) {
                      setName(autoGeneratedName);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                    autoGenerateName
                      ? "border-accent/40 bg-accent-subtle text-accent"
                      : "border-white/10 bg-white/5 text-[var(--text-secondary)]"
                  }`}
                >
                  <Zap
                    size={12}
                    className={autoGenerateName ? "fill-accent/20" : ""}
                  />
                  <span>{autoGenerateName ? "Autogenerado" : "Manual"}</span>
                </button>
              </div>

              <input
                type="text"
                data-testid="desktop-new-product-name-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (autoGenerateName) setAutoGenerateName(false);
                }}
                placeholder="Ej. Cubo iPhone 20W USB-C..."
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm font-bold text-white outline-none focus:border-accent transition-colors"
              />
            </div>

            {/* SECCIÓN D: Proveedor del Lote Inicial */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                  4. Proveedor del Lote Inicial
                </label>
                {onOpenSuppliers && (
                  <button
                    type="button"
                    onClick={onOpenSuppliers}
                    className="text-[11px] font-bold text-accent hover:underline cursor-pointer"
                  >
                    Gestionar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                {suppliers.map((sup) => {
                  const isSelected = selectedSupplierId === sup.id;
                  return (
                    <button
                      key={sup.id}
                      type="button"
                      onClick={() => setSelectedSupplierId(sup.id)}
                      className={`flex items-center gap-2 rounded-xl border p-2 text-left text-xs transition-all cursor-pointer ${
                        isSelected
                          ? "border-accent bg-accent/15 text-white font-bold shadow-2xs"
                          : "border-white/10 bg-white/5 text-[var(--text-secondary)] hover:text-white hover:border-white/20"
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: sup.color }}
                      />
                      <span className="truncate flex-1">{sup.name}</span>
                      {isSelected && (
                        <Check size={13} className="text-accent shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN E: Stock Inicial y Garantía (Ergonomía onWheel y Direct Input) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Stock Inicial con Rueda del Mouse (onWheel) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                  Stock Inicial
                </label>
                <div className="flex items-center rounded-2xl border border-white/10 bg-black/40 p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setStockInput(String(Math.max(0, parsedStock - 1)))
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-[var(--text-secondary)] hover:text-white active:scale-95 transition-all cursor-pointer"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    data-testid="desktop-new-product-stock-input"
                    value={stockInput}
                    onChange={(e) =>
                      setStockInput(e.target.value.replace(/\D/g, ""))
                    }
                    onWheel={(e) => {
                      e.currentTarget.blur();
                      const delta = e.deltaY < 0 ? 1 : -1;
                      setStockInput((prev) =>
                        String(Math.max(0, (parseInt(prev, 10) || 0) + delta))
                      );
                    }}
                    className="tabular-nums min-w-0 flex-1 bg-transparent text-center text-sm font-black text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setStockInput(String(parsedStock + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-[var(--text-secondary)] hover:text-white active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Garantía Numérica Editable (Días) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                  Garantía (días)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    data-testid="desktop-new-product-warranty-input"
                    value={warrantyDays === 0 ? "" : String(warrantyDays)}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "");
                      setWarrantyDays(clean === "" ? 0 : parseInt(clean, 10));
                    }}
                    onWheel={(e) => {
                      e.currentTarget.blur();
                      const delta = e.deltaY < 0 ? 5 : -5;
                      setWarrantyDays((prev) => Math.max(0, prev + delta));
                    }}
                    placeholder="15"
                    className="tabular-nums w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold text-white outline-none focus:border-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--text-secondary)] select-none">
                    días
                  </span>
                </div>
                {/* Atajos Rápidos de Garantía */}
                <div className="flex items-center gap-1 pt-1 flex-wrap">
                  {[15, 30, 60, 90, 180].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setWarrantyDays(d)}
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        warrantyDays === d
                          ? "bg-accent text-white"
                          : "border border-white/10 bg-white/5 text-[var(--text-secondary)] hover:text-white"
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SECCIÓN F: Costos, Precios y Tarjeta de Análisis Financiero */}
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Costo Unitario */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)]">
                    Costo Compra
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-[var(--text-secondary)] select-none">
                      $
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      data-testid="desktop-new-product-cost-input"
                      value={costInput}
                      onChange={(e) => setCostInput(e.target.value)}
                      placeholder="0"
                      className="tabular-nums w-full rounded-xl border border-white/10 bg-black/40 pl-7 pr-3 py-2 text-xs font-black text-white outline-none focus:border-accent"
                    />
                  </div>
                </div>

                {/* Precio Venta */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-accent">
                    Precio Público
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-accent select-none">
                      $
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      data-testid="desktop-new-product-price-input"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      placeholder="0"
                      className="tabular-nums w-full rounded-xl border border-white/10 bg-black/40 pl-7 pr-3 py-2 text-xs font-black text-white outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Tarjeta de Métricas de Margen en Tiempo Real */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                <div className="p-2 rounded-xl bg-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Utilidad Unitaria
                  </p>
                  <p
                    className={`tabular-nums text-xs font-black mt-0.5 truncate ${
                      unitProfit >= 0 ? "text-[#30d158]" : "text-[#ff453a]"
                    }`}
                  >
                    {unitProfit >= 0
                      ? `+${formatCOP(unitProfit)}`
                      : formatCOP(unitProfit)}
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Margen (%)
                  </p>
                  <p
                    className={`tabular-nums text-xs font-black mt-0.5 truncate ${
                      marginPct >= 0 ? "text-[#30d158]" : "text-[#ff453a]"
                    }`}
                  >
                    {marginPct >= 0 ? `+${marginPct}%` : `${marginPct}%`}
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Inversión Lote
                  </p>
                  <p className="tabular-nums text-xs font-black text-amber-500 mt-0.5 truncate">
                    {formatCOP(totalBatchCost)}
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Ingreso Lote
                  </p>
                  <p className="tabular-nums text-xs font-black text-accent mt-0.5 truncate">
                    {formatCOP(totalBatchRevenue)}
                  </p>
                </div>
              </div>

              {isCostHigherThanPrice && (
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-500/10 text-amber-500 text-[10px] font-bold">
                  <AlertTriangle size={12} className="shrink-0" />
                  <span>El costo ingresado supera el precio de venta.</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Panel Inferior Fijo de Acciones */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            {errorMessage && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-xs font-bold text-red-400 animate-in fade-in duration-150">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                <kbd className="rounded border border-white/10 bg-black/40 px-1.5 py-0.5 text-[10px] font-bold">
                  Ctrl+Enter
                </kbd>{" "}
                guardar
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-white hover:border-white/20 active:scale-95 transition-all cursor-pointer"
                >
                  Cancelar (Esc)
                </button>

                <button
                  type="button"
                  data-testid="desktop-new-product-submit-btn"
                  onClick={submitProduct}
                  className={`${PRIMARY_ACTION_BTN_CLASS} px-5 py-2.5 text-xs`}
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>
                    {initialProduct
                      ? "Guardar Copia / Clonar"
                      : "Crear Producto"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
