import {
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  Store,
  User,
  UserPlus,
} from "lucide-react";
import React, { useRef, useState } from "react";
import {
  RESTRICTED_REGISTRATION_MESSAGE,
  isEmailAllowedForRegistration,
} from "../config/authWhitelist";
import {
  DEMO_BYPASS_PASS,
  DEMO_BYPASS_USER,
  requestPasswordReset,
  signIn,
  signUpUser,
} from "../lib/authService";
import { humanizeSupabaseError } from "../utils/supabaseErrors";
import {
  evaluatePasswordStrength,
  isValidEmail,
  isValidUUID,
  validateUsernameFormat,
} from "../utils/validation";

interface AuthScreenProps {
  onAuthSuccess: () => Promise<void> | void;
}

type AuthMode = "login" | "register" | "forgot";

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Estados del formulario de registro
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeIdToJoin, setStoreIdToJoin] = useState("");
  const [isJoiningStore, setIsJoiningStore] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Referencia para aislamiento de concurrencia (anti-double-submitting)
  const isSubmittingRef = useRef(false);

  // Evaluaciones de validación reactiva
  const isEmailValid = isValidEmail(email);
  const usernameCheck = validateUsernameFormat(username);
  const passwordStrength = evaluatePasswordStrength(registerPassword);
  const passwordsMatch =
    registerPassword.length > 0 && registerPassword === confirmPassword;
  const isStoreValid = isJoiningStore
    ? isValidUUID(storeIdToJoin)
    : storeName.trim().length > 0;

  const isRegisterFormValid =
    isEmailValid &&
    usernameCheck.isValid &&
    passwordStrength.isValid &&
    passwordsMatch &&
    isStoreValid;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;

    setError(null);
    setSuccessMessage(null);

    const cleanUser = identifier.trim();
    if (!cleanUser || !password) {
      setError("Ingresa tu usuario/correo y contraseña.");
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    try {
      const authResult = await signIn(cleanUser, password);
      if (!authResult) {
        throw new Error(
          "No se pudo iniciar sesión. Verifica tus credenciales."
        );
      }
      await onAuthSuccess();
    } catch (err: unknown) {
      console.error("Error en login:", err);
      setError(humanizeSupabaseError(err));
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading || !isRegisterFormValid) return;

    setError(null);
    setSuccessMessage(null);

    if (!isEmailAllowedForRegistration(email)) {
      setError(RESTRICTED_REGISTRATION_MESSAGE);
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    try {
      await signUpUser(
        email,
        username,
        registerPassword,
        isJoiningStore ? "" : storeName || "Mi tienda",
        isJoiningStore ? storeIdToJoin : undefined
      );
      setSuccessMessage(
        "¡Cuenta creada exitosamente! Te enviamos un enlace de confirmación a tu correo. Por favor revísalo antes de iniciar sesión."
      );
      try {
        await signIn(username, registerPassword);
        await onAuthSuccess();
      } catch {
        setMode("login");
        setIdentifier(username);
        setPassword(registerPassword);
      }
    } catch (err: unknown) {
      console.error("Error en registro:", err);
      setError(humanizeSupabaseError(err));
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;

    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !isValidEmail(email)) {
      setError("Ingresa un correo electrónico válido asociado a tu cuenta.");
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSuccessMessage("Se ha enviado un enlace de recuperación a tu correo.");
    } catch (err: unknown) {
      console.error("Error en recuperación:", err);
      setError(humanizeSupabaseError(err));
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleQuickDemoFill = () => {
    if (!import.meta.env.DEV) return;
    setIdentifier(DEMO_BYPASS_USER);
    setPassword(DEMO_BYPASS_PASS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 dark:bg-black/85 p-4 pt-16 sm:p-6 sm:pt-16 transition-all duration-200">
      <div className="w-full max-w-md rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Cabecera / Marca Quiral */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/30 transition-colors duration-200">
            <Store size={28} />
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-[var(--text-primary)]">
            Quiral POS
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            {mode === "login" && "Acceso para propietarios y colaboradores"}
            {mode === "register" &&
              "Crea tu tienda segura o únete como colaborador"}
            {mode === "forgot" && "Recuperación de contraseña segura"}
          </p>
        </div>

        {/* Notificaciones de Error / Éxito */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-500/10 border border-red-500/20 p-3 text-xs font-semibold text-red-600 dark:text-red-400 animate-in fade-in">
            <AlertTriangle size={16} className="shrink-0" />
            <span className="flex-1 leading-tight">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
            <CheckCircle size={16} className="shrink-0" />
            <span className="flex-1 leading-tight">{successMessage}</span>
          </div>
        )}

        {/* Formulario de Login */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Usuario o Correo
              </label>
              <div className="relative flex items-center">
                <User
                  size={16}
                  className="absolute left-3.5 text-[var(--text-secondary)] pointer-events-none"
                />
                <input
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="false"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ej. demo o correo@tienda.com"
                  className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] pl-10 pr-4 py-3 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode("forgot");
                  }}
                  className="text-xs font-semibold text-accent hover:underline transition-colors duration-200"
                >
                  ¿Olvidaste tu clave?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock
                  size={16}
                  className="absolute left-3.5 text-[var(--text-secondary)] pointer-events-none"
                />
                <input
                  type={showLoginPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] pl-10 pr-10 py-3 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-accent transition-colors"
                />
                <button
                  type="button"
                  aria-label={
                    showLoginPassword ? "Ocultar contraseña" : "Ver contraseña"
                  }
                  title={
                    showLoginPassword ? "Ocultar contraseña" : "Ver contraseña"
                  }
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none"
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-accent hover:bg-accent-hover py-3.5 text-sm font-bold text-white shadow-md active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              <LogIn size={18} />
              <span>{loading ? "Iniciando sesión..." : "Iniciar Sesión"}</span>
            </button>

            {/* Acceso Rápido de Prueba 30 / 30 (Exclusivo Localhost / Desarrollo) */}
            {import.meta.env.DEV && (
              <div className="mt-4 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  data-testid="quick-demo-fill-btn"
                  onClick={handleQuickDemoFill}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/15 active:scale-95 transition-all"
                >
                  <KeyRound size={14} />
                  <span>Rellenar Acceso Rápido de Prueba (30 / 30)</span>
                </button>
                <p className="mt-1.5 text-[10px] text-center text-amber-500/80 font-medium leading-tight">
                  ⚠️ Acceso exclusivo para pruebas en entorno de desarrollo
                  local. Deshabilitado en producción.
                </p>
              </div>
            )}

            <div className="text-center pt-2">
              <span className="text-xs text-[var(--text-secondary)]">
                ¿No tienes cuenta?{" "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setMode("register");
                }}
                className="text-xs font-bold text-accent hover:underline transition-colors duration-200"
              >
                Crear tienda
              </button>
            </div>
          </form>
        )}

        {/* Formulario de Registro */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Correo Electrónico
                </label>
                {email.trim().length > 0 && (
                  <span
                    className={`text-[11px] font-bold ${
                      isEmailValid ? "text-emerald-500" : "text-amber-500"
                    }`}
                  >
                    {isEmailValid ? "Válido" : "Inválido"}
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Mail
                  size={16}
                  className="absolute left-3.5 text-[var(--text-secondary)] pointer-events-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="propietario@tienda.com"
                  className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] pl-10 pr-4 py-3 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Nombre de Usuario Único
                </label>
                {username.trim().length > 0 && (
                  <span
                    className={`text-[11px] font-bold ${
                      usernameCheck.isValid
                        ? "text-emerald-500"
                        : "text-amber-500"
                    }`}
                  >
                    {usernameCheck.isValid ? "Válido" : "3-24 letras/núms"}
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <User
                  size={16}
                  className="absolute left-3.5 text-[var(--text-secondary)] pointer-events-none"
                />
                <input
                  type="text"
                  autoCapitalize="none"
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, "")
                    )
                  }
                  placeholder="ej. juan_pos"
                  className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] pl-10 pr-4 py-3 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Contraseña
                </label>
                {registerPassword.length > 0 && (
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-[var(--text-secondary)]">
                      Fortaleza:
                    </span>
                    <span
                      className={`font-bold ${
                        passwordStrength.isValid
                          ? "text-emerald-500"
                          : passwordStrength.colorClass.split(" ")[1]
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock
                  size={16}
                  className="absolute left-3.5 text-[var(--text-secondary)] pointer-events-none"
                />
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres seguros"
                  className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] pl-10 pr-10 py-3 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-accent transition-colors"
                />
                <button
                  type="button"
                  aria-label={
                    showRegisterPassword
                      ? "Ocultar contraseña"
                      : "Ver contraseña"
                  }
                  title={
                    showRegisterPassword
                      ? "Ocultar contraseña"
                      : "Ver contraseña"
                  }
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-3 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none"
                >
                  {showRegisterPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>

              {/* Barra de progreso de fortaleza */}
              {registerPassword.length > 0 && (
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrength.colorClass.split(" ")[0]
                    } ${passwordStrength.barWidthClass}`}
                  />
                </div>
              )}

              {/* Checklist interactivo de las 5 reglas */}
              {registerPassword.length > 0 && (
                <div className="mt-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div
                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                      passwordStrength.rules.minLength
                        ? "text-emerald-500 font-semibold"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {passwordStrength.rules.minLength ? (
                      <CheckCircle
                        size={13}
                        className="shrink-0 text-emerald-500"
                      />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-current opacity-60 shrink-0" />
                    )}
                    <span>8+ caracteres</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                      passwordStrength.rules.hasUpper
                        ? "text-emerald-500 font-semibold"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {passwordStrength.rules.hasUpper ? (
                      <CheckCircle
                        size={13}
                        className="shrink-0 text-emerald-500"
                      />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-current opacity-60 shrink-0" />
                    )}
                    <span>Mayúscula (A-Z)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                      passwordStrength.rules.hasLower
                        ? "text-emerald-500 font-semibold"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {passwordStrength.rules.hasLower ? (
                      <CheckCircle
                        size={13}
                        className="shrink-0 text-emerald-500"
                      />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-current opacity-60 shrink-0" />
                    )}
                    <span>Minúscula (a-z)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                      passwordStrength.rules.hasNumber
                        ? "text-emerald-500 font-semibold"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {passwordStrength.rules.hasNumber ? (
                      <CheckCircle
                        size={13}
                        className="shrink-0 text-emerald-500"
                      />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-current opacity-60 shrink-0" />
                    )}
                    <span>Un número (0-9)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                      passwordStrength.rules.hasSpecial
                        ? "text-emerald-500 font-semibold"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {passwordStrength.rules.hasSpecial ? (
                      <CheckCircle
                        size={13}
                        className="shrink-0 text-emerald-500"
                      />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-current opacity-60 shrink-0" />
                    )}
                    <span>Símbolo especial (!@#$%^&*)</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Confirmar Contraseña
                </label>
                {confirmPassword.length > 0 && (
                  <span
                    className={`text-[11px] font-bold flex items-center gap-1 ${
                      passwordsMatch ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {passwordsMatch ? (
                      <>
                        <CheckCircle size={12} />
                        <span>Coinciden</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={12} />
                        <span>No coinciden</span>
                      </>
                    )}
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña exacta"
                  className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] pl-10 pr-10 py-3 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-accent transition-colors"
                />
                <button
                  type="button"
                  aria-label={
                    showConfirmPassword
                      ? "Ocultar contraseña"
                      : "Ver contraseña"
                  }
                  title={
                    showConfirmPassword
                      ? "Ocultar contraseña"
                      : "Ver contraseña"
                  }
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Alternar Crear Tienda vs Unirse a Tienda */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  {isJoiningStore
                    ? "ID de Tienda a Unirse"
                    : "Nombre de tu Tienda"}
                </label>
                <button
                  type="button"
                  onClick={() => setIsJoiningStore(!isJoiningStore)}
                  className="text-xs font-semibold text-accent hover:underline transition-colors duration-200"
                >
                  {isJoiningStore
                    ? "Crear nueva tienda"
                    : "Unirse a tienda existente"}
                </button>
              </div>

              {isJoiningStore ? (
                <input
                  type="text"
                  value={storeIdToJoin}
                  onChange={(e) => setStoreIdToJoin(e.target.value)}
                  placeholder="Pega el UUID de la tienda"
                  className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-accent transition-colors"
                />
              ) : (
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="ej. Apple Store Medellín"
                  className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-accent transition-colors"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isRegisterFormValid}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-accent hover:bg-accent-hover py-3.5 text-sm font-bold text-white shadow-md active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              <UserPlus size={18} />
              <span>
                {loading
                  ? "Creando cuenta..."
                  : isJoiningStore
                    ? "Unirse a Tienda"
                    : "Registrar Tienda"}
              </span>
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-[var(--text-secondary)]">
                ¿Ya tienes cuenta?{" "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setMode("login");
                }}
                className="text-xs font-bold text-accent hover:underline transition-colors duration-200"
              >
                Iniciar sesión
              </button>
            </div>
          </form>
        )}

        {/* Formulario de Recuperación de Contraseña */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Correo Electrónico
              </label>
              <div className="relative flex items-center">
                <Mail
                  size={16}
                  className="absolute left-3.5 text-[var(--text-secondary)] pointer-events-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@tienda.com"
                  className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] pl-10 pr-4 py-3 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-accent hover:bg-accent-hover py-3.5 text-sm font-bold text-white shadow-md active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              <span>
                {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
              </span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setMode("login");
                }}
                className="text-xs font-bold text-accent hover:underline transition-colors duration-200"
              >
                Volver a Iniciar sesión
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
