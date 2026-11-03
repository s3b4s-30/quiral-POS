import {
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { updateCredentials } from "../lib/authService";
import { evaluatePasswordStrength } from "../utils/validation";
import ModalSheet from "./ModalSheet";

interface ProfileSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartClose?: () => void;
  currentUsername: string;
  storeName: string;
  userEmail: string;
  role: string;
  isDemoUser?: boolean;
}

export default function ProfileSecurityModal({
  isOpen,
  onClose,
  onStartClose,
  currentUsername,
  storeName,
  userEmail,
  role,
  isDemoUser = false,
}: ProfileSecurityModalProps) {
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isSubmittingRef = useRef(false);

  if (!isOpen) return null;

  const newPassStrength = evaluatePasswordStrength(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;

    setError(null);
    setSuccess(null);

    if (isDemoUser) {
      setError(
        "La cuenta demo 30/30 está protegida contra modificaciones directas de credenciales."
      );
      return;
    }

    if (!currentPassword) {
      setError("Debes ingresar tu contraseña actual para confirmar los cambios.");
      return;
    }

    if (newPassword) {
      if (!newPassStrength.isValid) {
        setError(
          "La nueva contraseña debe cumplir las 5 reglas de seguridad (8+ caracteres, mayúscula, minúscula, número y símbolo)."
        );
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("La confirmación de la nueva contraseña no coincide.");
        return;
      }
    }

    isSubmittingRef.current = true;
    setLoading(true);
    try {
      await updateCredentials(
        currentPassword,
        newUsername !== currentUsername ? newUsername : undefined,
        newPassword || undefined
      );

      setSuccess("Tus credenciales se han actualizado correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error("Error al actualizar credenciales:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "No se pudieron actualizar las credenciales.");
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <ModalSheet
      title="Perfil y Seguridad"
      onClose={onClose}
      onStartClose={onStartClose}
      className="max-h-[92vh]"
      contentClassName="p-4 sm:p-5 space-y-4"
    >
      {/* Información del Tenant / Tienda con tokens OLED */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3.5 space-y-1.5 select-none shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-secondary)] font-medium">Tienda</span>
          <span className="font-bold text-[var(--text-primary)]">{storeName}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-secondary)] font-medium">Correo</span>
          <span className="font-semibold text-[var(--text-primary)]">{userEmail}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-secondary)] font-medium">Rol</span>
          <span className="rounded-full bg-accent-subtle text-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors duration-200">
            {role === "owner" ? "Propietario" : "Colaborador"}
          </span>
        </div>
      </div>

      {isDemoUser && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <AlertTriangle size={16} className="shrink-0" />
          <span className="leading-tight">
            ⚠️ Cuenta de prueba activa (30 / 30). Las modificaciones de perfil están restringidas para mantener el entorno de prueba intacto.
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-[#ff3b30]/10 border border-[#ff3b30]/20 p-3 text-xs font-semibold text-[#ff3b30] animate-in fade-in">
          <AlertTriangle size={16} className="shrink-0" />
          <span className="flex-1 leading-tight">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-2xl bg-[#30d158]/10 border border-[#30d158]/20 p-3 text-xs font-semibold text-[#30d158] animate-in fade-in">
          <CheckCircle size={16} className="shrink-0" />
          <span className="flex-1 leading-tight">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5 pb-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
            Nombre de Usuario
          </label>
          <div className="relative flex items-center">
            <User
              size={16}
              className="absolute left-3.5 text-[var(--text-secondary)] pointer-events-none"
            />
            <input
              type="text"
              autoCapitalize="none"
              disabled={isDemoUser}
              value={newUsername}
              onChange={(e) =>
                setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))
              }
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] pl-10 pr-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-accent transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        <div className="border-t border-[var(--border-color)] pt-3">
          <p className="text-xs font-bold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-accent transition-colors duration-200" />
            <span>Seguridad y Contraseña</span>
          </p>

          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Contraseña Actual (Obligatoria para confirmar)
              </label>
              <div className="relative flex items-center">
                <KeyRound
                  size={16}
                  className="absolute left-3.5 text-[var(--text-secondary)] pointer-events-none"
                />
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  disabled={isDemoUser}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] pl-10 pr-10 py-2.5 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-accent transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  aria-label={showCurrentPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  title={showCurrentPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none"
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Nueva Contraseña (Opcional)
                </label>
                {newPassword.length > 0 && (
                  <span
                    className={`text-[11px] font-bold ${
                      newPassStrength.isValid ? "text-emerald-500" : "text-amber-500"
                    }`}
                  >
                    {newPassStrength.label}
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock
                  size={16}
                  className="absolute left-3.5 text-[var(--text-secondary)] pointer-events-none"
                />
                <input
                  type={showNewPassword ? "text" : "password"}
                  disabled={isDemoUser}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Dejar en blanco para mantener"
                  className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] pl-10 pr-10 py-2.5 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-accent transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  aria-label={showNewPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  title={showNewPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {newPassword.length > 0 && (
                <div className="mt-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-2.5 space-y-1 text-xs">
                  <div
                    className={`flex items-center gap-1.5 ${
                      newPassStrength.rules.minLength
                        ? "text-emerald-500 font-semibold"
                        : "text-zinc-500"
                    }`}
                  >
                    <CheckCircle size={12} />
                    <span>8+ caracteres</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      newPassStrength.rules.hasUpper && newPassStrength.rules.hasLower
                        ? "text-emerald-500 font-semibold"
                        : "text-zinc-500"
                    }`}
                  >
                    <CheckCircle size={12} />
                    <span>Mayúsculas y minúsculas</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      newPassStrength.rules.hasNumber && newPassStrength.rules.hasSpecial
                        ? "text-emerald-500 font-semibold"
                        : "text-zinc-500"
                    }`}
                  >
                    <CheckCircle size={12} />
                    <span>Números y símbolos (@$!%*?&#)</span>
                  </div>
                </div>
              )}
            </div>

            {newPassword && (
              <div className="animate-in fade-in">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Confirmar Nueva Contraseña
                  </label>
                  {confirmPassword.length > 0 && (
                    <span
                      className={`text-[11px] font-bold ${
                        passwordsMatch ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {passwordsMatch ? "Coinciden" : "No coinciden"}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Lock
                    size={16}
                    className="absolute left-3.5 text-[var(--text-secondary)] pointer-events-none"
                  />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    disabled={isDemoUser}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] pl-10 pr-10 py-2.5 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-accent transition-colors disabled:opacity-50"
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    title={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || isDemoUser}
          className="w-full mt-2 rounded-2xl bg-accent hover:bg-accent-hover py-3.5 text-sm font-bold text-white shadow-md active:scale-[0.99] transition-all duration-200 disabled:opacity-50 select-none"
        >
          {loading ? "Guardando cambios..." : "Actualizar Credenciales"}
        </button>
      </form>
    </ModalSheet>
  );
}
