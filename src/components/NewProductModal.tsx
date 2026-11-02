import { Check, Plus, Sliders, Sparkles, Tag, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import AttributeConfigModal from "./AttributeConfigModal";
import ModalSheet from "./ModalSheet";
import { useInventory } from "../context/InventoryContext";
import { ProductCategory } from "../types/domain";
import {
  inferAttributeKeysForCategory,
  isSameCatalogText,
  normalizeCatalogText,
} from "../utils/catalogConfig";
import { formatCOP, parseCOPInput } from "../utils/formatters";

interface NewProductModalProps {
  onClose: () => void;
  onStartClose?: () => void;
  onOpenSuppliers: () => void;
}

export default function NewProductModal({
  onClose,
  onStartClose,
  onOpenSuppliers,
}: NewProductModalProps) {
  const {
    suppliers,
    addProduct,
    catalogConfig,
    addCategory,
    updateCategoryAttributes,
    addAttributeOption,
  } = useInventory();

  const [category, setCategory] = useState<ProductCategory>(
    catalogConfig.categoryOrder[0] || "Cargadores y Cables"
  );

  // Listas vivas desde el Banco Maestro de Atributos
  const chargerSubtypes = catalogConfig.attributes.chargerSubtypes?.options ?? [
    "Cubo",
    "Cable",
    "Cargador Completo",
  ];
  const chargerBrands = catalogConfig.attributes.brands?.options ?? [
    "iPhone",
    "1Hora",
    "Anker",
    "Belkin",
    "Tipo C",
  ];
  const chargerPowers = catalogConfig.attributes.powers?.options ?? [
    "20W",
    "25W",
    "30W",
    "35W",
    "45W",
    "60W",
  ];
  const cableFinishes = catalogConfig.attributes.cableFinishes?.options ?? [
    "Normal",
    "Trenzado",
  ];
  const caseMaterials = catalogConfig.attributes.caseMaterials?.options ?? [
    "Silicona Líquida",
    "Transparente Anti-amarilleo",
    "Lujo / MagSafe",
    "Uso Rudo",
  ];
  const caseModels = catalogConfig.attributes.caseModels?.options ?? [
    "iPhone 11",
    "iPhone 12 / 12 Pro",
    "iPhone 12 Pro Max",
    "iPhone 13 / 14",
    "iPhone 13 Pro Max",
    "iPhone 15",
    "iPhone 15 Pro",
    "iPhone 15 Pro Max",
  ];
  const audioModels = catalogConfig.attributes.audioModels?.options ?? [
    "AirPods Serie 4",
    "AirPods Pro 2da Generación",
    "AirPods Pro 3ra Generación",
  ];
  const audioConnections = catalogConfig.attributes.connections?.options ?? [
    "USB-C",
    "Lightning",
    "MagSafe",
  ];

  // Estados para las familias clásicas y atributos sincronizados
  const [chargerSubtype, setChargerSubtype] = useState(chargerSubtypes[0] || "Cubo");
  const [chargerBrand, setChargerBrand] = useState(chargerBrands[0] || "iPhone");
  const [chargerPower, setChargerPower] = useState(chargerPowers[0] || "20W");
  const [cableFinish, setCableFinish] = useState(cableFinishes[0] || "Normal");

  const [caseMaterial, setCaseMaterial] = useState(
    caseMaterials[0] || "Silicona Líquida"
  );
  const [caseModel, setCaseModel] = useState(
    caseModels[3] || caseModels[0] || "iPhone 13 / 14"
  );

  const [audioModel, setAudioModel] = useState(
    audioModels[1] || audioModels[0] || "AirPods Pro 2da Generación"
  );
  const [audioConnection, setAudioConnection] = useState(
    audioConnections[0] || "USB-C"
  );

  // Estado dinámico para atributos de cualquier categoría modular
  const [dynamicSelections, setDynamicSelections] = useState<Record<string, string>>(
    {}
  );

  // Estado para adición en vivo (+) de un nuevo valor en un atributo
  const [addingAttrKey, setAddingAttrKey] = useState<string | null>(null);
  const [newAttrOptionText, setNewAttrOptionText] = useState("");

  // Estado para creación rápida (+) de una nueva categoría al vuelo con secuencia estricta de atributos
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryAttrKeys, setNewCategoryAttrKeys] = useState<string[]>([
    "brands",
    "capacities",
    "ports",
  ]);
  const hasCustomAttrOrderRef = useRef(false);

  // Estado para configurar el orden de atributos de la categoría activa directamente
  const [isConfiguringCategoryAttrs, setIsConfiguringCategoryAttrs] = useState(false);

  // Modal de Banco Maestro de Atributos
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);

  // Campos del formulario comercial y Control de Nomenclatura Dinámica
  const [name, setName] = useState("");
  const [manualBaseName, setManualBaseName] = useState("");
  const [includeAttributesInName, setIncludeAttributesInName] = useState(true);

  const [priceInput, setPriceInput] = useState("");
  const [costInput, setCostInput] = useState("");
  const [stockInput, setStockInput] = useState("1");
  const [warrantyDays, setWarrantyDays] = useState("15");
  const [selectedSupplierId, setSelectedSupplierId] = useState(
    suppliers[0]?.id || ""
  );
  const [error, setError] = useState<string | null>(null);

  const currentCost = parseCOPInput(costInput);
  const currentPrice = parseCOPInput(priceInput);
  const isCostGreaterThanPrice = currentPrice > 0 && currentCost > currentPrice;
  const unitProfit = currentPrice - currentCost;
  const marginPercent =
    currentCost > 0 ? Math.round((unitProfit / currentCost) * 100) : 0;

  // Categoría activa en la configuración modular (respeta el orden exacto de attributeKeys)
  const activeCategoryConfig = catalogConfig.categories.find((c) =>
    isSameCatalogText(c.name, category)
  );
  const activeAttributeKeys =
    activeCategoryConfig?.attributeKeys ?? inferAttributeKeysForCategory(category);

  // Inicializar selecciones por defecto cuando cambian los atributos de una categoría modular
  useEffect(() => {
    setDynamicSelections((prev) => {
      const next = { ...prev };
      for (const key of activeAttributeKeys) {
        const opts = catalogConfig.attributes[key]?.options ?? [];
        if (!next[key] || !opts.includes(next[key])) {
          next[key] = opts[0] || "";
        }
      }
      return next;
    });
  }, [category, activeAttributeKeys, catalogConfig.attributes]);

  // Sugerir automáticamente bloques de atributos al escribir el nombre de una nueva categoría
  // solo si el usuario no ha personalizado manualmente el orden de selección
  useEffect(() => {
    if (newCategoryName.trim().length >= 3 && !hasCustomAttrOrderRef.current) {
      setNewCategoryAttrKeys(inferAttributeKeysForCategory(newCategoryName));
    }
  }, [newCategoryName]);

  // Helper para obtener el valor actualmente seleccionado de cualquier clave de atributo
  const getSelectedValueForAttribute = (attrKey: string): string => {
    if (category === "Cargadores y Cables") {
      if (attrKey === "chargerSubtypes") return chargerSubtype;
      if (attrKey === "brands") return chargerBrand;
      if (attrKey === "powers") return chargerPower;
      if (attrKey === "cableFinishes") return cableFinish;
    }
    if (category === "Forros / Fundas") {
      if (attrKey === "caseMaterials") return caseMaterial;
      if (attrKey === "caseModels") return caseModel;
    }
    if (category === "Audio" || category === "Audio / AirPods") {
      if (attrKey === "audioModels") return audioModel;
      if (attrKey === "connections") return audioConnection;
    }
    const opts = catalogConfig.attributes[attrKey]?.options ?? [];
    return dynamicSelections[attrKey] || opts[0] || "";
  };

  // Helper para actualizar el valor seleccionado de cualquier clave de atributo
  const setSelectedValueForAttribute = (attrKey: string, val: string) => {
    if (attrKey === "chargerSubtypes") setChargerSubtype(val);
    if (attrKey === "brands" && category === "Cargadores y Cables") setChargerBrand(val);
    if (attrKey === "powers" && category === "Cargadores y Cables") setChargerPower(val);
    if (attrKey === "cableFinishes" && category === "Cargadores y Cables")
      setCableFinish(val);
    if (attrKey === "caseMaterials" && category === "Forros / Fundas")
      setCaseMaterial(val);
    if (attrKey === "caseModels" && category === "Forros / Fundas") setCaseModel(val);
    if (
      attrKey === "audioModels" &&
      (category === "Audio" || category === "Audio / AirPods")
    )
      setAudioModel(val);
    if (
      attrKey === "connections" &&
      (category === "Audio" || category === "Audio / AirPods")
    )
      setAudioConnection(val);

    setDynamicSelections((prev) => ({ ...prev, [attrKey]: val }));
  };

  // Construir sufijo/nombre técnico de atributos según la categoría y el orden de activeAttributeKeys
  const buildTechnicalAttributesDescriptor = (): string => {
    if (category === "Cargadores y Cables") {
      if (chargerSubtype === "Cubo") {
        return `Cubo ${chargerBrand} ${chargerPower}`;
      }
      if (chargerSubtype === "Cable") {
        return `Cable ${chargerBrand} (${cableFinish})`;
      }
      if (chargerSubtype === "Cargador Completo") {
        return `Cargador Completo ${chargerBrand} ${chargerPower} (${cableFinish})`;
      }
      return `${chargerSubtype} ${chargerBrand} ${chargerPower}`;
    }
    if (category === "Forros / Fundas") {
      return `Forro ${caseMaterial} (${caseModel})`;
    }
    if (category === "Audio" || category === "Audio / AirPods") {
      return `${audioModel} (${audioConnection})`;
    }
    const selectedValues = activeAttributeKeys
      .map((k) => getSelectedValueForAttribute(k))
      .filter(Boolean);
    if (
      isSameCatalogText(category, "Power Banks / Baterías") ||
      isSameCatalogText(category, "Power Banks / Baterías portatiles")
    ) {
      const capVal = dynamicSelections.capacities || "";
      const portVal = dynamicSelections.ports || "";
      return `Power Bank ${capVal}${portVal ? ` (${portVal})` : ""}`.trim();
    }
    return [category, ...selectedValues].join(" ").trim();
  };

  // Construir cadena compacta de atributos seleccionados para concatenar a un nombre manual
  const buildCompactAttributesSuffix = (): string => {
    const parts: string[] = [];
    for (const key of activeAttributeKeys) {
      if (
        category === "Cargadores y Cables" &&
        key === "powers" &&
        chargerSubtype === "Cable"
      ) {
        continue;
      }
      if (
        category === "Cargadores y Cables" &&
        key === "cableFinishes" &&
        chargerSubtype === "Cubo"
      ) {
        continue;
      }
      const val = getSelectedValueForAttribute(key);
      if (val) parts.push(val);
    }
    return parts.join(" ");
  };

  const resetForm = () => {
    setName("");
    setManualBaseName("");
    setIncludeAttributesInName(true);
    setPriceInput("");
    setCostInput("");
    setStockInput("1");
    setWarrantyDays("15");
    setCategory(catalogConfig.categoryOrder[0] || "Cargadores y Cables");
    setChargerSubtype(chargerSubtypes[0] || "Cubo");
    setChargerBrand(chargerBrands[0] || "iPhone");
    setChargerPower(chargerPowers[0] || "20W");
    setCableFinish(cableFinishes[0] || "Normal");
    setAddingAttrKey(null);
    setNewAttrOptionText("");
    setIsAddingCategory(false);
    setIsConfiguringCategoryAttrs(false);
    hasCustomAttrOrderRef.current = false;
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Sincronizar el nombre comercial cuando está activo el Control de Nomenclatura Dinámica
  useEffect(() => {
    if (!includeAttributesInName) return;

    const generated = buildTechnicalAttributesDescriptor();
    if (!manualBaseName.trim()) {
      setName(generated);
    } else {
      const base = manualBaseName.trim();
      const suffix = buildCompactAttributesSuffix();
      const words = suffix
        .split(/\s+/)
        .filter((w) => w && !base.toLowerCase().includes(w.toLowerCase()));
      setName(words.length > 0 ? `${base} ${words.join(" ")}` : base);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    includeAttributesInName,
    category,
    chargerSubtype,
    chargerBrand,
    chargerPower,
    cableFinish,
    caseMaterial,
    caseModel,
    audioModel,
    audioConnection,
    activeAttributeKeys,
    dynamicSelections,
  ]);

  // Alternar el switch de incluir subtipo/atributos en el nombre
  const handleToggleIncludeAttributesInName = () => {
    const nextState = !includeAttributesInName;
    setIncludeAttributesInName(nextState);

    if (nextState) {
      // Al activarlo, si había un nombre manual escrito, lo concatenamos con los atributos clave
      const base = manualBaseName.trim();
      if (base) {
        const suffix = buildCompactAttributesSuffix();
        const words = suffix
          .split(/\s+/)
          .filter((w) => w && !base.toLowerCase().includes(w.toLowerCase()));
        setName(words.length > 0 ? `${base} ${words.join(" ")}` : base);
      } else {
        setName(buildTechnicalAttributesDescriptor());
      }
    } else {
      // Al desactivarlo, si había un nombre base manual se restaura solo el nombre manual;
      // si era el nombre autogenerado, se deja libre con el prefijo base limpio para edición manual
      if (manualBaseName.trim()) {
        setName(manualBaseName.trim());
      }
    }
  };

  // Asegurar que haya un proveedor seleccionado por defecto
  useEffect(() => {
    if (!selectedSupplierId && suppliers.length > 0) {
      setSelectedSupplierId(suppliers[0].id);
    }
  }, [suppliers, selectedSupplierId]);

  // Guardar nuevo valor (+) en un atributo en vivo
  const handleConfirmInlineAttrOption = (attrKey: string) => {
    const clean = normalizeCatalogText(newAttrOptionText);
    if (!clean) {
      setAddingAttrKey(null);
      return;
    }
    const saved = addAttributeOption(attrKey, clean);
    if (saved) {
      setSelectedValueForAttribute(attrKey, saved);
    }
    setNewAttrOptionText("");
    setAddingAttrKey(null);
  };

  // Crear nueva familia/categoría al vuelo (+) respetando el orden exacto de atributos seleccionados
  const handleCreateQuickCategory = () => {
    const clean = normalizeCatalogText(newCategoryName);
    if (!clean || clean.toLowerCase() === "todos") return;
    const keys =
      newCategoryAttrKeys.length > 0
        ? [...newCategoryAttrKeys]
        : inferAttributeKeysForCategory(clean);
    const created = addCategory(clean, keys);
    if (created) {
      setCategory(created.name);
      setNewCategoryName("");
      setIsAddingCategory(false);
      hasCustomAttrOrderRef.current = false;
    }
  };

  // Seleccionar/deseleccionar atributo en estricto orden de clic (Task 3)
  const toggleNewCategoryAttrKey = (key: string) => {
    hasCustomAttrOrderRef.current = true;
    setNewCategoryAttrKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Alternar atributo en la categoría activa respetando la secuencia exacta de selección
  const toggleActiveCategoryAttrKey = (key: string) => {
    const exists = activeAttributeKeys.includes(key);
    const nextKeys = exists
      ? activeAttributeKeys.length > 1
        ? activeAttributeKeys.filter((k) => k !== key)
        : activeAttributeKeys
      : [...activeAttributeKeys, key];
    updateCategoryAttributes(category, nextKeys);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del producto es obligatorio.");
      return;
    }
    const price = parseCOPInput(priceInput);
    if (price <= 0) {
      setError("Debes indicar un precio de venta válido.");
      return;
    }
    if (!selectedSupplierId) {
      setError("Debes asignar un proveedor obligatorio.");
      return;
    }

    const cost = parseCOPInput(costInput);
    const initialStock = Math.max(0, parseInt(stockInput, 10) || 0);
    const warranty = Math.max(0, parseInt(warrantyDays, 10) || 15);

    let subtitle = "";
    if (category === "Cargadores y Cables") {
      if (chargerSubtype === "Cubo") {
        subtitle = `Cubo · ${chargerBrand}`;
      } else if (chargerSubtype === "Cable") {
        subtitle = `Cable · ${chargerBrand} · ${cableFinish}`;
      } else {
        subtitle = `${chargerSubtype} · ${chargerBrand}`;
      }
    } else if (category === "Forros / Fundas") {
      subtitle = `Forro · ${caseModel}`;
    } else if (category === "Audio" || category === "Audio / AirPods") {
      subtitle = `Audio · ${audioConnection}`;
    } else {
      const vals = activeAttributeKeys
        .map((k) => getSelectedValueForAttribute(k))
        .filter(Boolean);
      subtitle = vals.length > 0 ? vals.join(" · ") : category;
    }

    addProduct({
      name: name.trim(),
      category,
      subtitle,
      price,
      warrantyDays: warranty,
      batches: [
        {
          id: "batch-" + Date.now(),
          supplierId: selectedSupplierId,
          cost,
          stock: initialStock,
        },
      ],
    });

    resetForm();
    onClose();
  };

  // Renderizador reutilizable de botón (+) e input inline para agregar valores a un atributo
  const renderInlineAddOption = (attrKey: string, attrLabel: string) => {
    const isAddingThis = addingAttrKey === attrKey;
    if (isAddingThis) {
      return (
        <div className="inline-flex items-center gap-1 rounded-xl border border-[#007aff] bg-[var(--bg-elevated)] dark:bg-zinc-900 px-2 py-0.5 animate-in fade-in duration-100">
          <input
            type="text"
            value={newAttrOptionText}
            onChange={(e) => setNewAttrOptionText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleConfirmInlineAttrOption(attrKey);
              } else if (e.key === "Escape") {
                setAddingAttrKey(null);
                setNewAttrOptionText("");
              }
            }}
            placeholder={`Nuevo valor para ${attrLabel}`}
            aria-label={`Escribir nuevo valor para ${attrLabel}`}
            autoFocus
            className="w-28 bg-transparent text-xs font-semibold text-[var(--text-primary)] dark:text-zinc-100 placeholder:text-[var(--text-secondary)] dark:placeholder:text-zinc-500 outline-none"
          />
          <button
            type="button"
            onClick={() => handleConfirmInlineAttrOption(attrKey)}
            aria-label={`Guardar nuevo valor de ${attrLabel}`}
            className="flex h-5 w-5 items-center justify-center rounded-md bg-[#30d158] text-white"
          >
            <Check size={12} />
          </button>
          <button
            type="button"
            onClick={() => {
              setAddingAttrKey(null);
              setNewAttrOptionText("");
            }}
            aria-label="Cancelar nuevo valor"
            className="flex h-5 w-5 items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X size={12} />
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => {
          setAddingAttrKey(attrKey);
          setNewAttrOptionText("");
        }}
        aria-label={`Agregar opción a ${attrLabel}`}
        title={`Añadir nuevo valor a ${attrLabel}`}
        className="inline-flex items-center justify-center rounded-xl border border-dashed border-[#007aff]/50 bg-[#007aff]/10 px-2.5 py-1 text-xs font-bold text-[#007aff] dark:text-[#0a84ff] hover:bg-[#007aff]/20 active:scale-95 transition-all"
      >
        +
      </button>
    );
  };

  // Etiqueta visible para cada bloque de atributo (preservando etiquetas clásicas de regresión visual)
  const getDisplayHeadingForAttribute = (attrKey: string, defaultLabel: string): string => {
    if (category === "Cargadores y Cables" && attrKey === "powers") {
      return "Potencia:";
    }
    if (category === "Forros / Fundas" && attrKey === "caseModels") {
      return "Modelos:";
    }
    if (
      (category === "Audio" || category === "Audio / AirPods") &&
      attrKey === "connections"
    ) {
      return "Conexión:";
    }
    return `${defaultLabel}:`;
  };

  // Renderizado dinámico de cualquier bloque de atributo siguiendo el orden exacto de activeAttributeKeys
  const renderAttributeBlock = (attrKey: string) => {
    const attrDef = catalogConfig.attributes[attrKey];
    if (!attrDef) return null;

    // Reglas reactivas de subtipos para Cargadores y Cables
    if (category === "Cargadores y Cables") {
      const hasSubtypeBlock = activeAttributeKeys.includes("chargerSubtypes");
      if (
        hasSubtypeBlock &&
        attrKey === "powers" &&
        chargerSubtype === "Cable"
      ) {
        return null;
      }
      if (
        hasSubtypeBlock &&
        attrKey === "cableFinishes" &&
        chargerSubtype === "Cubo"
      ) {
        return null;
      }
    }

    const selectedVal = getSelectedValueForAttribute(attrKey);
    const headingText = getDisplayHeadingForAttribute(attrKey, attrDef.label);

    return (
      <div key={attrKey} data-attribute-key={attrKey}>
        <p className="mb-1.5 text-[11px] font-medium text-[var(--text-secondary)] dark:text-zinc-400">
          {headingText}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {attrDef.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setSelectedValueForAttribute(attrKey, opt)}
              className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-colors duration-75 ${
                selectedVal === opt
                  ? "bg-[#007aff] text-white font-semibold shadow-sm"
                  : "border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 text-[var(--text-primary)] dark:text-zinc-200"
              }`}
            >
              {opt}
            </button>
          ))}
          {attrKey !== "chargerSubtypes" && renderInlineAddOption(attrKey, attrDef.label)}
        </div>
      </div>
    );
  };

  return (
    <>
      <ModalSheet
        onClose={handleClose}
        onStartClose={onStartClose}
        title="Nuevo producto"
        footer={
          <button
            type="submit"
            form="new-product-form"
            className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#007aff] text-base font-bold text-white shadow-lg transition-transform active:scale-[0.98] hover:opacity-95"
          >
            Guardar producto
          </button>
        }
      >
        <form id="new-product-form" onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="rounded-xl bg-[#ff3b30]/15 p-3 text-xs font-semibold text-[#ff3b30]">
              {error}
            </p>
          )}

          {/* Categoría Selector con botón (+) para crear nuevas familias al vuelo */}
          <div className="mt-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                Categoría
              </span>
              <button
                type="button"
                data-testid="add-new-category-inline-btn"
                onClick={() => {
                  setIsAddingCategory((prev) => !prev);
                  hasCustomAttrOrderRef.current = false;
                }}
                aria-label="Crear nueva categoría"
                className="inline-flex items-center gap-1 rounded-xl border border-[#007aff]/30 bg-[#007aff]/10 px-2.5 py-1 text-xs font-bold text-[#007aff] dark:text-[#0a84ff] active:scale-95 transition-transform"
              >
                <Plus size={13} />
                <span>Nueva familia</span>
              </button>
            </div>

            {/* Panel inline para crear una categoría al vuelo con orden de atributos por secuencia de clic */}
            {isAddingCategory && (
              <div className="rounded-2xl border border-[#007aff]/35 bg-[#007aff]/5 dark:bg-zinc-900 p-3 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    data-testid="new-category-name-input"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateQuickCategory();
                      }
                    }}
                    placeholder="Ej. Relojes, Baterías Portátiles, SSD..."
                    aria-label="Nombre de la nueva familia de productos"
                    className="flex-1 rounded-xl border border-[var(--border-color)] dark:border-zinc-700 bg-[var(--bg-elevated)] dark:bg-zinc-950 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] dark:text-zinc-100 placeholder:text-[var(--text-secondary)] dark:placeholder:text-zinc-500 outline-none focus:border-[#007aff]"
                  />
                  <button
                    type="button"
                    data-testid="confirm-create-category-btn"
                    onClick={handleCreateQuickCategory}
                    disabled={!newCategoryName.trim()}
                    aria-label="Confirmar creación de categoría"
                    className="rounded-xl bg-[#007aff] px-3 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-40"
                  >
                    Crear
                  </button>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                      Atributos técnicos asociados (toca en el orden deseado):
                    </p>
                    {newCategoryAttrKeys.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          hasCustomAttrOrderRef.current = true;
                          setNewCategoryAttrKeys([]);
                        }}
                        aria-label="Reiniciar orden de atributos"
                        className="text-[10px] font-bold text-[#ff3b30] hover:underline"
                      >
                        Reiniciar orden
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.values(catalogConfig.attributes).map((attr) => {
                      const orderIdx = newCategoryAttrKeys.indexOf(attr.key);
                      const selected = orderIdx !== -1;
                      return (
                        <button
                          key={attr.key}
                          type="button"
                          onClick={() => toggleNewCategoryAttrKey(attr.key)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors ${
                            selected
                              ? "bg-[#007aff] text-white shadow-sm"
                              : "border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-950 text-[var(--text-secondary)] dark:text-zinc-400"
                          }`}
                        >
                          {selected && (
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
              </div>
            )}

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {catalogConfig.categoryOrder.map((cat) => {
                const isActive = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-colors duration-75 ${
                      isActive
                        ? "bg-[#007aff] text-white shadow-sm"
                        : "border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)]/70 dark:bg-zinc-900 text-[var(--text-primary)] dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opciones y Especificaciones Dinámicas según el Orden Exacto de Atributos */}
          <div className="rounded-2xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)]/40 dark:bg-zinc-900/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                Especificaciones
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsConfiguringCategoryAttrs((prev) => !prev)}
                  aria-label="Ordenar atributos de esta categoría"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--text-secondary)] dark:text-zinc-300 hover:text-[#007aff] dark:hover:text-[#0a84ff]"
                >
                  <Tag size={11} />
                  <span>Orden de atributos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAttrModalOpen(true)}
                  aria-label="Abrir banco maestro de atributos"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#007aff] dark:text-[#0a84ff] hover:underline"
                >
                  <Sliders size={12} />
                  <span>Editar banco</span>
                </button>
              </div>
            </div>

            {/* Configurador en vivo del orden exacto de atributos para la categoría actual */}
            {isConfiguringCategoryAttrs && (
              <div className="rounded-xl border border-[#007aff]/30 bg-[#007aff]/5 dark:bg-zinc-950 p-2.5 space-y-1.5 animate-in fade-in duration-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                  Secuencia de atributos para «{category}» (toca para ordenar):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.values(catalogConfig.attributes).map((attr) => {
                    const idx = activeAttributeKeys.indexOf(attr.key);
                    const isSelected = idx !== -1;
                    return (
                      <button
                        key={attr.key}
                        type="button"
                        onClick={() => toggleActiveCategoryAttrKey(attr.key)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors ${
                          isSelected
                            ? "bg-[#007aff] text-white shadow-sm"
                            : "border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 text-[var(--text-secondary)] dark:text-zinc-400"
                        }`}
                      >
                        {isSelected && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[10px] font-extrabold">
                            {idx + 1}
                          </span>
                        )}
                        <span>{attr.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Renderizado estricto según el orden de activeAttributeKeys */}
            {activeAttributeKeys.map((attrKey) => renderAttributeBlock(attrKey))}
          </div>

          {/* Nombre comercial del producto + Control de Nomenclatura Dinámica (Task 5) */}
          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                Nombre comercial del producto *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  const val = e.target.value;
                  setName(val);
                  if (!includeAttributesInName) {
                    setManualBaseName(val);
                  }
                }}
                placeholder="Ej. Cubo iPhone 20W"
                className="w-full rounded-xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] dark:text-zinc-100 outline-none focus:border-[#007aff]"
              />
            </div>

            {/* Switch de Control de Nomenclatura Dinámica justo debajo del nombre */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)]/50 dark:bg-zinc-900/70 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles
                  size={15}
                  className={
                    includeAttributesInName
                      ? "text-[#007aff] shrink-0"
                      : "text-[var(--text-secondary)] dark:text-zinc-500 shrink-0"
                  }
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[var(--text-primary)] dark:text-zinc-200">
                    Incluir subtipo y atributos en el nombre
                  </p>
                  <p className="truncate text-[10px] text-[var(--text-secondary)] dark:text-zinc-400">
                    {includeAttributesInName
                      ? `Concatenación activa (${buildCompactAttributesSuffix() || category})`
                      : "Modo manual: solo se mostrará el nombre que escribas"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={includeAttributesInName}
                aria-label="Incluir atributos en el nombre del producto"
                data-testid="auto-append-attributes-toggle"
                onClick={handleToggleIncludeAttributesInName}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-150 ${
                  includeAttributesInName
                    ? "bg-[#30d158]"
                    : "bg-black/20 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-150 ${
                    includeAttributesInName ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Precios (Costo a la izquierda, Venta a la derecha con tabIndex y validación visual) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                Costo de compra
              </label>
              <input
                type="text"
                tabIndex={1}
                value={costInput}
                onChange={(e) => {
                  const num = parseCOPInput(e.target.value);
                  setCostInput(num > 0 ? formatCOP(num) : "");
                }}
                placeholder="$0"
                className={`tabular-nums w-full rounded-xl border bg-[var(--bg-elevated)] dark:bg-zinc-900 px-3 py-2.5 text-sm font-medium outline-none transition-colors ${
                  isCostGreaterThanPrice
                    ? "border-[#ff3b30] text-[#ff3b30] focus:border-[#ff3b30]"
                    : "border-[var(--border-color)] dark:border-zinc-800 text-[var(--text-secondary)] dark:text-zinc-200 focus:border-[#007aff]"
                }`}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                Precio de venta *
              </label>
              <input
                type="text"
                tabIndex={2}
                value={priceInput}
                onChange={(e) => {
                  const num = parseCOPInput(e.target.value);
                  setPriceInput(num > 0 ? formatCOP(num) : "");
                }}
                placeholder="$0"
                className="tabular-nums w-full rounded-xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-3 py-2.5 text-sm font-bold text-[var(--text-primary)] dark:text-zinc-100 outline-none focus:border-[#007aff]"
              />
            </div>
          </div>

          {/* Validación Visual de Margen ($0 <= costo <= precio) */}
          {currentPrice > 0 && currentCost > 0 && (
            <div
              className={`rounded-xl px-3 py-2 text-xs font-semibold flex items-center justify-between ${
                isCostGreaterThanPrice
                  ? "bg-[#ff3b30]/15 text-[#ff3b30] border border-[#ff3b30]/30"
                  : "bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30"
              }`}
            >
              <span>
                {isCostGreaterThanPrice
                  ? "⚠️ El costo supera el precio de venta"
                  : "Margen de ganancia estimado"}
              </span>
              <span className="tabular-nums">
                {isCostGreaterThanPrice
                  ? `Pérdida: -${formatCOP(currentCost - currentPrice)}`
                  : `+${formatCOP(unitProfit)} (${marginPercent}%)`}
              </span>
            </div>
          )}

          {/* Stock inicial y Garantía */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                Stock inicial
              </label>
              <input
                type="number"
                min="0"
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value)}
                placeholder="1"
                className="tabular-nums w-full rounded-xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] dark:text-zinc-100 outline-none focus:border-[#007aff]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                Garantía (días)
              </label>
              <input
                type="number"
                min="0"
                value={warrantyDays}
                onChange={(e) => setWarrantyDays(e.target.value)}
                placeholder="15"
                className="tabular-nums w-full rounded-xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] dark:text-zinc-100 outline-none focus:border-[#007aff]"
              />
            </div>
          </div>

          {/* Proveedor selector */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                Proveedor (Obligatorio) *
              </label>
              <button
                type="button"
                onClick={onOpenSuppliers}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#007aff] dark:text-[#0a84ff] hover:underline"
              >
                <Plus size={13} />
                <span>Gestionar proveedores</span>
              </button>
            </div>

            {suppliers.length === 0 ? (
              <p className="rounded-xl border border-[#ff9500]/40 bg-[#ff9500]/10 p-3 text-xs text-[#ff9500]">
                No hay proveedores registrados. Crea al menos uno para guardar este
                producto.
              </p>
            ) : (
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-3.5 py-2.5 text-sm font-medium text-[var(--text-primary)] dark:text-zinc-100 outline-none focus:border-[#007aff]"
              >
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </form>
      </ModalSheet>

      {isAttrModalOpen && (
        <AttributeConfigModal onClose={() => setIsAttrModalOpen(false)} />
      )}
    </>
  );
}
