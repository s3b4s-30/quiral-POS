import { Check, Pencil, Plus, RotateCcw, Sparkles, Trash2, X } from "lucide-react";
import React, { useState } from "react";
import ModalSheet from "./ModalSheet";
import { useInventory } from "../context/InventoryContext";
import { isSameCatalogText, normalizeCatalogText } from "../utils/catalogConfig";

interface AttributeConfigModalProps {
  onClose: () => void;
  initialAttributeKey?: string;
}

export default function AttributeConfigModal({
  onClose,
  initialAttributeKey,
}: AttributeConfigModalProps) {
  const {
    catalogConfig,
    addAttributeOption,
    renameAttributeOption,
    deleteAttributeOption,
    createCustomAttribute,
  } = useInventory();

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

  // Creación de un nuevo bloque maestro de atributo (ej. Resistencia al agua, Tamaño correa)
  const [isCreatingBlock, setIsCreatingBlock] = useState(false);
  const [newBlockLabel, setNewBlockLabel] = useState("");
  const [newBlockFirstOption, setNewBlockFirstOption] = useState("");

  const activeAttr =
    catalogConfig.attributes[selectedKey] || attributeList[0];

  const showFeedback = (type: "success" | "warning", text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg((prev) => (prev?.text === text ? null : prev));
    }, 2800);
  };

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAttr) return;

    const clean = normalizeCatalogText(newOptionInput);
    if (!clean) return;

    const alreadyExists = activeAttr.options.some((opt) =>
      isSameCatalogText(opt, clean)
    );

    const saved = addAttributeOption(activeAttr.key, clean);
    setNewOptionInput("");

    if (alreadyExists) {
      showFeedback(
        "warning",
        `«${saved || clean}» ya existe en ${activeAttr.label} (normalizado sin duplicar).`
      );
    } else if (saved) {
      showFeedback("success", `«${saved}» guardado en ${activeAttr.label}.`);
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

    const ok = renameAttributeOption(activeAttr.key, oldOpt, clean);
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
      showFeedback("success", `Atributo «${cleanLabel}» añadido al banco maestro.`);
    }
  };

  return (
    <ModalSheet
      title="Banco Maestro de Atributos"
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#007aff] text-sm sm:text-base font-bold text-white shadow-lg active:scale-[0.98] transition-transform duration-75"
        >
          Listo
        </button>
      }
    >
      <div className="space-y-4 py-1">
        {/* Descripción superior */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-[var(--text-secondary)] dark:text-zinc-400">
            Administra marcas, potencias, capacidades y especificaciones técnicas reutilizables.
          </p>
          <button
            type="button"
            onClick={() => setIsCreatingBlock((prev) => !prev)}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[#007aff]/30 bg-[#007aff]/10 px-2.5 py-1.5 text-xs font-bold text-[#007aff] dark:text-[#0a84ff] active:scale-95 transition-transform"
          >
            <Plus size={14} />
            <span>Nuevo atributo</span>
          </button>
        </div>

        {/* Formulario colapsable para crear un nuevo bloque de atributo */}
        {isCreatingBlock && (
          <form
            onSubmit={handleCreateBlock}
            className="rounded-2xl border border-[#007aff]/30 bg-[#007aff]/5 dark:bg-zinc-900 p-3.5 space-y-2.5 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#007aff] dark:text-[#0a84ff] flex items-center gap-1.5">
                <Sparkles size={14} />
                Crear nueva familia de atributo
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
                className="w-full rounded-xl border border-[var(--border-color)] dark:border-zinc-700 bg-[var(--bg-elevated)] dark:bg-zinc-950 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] dark:text-zinc-100 placeholder:text-[var(--text-secondary)] dark:placeholder:text-zinc-500 outline-none focus:border-[#007aff]"
              />
              <input
                type="text"
                value={newBlockFirstOption}
                onChange={(e) => setNewBlockFirstOption(e.target.value)}
                placeholder="Primer valor (ej. IP68, 45mm)"
                className="w-full rounded-xl border border-[var(--border-color)] dark:border-zinc-700 bg-[var(--bg-elevated)] dark:bg-zinc-950 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] dark:text-zinc-100 placeholder:text-[var(--text-secondary)] dark:placeholder:text-zinc-500 outline-none focus:border-[#007aff]"
              />
            </div>
            <button
              type="submit"
              disabled={!newBlockLabel.trim()}
              className="flex min-h-9 w-full items-center justify-center rounded-xl bg-[#007aff] text-xs font-bold text-white shadow-sm disabled:opacity-40"
            >
              Guardar bloque de atributo
            </button>
          </form>
        )}

        {/* Selector horizontal de bloques de atributos */}
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] dark:text-zinc-400">
            Atributo seleccionado
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
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
                  className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                    isSelected
                      ? "bg-[#007aff] text-white shadow-sm"
                      : "border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900 text-[var(--text-primary)] dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-zinc-800"
                  }`}
                >
                  {attr.label} ({attr.options.length})
                </button>
              );
            })}
          </div>
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

        {/* Agregar nuevo valor al atributo activo */}
        {activeAttr && (
          <div className="rounded-2xl border border-[var(--border-color)] dark:border-zinc-800 bg-[var(--bg-elevated)] dark:bg-zinc-900/60 p-3.5 space-y-3">
            <form onSubmit={handleAddOption} className="flex items-center gap-2">
              <input
                type="text"
                value={newOptionInput}
                onChange={(e) => setNewOptionInput(e.target.value)}
                placeholder={`Nuevo valor para ${activeAttr.label} (ej. 2TB, 140W)...`}
                aria-label={`Nuevo valor para ${activeAttr.label}`}
                className="flex-1 rounded-xl border border-[var(--border-color)] dark:border-zinc-700 bg-[var(--bg-primary)]/60 dark:bg-zinc-900 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[var(--text-primary)] dark:text-zinc-100 placeholder:text-[var(--text-secondary)] dark:placeholder:text-zinc-500 outline-none focus:border-[#007aff]"
              />
              <button
                type="submit"
                disabled={!newOptionInput.trim()}
                aria-label="Agregar valor al atributo"
                className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-[#007aff] px-3.5 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition-transform disabled:opacity-40 shrink-0"
              >
                <Plus size={16} />
                <span>Agregar</span>
              </button>
            </form>

            {/* Listado de opciones editables / eliminables */}
            <div className="max-h-[42vh] overflow-y-auto space-y-1.5 pr-1">
              {activeAttr.options.map((opt) => {
                const isEditing = editingOption === opt;
                return (
                  <div
                    key={opt}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-color)] dark:border-zinc-800/80 bg-[var(--bg-primary)]/40 dark:bg-zinc-900 px-3 py-2"
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
                          className="flex-1 rounded-lg border border-[#007aff] bg-[var(--bg-elevated)] dark:bg-zinc-950 px-2.5 py-1 text-xs font-bold text-[var(--text-primary)] dark:text-zinc-100 outline-none"
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
                        <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] dark:text-zinc-100 truncate">
                          {opt}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startRename(opt)}
                            aria-label={`Renombrar ${opt}`}
                            title="Renombrar"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-zinc-800 hover:text-[#007aff]"
                          >
                            <Pencil size={13} />
                          </button>
                          {activeAttr.options.length > 1 && (
                            <button
                              type="button"
                              onClick={() => deleteAttributeOption(activeAttr.key, opt)}
                              aria-label={`Eliminar opción ${opt}`}
                              title="Eliminar valor"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30]"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
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
    </ModalSheet>
  );
}
