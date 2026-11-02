import { test, expect } from "@playwright/test";

test.describe("Quiral POS — Sistema Modular de Catálogo, Reordenamiento y Atributos Dinámicos", () => {
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

  test("1. Gestión, reordenamiento, eliminación de categorías predeterminadas a Respaldo y recuperación en un toque", async ({
    page,
  }) => {
    await page.goto("/");

    const mobileNavbar = page.locator("nav.liquid-glass-surface");
    await expect(mobileNavbar).toBeVisible({ timeout: 10000 });

    // Ir a Inventario
    await mobileNavbar.locator("button").filter({ hasText: "Inventario" }).click();
    await expect(page.locator("#inventory-scroll")).toBeVisible();

    // Disparar long-press / contextmenu en una píldora de categoría para abrir Organizar Categorías
    const firstCategoryPill = page
      .locator("#inventory-scroll")
      .getByRole("button", { name: "Cargadores y Cables", exact: true });
    await expect(firstCategoryPill).toBeVisible();
    await firstCategoryPill.dispatchEvent("contextmenu");

    // Verificar modal "Organizar Categorías"
    const modalHeading = page.getByRole("heading", { name: "Organizar Categorías" });
    await expect(modalHeading).toBeVisible();

    // Verificar botón Check (✓) brillante en la esquina superior derecha del modal
    const checkSaveBtn = page.locator('button[aria-label="Guardar orden de categorías"]');
    await expect(checkSaveBtn).toBeVisible();

    // Verificar que "Todos" esté fijo al inicio y la sección de fábrica al final
    await expect(page.getByText("Fija e inamovible al inicio de la barra")).toBeVisible();
    await expect(page.getByText("Valores Predeterminados Fijos (Respaldo)")).toBeVisible();

    // Eliminar una categoría predeterminada ("Power Banks / Baterías portatiles", que tiene 0 productos) de la barra activa
    const deleteDefaultCatBtn = page.locator(
      'button[aria-label="Eliminar categoría Power Banks / Baterías portatiles"]'
    );
    await expect(deleteDefaultCatBtn).toBeVisible();
    await deleteDefaultCatBtn.click();

    // Debe trasladarse a la sección inferior de Respaldo como botón interactivo de recuperación (+)
    const restoreDefaultCatBtn = page.locator(
      'button[aria-label="Recuperar categoría Power Banks / Baterías portatiles"]'
    );
    await expect(restoreDefaultCatBtn).toBeVisible();

    // Recuperarla a la barra principal con un solo toque
    await restoreDefaultCatBtn.click();
    await expect(restoreDefaultCatBtn).not.toBeVisible();
    await expect(deleteDefaultCatBtn).toBeVisible();

    // Mover la primera categoría hacia abajo y confirmar con Check (✓)
    const moveDownBtn = page.locator('button[aria-label="Bajar categoría Cargadores y Cables"]');
    await expect(moveDownBtn).toBeVisible();
    await moveDownBtn.click();

    await checkSaveBtn.click();
    await expect(modalHeading).not.toBeVisible();
  });

  test("2. Creación de familia con orden estricto de atributos por secuencia de clic, switch de nomenclatura dinámica y protección de huérfanos", async ({
    page,
  }) => {
    await page.goto("/");

    const mobileNavbar = page.locator("nav.liquid-glass-surface");
    await expect(mobileNavbar).toBeVisible({ timeout: 10000 });

    // Ir a Inventario
    await mobileNavbar.locator("button").filter({ hasText: "Inventario" }).click();
    await expect(page.locator("#inventory-scroll")).toBeVisible();

    // Abrir modal Nuevo Producto desde el TopHeader
    const addProductBtn = page.locator('button[aria-label="Nuevo producto"]');
    await expect(addProductBtn).toBeVisible();
    await addProductBtn.click();

    await expect(page.getByRole("heading", { name: "Nuevo producto" })).toBeVisible();

    // Verificar atributos adaptativos de "Power Banks / Baterías portatiles"
    const powerBankCategoryBtn = page
      .locator("#new-product-form")
      .getByRole("button", { name: "Power Banks / Baterías portatiles", exact: true });
    await expect(powerBankCategoryBtn).toBeVisible();
    await powerBankCategoryBtn.click();

    await expect(page.getByText("Capacidad (mAh):")).toBeVisible();
    await expect(page.getByText("Conexiones / Puertos:")).toBeVisible();

    // Agregar nuevo valor al vuelo con el botón (+) en Capacidad (mAh)
    const addCapacityOptionBtn = page.locator('button[aria-label="Agregar opción a Capacidad (mAh)"]');
    await expect(addCapacityOptionBtn).toBeVisible();
    await addCapacityOptionBtn.click();

    const newCapacityInput = page.locator('input[aria-label="Escribir nuevo valor para Capacidad (mAh)"]');
    await expect(newCapacityInput).toBeVisible();
    await newCapacityInput.fill("  35000mAh  "); // Probar normalización de espacios
    await newCapacityInput.press("Enter");

    // El nuevo valor normalizado debe aparecer seleccionado como píldora
    await expect(page.getByRole("button", { name: "35000mAh", exact: true })).toBeVisible();

    // Crear una nueva categoría personalizada (+ Nueva familia) con ORDEN ESTRICTO de selección de atributos:
    // 1° Potencia (W), 2° Marca
    const newFamilyBtn = page.locator('button[aria-label="Crear nueva categoría"]');
    await expect(newFamilyBtn).toBeVisible();
    await newFamilyBtn.click();

    const resetAttrOrderBtn = page.locator('button[aria-label="Reiniciar orden de atributos"]');
    await expect(resetAttrOrderBtn).toBeVisible();
    await resetAttrOrderBtn.click();

    // Seleccionar primero "Potencia (W)" (#1) y segundo "Marca" (#2)
    await page.getByRole("button", { name: "Potencia (W)", exact: true }).click();
    await page.getByRole("button", { name: "Marca", exact: true }).click();

    const newCategoryInput = page.locator('input[aria-label="Nombre de la nueva familia de productos"]');
    await expect(newCategoryInput).toBeVisible();
    await newCategoryInput.fill("  Relojes   Inteligentes  "); // Normalización automática -> "Relojes Inteligentes"

    const confirmCreateCatBtn = page.locator('button[aria-label="Confirmar creación de categoría"]');
    await confirmCreateCatBtn.click();

    // Verificar que los bloques de atributos se renderizan en el orden exacto de clic: [powers, brands]
    const attrBlocks = page.locator("#new-product-form [data-attribute-key]");
    await expect(attrBlocks.nth(0)).toHaveAttribute("data-attribute-key", "powers");
    await expect(attrBlocks.nth(1)).toHaveAttribute("data-attribute-key", "brands");

    // Probar el Switch de Control de Nomenclatura Dinámica justo debajo del nombre
    const autoNameToggle = page.locator('[data-testid="auto-append-attributes-toggle"]');
    await expect(autoNameToggle).toBeVisible();
    await expect(autoNameToggle).toHaveAttribute("aria-checked", "true");

    // Desactivar concatenación automática y escribir nombre manual limpio
    await autoNameToggle.click();
    await expect(autoNameToggle).toHaveAttribute("aria-checked", "false");

    const nameInput = page.locator('input[placeholder="Ej. Cubo iPhone 20W"]');
    await nameInput.fill("Apple Watch Series 9");

    // Cambiar un atributo con el switch apagado NO debe sobrescribir el nombre manual
    await page.locator('[data-attribute-key="brands"]').getByRole("button", { name: "Anker", exact: true }).click();
    await expect(nameInput).toHaveValue("Apple Watch Series 9");

    // Volver a activar el switch concatena automáticamente los atributos seleccionados al nombre manual
    await autoNameToggle.click();
    await expect(autoNameToggle).toHaveAttribute("aria-checked", "true");
    await expect(nameInput).toHaveValue(/Apple Watch Series 9.*Anker/);

    // Segundo campo con placeholder "$0" es Precio de venta *
    const priceInput = page.locator('input[placeholder="$0"]').nth(1);
    await priceInput.fill("1800000");

    const saveProductBtn = page.getByRole("button", { name: "Guardar producto" });
    await saveProductBtn.click();

    // Verificar que el producto fue creado en el inventario
    await expect(page.getByText(/Apple Watch Series 9/)).toBeVisible();

    // Abrir "Organizar Categorías" e intentar eliminar "Relojes Inteligentes" (que tiene 1 producto activo)
    const organizeCatBtn = page.locator('button[aria-label="Organizar categorías"]');
    await expect(organizeCatBtn).toBeVisible();
    await organizeCatBtn.click();

    await expect(page.getByRole("heading", { name: "Organizar Categorías" })).toBeVisible();

    const deleteCustomCatBtn = page.locator('button[aria-label="Eliminar categoría Relojes Inteligentes"]');
    await expect(deleteCustomCatBtn).toBeVisible();
    await deleteCustomCatBtn.click();

    // Debe dispararse la alerta de Protección contra productos huérfanos
    const orphanAlert = page.locator('div[role="alertdialog"][aria-label="Alerta de categoría con productos activos"]');
    await expect(orphanAlert).toBeVisible();
    await expect(orphanAlert).toContainText("General / Otros");

    // Confirmar el traslado a "General / Otros" y eliminación de la categoría personalizada
    const confirmOrphanMoveBtn = orphanAlert.getByRole("button", { name: "Mover a General / Otros" });
    await confirmOrphanMoveBtn.click();

    await expect(orphanAlert).not.toBeVisible();

    // Cerrar el modal con el botón Check (✓)
    await page.locator('button[aria-label="Guardar orden de categorías"]').click();

    // El producto debe seguir existiendo en el inventario bajo "General / Otros"
    await page.locator("#inventory-scroll").getByRole("button", { name: "Todos", exact: true }).click();
    await expect(page.getByText(/Apple Watch Series 9/)).toBeVisible();
  });
});
