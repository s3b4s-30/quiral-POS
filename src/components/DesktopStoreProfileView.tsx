import {
  ArrowLeft,
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
import { BTN_PRIMARY, BTN_TERTIARY } from "../constants/uiButtons";

interface DesktopStoreProfileViewProps {
  onBack: () => void;
  onOpenSecurity?: () => void;
}

export default function DesktopStoreProfileView({
  onBack,
  onOpenSecurity,
}: DesktopStoreProfileViewProps) {
  const {
    userProfile,
    updateStoreProfile,
    isDemoUser,
    accentPalette,
    setAccentPalette,
  } = useInventory();

  const [storeName, setStoreName] = useState(userProfile?.storeName || "");
  const [storePhone, setStorePhone] = useState(userProfile?.storePhone || "");
  const [storeAddress, setStoreAddress] = useState(
    userProfile?.storeAddress || ""
  );
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(
        "Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP)."
      );
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
      }, 2000);
    } catch (err: unknown) {
      console.error("Error actualizando perfil de tienda:", err);
      setError("No se pudo guardar la información del negocio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      data-testid="desktop-store-profile-view"
      className="w-full h-full flex flex-col overflow-hidden bg-[var(--bg-primary)]"
    >
      {/* Cabecera de la vista de pantalla completa en escritorio */}
      <div className="shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-elevated)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className={BTN_TERTIARY}>
            <ArrowLeft size={16} />
            <span>Regresar</span>
          </button>
          <div className="h-5 w-px bg-[var(--border-color)]" />
          <div>
            <h1 className="text-lg font-black text-[var(--text-primary)]">
              Perfil y Configuración de la Tienda
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Personaliza la identidad corporativa, datos de contacto y paleta
              cromática global
            </p>
          </div>
        </div>

        <button
          type="submit"
          form="desktop-store-profile-form"
          disabled={saving}
          className={`${BTN_PRIMARY} px-5 py-2 text-sm font-extrabold`}
        >
          {success ? (
            <>
              <Check size={16} />
              <span>¡Guardado con éxito!</span>
            </>
          ) : (
            <span>Guardar cambios</span>
          )}
        </button>
      </div>

      {/* Contenido con scroll independiente estructurado en dos columnas de alta ergonomía */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <form
          id="desktop-store-profile-form"
          onSubmit={handleSave}
          className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6"
        >
          {error && (
            <div className="md:col-span-12 rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs font-semibold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {isDemoUser && (
            <div className="md:col-span-12 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300">
              Estás en modo demostración. Los cambios de perfil se guardarán de
              forma local en este dispositivo.
            </div>
          )}

          {/* Columna Izquierda: Logo y Branding */}
          <div className="md:col-span-4 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 flex flex-col items-center text-center shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] mb-4">
              Identidad Visual
            </h3>

            <div className="relative group mb-4">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border-2 border-[var(--border-color)] bg-[var(--bg-primary)] shadow-md">
                {storeLogoUrl ? (
                  <img
                    src={storeLogoUrl}
                    alt={storeName || "Logo de la tienda"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-[var(--text-secondary)]">
                    <Store
                      size={44}
                      className="text-accent transition-colors duration-200"
                    />
                    <span className="text-[11px] font-bold mt-1.5 uppercase tracking-wide">
                      Logo
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Cambiar foto o logo"
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Camera size={16} />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleImageChange}
              className="hidden"
            />

            <div className="flex items-center gap-3 text-xs font-semibold">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-accent hover:underline transition-colors"
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

            <p className="mt-4 text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Formatos soportados: PNG, JPG o WEBP hasta 2MB. Aparecerá en el
              encabezado principal y tickets de venta.
            </p>

            {onOpenSecurity && (
              <div className="w-full mt-6 pt-5 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={onOpenSecurity}
                  className="w-full flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 text-left transition-colors hover:border-accent/40 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">
                        Seguridad de Cuenta
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        Credenciales y accesos
                      </p>
                    </div>
                  </div>
                  <KeyRound
                    size={15}
                    className="text-[var(--text-secondary)]"
                  />
                </button>
              </div>
            )}
          </div>

          {/* Columna Derecha: Datos Comerciales y Paleta de Colores */}
          <div className="md:col-span-8 space-y-6">
            <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                Datos de Contacto del Establecimiento
              </h3>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                  Nombre Comercial del Negocio *
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
                    className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] pl-10 pr-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                    Teléfono / WhatsApp
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
                      className="tabular-nums w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] pl-10 pr-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                    Dirección Física
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
                      className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] pl-10 pr-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Selector de Paleta de Colores de Acento */}
            <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-subtle text-accent">
                    <Palette size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                      Tema de Acento y Paleta Cromática
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Aplica el color de acento de forma instantánea a botones,
                      selecciones y badges
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-accent-subtle px-3 py-1 text-xs font-extrabold text-accent">
                  {ACCENT_PALETTES.find((p) => p.id === selectedPalette)
                    ?.name || "Azul Clásico"}
                </span>
              </div>

              <div
                role="radiogroup"
                aria-label="Paletas de color de acento"
                data-testid="theme-palette-selector"
                className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2"
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
                      className={`flex flex-col items-center gap-2 rounded-2xl p-3 border transition-all active:scale-95 ${
                        isSelected
                          ? "border-accent bg-accent-subtle shadow-xs ring-2 ring-accent"
                          : "border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-accent/40"
                      }`}
                      title={`${palette.name}: ${palette.description}`}
                    >
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition-transform"
                        style={{ backgroundColor: palette.previewColor }}
                      >
                        {isSelected && (
                          <Check size={16} className="text-white stroke-[3]" />
                        )}
                      </span>
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate max-w-full">
                        {palette.shortName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
