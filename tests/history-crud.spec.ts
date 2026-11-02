import { test, expect } from "@playwright/test";

test.describe("Quiral POS — Suite E2E de Historial, CRUD y Autosuficiencia de Datos", () => {
  test.use({
    viewport: { width: 390, height: 844 }, // iPhone 14 Standalone
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  });

  test.beforeEach(async ({ page }) => {
    // Activar bypass de demo para acceder a las vistas del sistema en entorno local
    await page.addInitScript(() => {
      localStorage.setItem("quiral_demo_bypass", "true");
    });
  });

  test("Ciclo completo autosuficiente: Crear venta en POS -> Modificar con confirmación -> Eliminar con confirmación", async ({
    page,
  }) => {
    await page.goto("/");

    const mobileNavbar = page.locator("nav.liquid-glass-surface");
    await expect(mobileNavbar).toBeVisible({ timeout: 10000 });

    // 1. Navegar a POS (Vender)
    const posNavBtn = mobileNavbar.locator("button").filter({ hasText: "Vender" });
    await posNavBtn.click();
    await expect(page.locator("#pos-scroll")).toBeVisible();

    // 2. Agregar un producto al carrito
    // Seleccionar el primer artículo de catálogo en POS
    const firstProduct = page.locator("#pos-scroll article[role='button']").first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();

    // 3. Abrir la hoja modal de Cobro (CheckoutSheet)
    const checkoutBarBtn = page.getByRole("button", { name: /Cobrar/i });
    await expect(checkoutBarBtn).toBeVisible();
    await checkoutBarBtn.click();

    // Validar apertura del modal CheckoutSheet (Título: 'Cobro')
    const checkoutHeading = page.getByRole("heading", { name: "Cobro" });
    await expect(checkoutHeading).toBeVisible();

    // Configurar nombre de cliente único para trazabilidad determinista
    const testCustomer = "Cliente Test E2E Playwright";
    const customerInput = page.locator('input[placeholder="Cliente general (opcional)"]');
    await expect(customerInput).toBeVisible();
    await customerInput.fill(testCustomer);

    // Completar la venta (Botón: 'Completar venta · $...')
    const completeSaleBtn = page.getByRole("button", { name: /Completar venta/i });
    await expect(completeSaleBtn).toBeVisible();
    await completeSaleBtn.click();

    // Esperar cierre del modal tras completar la venta
    await expect(checkoutHeading).not.toBeVisible({ timeout: 10000 });

    // 4. Navegar al Historial
    const historyNavBtn = mobileNavbar.locator("button").filter({ hasText: "Historial" });
    await expect(historyNavBtn).toBeVisible();
    await historyNavBtn.click();
    await expect(page.locator("#history-scroll")).toBeVisible();

    // 5. Localizar la venta recién creada en el Historial por el nombre del cliente
    const saleCard = page.locator("#history-scroll article").filter({ hasText: testCustomer }).first();
    await expect(saleCard).toBeVisible({ timeout: 10000 });

    // 6. Probar MODIFICACIÓN con flujo obligatorio de doble confirmación
    const editBtn = saleCard.getByRole("button", { name: /Modificar/i });
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Verificar modal de edición
    const editModalHeading = page.getByRole("heading", { name: /Modificar Venta/i });
    await expect(editModalHeading).toBeVisible();

    // Modificar nombre del cliente (placeholder: 'Cliente General')
    const updatedCustomer = "Cliente E2E Modificado";
    const editCustomerInput = page.locator('input[placeholder="Cliente General"]');
    await expect(editCustomerInput).toBeVisible();
    await editCustomerInput.fill(updatedCustomer);

    // Paso 1: Clic en 'Revisar y guardar'
    const reviewBtn = page.getByRole("button", { name: /Revisar y guardar/i });
    await expect(reviewBtn).toBeVisible();
    await reviewBtn.click();

    // Paso 2: Verificar cambio al submodal de confirmación
    const confirmModalHeading = page.getByRole("heading", { name: /Confirmar Cambios/i });
    await expect(confirmModalHeading).toBeVisible();
    await expect(
      page.getByText("¿Confirmas la actualización de la venta")
    ).toBeVisible();

    // Clic en 'Confirmar' para asentar cambios
    const confirmSaveBtn = page.getByRole("button", { name: /Confirmar/i });
    await expect(confirmSaveBtn).toBeVisible();
    await confirmSaveBtn.click();

    // Esperar cierre del modal de edición
    await expect(editModalHeading).not.toBeVisible();
    await expect(confirmModalHeading).not.toBeVisible();

    // Validar que la tarjeta en el Historial refleja el cliente actualizado
    const updatedSaleCard = page.locator("#history-scroll article").filter({ hasText: updatedCustomer }).first();
    await expect(updatedSaleCard).toBeVisible();

    // 7. Probar ELIMINACIÓN con Modal Obligatorio de Confirmación
    const deleteBtn = updatedSaleCard.getByRole("button", { name: /Eliminar/i });
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Verificar modal de confirmación de eliminación destructiva
    const deleteModalHeading = page.getByRole("heading", { name: /Eliminar Venta/i });
    await expect(deleteModalHeading).toBeVisible();
    await expect(page.getByText("Acción destructiva permanente")).toBeVisible();
    await expect(page.getByText("Restituir unidades al inventario")).toBeVisible();

    // Confirmar eliminación definitiva
    const confirmDeleteBtn = page.getByRole("button", { name: /Sí, eliminar/i });
    await expect(confirmDeleteBtn).toBeVisible();
    await confirmDeleteBtn.click();

    // Validar que el modal se cierra y la venta ya no existe en el DOM
    await expect(deleteModalHeading).not.toBeVisible();
    await expect(page.locator("#history-scroll article").filter({ hasText: updatedCustomer })).not.toBeVisible();
  });
});
