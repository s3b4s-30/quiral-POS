/**
 * supabaseErrors.ts — Traductor y Humanizador de Errores Técnicos de Supabase
 *
 * Mapea códigos, excepciones y mensajes crudos de Supabase / PostgreSQL
 * a un lenguaje amigable, claro y en español profesional para el usuario en mostrador.
 */

export function humanizeSupabaseError(error: unknown): string {
  if (!error) return "Ocurrió un error inesperado. Inténtalo de nuevo.";

  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  // Errores de autenticación
  if (normalized.includes("invalid login credentials")) {
    return "Credenciales inválidas. Verifica tu correo o usuario y tu contraseña.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Debes confirmar tu correo electrónico antes de ingresar. Por favor revisa tu bandeja de entrada o spam.";
  }
  if (
    normalized.includes("user already registered") ||
    normalized.includes("already registered")
  ) {
    return "Este correo electrónico ya se encuentra registrado. Inicia sesión o recupera tu contraseña.";
  }
  if (
    normalized.includes("password should be at least 6 characters") ||
    normalized.includes("password is too short")
  ) {
    return "La contraseña debe contener al menos 6 caracteres.";
  }
  if (
    normalized.includes("email rate limit exceeded") ||
    normalized.includes("over_email_send_rate_limit")
  ) {
    return "Demasiados intentos en poco tiempo. Por seguridad, espera unos minutos antes de intentar de nuevo.";
  }
  if (normalized.includes("user not found")) {
    return "No encontramos una cuenta asociada a este correo electrónico.";
  }
  if (
    normalized.includes("token has expired") ||
    normalized.includes("otp_expired")
  ) {
    return "El enlace de confirmación o código ha expirado. Por favor solicita uno nuevo.";
  }
  if (
    normalized.includes("session missing") ||
    normalized.includes("jwt expired") ||
    normalized.includes("invalid claim")
  ) {
    return "Tu sesión ha caducado. Por favor ingresa nuevamente.";
  }
  if (
    normalized.includes("network error") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("networkrequestfailed")
  ) {
    return "Error de conexión con el servidor. Revisa tu acceso a internet.";
  }
  if (normalized.includes("row-level security") || normalized.includes("rls")) {
    return "No tienes permisos suficientes para realizar esta acción.";
  }
  if (
    normalized.includes("store not found") ||
    normalized.includes("tienda no encontrada")
  ) {
    return "El código de tienda proporcionado no existe o es inválido.";
  }
  if (
    normalized.includes("duplicate key") ||
    normalized.includes("unique constraint")
  ) {
    return "Este registro ya existe en el sistema.";
  }

  // Si ya es un mensaje legible en español generado por nuestra app, respetarlo
  if (
    message.includes("Ingresa tu") ||
    message.includes("Debes") ||
    message.includes("No se pudo") ||
    message.includes("Verifica") ||
    message.includes("Registro restringido") ||
    message.includes("demostración") ||
    message.includes("Usuario o correo") ||
    message.includes("El correo electrónico ya")
  ) {
    return message;
  }

  return "Ocurrió un inconveniente al procesar la solicitud. Por favor intenta de nuevo.";
}
