import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Eye,
  Minus,
  Plus,
  RotateCcw,
  Sliders,
  Tag,
  X,
} from "lucide-react";
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
  ];
  const chargerPowers = catalogConfig.attributes.powers?.options ?? [
    "20W",
    "25W",
    "30W",
    "35W",
    "45W",
    "60W",
    "65W",
  ];
  const cableFinishes = catalogConfig.attributes.cableFinishes?.options ?? [
    "Normal",
    "Trenzado",
  ];
  const caseMaterials = catalogConfig.attributes.caseMaterials?.options ?? [
    "Silicona Líquida",
    "Transparente Anti-amarilleo",
    "Lujo",
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
    "AirPods Serie 3",
    "AirPods Serie 4",
    "AirPods Pro 2da Generación",
    "AirPods Pro 3ra Generación",
  ];
  const audioConnections = catalogConfig.attributes.connections?.options ?? [
    "USB-C",
    "Lightning",
    "MagSafe",
  ];

  // Estados para las categorías principales y atributos sincronizados
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
    audioModels[1] || audioModels[0] || "AirPods Serie 4"
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

  // Estado para el flujo limpio de creación de nueva categoría con previsualización y orden en vivo
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryAttrKeys, setNewCategoryAttrKeys] = useState<string[]>([]);

  // Estados de arrastre táctil / drag & drop para la lista de atributos de nueva categoría
  const [draggedAttrIdx, setDraggedAttrIdx] = useState<number | null>(null);
  const [dragOverAttrIdx, setDragOverAttrIdx] = useState<number | null>(null);
  const [touchDragAttrIdx, setTouchDragAttrIdx] = useState<number | null>(null);
  const touchDragAttrIdxRef = useRef<number | null>(null);
  const longPressAttrTimerRef = useRef<number | null>(null);
  const touchStartAttrYRef = useRef<number>(0);
  const newCatAttrListRef = useRef<HTMLDivElement | null>(null);

  // Modal de Configuración de Atributos (Banco Maestro)
  const [attrModalConfig, setAttrModalConfig] = useState<{
    open: boolean;
    tab: "category-order" | "attribute-options";
  }>({ open: false, tab: "attribute-options" });

  // Campos del formulario comercial y Switch de Nomenclatura
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

  // Construir nombre técnico según la categoría y el orden de activeAttributeKeys
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

  // Construir cadena compacta de atributos seleccionados para agregar a un nombre manual
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
    setNewCategoryName("");
    setNewCategoryAttrKeys([]);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Sincronizar el nombre comercial cuando está activo el switch de incluir atributos
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

  // Alternar el switch de incluir subtipo y atributos en el nombre
  const handleToggleIncludeAttributesInName = () => {
    const nextState = !includeAttributesInName;
    setIncludeAttributesInName(nextState);

    if (nextState) {
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

  // Abrir el flujo limpio de "+ Nueva categoría" despejando selecciones previas
  const handleOpenNewCategoryFlow = () => {
    setNewCategoryName("");
    setNewCategoryAttrKeys([]);
    setError(null);
    setIsAddingCategory(true);
  };

  // Crear nueva categoría respetando el orden exacto de atributos y volver a "Nuevo producto"
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
      setNewCategoryAttrKeys([]);
      setIsAddingCategory(false);
    }
  };

  // Agregar, quitar o mover atributos al crear una nueva categoría
  const toggleNewCategoryAttrKey = (key: string) => {
    setNewCategoryAttrKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const moveNewCategoryAttrKey = (fromIdx: number, toIdx: number) => {
    setNewCategoryAttrKeys((prev) => {
      if (
        fromIdx < 0 ||
        toIdx < 0 ||
        fromIdx >= prev.length ||
        toIdx >= prev.length ||
        fromIdx === toIdx
      ) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  // Soporte de arrastre táctil directo para la lista de atributos de nueva categoría
  const clearAttrLongPressTimer = () => {
    if (longPressAttrTimerRef.current !== null) {
      window.clearTimeout(longPressAttrTimerRef.current);
      longPressAttrTimerRef.current = null;
    }
  };

  const handleAttrHandleTouchStart = (idx: number, clientY: number) => {
    clearAttrLongPressTimer();
    touchStartAttrYRef.current = clientY;
    touchDragAttrIdxRef.current = idx;
    setTouchDragAttrIdx(idx);
  };

  const handleAttrRowTouchStart = (idx: number, clientY: number) => {
    clearAttrLongPressTimer();
    touchStartAttrYRef.current = clientY;
    longPressAttrTimerRef.current = window.setTimeout(() => {
      touchDragAttrIdxRef.current = idx;
      setTouchDragAttrIdx(idx);
      longPressAttrTimerRef.current = null;
    }, 200);
  };

  const handleAttrTouchMovePoint = (
    clientX: number,
    clientY: number,
    e?: React.TouchEvent
  ) => {
    const activeIdx = touchDragAttrIdxRef.current;
    if (activeIdx === null) {
      if (Math.abs(clientY - touchStartAttrYRef.current) > 10) {
        clearAttrLongPressTimer();
      }
      return;
    }

    if (e && e.cancelable) {
      e.preventDefault();
    }

    let targetIdx: number | null = null;
    const elUnderFinger = document.elementFromPoint(clientX, clientY);
    const rowEl = elUnderFinger?.closest(
      "[data-newcat-attr-index]"
    ) as HTMLElement | null;
    if (rowEl && rowEl.dataset.newcatAttrIndex !== undefined) {
      const parsed = parseInt(rowEl.dataset.newcatAttrIndex, 10);
      if (!Number.isNaN(parsed)) {
        targetIdx = parsed;
      }
    } else if (newCatAttrListRef.current) {
      const rows = Array.from(
        newCatAttrListRef.current.querySelectorAll<HTMLElement>(
          "[data-newcat-attr-index]"
        )
      );
      for (const r of rows) {
        const rect = r.getBoundingClientRect();
        if (clientY >= rect.top && clientY <= rect.bottom) {
          const parsed = parseInt(r.dataset.newcatAttrIndex || "", 10);
          if (!Number.isNaN(parsed)) {
            targetIdx = parsed;
            break;
          }
        }
      }
    }

    if (targetIdx !== null && targetIdx !== activeIdx) {
      moveNewCategoryAttrKey(activeIdx, targetIdx);
      touchDragAttrIdxRef.current = targetIdx;
      setTouchDragAttrIdx(targetIdx);
    }
  };

  const handleAttrTouchEndOrCancel = () => {
    clearAttrLongPressTimer();
    touchDragAttrIdxRef.current = null;
    setTouchDragAttrIdx(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingCategory) {
      handleCreateQuickCategory();
      return;
    }
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
  const getDisplayHeadingForAttribute = (
    attrKey: string,
    defaultLabel: string
  ): string => {
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
          {attrKey !== "chargerSubtypes" &&
            renderInlineAddOption(attrKey, attrDef.label)}
        </div>
      </div>
    );
  };

  return (
    <>
      <ModalSheet
        onClose={handleClose}
        onStartClose={onStartClose}
        title={isAddingCategory ? "Nueva categoría" : "Nuevo producto"}
        footer={
          isAddingCategory ? (
            <button
              type="button"
              data-testid="confirm-create-category-btn"
              onClick={handleCreateQuickCategory}
              disabled={!newCategoryName.trim()}
              aria-label="Confirmar creación de categoría"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#007aff] text-base font-bold text-white shadow-lg transition-transform active:scale-[0.98] hover:opacity-95 disabled:opacity-40"
            >
              <Check size={18} strokeWidth={2.5} />
              <span>Crear categoría</span>
            </button>
          ) : (
            <button
              type="submit"
              form="new-product-form"
              className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#007aff] text-base font-bold text-white shadow-lg transition-transform active:scale-[0.98] hover:opacity-95"
            >
              Guardar producto
            </button>
          )
        }
      >
        <form id="new-product-form" onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="rounded-xl bg-[#ff3b30]/15 p-3 text-xs font-semibold text-[#ff3b30]">
              {error}
            </p>
          )}

          {isAddingCategory ? (
            /* =====================================================================
               MODO DEDICADO Y DESPEJADO: CREACIÓN DE NUEVA CATEGORÍA EN VIVO
               ===================================================================== */
            <div
              data-testid="clean-new-category-workspace"
              className="space-y-4 py-0.5 animate-in fade-in duration-150"
            >
              {/* Barra superior de navegación de la vista de creación + Acceso directo a "Editar banco" */}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategoryName("");
                    setNewCategoryAttrKeys([]);
                  }}
                  aria-label="Volver a nuevo producto"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] dark:text-zinc-200 active:scale-95 transition-transform"
                >
                  <ArrowLeft size={14} strokeWidth={2.5} className="shrink-0" />
                  <span>Volver</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAttrModalConfig({ open: true, tab: "attribute-options" })
                  }
                  aria-label="Abrir banco maestro de atributos"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#007aff]/30 bg-[#007aff]/10 px-3 py-1.5 text-xs font-bold text-[#007aff] dark:text-[#0a84ff] active:scale-95 transition-transform"
                >
                  <Sliders size={13} strokeWidth={2.5} className="shrink-0" />
                  <span>Editar banco</span>
                </button>
              </div>

              {/* 1. Nombre de la nueva categoría */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                  Nombre de la nueva categoría *
                </label>
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
                  placeholder="Ej. Relojes Inteligentes, Memorias SSD..."
                  aria-label="Nombre de la nueva categoría"
                  autoFocus
                  className="w-full rounded-xl border border-[var(--border-color)] dark:border-zinc-700 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] dark:text-zinc-100 placeholder:text-[var(--text-secondary)] dark:placeholder:text-zinc-500 outline-none focus:border-[#007aff]"
                />
              </div>

              {/* 2. Banco de atributos disponibles para agregar con un toque */}
              <div className="rounded-2xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)]/40 dark:bg-zinc-900/50 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                    Toca para agregar atributos:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCategoryAttrKeys([]);
                    }}
                    aria-label="Reiniciar orden de atributos"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--text-secondary)] dark:text-zinc-400 hover:text-[#ff3b30] transition-colors"
                  >
                    <RotateCcw size={11} />
                    <span>Limpiar</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {Object.values(catalogConfig.attributes)
                    .filter((attr) => !newCategoryAttrKeys.includes(attr.key))
                    .map((attr) => (
                      <button
                        key={attr.key}
                        type="button"
                        onClick={() => toggleNewCategoryAttrKey(attr.key)}
                        className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] dark:text-zinc-200 hover:border-[#007aff] active:scale-95 transition-all"
                      >
                        <Plus size={12} strokeWidth={2.5} className="text-[#007aff] shrink-0" />
                        <span>{attr.label}</span>
                      </button>
                    ))}
                </div>
              </div>

              {/* 3. Previsualización Dinámica de la Categoría */}
              <div
                data-testid="new-category-live-preview"
                className="rounded-2xl border border-[#007aff]/30 bg-[#007aff]/5 dark:bg-zinc-900/80 p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[#007aff] dark:text-[#0a84ff]">
                    <Eye size={14} className="shrink-0" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Previsualización dinámica
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] dark:text-zinc-400 truncate max-w-[160px]">
                    {normalizeCatalogText(newCategoryName) || "Nueva categoría"}
                  </span>
                </div>

                {newCategoryAttrKeys.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)]/60 dark:bg-zinc-950/50 px-3 py-3 text-center text-xs text-[var(--text-secondary)] dark:text-zinc-400">
                    Selecciona atributos arriba para previsualizar cómo se verá el formulario de esta categoría.
                  </p>
                ) : (
                  <div className="space-y-2.5 rounded-xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-950 p-3">
                    {newCategoryAttrKeys.map((attrKey) => {
                      const attr = catalogConfig.attributes[attrKey];
                      if (!attr) return null;
                      const previewOptions = attr.options.slice(0, 4);
                      return (
                        <div key={`preview-${attrKey}`} className="space-y-1">
                          <p className="text-[11px] font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                            {attr.label}:
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {previewOptions.map((opt, i) => (
                              <span
                                key={opt}
                                className={`rounded-xl px-2.5 py-0.5 text-[11px] font-medium ${
                                  i === 0
                                    ? "bg-[#007aff] text-white font-semibold"
                                    : "border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)] dark:bg-zinc-900 text-[var(--text-secondary)] dark:text-zinc-300"
                                }`}
                              >
                                {opt}
                              </span>
                            ))}
                            {attr.options.length > 4 && (
                              <span className="text-[10px] font-semibold text-[var(--text-secondary)] dark:text-zinc-500">
                                +{attr.options.length - 4} más
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. Lista Interactiva de Ordenamiento en Vivo (justo debajo de la previsualización) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                    Orden de atributos seleccionados ({newCategoryAttrKeys.length})
                  </p>
                  {newCategoryAttrKeys.length > 1 && (
                    <span className="text-[10px] font-medium text-[var(--text-secondary)] dark:text-zinc-400">
                      Desliza o usa las flechas
                    </span>
                  )}
                </div>

                {newCategoryAttrKeys.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[var(--border-color)] dark:border-zinc-800 px-3 py-2.5 text-xs text-[var(--text-secondary)] dark:text-zinc-400">
                    Aún no has seleccionado atributos para esta categoría.
                  </p>
                ) : (
                  <div
                    ref={newCatAttrListRef}
                    data-testid="new-category-selected-attrs-list"
                    onTouchMove={(e) => {
                      const touch = e.touches[0];
                      if (touch) {
                        handleAttrTouchMovePoint(touch.clientX, touch.clientY, e);
                      }
                    }}
                    onTouchEnd={handleAttrTouchEndOrCancel}
                    onTouchCancel={handleAttrTouchEndOrCancel}
                    className="space-y-1.5"
                  >
                    {newCategoryAttrKeys.map((key, idx) => {
                      const attr = catalogConfig.attributes[key];
                      if (!attr) return null;
                      const isTouchDragging = touchDragAttrIdx === idx;
                      const isDraggedOver =
                        dragOverAttrIdx === idx && draggedAttrIdx !== idx;

                      return (
                        <div
                          key={key}
                          data-newcat-attr-index={idx}
                          draggable
                          onDragStart={() => setDraggedAttrIdx(idx)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverAttrIdx(idx);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedAttrIdx !== null) {
                              moveNewCategoryAttrKey(draggedAttrIdx, idx);
                            }
                            setDraggedAttrIdx(null);
                            setDragOverAttrIdx(null);
                          }}
                          onDragEnd={() => {
                            setDraggedAttrIdx(null);
                            setDragOverAttrIdx(null);
                          }}
                          onTouchStart={(e) => {
                            const touch = e.touches[0];
                            if (touch) {
                              handleAttrRowTouchStart(idx, touch.clientY);
                            }
                          }}
                          className={`flex items-center justify-between gap-2.5 rounded-xl border px-3 py-2 select-none transition-all ${
                            isTouchDragging || isDraggedOver
                              ? "border-[#007aff] bg-[#007aff]/15 dark:bg-[#007aff]/20 scale-[1.01] shadow-md z-10"
                              : "border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900"
                          }`}
                        >
                          {/* Botón rojo (-) sin superposición para quitar el atributo */}
                          <button
                            type="button"
                            onClick={() => toggleNewCategoryAttrKey(key)}
                            aria-label={`Quitar ${attr.label} de nueva categoría`}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ff3b30]/15 text-[#ff3b30] hover:bg-[#ff3b30] hover:text-white active:scale-90 transition-all"
                          >
                            <Minus size={14} strokeWidth={2.75} className="shrink-0" />
                          </button>

                          {/* Nombre del atributo con su posición */}
                          <span className="min-w-0 flex-1 truncate text-xs sm:text-sm font-bold text-[var(--text-primary)] dark:text-zinc-100">
                            {idx + 1}. {attr.label}
                          </span>

                          {/* Controles Subir / Bajar + Asa de 3 líneas */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveNewCategoryAttrKey(idx, idx - 1)}
                              aria-label={`Subir ${attr.label}`}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)]/50 dark:bg-zinc-800/70 text-[var(--text-primary)] dark:text-zinc-200 disabled:opacity-25 active:scale-90 transition-transform"
                            >
                              <ArrowUp size={13} strokeWidth={2.25} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === newCategoryAttrKeys.length - 1}
                              onClick={() => moveNewCategoryAttrKey(idx, idx + 1)}
                              aria-label={`Bajar ${attr.label}`}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)]/50 dark:bg-zinc-800/70 text-[var(--text-primary)] dark:text-zinc-200 disabled:opacity-25 active:scale-90 transition-transform"
                            >
                              <ArrowDown size={13} strokeWidth={2.25} />
                            </button>
                            <div
                              aria-label={`Asa de arrastre ${attr.label}`}
                              onTouchStart={(e) => {
                                e.stopPropagation();
                                const touch = e.touches[0];
                                if (touch) {
                                  handleAttrHandleTouchStart(idx, touch.clientY);
                                }
                              }}
                              style={{ touchAction: "none" }}
                              className="flex h-7 w-7 cursor-grab active:cursor-grabbing flex-col items-center justify-center gap-[3px] rounded-lg px-1 text-[var(--text-secondary)] dark:text-zinc-400"
                            >
                              <span className="block h-[2px] w-4 rounded-full bg-current" />
                              <span className="block h-[2px] w-4 rounded-full bg-current" />
                              <span className="block h-[2px] w-4 rounded-full bg-current" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* =====================================================================
               VISTA NORMAL: REGISTRO DE NUEVO PRODUCTO
               ===================================================================== */
            <>
              {/* Categoría Selector con botón (+ Nueva categoría) */}
              <div className="mt-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                    Categoría
                  </span>
                  <button
                    type="button"
                    data-testid="add-new-category-inline-btn"
                    onClick={handleOpenNewCategoryFlow}
                    aria-label="Crear nueva categoría"
                    className="inline-flex items-center gap-1 rounded-xl border border-[#007aff]/30 bg-[#007aff]/10 px-2.5 py-1 text-xs font-bold text-[#007aff] dark:text-[#0a84ff] active:scale-95 transition-transform"
                  >
                    <Plus size={13} strokeWidth={2.5} />
                    <span>Nueva categoría</span>
                  </button>
                </div>

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

              {/* Opciones y Especificaciones Dinámicas (sin bloque redundante de ordenar atributos) */}
              <div className="rounded-2xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)]/40 dark:bg-zinc-900/50 p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
                    Especificaciones
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setAttrModalConfig({ open: true, tab: "attribute-options" })
                    }
                    aria-label="Abrir banco maestro de atributos"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#007aff] dark:text-[#0a84ff] hover:underline"
                  >
                    <Sliders size={13} strokeWidth={2.5} className="shrink-0" />
                    <span>Editar banco</span>
                  </button>
                </div>

                {/* Renderizado estricto según el orden de activeAttributeKeys */}
                {activeAttributeKeys.map((attrKey) => renderAttributeBlock(attrKey))}
              </div>

              {/* Nombre comercial del producto + Interruptor limpio de detalles */}
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

                {/* Interruptor limpio y legible (sin iconos de IA ni textos truncados) */}
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-primary)]/50 dark:bg-zinc-900/70 px-3.5 py-2.5">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <Tag
                      size={16}
                      className={
                        includeAttributesInName
                          ? "mt-0.5 text-[#007aff] shrink-0"
                          : "mt-0.5 text-[var(--text-secondary)] dark:text-zinc-500 shrink-0"
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-snug text-[var(--text-primary)] dark:text-zinc-200">
                        Incluir subtipo y atributos en el nombre
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-secondary)] dark:text-zinc-400">
                        {includeAttributesInName
                          ? "Se agregan automáticamente al nombre del producto."
                          : "Usar únicamente el nombre escrito arriba."}
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
            </>
          )}
        </form>
      </ModalSheet>

      {attrModalConfig.open && (
        <AttributeConfigModal
          activeCategory={category}
          initialTab={attrModalConfig.tab}
          onClose={() =>
            setAttrModalConfig({ open: false, tab: "attribute-options" })
          }
        />
      )}
    </>
  );
}
