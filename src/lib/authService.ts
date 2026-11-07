import {
  RESTRICTED_REGISTRATION_MESSAGE,
  isEmailAllowedForRegistration,
} from "../config/authWhitelist";
import { supabase } from "./supabase";

export const DEMO_BYPASS_USER = "30";
export const DEMO_BYPASS_PASS = "30";
export const DEMO_EMAIL = "demo30@quiral.xyz";
export const DEMO_PASSWORD = "QuiralDemo30!#";
export const IS_DEV_ENV = Boolean(import.meta.env.DEV);

const looksLikeEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim());

export const printSecurityWarning = () => {
  if (!import.meta.env.DEV) return;
  console.warn(
    "%c⚠️ RECORDATORIO DE SEGURIDAD:%c El acceso rápido 30 / 30 está activo exclusivamente en el entorno local de desarrollo (DEV). Deshabilitado en producción.",
    "color: #ff9500; font-weight: bold; font-size: 13px;",
    "color: inherit; font-size: 13px;"
  );
};

export async function resolveLoginEmail(
  identifier: string
): Promise<string | null> {
  const clean = identifier.trim();
  if (!clean) return null;
  if (looksLikeEmail(clean)) return clean;

  try {
    const { data, error } = await supabase.rpc("get_email_by_username", {
      input_username: clean,
    });
    if (error) {
      console.warn("Error resolviendo username:", error);
      return null;
    }
    return (data as string) || null;
  } catch (err) {
    console.error("Excepción al resolver email por username:", err);
    return null;
  }
}

export async function checkUsernameAvailability(
  username: string
): Promise<boolean> {
  const clean = username.trim().toLowerCase();
  if (!clean || clean.length < 3) return false;
  try {
    const { data, error } = await supabase.rpc("get_email_by_username", {
      input_username: clean,
    });
    if (error) return true;
    return !data;
  } catch {
    return true;
  }
}

export async function signIn(identifier: string, password: string) {
  const cleanId = identifier.trim();
  const isDemo = cleanId === DEMO_BYPASS_USER && password === DEMO_BYPASS_PASS;

  if (isDemo) {
    // Blindaje estricto: el modo demo solo se compila y autoriza en entorno local (import.meta.env.DEV)
    if (!import.meta.env.DEV) {
      localStorage.removeItem("quiral_demo_bypass");
      throw new Error(
        "El acceso de demostración está deshabilitado en el entorno de producción."
      );
    }

    printSecurityWarning();
    try {
      // Intentar iniciar sesión con la cuenta demo fija
      let { data, error } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });

      // Si no existe, crearla automáticamente con su trigger en Supabase
      if (error && error.message.toLowerCase().includes("invalid")) {
        const signUpRes = await supabase.auth.signUp({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
          options: {
            data: {
              username: DEMO_BYPASS_USER,
              store_name: "Quiral Demo 30",
            },
          },
        });

        if (signUpRes.error) {
          throw signUpRes.error;
        }

        const retrySignIn = await supabase.auth.signInWithPassword({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
        });

        if (retrySignIn.error) throw retrySignIn.error;
        data = retrySignIn.data;
      } else if (error) {
        throw error;
      }

      localStorage.setItem("quiral_demo_bypass", "true");
      return { session: data.session, user: data.user, isDemo: true };
    } catch (err) {
      console.warn(
        "Fallo en auth demo de Supabase, activando demo offline local:",
        err
      );
      localStorage.setItem("quiral_demo_bypass", "true");
      return { session: null, user: null, isDemo: true };
    }
  }

  const email = await resolveLoginEmail(cleanId);
  if (!email) {
    throw new Error("Usuario o correo electrónico no encontrado.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  localStorage.removeItem("quiral_demo_bypass");
  return { session: data.session, user: data.user, isDemo: false };
}

export async function signUpUser(
  email: string,
  username: string,
  password: string,
  storeName: string,
  storeIdToJoin?: string
) {
  const cleanEmail = email.trim();
  const cleanUser = username.trim().toLowerCase();
  const cleanStore = storeName.trim() || "Mi tienda";

  // Validación estricta mediante Whitelist de administración
  if (!isEmailAllowedForRegistration(cleanEmail)) {
    throw new Error(RESTRICTED_REGISTRATION_MESSAGE);
  }

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        username: cleanUser,
        store_name: cleanStore,
        store_id: storeIdToJoin?.trim() || undefined,
      },
    },
  });

  if (error) throw error;
  if (
    data.user &&
    Array.isArray(data.user.identities) &&
    data.user.identities.length === 0
  ) {
    throw new Error("El correo electrónico ya se encuentra registrado.");
  }
  return data;
}

export async function requestPasswordReset(email: string) {
  const cleanEmail = email.trim();
  const redirectOrigin =
    typeof window !== "undefined" ? window.location.origin : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: redirectOrigin,
  });

  if (error) throw error;
}

export async function updateCredentials(
  currentPassword: string,
  newUsername?: string,
  newPassword?: string
) {
  // Primero re-autenticar con la contraseña actual por seguridad
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes?.user?.email) {
    throw new Error("No hay una sesión activa para verificar credenciales.");
  }

  const { error: verifyErr } = await supabase.auth.signInWithPassword({
    email: userRes.user.email,
    password: currentPassword,
  });

  if (verifyErr) {
    throw new Error("La contraseña actual es incorrecta.");
  }

  // Actualizar username en store_members mediante RPC
  if (newUsername && newUsername.trim()) {
    const { error: rpcErr } = await supabase.rpc("update_my_credentials", {
      current_password: currentPassword,
      new_username: newUsername.trim().toLowerCase(),
      new_password: newPassword || null,
    });

    if (rpcErr) throw rpcErr;
  }

  // Actualizar contraseña en auth.users si se proporcionó una nueva
  if (newPassword && newPassword.trim()) {
    const { error: passErr } = await supabase.auth.updateUser({
      password: newPassword.trim(),
    });

    if (passErr) throw passErr;
  }
}

export async function signOutUser() {
  localStorage.removeItem("quiral_demo_bypass");
  await supabase.auth.signOut().catch(() => {});
}

export async function getStoreMembership(userId: string) {
  try {
    const { data, error } = await supabase
      .from("store_members")
      .select("store_id, username, role, stores(name)")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const storeObj = data.stores as unknown as { name?: string } | null;
      return {
        storeId: data.store_id as string,
        username: data.username as string,
        role: data.role as "owner" | "staff",
        storeName: storeObj?.name || "Mi tienda",
      };
    }
  } catch (err) {
    console.warn("No se pudo obtener la membresía de la tienda:", err);
  }
  return null;
}
