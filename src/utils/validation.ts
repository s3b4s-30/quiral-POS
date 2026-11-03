export interface PasswordValidationRules {
  minLength: boolean; // >= 8 caracteres
  hasUpper: boolean;  // >= 1 letra mayúscula
  hasLower: boolean;  // >= 1 letra minúscula
  hasNumber: boolean; // >= 1 número
  hasSpecial: boolean;// >= 1 símbolo especial
}

export type PasswordStrengthLevel = "Muy débil" | "Débil" | "Media" | "Fuerte" | "Excelente";

export interface PasswordStrengthResult {
  score: number; // 0 to 5
  rules: PasswordValidationRules;
  isValid: boolean; // true si cumple las 5 reglas obligatorias
  label: PasswordStrengthLevel;
  colorClass: string;
  barWidthClass: string;
}

/**
 * Evalúa de forma determinista la robustez de una contraseña
 * según los estándares de ciberseguridad de Quiral POS.
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const rules: PasswordValidationRules = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(rules).filter(Boolean).length;
  const isValid = score === 5;

  let label: PasswordStrengthLevel = "Muy débil";
  let colorClass = "bg-red-500 text-red-500";
  let barWidthClass = "w-1/5";

  switch (score) {
    case 1:
      label = "Muy débil";
      colorClass = "bg-red-500 text-red-500";
      barWidthClass = "w-1/5";
      break;
    case 2:
      label = "Débil";
      colorClass = "bg-[#ff9500] text-[#ff9500]";
      barWidthClass = "w-2/5";
      break;
    case 3:
      label = "Media";
      colorClass = "bg-yellow-500 text-yellow-500";
      barWidthClass = "w-3/5";
      break;
    case 4:
      label = "Fuerte";
      colorClass = "bg-accent text-accent";
      barWidthClass = "w-4/5";
      break;
    case 5:
      label = "Excelente";
      colorClass = "bg-[#34c759] text-[#34c759]";
      barWidthClass = "w-full";
      break;
    default:
      label = "Muy débil";
      colorClass = "bg-zinc-600 text-zinc-500";
      barWidthClass = "w-0";
      break;
  }

  return {
    score,
    rules,
    isValid,
    label,
    colorClass,
    barWidthClass,
  };
}

/**
 * Valida la sintaxis estricta de un correo electrónico.
 */
export function isValidEmail(email: string): boolean {
  const clean = email.trim();
  if (!clean) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean);
}

/**
 * Valida el formato canónico de un nombre de usuario en Quiral POS.
 */
export function validateUsernameFormat(username: string): { isValid: boolean; error?: string } {
  const clean = username.trim().toLowerCase();
  if (!clean) {
    return { isValid: false, error: "El nombre de usuario es obligatorio." };
  }
  if (clean.length < 3) {
    return { isValid: false, error: "Debe contener al menos 3 caracteres." };
  }
  if (clean.length > 24) {
    return { isValid: false, error: "No puede exceder 24 caracteres." };
  }
  if (!/^[a-z0-9_.-]+$/.test(clean)) {
    return { isValid: false, error: "Solo se permiten letras minúsculas, números, guiones y puntos." };
  }
  return { isValid: true };
}

/**
 * Valida si una cadena cumple la especificación UUID v4 de Supabase / PostgreSQL.
 */
export function isValidUUID(uuidString: string): boolean {
  const clean = uuidString.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
}
