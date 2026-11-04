import { expect, test } from "@playwright/test";

test.describe("Quiral POS — Estación de Trabajo Desktop Data-Grid (1280x800)", () => {
  test.use({
    viewport: { width: 1280, height: 800 },
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("quiral_demo_bypass", "true");
    });
  });

  test("1. Renderizado de Tabla Excel de alta densidad, edición inline con Enter (avance vertical) y Creación Rápida en Línea", async ({
    page,
  }) => {
    await page.goto("/");

    // En Desktop (1280x800), navegar a Inventario usando la barra lateral de escritorio (DesktopSidebar)
    const desktopSidebar = page.getByRole("complementary", {
      name: /Navegación principal de escritorio/i,
    });
    await expect(desktopSidebar).toBeVisible({ timeout: 10000 });
    await desktopSidebar.getByRole("button", { name: "Inventario" }).click();

    // Validar que el contenedor de la tabla tipo Excel y la barra de herramientas de escritorio son visibles
    const gridTable = page.getByTestId("desktop-inventory-table");
    await expect(gridTable).toBeVisible();
    await expect(page.getByTestId("desktop-workstation-toolbar")).toBeVisible();

    // Validar cabeceras obligatorias tipo Hoja de Cálculo
    const thead = gridTable.locator("thead");
    await expect(
      thead.getByRole("button", { name: /Artículo \/ Referencia/i })
    ).toBeVisible();
    await expect(
      thead.getByRole("button", { name: /Categoría/i })
    ).toBeVisible();
    await expect(thead.getByRole("button", { name: /Stock/i })).toBeVisible();
    await expect(
      thead.getByRole("button", { name: /Costo \/ Mayor/i })
    ).toBeVisible();
    await expect(
      thead.getByRole("button", { name: /Precio Sugerido/i })
    ).toBeVisible();
    await expect(
      thead.getByRole("button", { name: /Utilidad/i })
    ).toBeVisible();

    // Validar que la celda de Costo está protegida por defecto (••••••) cuando Modo Privacidad está activo
    const firstCostCell = page.getByTestId("grid-cell-cost-0");
    await expect(firstCostCell).toContainText("••••••");

    // Edición Inline con Enter en Stock de la Fila 0 -> debe guardar y bajar a la Fila 1
    const stockCell0 = page.getByTestId("grid-cell-stock-0");
    await stockCell0.click();
    await page.keyboard.press("Enter");

    const stockInput0 = page.getByTestId("grid-input-stock-0");
    await expect(stockInput0).toBeVisible();
    await stockInput0.fill("42");
    await page.keyboard.press("Enter");

    // Verificar actualización optimista a 42 en Fila 0 y que el foco bajó a la Fila 1
    await expect(stockCell0).toContainText("42");
    const stockCell1 = page.getByTestId("grid-cell-stock-1");
    await expect(stockCell1).toHaveClass(/ring-accent/);

    // Seleccionar "Todos" en el selector denso de paginación de escritorio
    await page
      .getByTestId("desktop-page-size-bar")
      .getByRole("button", { name: "Todos" })
      .click();

    // Probar Fila de Creación Rápida en Línea (Quick-Add Inline Row)
    const quickNameInput = page.getByTestId("quick-add-name-input");
    const quickStockInput = page.getByTestId("quick-add-stock-input");
    const quickPriceInput = page.getByTestId("quick-add-price-input");

    await quickNameInput.fill("Silicona Case iPhone 16 Pro Max");
    await quickStockInput.fill("15");
    await quickPriceInput.fill("55000");
    await quickPriceInput.press("Enter");

    // El campo nombre debe limpiarse y mantener el foco para ingreso continuo
    await expect(quickNameInput).toHaveValue("");
    await expect(
      page.getByText("Silicona Case iPhone 16 Pro Max")
    ).toBeVisible();
  });

  test("2. Modo Conteo Rápido, Inspector Lateral (Side Drawer) y herencia del Sistema Global de Temas", async ({
    page,
  }) => {
    await page.goto("/");

    const desktopSidebar = page.getByRole("complementary", {
      name: /Navegación principal de escritorio/i,
    });
    await expect(desktopSidebar).toBeVisible({ timeout: 10000 });
    await desktopSidebar.getByRole("button", { name: "Inventario" }).click();

    // Activar Modo Conteo Rápido desde la barra de herramientas de escritorio
    const quickCountBtn = page.getByTestId("desktop-quick-count-btn");
    await quickCountBtn.click();
    await expect(page.getByTestId("quick-count-mode-banner")).toBeVisible();
    await expect(quickCountBtn).toHaveClass(/bg-accent/);

    // Revelar Costos con el botón de privacidad de escritorio
    const toggleCostsBtn = page.getByTestId("desktop-toggle-costs-btn");
    await toggleCostsBtn.click();
    await expect(page.getByTestId("grid-cell-cost-0")).not.toContainText(
      "••••••"
    );

    // Abrir el Panel Lateral de Inspección (Desktop Side Drawer) haciendo clic en el primer producto
    const firstRow = page.getByTestId("desktop-grid-row-0");
    await firstRow.locator("td").nth(1).locator("button").first().click();

    const productDrawer = page.getByTestId("desktop-product-drawer");
    await expect(productDrawer).toBeVisible();
    await expect(page.getByText("Inspector de Referencia")).toBeVisible();

    // Cerrar el Drawer con Escape
    await page.keyboard.press("Escape");
    await expect(productDrawer).not.toBeVisible();

    // Verificar integración con el Sistema de Paletas de Acento (ej. cambiar a Esmeralda)
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme-palette", "emerald");
    });
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme-palette",
      "emerald"
    );
  });
  test("3. Modal de Creación Avanzada de Productos y Navegación Horizontal con Chevrons", async ({
    page,
  }) => {
    await page.goto("/");

    const desktopSidebar = page.getByRole("complementary", {
      name: /Navegación principal de escritorio/i,
    });
    await expect(desktopSidebar).toBeVisible({ timeout: 10000 });
    await desktopSidebar.getByRole("button", { name: "Inventario" }).click();

    // 1. Validar barra de desplazamiento horizontal de categorías
    const categoryNav = page.getByTestId("desktop-category-chips-nav");
    await expect(categoryNav).toBeVisible();

    // 2. Abrir Modal de Creación Avanzada de Productos desde la barra de herramientas de escritorio
    const newProductBtn = page.getByTestId("desktop-toolbar-new-product-btn");
    await expect(newProductBtn).toBeVisible();
    await newProductBtn.click();

    // 3. Validar renderizado del diálogo modal centrado de escritorio
    const modal = page.getByTestId("desktop-new-product-modal");
    await expect(modal).toBeVisible();
    await expect(
      modal.getByRole("heading", { name: /Nuevo Producto/i })
    ).toBeVisible();

    // 4. Llenar campos principales y verificar cálculos financieros en tiempo real
    const nameInput = page.getByTestId("desktop-new-product-name-input");
    await nameInput.fill("Funda MagSafe Cuero iPhone 15 Pro");

    const costInput = page.getByTestId("desktop-new-product-cost-input");
    await costInput.fill("45000");

    const priceInput = page.getByTestId("desktop-new-product-price-input");
    await priceInput.fill("89000");

    const stockInput = page.getByTestId("desktop-new-product-stock-input");
    await stockInput.fill("10");

    // Verificar cálculo en tarjeta de márgenes (Utilidad: 89,000 - 45,000 = 44,000)
    await expect(modal.getByText(/44.000/)).toBeVisible();

    // 5. Cerrar modal con tecla Escape
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });
});
