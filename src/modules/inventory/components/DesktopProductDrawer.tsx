import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Minus,
  Plus,
  Sliders,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useInventory } from "../../../context/InventoryContext";
import { Product, ProductCategory } from "../../../types/domain";
import {
  inferAttributeKeysForCategory,
  isSameCatalogText,
} from "../../../utils/catalogConfig";
import { formatCOP, parseCOPInput } from "../../../utils/formatters";

interface DesktopProductDrawerProps {
  product: Product | null;
  onClose: () => void;
  onOpenAttributeModal?: (category: ProductCategory) => void;
}

export default function DesktopProductDrawer({
  product,
  onClose,
  onOpenAttributeModal,
}: DesktopProductDrawerProps) {
  const {
    products,
    suppliers,
    getSupplier,
    updateProduct,
    addProduct,
    deleteProduct,
    adjustBatchStock,
    addBatchToProduct,
    catalogConfig,
    addAttributeOption,
    showCosts,
    setShowCosts,
  } = useInventory();

  const [isClosing, setIsClosing] = useState(false);

  // Obtener versión viva del producto desde el contexto
  const liveProduct = products.find((p) => p.id === product?.id) ?? product;

  const [baseName, setBaseName] = useState("");
  const [category, setCategory] = useState<ProductCategory>(
    "Cargadores y Cables"
  );
  const [includeAttributesInName, setIncludeAttributesInName] = useState(false);
  const [dynamicSelections, setDynamicSelections] = useState<
    Record<string, string>
  >({});
  const [priceInput, setPriceInput] = useState("");
  const [warrantyInput, setWarrantyInput] = useState("15");
  const [savedBanner, setSavedBanner] = useState(false);

  // Adición rápida de opción de atributo en el Drawer
  const [addingAttrKey, setAddingAttrKey] = useState<string | null>(null);
  const [newAttrOptionText, setNewAttrOptionText] = useState("");

  // Estado para nuevo lote
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [newBatchSupplierId, setNewBatchSupplierId] = useState(
    suppliers[0]?.id || ""
  );
  const [newBatchCostInput, setNewBatchCostInput] = useState("");
  const [newBatchStockInput, setNewBatchStockInput] = useState("5");

  // Sincronizar estado local al cambiar de producto seleccionado
  useEffect(() => {
    if (!liveProduct) return;
    setBaseName(liveProduct.name);
    setCategory(liveProduct.category);
    setPriceInput(formatCOP(liveProduct.price));
    setWarrantyInput(String(liveProduct.warrantyDays ?? 15));
    setIncludeAttributesInName(false);
    setSavedBanner(false);

    // Extraer posibles valores actuales desde subtitle ("Cubo · iPhone · 20W")
    const subtitleParts = (liveProduct.subtitle || "")
      .split("·")
      .map((s) => s.trim())
      .filter(Boolean);

    const catCfg = catalogConfig.categories.find((c) =>
      isSameCatalogText(c.name, liveProduct.category)
    );
    const attrKeys =
      catCfg?.attributeKeys ??
      inferAttributeKeysForCategory(liveProduct.category);

    const initialMap: Record<string, string> = {};
    attrKeys.forEach((key) => {
      const opts = catalogConfig.attributes[key]?.options ?? [];
      const matched = subtitleParts.find((part) =>
        opts.some((o) => isSameCatalogText(o, part))
      );
      initialMap[key] = matched || "";
    });
    setDynamicSelections(initialMap);
  }, [liveProduct?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleRequestClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (!liveProduct) return null;

  const activeCategoryConfig = catalogConfig.categories.find((c) =>
    isSameCatalogText(c.name, category)
  );
  const activeAttributeKeys =
    activeCategoryConfig?.attributeKeys ??
    inferAttributeKeysForCategory(category);

  const selectedAttrValues = activeAttributeKeys
    .map((k) => dynamicSelections[k]?.trim())
    .filter(Boolean);

  const computedSubtitle =
    selectedAttrValues.length > 0
      ? selectedAttrValues.join(" · ")
      : liveProduct.subtitle || category;

  const computedFinalName =
    includeAttributesInName && selectedAttrValues.length > 0
      ? `${baseName.trim()} ${selectedAttrValues.slice(0, 4).join(" ")}`.trim()
      : baseName.trim();

  const totalStock = liveProduct.batches.reduce((sum, b) => sum + b.stock, 0);
  const totalCost = liveProduct.batches.reduce(
    (sum, b) => sum + b.cost * b.stock,
    0
  );
  const avgCost =
    totalStock > 0
      ? Math.round(totalCost / totalStock)
      : (liveProduct.batches[0]?.cost ?? 0);

  const numericPrice = parseCOPInput(priceInput);
  const unitProfit = numericPrice - avgCost;
  const marginPct = avgCost > 0 ? Math.round((unitProfit / avgCost) * 100) : 0;

  const handleRequestClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 140);
  };

  const handleSave = () => {
    if (!computedFinalName) return;
    const updated: Product = {
      ...liveProduct,
      name: computedFinalName,
      category,
      subtitle: computedSubtitle,
      price: numericPrice > 0 ? numericPrice : liveProduct.price,
      warrantyDays: Math.max(0, parseInt(warrantyInput, 10) || 0),
    };
    updateProduct(updated);
    setBaseName(computedFinalName);
    setIncludeAttributesInName(false);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 1800);
  };

  const handleDuplicate = () => {
    const copy = addProduct({
      name: `${liveProduct.name} (Copia)`,
      category: liveProduct.category,
      subtitle: liveProduct.subtitle,
      price: liveProduct.price,
      warrantyDays: liveProduct.warrantyDays,
      batches: liveProduct.batches.map((b) => ({
        ...b,
        id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      })),
    });
    if (copy) {
      handleRequestClose();
    }
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `¿Eliminar "${liveProduct.name}" del inventario? Esta acción no alterará las ventas históricas.`
      )
    ) {
      deleteProduct(liveProduct.id);
      handleRequestClose();
    }
  };

  const handleAddAttrOption = (attrKey: string) => {
    const clean = newAttrOptionText.trim();
    if (!clean) return;
    const added = addAttributeOption(attrKey, clean);
    if (added) {
      setDynamicSelections((prev) => ({ ...prev, [attrKey]: added }));
    }
    setNewAttrOptionText("");
    setAddingAttrKey(null);
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseCOPInput(newBatchCostInput);
    const stock = Math.max(0, parseInt(newBatchStockInput, 10) || 0);
    const supId = newBatchSupplierId || suppliers[0]?.id || "sup-default";
    addBatchToProduct(liveProduct.id, {
      supplierId: supId,
      cost,
      stock,
    });
    setIsAddingBatch(false);
    setNewBatchCostInput("");
    setNewBatchStockInput("5");
  };

  const handleUpdateBatchCost = (batchId: string, rawCost: string) => {
    const newCost = parseCOPInput(rawCost);
    const updated: Product = {
      ...liveProduct,
      batches: liveProduct.batches.map((b) =>
        b.id === batchId ? { ...b, cost: newCost } : b
      ),
    };
    updateProduct(updated);
  };

  return (
    <div
      data-testid="desktop-product-drawer"
      className={`fixed inset-0 z-50 flex justify-end bg-black/45 dark:bg-black/65 backdrop-blur-[2px] transition-opacity duration-150 ease-out will-change-[opacity] ${
        isClosing ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <aside
        role="dialog"
        aria-label="Inspección y edición avanzada de producto"
        className={`flex h-full w-full max-w-xl flex-col border-l border-[var(--border-color)] bg-[var(--bg-elevated)] shadow-2xl transition-transform duration-150 ease-out will-change-transform ${
          isClosing ? "translate-x-full" : "translate-x-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Drawer */}
        <header className="flex items-center justify-between border-b border-[var(--border-color)] px-5 py-3.5 bg-[var(--bg-elevated)]">
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-accent-subtle px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent">
                Inspector de Referencia
              </span>
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                Esc para cerrar · Ctrl+S guardar
              </span>
            </div>
            <h2 className="mt-1 truncate text-base font-extrabold text-[var(--text-primary)]">
              {liveProduct.name}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowCosts((prev) => !prev)}
              title={
                showCosts
                  ? "Ocultar costos y márgenes"
                  : "Revelar costos y márgenes"
              }
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors duration-150 ${
                showCosts
                  ? "border-accent/40 bg-accent-subtle text-accent"
                  : "border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)]"
              }`}
            >
              {showCosts ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button
              type="button"
              onClick={handleRequestClose}
              aria-label="Cerrar panel lateral"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Cuerpo desplazable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* 1. Nombre Comercial y Switch de Nomenclatura */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Nombre del Artículo / Referencia
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeAttributesInName}
                  onChange={(e) => setIncludeAttributesInName(e.target.checked)}
                  className="h-4 w-4 rounded accent-[var(--accent-primary)]"
                />
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  Incluir subtipo y atributos en el nombre
                </span>
              </label>
            </div>

            <input
              type="text"
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
              placeholder="Ej. Silicona Case iPhone 15 Pro Max"
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2.5 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-accent transition-colors duration-150"
            />

            {includeAttributesInName && selectedAttrValues.length > 0 && (
              <div className="rounded-xl border border-accent/30 bg-accent-subtle px-3 py-2 text-xs">
                <span className="font-semibold text-[var(--text-secondary)]">
                  Vista previa del nombre:{" "}
                </span>
                <strong className="font-extrabold text-accent">
                  {computedFinalName}
                </strong>
              </div>
            )}
          </section>

          {/* 2. Categoría y Atributos Modulares Dinámicos */}
          <section className="space-y-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Categoría y Atributos Modulares
              </label>
              {onOpenAttributeModal && (
                <button
                  type="button"
                  onClick={() => onOpenAttributeModal(category)}
                  className="inline-flex items-center gap-1 rounded-lg border border-accent/30 bg-accent-subtle px-2 py-1 text-[11px] font-bold text-accent hover:bg-accent hover:text-white transition-colors duration-150"
                >
                  <Sliders size={12} />
                  <span>Banco de atributos</span>
                </button>
              )}
            </div>

            <div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                aria-label="Categoría del producto"
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-accent"
              >
                {catalogConfig.categoryOrder.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Bloques de Atributos Dinámicos según la Categoría */}
            {activeAttributeKeys.length > 0 && (
              <div className="space-y-3 pt-1">
                {activeAttributeKeys.map((attrKey) => {
                  const attrDef = catalogConfig.attributes[attrKey];
                  if (!attrDef) return null;
                  const currentVal = dynamicSelections[attrKey] || "";

                  return (
                    <div key={attrKey} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                          {attrDef.label}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setAddingAttrKey(
                              addingAttrKey === attrKey ? null : attrKey
                            )
                          }
                          className="text-[11px] font-bold text-accent hover:underline"
                        >
                          + Añadir opción
                        </button>
                      </div>

                      {addingAttrKey === attrKey && (
                        <div className="flex items-center gap-1.5 pb-1">
                          <input
                            type="text"
                            value={newAttrOptionText}
                            onChange={(e) =>
                              setNewAttrOptionText(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddAttrOption(attrKey);
                              }
                            }}
                            placeholder={`Nuevo valor para ${attrDef.label}...`}
                            className="flex-1 rounded-lg border border-accent bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleAddAttrOption(attrKey)}
                            className="rounded-lg bg-accent px-2.5 py-1 text-xs font-bold text-white"
                          >
                            Guardar
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5">
                        {attrDef.options.map((opt) => {
                          const isSelected = isSameCatalogText(currentVal, opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                setDynamicSelections((prev) => ({
                                  ...prev,
                                  [attrKey]: isSelected ? "" : opt,
                                }))
                              }
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors duration-150 ${
                                isSelected
                                  ? "bg-accent text-white shadow-sm"
                                  : "border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-[var(--text-secondary)]">
              <Tag size={12} className="text-accent shrink-0" />
              <span>Subtítulo modular:</span>
              <strong className="font-bold text-[var(--text-primary)] truncate">
                {computedSubtitle}
              </strong>
            </div>
          </section>

          {/* 3. Precios, Costo, Margen y Garantía */}
          <section className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Precio Sugerido (Venta)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={priceInput}
                onChange={(e) => {
                  const num = parseCOPInput(e.target.value);
                  setPriceInput(num > 0 ? formatCOP(num) : "");
                }}
                className="tabular-nums w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm font-extrabold text-[var(--text-primary)] outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Garantía (Días)
              </label>
              <input
                type="number"
                min={0}
                value={warrantyInput}
                onChange={(e) => setWarrantyInput(e.target.value)}
                className="tabular-nums w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-accent"
              />
            </div>

            <div className="col-span-2 grid grid-cols-3 gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-2.5 text-center">
              <div>
                <span className="block text-[10px] font-semibold uppercase text-[var(--text-secondary)]">
                  Stock Total
                </span>
                <span className="tabular-nums text-sm font-extrabold text-[var(--text-primary)]">
                  {totalStock} uds
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold uppercase text-[var(--text-secondary)]">
                  Costo Promedio
                </span>
                <span className="tabular-nums text-sm font-extrabold text-[var(--text-primary)]">
                  {showCosts ? formatCOP(avgCost) : "••••••"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold uppercase text-[var(--text-secondary)]">
                  Utilidad / Margen
                </span>
                <span className="tabular-nums text-sm font-extrabold text-[#30d158]">
                  {showCosts
                    ? `${unitProfit >= 0 ? "+" : ""}${formatCOP(unitProfit)} (${marginPct}%)`
                    : "••••••"}
                </span>
              </div>
            </div>
          </section>

          {/* 4. Lotes de Inventario por Proveedor */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Lotes y Existencias por Proveedor
              </label>
              <button
                type="button"
                onClick={() => setIsAddingBatch((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-lg border border-accent/30 bg-accent-subtle px-2.5 py-1 text-[11px] font-bold text-accent hover:bg-accent hover:text-white transition-colors duration-150"
              >
                <Plus size={12} />
                <span>Nuevo lote</span>
              </button>
            </div>

            {isAddingBatch && (
              <form
                onSubmit={handleCreateBatch}
                className="rounded-xl border border-accent/40 bg-accent-subtle p-3 space-y-2.5"
              >
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)]">
                      Proveedor
                    </label>
                    <select
                      value={newBatchSupplierId}
                      onChange={(e) => setNewBatchSupplierId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2 py-1.5 text-xs font-semibold text-[var(--text-primary)]"
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)]">
                      Costo Unit.
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={newBatchCostInput}
                      onChange={(e) => {
                        const n = parseCOPInput(e.target.value);
                        setNewBatchCostInput(n > 0 ? formatCOP(n) : "");
                      }}
                      placeholder="$ 0"
                      className="tabular-nums mt-1 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2 py-1.5 text-xs font-bold text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[var(--text-secondary)]">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={newBatchStockInput}
                      onChange={(e) => setNewBatchStockInput(e.target.value)}
                      className="tabular-nums mt-1 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2 py-1.5 text-xs font-bold text-[var(--text-primary)]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingBatch(false)}
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-accent px-3 py-1 text-xs font-bold text-white"
                  >
                    Agregar Lote
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {liveProduct.batches.map((batch, idx) => {
                const sup = getSupplier(batch.supplierId);
                return (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sup?.color ?? "#007aff" }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[var(--text-primary)]">
                          {sup?.name ?? `Lote #${idx + 1}`}
                        </p>
                        {showCosts ? (
                          <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                            <span>Costo:</span>
                            <input
                              type="text"
                              value={formatCOP(batch.cost)}
                              onChange={(e) =>
                                handleUpdateBatchCost(batch.id, e.target.value)
                              }
                              className="tabular-nums w-24 rounded border border-transparent hover:border-[var(--border-color)] focus:border-accent bg-transparent px-1 py-0.5 text-[11px] font-bold text-[var(--text-primary)] outline-none"
                            />
                          </div>
                        ) : (
                          <p className="text-[11px] text-[var(--text-secondary)]">
                            Costo: ••••••
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          adjustBatchStock(liveProduct.id, batch.id, -1)
                        }
                        disabled={batch.stock <= 0}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] disabled:opacity-40"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="tabular-nums w-9 text-center text-xs font-extrabold text-[var(--text-primary)]">
                        {batch.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          adjustBatchStock(liveProduct.id, batch.id, 1)
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 5. Acciones Secundarias y Destructivas */}
          <section className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={handleDuplicate}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] hover:border-accent transition-colors duration-150"
            >
              <Copy size={14} />
              <span>Duplicar referencia</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 rounded-xl border border-transparent bg-red-500/10 px-3 py-2 text-xs font-bold text-red-500 hover:border-red-500/30 transition-colors duration-150"
            >
              <Trash2 size={14} />
              <span>Eliminar producto</span>
            </button>
          </section>
        </div>

        {/* Footer Persistente de Guardado */}
        <footer className="border-t border-[var(--border-color)] bg-[var(--bg-elevated)] px-5 py-3 flex items-center justify-between gap-3">
          {savedBanner ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#30d158]">
              <Check size={16} />
              <span>Cambios guardados en inventario</span>
            </div>
          ) : (
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              Edición sincronizada en tiempo real
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRequestClose}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 text-xs font-bold text-[var(--text-primary)]"
            >
              Cerrar
            </button>
            <button
              type="button"
              data-testid="drawer-save-product-btn"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent hover:bg-accent-hover px-5 py-2 text-xs font-bold text-white shadow-sm transition-colors duration-150"
            >
              <Check size={15} />
              <span>Guardar cambios</span>
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
