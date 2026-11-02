import { Check, Plus, Sliders, X } from "lucide-react";
import React, { useEffect, useState } from "react";
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
    addAttributeOption,
  } = useInventory();

  const [category, setCategory] = useState<ProductCategory>("Cargadores y Cables");

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

  // Estados para las 3 familias clásicas (preservando compatibilidad determinista)
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

  // Estado dinámico para atributos de cualquier categoría modular (Power Banks, Relojes, SSD, etc.)
  const [dynamicSelections, setDynamicSelections] = useState<Record<string, string>>(
    {}
  );

  // Estado para adición en vivo (+) de un nuevo valor en un atributo
  const [addingAttrKey, setAddingAttrKey] = useState<string | null>(null);
  const [newAttrOptionText, setNewAttrOptionText] = useState("");

  // Estado para creación rápida (+) de una nueva categoría al vuelo
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryAttrKeys, setNewCategoryAttrKeys] = useState<string[]>([
    "brands",
    "capacities",
    "ports",
  ]);

  // Modal de Banco Maestro de Atributos
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);

  // Campos del formulario comercial
  const [name, setName] = useState("");
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

  // Categoría activa en la configuración modular
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
  useEffect(() => {
    if (newCategoryName.trim().length >= 3) {
      setNewCategoryAttrKeys(inferAttributeKeysForCategory(newCategoryName));
    }
  }, [newCategoryName]);

  const resetForm = () => {
    setName("");
    setPriceInput("");
    setCostInput("");
    setStockInput("1");
    setWarrantyDays("15");
    setCategory("Cargadores y Cables");
    setChargerSubtype(chargerSubtypes[0] || "Cubo");
    setChargerBrand(chargerBrands[0] || "iPhone");
    setChargerPower(chargerPowers[0] || "20W");
    setCableFinish(cableFinishes[0] || "Normal");
    setAddingAttrKey(null);
    setNewAttrOptionText("");
    setIsAddingCategory(false);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Autogenerar nombre comercial cuando cambia la categoría o los chips seleccionados
  useEffect(() => {
    let generated = "";
    if (category === "Cargadores y Cables") {
      if (chargerSubtype === "Cubo") {
        generated = `Cubo ${chargerBrand} ${chargerPower}`;
      } else if (chargerSubtype === "Cable") {
        generated = `Cable ${chargerBrand} (${cableFinish})`;
      } else {
        generated = `Cargador Completo ${chargerBrand} ${chargerPower} (${cableFinish})`;
      }
    } else if (category === "Forros / Fundas") {
      generated = `Forro ${caseMaterial} (${caseModel})`;
    } else if (category === "Audio / AirPods") {
      generated = `${audioModel} (${audioConnection})`;
    } else {
      const selectedValues = activeAttributeKeys
        .map((k) => dynamicSelections[k])
        .filter(Boolean);
      if (isSameCatalogText(category, "Power Banks / Baterías")) {
        const brandVal = dynamicSelections.brands || "";
        const capVal = dynamicSelections.capacities || "";
        const portVal = dynamicSelections.ports || "";
        generated = `Power Bank ${brandVal} ${capVal}${portVal ? ` (${portVal})` : ""}`.trim();
      } else {
        generated = [category, ...selectedValues].join(" ").trim();
      }
    }
    setName(generated);
  }, [
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
      if (attrKey === "brands" && category === "Cargadores y Cables") {
        setChargerBrand(saved);
      } else if (attrKey === "powers" && category === "Cargadores y Cables") {
        setChargerPower(saved);
      } else if (attrKey === "cableFinishes" && category === "Cargadores y Cables") {
        setCableFinish(saved);
      } else if (attrKey === "caseMaterials" && category === "Forros / Fundas") {
        setCaseMaterial(saved);
      } else if (attrKey === "caseModels" && category === "Forros / Fundas") {
        setCaseModel(saved);
      } else if (attrKey === "audioModels" && category === "Audio / AirPods") {
        setAudioModel(saved);
      } else if (attrKey === "connections" && category === "Audio / AirPods") {
        setAudioConnection(saved);
      } else {
        setDynamicSelections((prev) => ({ ...prev, [attrKey]: saved }));
      }
    }
    setNewAttrOptionText("");
    setAddingAttrKey(null);
  };

  // Crear nueva familia/categoría al vuelo (+)
  const handleCreateQuickCategory = () => {
    const clean = normalizeCatalogText(newCategoryName);
    if (!clean || clean.toLowerCase() === "todos") return;
    const keys =
      newCategoryAttrKeys.length > 0
        ? newCategoryAttrKeys
        : inferAttributeKeysForCategory(clean);
    const created = addCategory(clean, keys);
    if (created) {
      setCategory(created.name);
      setNewCategoryName("");
      setIsAddingCategory(false);
    }
  };

  const toggleNewCategoryAttrKey = (key: string) => {
    setNewCategoryAttrKeys((prev) =>
      prev.includes(key)
        ? prev.length > 1
          ? prev.filter((k) => k !== key)
          : prev
        : [...prev, key]
    );
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
        subtitle = `Cargador Completo · ${chargerBrand}`;
      }
    } else if (category === "Forros / Fundas") {
      subtitle = `Forro · ${caseModel}`;
    } else if (category === "Audio / AirPods") {
      subtitle = `Audio · ${audioConnection}`;
    } else {
      const vals = activeAttributeKeys
        .map((k) => dynamicSelections[k])
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
            placeholder={`Nuevo (${attrLabel})`}
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
                onClick={() => setIsAddingCategory((prev) => !prev)}
                aria-label="Crear nueva categoría"
                className="inline-flex items-center gap-1 rounded-xl border border-[#007aff]/30 bg-[#007aff]/10 px-2.5 py-1 text-xs font-bold text-[#007aff] dark:text-[#0a84ff] active:scale-95 transition-transform"
              >
                <Plus size={13} />
                <span>Nueva familia</span>
              </button>
            </div>

            {/* Panel inline para crear una categoría al vuelo con atributos adaptativos */}
            {isAddingCategory && (
              <div className="rounded-2xl border border-[#007aff]/35 bg-[#007aff]/5 dark:bg-zinc-900 p-3 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
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
                    onClick={handleCreateQuickCategory}
                    disabled={!newCategoryName.trim()}
                    aria-label="Confirmar creación de categoría"
                    className="rounded-xl bg-[#007aff] px-3 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-40"
                  >
                    Crear
                  </button>
                </div>

                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                    Atributos técnicos asociados:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Object.values(catalogConfig.attributes)
                      .filter((a) => a.key !== "chargerSubtypes")
                      .map((attr) => {
                        const selected = newCategoryAttrKeys.includes(attr.key);
                        return (
                          <button
                            key={attr.key}
                            type="button"
                            onClick={() => toggleNewCategoryAttrKey(attr.key)}
                            className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors ${
                              selected
                                ? "bg-[#007aff] text-white"
                                : "border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-950 text-[var(--text-secondary)] dark:text-zinc-400"
                            }`}
                          >
                            {attr.label}
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

          {/* Opciones y Especificaciones Dinámicas según Categoría */}
          <div className="rounded-2xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)]/40 dark:bg-zinc-900/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                Especificaciones
              </p>
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

            {category === "Cargadores y Cables" && (
              <>
                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                    Subtipo:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {chargerSubtypes.map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setChargerSubtype(sub)}
                        className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-colors duration-75 ${
                          chargerSubtype === sub
                            ? "bg-[#007aff] text-white font-semibold shadow-sm"
                            : "border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 text-[var(--text-primary)] dark:text-zinc-200"
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                    Marca:
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {chargerBrands.map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => setChargerBrand(brand)}
                        className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-colors duration-75 ${
                          chargerBrand === brand
                            ? "bg-[#007aff] text-white font-semibold shadow-sm"
                            : "border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 text-[var(--text-primary)] dark:text-zinc-200"
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                    {renderInlineAddOption("brands", "Marca")}
                  </div>
                </div>

                {/* Potencia: Visible para Cubo y Cargador Completo */}
                {(chargerSubtype === "Cubo" ||
                  chargerSubtype === "Cargador Completo") && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                      Potencia:
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {chargerPowers.map((pow) => (
                        <button
                          key={pow}
                          type="button"
                          onClick={() => setChargerPower(pow)}
                          className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-colors duration-75 ${
                            chargerPower === pow
                              ? "bg-[#007aff] text-white font-semibold shadow-sm"
                              : "border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 text-[var(--text-primary)] dark:text-zinc-200"
                          }`}
                        >
                          {pow}
                        </button>
                      ))}
                      {renderInlineAddOption("powers", "Potencia (W)")}
                    </div>
                  </div>
                )}

                {/* Acabado: Visible para Cable y Cargador Completo */}
                {(chargerSubtype === "Cable" ||
                  chargerSubtype === "Cargador Completo") && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                      Acabado del cable:
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {cableFinishes.map((finish) => (
                        <button
                          key={finish}
                          type="button"
                          onClick={() => setCableFinish(finish)}
                          className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-colors duration-75 ${
                            cableFinish === finish
                              ? "bg-[#007aff] text-white font-semibold shadow-sm"
                              : "border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 text-[var(--text-primary)] dark:text-zinc-200"
                          }`}
                        >
                          {finish}
                        </button>
                      ))}
                      {renderInlineAddOption("cableFinishes", "Acabado del cable")}
                    </div>
                  </div>
                )}
              </>
            )}

            {category === "Forros / Fundas" && (
              <>
                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                    Material:
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {caseMaterials.map((mat) => (
                      <button
                        key={mat}
                        type="button"
                        onClick={() => setCaseMaterial(mat)}
                        className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-colors duration-75 ${
                          caseMaterial === mat
                            ? "bg-[#007aff] text-white font-semibold shadow-sm"
                            : "border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 text-[var(--text-primary)] dark:text-zinc-200"
                        }`}
                      >
                        {mat}
                      </button>
                    ))}
                    {renderInlineAddOption("caseMaterials", "Material")}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                    Modelos:
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {caseModels.map((mod) => (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => setCaseModel(mod)}
                        className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-colors duration-75 ${
                          caseModel === mod
                            ? "bg-[#007aff] text-white font-semibold shadow-sm"
                            : "border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 text-[var(--text-primary)] dark:text-zinc-200"
                        }`}
                      >
                        {mod}
                      </button>
                    ))}
                    {renderInlineAddOption("caseModels", "Modelo Compatible")}
                  </div>
                </div>
              </>
            )}

            {category === "Audio / AirPods" && (
              <>
                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                    Modelo:
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {audioModels.map((mod) => (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => setAudioModel(mod)}
                        className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-colors duration-75 ${
                          audioModel === mod
                            ? "bg-[#007aff] text-white font-semibold shadow-sm"
                            : "border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 text-[var(--text-primary)] dark:text-zinc-200"
                        }`}
                      >
                        {mod}
                      </button>
                    ))}
                    {renderInlineAddOption("audioModels", "Modelo")}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                    Conexión:
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {audioConnections.map((con) => (
                      <button
                        key={con}
                        type="button"
                        onClick={() => setAudioConnection(con)}
                        className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-colors duration-75 ${
                          audioConnection === con
                            ? "bg-[#007aff] text-white font-semibold shadow-sm"
                            : "border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 text-[var(--text-primary)] dark:text-zinc-200"
                        }`}
                      >
                        {con}
                      </button>
                    ))}
                    {renderInlineAddOption("connections", "Tipo de Conexión")}
                  </div>
                </div>
              </>
            )}

            {/* Renderizado adaptativo para cualquier otra categoría (Power Banks, Relojes, SSD, etc.) */}
            {category !== "Cargadores y Cables" &&
              category !== "Forros / Fundas" &&
              category !== "Audio / AirPods" &&
              activeAttributeKeys.map((attrKey) => {
                const attrDef = catalogConfig.attributes[attrKey];
                if (!attrDef) return null;
                const selectedVal =
                  dynamicSelections[attrKey] || attrDef.options[0] || "";

                return (
                  <div key={attrKey}>
                    <p className="mb-1.5 text-[11px] font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                      {attrDef.label}:
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {attrDef.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setDynamicSelections((prev) => ({
                              ...prev,
                              [attrKey]: opt,
                            }))
                          }
                          className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-colors duration-75 ${
                            selectedVal === opt
                              ? "bg-[#007aff] text-white font-semibold shadow-sm"
                              : "border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 text-[var(--text-primary)] dark:text-zinc-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      {renderInlineAddOption(attrKey, attrDef.label)}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Nombre autocompletado / editable */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)] dark:text-zinc-400">
              Nombre comercial del producto *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Cubo iPhone 20W"
              className="w-full rounded-xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] dark:text-zinc-100 outline-none focus:border-[#007aff]"
            />
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
                className="text-xs font-semibold text-[#007aff] hover:underline dark:text-[#0a84ff]"
              >
                + Gestionar proveedores
              </button>
            </div>

            {suppliers.length === 0 ? (
              <div className="rounded-xl border border-[#ff9500]/30 bg-[#ff9500]/10 p-3 text-xs text-[#ff9500]">
                Debes registrar al menos un proveedor antes de crear productos.
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] dark:text-zinc-100 outline-none focus:border-[#007aff]"
                >
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5">
                  {suppliers.find((s) => s.id === selectedSupplierId) && (
                    <span
                      className="h-3.5 w-3.5 rounded-full shadow-sm"
                      style={{
                        backgroundColor: suppliers.find(
                          (s) => s.id === selectedSupplierId
                        )?.color,
                      }}
                    />
                  )}
                </div>
              </div>
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
