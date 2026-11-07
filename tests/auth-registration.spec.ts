import { test, expect } from "@playwright/test";

test.describe("Quiral POS — Flujo de Registro, Blindaje de Contraseñas y Seguridad UI/UX", () => {
  test.use({
    viewport: { width: 390, height: 844 }, // iPhone 14
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  });

  test("1. Alternancia de visibilidad de contraseña (Eye / EyeOff) en login", async ({
    page,
  }) => {
    // Entrar sin bypass para ver la pantalla de login
    await page.goto("http://localhost:5173/");

    const passwordInput = page.locator('input[placeholder="••••••••"]');
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Escribir contraseña de prueba
    await passwordInput.fill("PruebaClave123!");

    // Buscar botón de visibilidad (icono de ojo)
    const toggleEyeBtn = page.getByRole("button", { name: /Ver contraseña/i });
    await expect(toggleEyeBtn).toBeVisible();
    await toggleEyeBtn.click();

    // Ahora el input debe ser de tipo 'text'
    await expect(passwordInput).toHaveAttribute("type", "text");

    // Volver a enmascarar
    const hideEyeBtn = page.getByRole("button", {
      name: /Ocultar contraseña/i,
    });
    await hideEyeBtn.click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("2. Validación de fortaleza de contraseña interactiva, doble confirmación y bloqueo por Whitelist en registro", async ({
    page,
  }) => {
    await page.goto("http://localhost:5173/");

    // Cambiar a formulario de registro "Crear tienda"
    const createStoreBtn = page.getByRole("button", { name: "Crear tienda" });
    await expect(createStoreBtn).toBeVisible({ timeout: 10000 });
    await createStoreBtn.click();

    // Verificar que estamos en la vista de registro
    await expect(
      page.getByRole("heading", { name: "Quiral POS" })
    ).toBeVisible();
    await expect(
      page.getByText("Crea tu tienda segura o únete como colaborador")
    ).toBeVisible();

    const emailInput = page.locator(
      'input[placeholder="propietario@tienda.com"]'
    );
    const userInput = page.locator('input[placeholder="ej. juan_pos"]');
    const passInput = page.locator(
      'input[placeholder="Mínimo 8 caracteres seguros"]'
    );
    const confirmInput = page.locator(
      'input[placeholder="Repite la contraseña exacta"]'
    );
    const storeInput = page.locator(
      'input[placeholder="ej. Apple Store Medellín"]'
    );
    const submitBtn = page.getByRole("button", { name: /Registrar Tienda/i });

    // El botón debe estar inicialmente deshabilitado
    await expect(submitBtn).toBeDisabled();

    // 1. Ingresar correo externo no autorizado en Whitelist
    await emailInput.fill("propietario@tiendatest.com");
    await expect(page.getByText("Válido")).toBeVisible();

    // 2. Ingresar nombre de usuario
    await userInput.fill("tienda_segura_2026");

    // 3. Probar contraseña débil (< 8 caracteres y sin mayúsculas/símbolos)
    await passInput.fill("clave");
    await expect(page.getByText(/Fortaleza:/i)).toBeVisible();
    await expect(page.getByText(/Muy débil/i)).toBeVisible();
    await expect(submitBtn).toBeDisabled();

    // 4. Probar contraseña robusta completa (8+ chars, mayúscula, minúscula, número, símbolo)
    await passInput.fill("Quiral2026!#Secure");
    await expect(page.getByText(/Excelente/i)).toBeVisible();
    await expect(page.getByText("8+ caracteres").locator("..")).toHaveClass(
      /text-emerald/
    );
    await expect(page.getByText("Mayúscula (A-Z)").locator("..")).toHaveClass(
      /text-emerald/
    );
    await expect(page.getByText("Minúscula (a-z)").locator("..")).toHaveClass(
      /text-emerald/
    );
    await expect(page.getByText("Un número (0-9)").locator("..")).toHaveClass(
      /text-emerald/
    );
    await expect(
      page.getByText("Símbolo especial (!@#$%^&*)").locator("..")
    ).toHaveClass(/text-emerald/);

    // 5. Probar discrepancia en confirmación de contraseña
    await confirmInput.fill("QuiralDiferente123!");
    await expect(page.getByText("No coinciden")).toBeVisible();
    await expect(submitBtn).toBeDisabled();

    // 6. Probar coincidencia exacta
    await confirmInput.fill("Quiral2026!#Secure");
    await expect(page.getByText("Coinciden")).toBeVisible();

    // 7. Completar nombre de tienda
    await storeInput.fill("Tienda Segura Medellín");

    // 8. El botón de envío debe activarse una vez todos los criterios se cumplen
    await expect(submitBtn).toBeEnabled();

    // 9. Intentar registrar correo fuera de la Whitelist administrativa y verificar rechazo
    await submitBtn.click();
    await expect(
      page.getByText(
        "Registro restringido por administración. Contacte al propietario de la tienda."
      )
    ).toBeVisible();
  });

  test("3. Alternancia accesible de texto plano en campo de registro", async ({
    page,
  }) => {
    await page.goto("http://localhost:5173/");

    await page.getByRole("button", { name: "Crear tienda" }).click();

    const passInput = page.locator(
      'input[placeholder="Mínimo 8 caracteres seguros"]'
    );
    await passInput.fill("ClaveSuperSegura99!");
    await expect(passInput).toHaveAttribute("type", "password");

    // Alternar visibilidad con el primer botón de ojo
    const eyeButtons = page.locator('button[aria-label="Ver contraseña"]');
    await eyeButtons.first().click();
    await expect(passInput).toHaveAttribute("type", "text");

    const hideButtons = page.locator('button[aria-label="Ocultar contraseña"]');
    await hideButtons.first().click();
    await expect(passInput).toHaveAttribute("type", "password");
  });
});
