import {
  Camera,
  Check,
  KeyRound,
  MapPin,
  Palette,
  Phone,
  ShieldCheck,
  Store,
  Trash2,
  Upload,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { AccentPaletteId, ACCENT_PALETTES } from "../utils/themePalettes";
import ModalSheet from "./ModalSheet";

interface StoreProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartClose?: () => void;
  onOpenSecurity?: () => void;
}

/**
 * StoreProfileModal — Pantalla independiente de configuración del negocio
 *
 * Estándares Apple HIG aplicados:
 * 1. Hoja modal nativa con swipe-to-dismiss y handle táctil vía ModalSheet.
 * 2. Carga y previsualización inmediata de logo/foto comercial mediante FileReader (Data URL).
 * 3. Campos comerciales clave para recibos/facturas: Nombre comercial, Teléfono/WhatsApp y Dirección física.
 * 4. Botón de acción principal fijo en el footer persistente ("Guardar perfil").
 * 5. Acceso complementario a credenciales y seguridad de cuenta.
 */
export default function StoreProfileModal({
  isOpen,
  onClose,
  onStartClose,
  onOpenSecurity,
}: StoreProfileModalProps) {
  const { userProfile, updateStoreProfile, isDemoUser, accentPalette, setAccentPalette } =
    useInventory();

  const [storeName, setStoreName] = useState(userProfile?.storeName || "");
  const [storePhone, setStorePhone] = useState(userProfile?.storePhone || "");
  const [storeAddress, setStoreAddress] = useState(userProfile?.storeAddress || "");
  const [storeLogoUrl, setStoreLogoUrl] = useState<string | undefined>(
    userProfile?.storeLogoUrl
  );
  const [selectedPalette, setSelectedPalette] = useState<AccentPaletteId>(
    accentPalette || userProfile?.accentPalette || "blue"
  );

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen no debe superar los 2MB de tamaño.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setStoreLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setStoreLogoUrl(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setError("El nombre de la tienda es obligatorio.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await updateStoreProfile({
        storeName: storeName.trim(),
        storePhone: storePhone.trim() || undefined,
        storeAddress: storeAddress.trim() || undefined,
        storeLogoUrl,
        accentPalette: selectedPalette,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 700);
    } catch (err: unknown) {
      console.error("Error actualizando perfil de tienda:", err);
      setError("No se pudo guardar la información del negocio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalSheet
      onClose={onClose}
      onStartClose={onStartClose}
      title="Perfil de la tienda"
      footer={
        <button
          type="submit"
          form="store-profile-form"
          disabled={saving}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-base font-bold text-white shadow-lg transition-transform active:scale-[0.98] hover:opacity-95 disabled:opacity-50"
        >
          {success ? (
            <>
              <Check size={18} />
              <span>Guardado con éxito</span>
            </>
          ) : (
            <span>Guardar perfil</span>
          )}
        </button>
      }
    >
      <form id="store-profile-form" onSubmit={handleSave} className="space-y-5">
        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {isDemoUser && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
            Estás en modo demostración. Los cambios de perfil se guardarán de forma local en este dispositivo.
          </div>
        )}

        {/* Sección de Logo / Imagen de Tienda */}
        <div className="flex flex-col items-center justify-center pt-2 pb-1">
          <div className="relative group">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-2 border-[var(--border-color)] bg-[var(--bg-elevated)] shadow-md">
              {storeLogoUrl ? (
                <img
                  src={storeLogoUrl}
                  alt={storeName || "Logo de la tienda"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-[var(--text-secondary)]">
                  <Store size={36} className="text-[#007aff]" />
                  <span className="text-[10px] font-bold mt-1 uppercase tracking-wide">Logo</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Cambiar foto o logo"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#007aff] text-white shadow-md transition-transform hover:scale-105 active:scale-95"
            >
              <Camera size={15} />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleImageChange}
            className="hidden"
          />

          <div className="mt-3 flex items-center gap-3 text-xs font-semibold">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-[#007aff] hover:underline"
            >
              <Upload size={13} />
              <span>Subir logo</span>
            </button>
            {storeLogoUrl && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="flex items-center gap-1.5 text-red-500 hover:underline"
              >
                <Trash2 size={13} />
                <span>Quitar</span>
              </button>
            )}
          </div>
        </div>

        {/* Datos Comerciales */}
        <div className="space-y-3.5">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Nombre comercial del negocio *
            </label>
            <div className="relative flex items-center">
              <Store
                size={16}
                className="absolute left-3.5 text-[var(--text-secondary)] pointer-events-none"
              />
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ej. Quiral POS & Store"
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] pl-10 pr-3.5 py-3 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[#007aff] transition-colors"
              />
            </div>
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              Aparecerá en el encabezado de la app y en los recibos de venta impresos o digitales.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Teléfono de contacto / WhatsApp
            </label>
            <div className="relative flex items-center">
              <Phone
                size={16}
                className="absolute left-3.5 text-[var(--text-secondary)] pointer-events-none"
              />
              <input
                type="tel"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                placeholder="Ej. +57 300 123 4567"
                className="tabular-nums w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] pl-10 pr-3.5 py-3 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[#007aff] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Dirección física
            </label>
            <div className="relative flex items-center">
              <MapPin
                size={16}
                className="absolute left-3.5 text-[var(--text-secondary)] pointer-events-none"
              />
              <input
                type="text"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Ej. Calle 72 # 10-34, Local 201"
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] pl-10 pr-3.5 py-3 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[#007aff] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Paleta de Colores de Acento del Sistema */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-accent-subtle text-accent">
                <Palette size={15} />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)]">
                  Paleta de colores del sistema
                </label>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  Personaliza los tonos de acento y estados activos de la app
                </p>
              </div>
            </div>
            <span className="rounded-full bg-accent-subtle px-2 py-0.5 text-[10px] font-extrabold text-accent">
              {ACCENT_PALETTES.find((p) => p.id === selectedPalette)?.name || "Azul Clásico"}
            </span>
          </div>

          <div
            role="radiogroup"
            aria-label="Paletas de color de acento"
            data-testid="theme-palette-selector"
            className="grid grid-cols-5 gap-1.5 pt-1"
          >
            {ACCENT_PALETTES.map((palette) => {
              const isSelected = selectedPalette === palette.id;
              return (
                <button
                  key={palette.id}
                  type="button"
                  data-testid={`theme-palette-${palette.id}`}
                  aria-checked={isSelected}
                  role="radio"
                  onClick={() => {
                    setSelectedPalette(palette.id);
                    setAccentPalette(palette.id);
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl p-2 border transition-all active:scale-95 ${
                    isSelected
                      ? "border-accent bg-accent-subtle shadow-sm ring-1 ring-accent"
                      : "border-[var(--border-color)] bg-black/5 dark:bg-white/5 hover:border-[var(--text-secondary)]"
                  }`}
                  title={`${palette.name}: ${palette.description}`}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition-transform"
                    style={{ backgroundColor: palette.previewColor }}
                  >
                    {isSelected && (
                      <Check size={14} className="text-white stroke-[3]" />
                    )}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--text-primary)] truncate max-w-full">
                    {palette.shortName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Acceso a Credenciales y Seguridad */}
        {onOpenSecurity && (
          <div className="pt-2 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSecurity();
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    Seguridad de la cuenta
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Cambiar usuario o contraseña de acceso
                  </p>
                </div>
              </div>
              <KeyRound size={16} className="text-[var(--text-secondary)]" />
            </button>
          </div>
        )}
      </form>
    </ModalSheet>
  );
}
