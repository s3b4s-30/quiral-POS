/**
 * authWhitelist.ts — Lista de Control de Acceso (ACL / Whitelist) para Registro Multi-Tenant
 *
 * Previene el registro no autorizado de cuentas o tiendas anónimas en el entorno de producción.
 * Solo los correos explícitamente autorizados o pertenecientes a los dominios corporativos
 * aprobados por la administración pueden dar de alta nuevas cuentas.
 */

export const RESTRICTED_REGISTRATION_MESSAGE =
  "Registro restringido por administración. Contacte al propietario de la tienda.";

/**
 * Correos electrónicos autorizados explícitamente por la administración.
 * Puede extenderse mediante la variable de entorno VITE_AUTH_WHITELIST_EMAILS (separados por coma).
 */
const BASE_ALLOWED_EMAILS: readonly string[] = [
  "admin@quiral.xyz",
  "propietario@quiral.xyz",
  "soporte@quiral.xyz",
  "gerencia@quiral.xyz",
  "demo30@quiral.xyz",
  "nahoj.aveirb@gmail.com",
];

/**
 * Dominios institucionales autorizados para creación de cuentas y colaboradores.
 * Puede extenderse mediante la variable de entorno VITE_AUTH_WHITELIST_DOMAINS (separados por coma).
 */
const BASE_ALLOWED_DOMAINS: readonly string[] = ["quiral.xyz"];

function parseEnvList(raw: string | undefined): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function getAllowedRegistrationEmails(): string[] {
  const envEmails = parseEnvList(
    import.meta.env.VITE_AUTH_WHITELIST_EMAILS as string | undefined
  );
  return Array.from(new Set([...BASE_ALLOWED_EMAILS, ...envEmails]));
}

export function getAllowedRegistrationDomains(): string[] {
  const envDomains = parseEnvList(
    import.meta.env.VITE_AUTH_WHITELIST_DOMAINS as string | undefined
  ).map((d) => (d.startsWith("@") ? d.slice(1) : d));
  return Array.from(new Set([...BASE_ALLOWED_DOMAINS, ...envDomains]));
}

/**
 * Verifica si un correo electrónico está autorizado en la Whitelist de registro.
 */
export function isEmailAllowedForRegistration(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return false;

  const allowedEmails = getAllowedRegistrationEmails();
  if (allowedEmails.includes(normalized)) {
    return true;
  }

  const domain = normalized.split("@")[1];
  if (!domain) return false;

  const allowedDomains = getAllowedRegistrationDomains();
  return allowedDomains.includes(domain);
}
