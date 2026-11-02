import { test, expect } from "@playwright/test";

test.describe("Quiral POS — Suite E2E de Gestión Masiva y Vaciado de Catálogo", () => {
  test.use({
    viewport: { width: 390, height: 844 }, // iPhone 14 Standalone
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("quiral_demo_bypass", "true");
    });
  });

  test("Apertura de modal de gestión, pestañas, selección selectiva y desbloqueo por frase exacta", async ({
    page,
  }) => {
    await page.goto("/");

    const mobileNavbar = page.locator("nav.liquid-glass-surface");
    await expect(mobileNavbar).toBeVisible({ timeout: 10000 });

    // Navegar a Inventario
    await mobileNavbar.locator("button").filter({ hasText: "Inventario" }).click();
    await expect(page.locator("#inventory-scroll")).toBeVisible();

    // Abrir modal de gestión mediante el botón papelera de TopHeader
    const purgeBtn = page.locator('button[aria-label="Purgar stock agotado"]');
    await expect(purgeBtn).toBeVisible();
    await purgeBtn.click();

    // Validar apertura del ModalSheet con nuevo título
    const modalHeading = page.getByRole("heading", { name: "Gestión y Vaciado de Catálogo" });
    await expect(modalHeading).toBeVisible();

    // Validar pestañas
    const manualTab = page.getByRole("button", { name: "Selección Manual" });
    const clearAllTab = page.getByRole("button", { name: "Vaciado Total (Catálogo)" });
    await expect(manualTab).toBeVisible();
    await expect(clearAllTab).toBeVisible();

    // 1. Probar Selección Manual
    const selectAllBtn = page.getByRole("button", { name: "Seleccionar todo" });
    await expect(selectAllBtn).toBeVisible();

    // Seleccionar primer producto de la lista
    const firstCheckboxItem = page.locator(".modal-sheet-dialog .cursor-pointer").first();
    await expect(firstCheckboxItem).toBeVisible();
    await firstCheckboxItem.click();

    // El botón de eliminar selectivo debe reflejar (1)
    const deleteSelectiveBtn = page.getByRole("button", { name: /Eliminar \(1\)/i });
    await expect(deleteSelectiveBtn).toBeVisible();
    await expect(deleteSelectiveBtn).toBeEnabled();

    // Deseleccionar producto
    await firstCheckboxItem.click();
    await expect(deleteSelectiveBtn).not.toBeVisible();

    // 2. Probar Pestaña de Vaciado Total y Frase de Seguridad
    await clearAllTab.click();

    const executeBtn = page.getByRole("button", { name: "Ejecutar vaciado" });
    await expect(executeBtn).toBeVisible();
    await expect(executeBtn).toBeDisabled(); // Inicialmente bloqueado

    const phraseInput = page.locator('input[placeholder*="vaciar inventario"]');
    await expect(phraseInput).toBeVisible();

    // Escribir texto erróneo
    await phraseInput.fill("texto incorrecto");
    await expect(page.getByText("La frase aún no coincide de forma exacta.")).toBeVisible();
    await expect(executeBtn).toBeDisabled();

    // Escribir la frase exacta
    await phraseInput.fill("vaciar inventario");
    await expect(page.getByText("✓ Frase confirmada. El botón de vaciado ha sido desbloqueado.")).toBeVisible();
    await expect(executeBtn).toBeEnabled();

    // Cerrar modal
    const cancelBtn = page.getByRole("button", { name: "Cancelar" });
    await cancelBtn.click();
    await expect(modalHeading).not.toBeVisible();
  });
});
