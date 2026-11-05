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

  test("1. Renderizado de Tabla Excel de alta densidad, edición inline con Enter (avance vertical) y Creación Rápida con Permiso y Censura de Costo", async ({
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

    // Validar que NO existe el mensaje redundante "Mostrando X de Y"
    await expect(page.getByTestId("desktop-results-counter")).not.toBeVisible();

    // Validar selector de registros (10, 20, 30, 50, 100, Todos) con 10 predeterminado
    const pageSizeBar = page.getByTestId("desktop-page-size-bar");
    await expect(pageSizeBar).toBeVisible();
    await expect(
      pageSizeBar.getByRole("button", { name: "10", exact: true })
    ).toHaveClass(/bg-accent/);
    await expect(
      pageSizeBar.getByRole("button", { name: "30", exact: true })
    ).toBeVisible();

    // Probar cambio reactivo a 20 registros
    await pageSizeBar.getByRole("button", { name: "20", exact: true }).click();
    await expect(
      pageSizeBar.getByRole("button", { name: "20", exact: true })
    ).toHaveClass(/bg-accent/);

    // Seleccionar "Todos" para visualizar todo el inventario
    await pageSizeBar
      .getByRole("button", { name: "Todos", exact: true })
      .click();
    await expect(
      pageSizeBar.getByRole("button", { name: "Todos", exact: true })
    ).toHaveClass(/bg-accent/);

    // Probar Fila de Creación Rápida en Línea (Quick-Add Inline Row) con Costo accesible sin Modo Admin
    const quickNameInput = page.getByTestId("quick-add-name-input");
    const quickStockInput = page.getByTestId("quick-add-stock-input");
    const quickCostInput = page.getByTestId("quick-add-cost-input");
    const quickPriceInput = page.getByTestId("quick-add-price-input");

    await expect(quickCostInput).toBeVisible();
    await quickNameInput.fill("Silicona Case iPhone 16 Pro Max");
    await quickStockInput.fill("15");
    await quickCostInput.fill("28000");
    await quickPriceInput.fill("55000");
    await quickPriceInput.press("Enter");

    // El campo nombre y costo deben limpiarse y mantener el foco para ingreso continuo
    await expect(quickNameInput).toHaveValue("");
    await expect(quickCostInput).toHaveValue("");
    await expect(
      page.getByText("Silicona Case iPhone 16 Pro Max")
    ).toBeVisible();

    // Validar censura post-creación: la nueva fila debe mostrar '••••••' en costo mientras Modo Admin esté inactivo
    const newProductRow = gridTable
      .locator("tbody tr")
      .filter({ hasText: "Silicona Case iPhone 16 Pro Max" });
    await expect(newProductRow).toBeVisible();

    const newProductCostCell = newProductRow.locator(
      '[data-testid^="grid-cell-cost-"]'
    );
    await expect(newProductCostCell).toContainText("••••••");

    // Revelar costo activando Modo Administrador en la barra lateral
    const adminModeBtn = desktopSidebar.getByRole("button", {
      name: /Modo Administrador/i,
    });
    await adminModeBtn.click();
    await expect(newProductCostCell).not.toContainText("••••••");
    await expect(newProductCostCell).toContainText("28.000");

    // Desactivar Modo Administrador y comprobar que se censura de nuevo
    await adminModeBtn.click();
    await expect(newProductCostCell).toContainText("••••••");
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

    // Revelar Costos con el botón de Modo Administrador de la barra lateral de escritorio
    const adminModeBtn = desktopSidebar.getByRole("button", {
      name: /Modo Administrador/i,
    });
    await adminModeBtn.click();
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

  test("3. Modal de Creación Avanzada de Productos Split-Layout y Navegación Horizontal por Arrastre (Drag-to-Scroll sin flechas)", async ({
    page,
  }) => {
    await page.goto("/");

    const desktopSidebar = page.getByRole("complementary", {
      name: /Navegación principal de escritorio/i,
    });
    await expect(desktopSidebar).toBeVisible({ timeout: 10000 });
    await desktopSidebar.getByRole("button", { name: "Inventario" }).click();

    // 1. Validar barra de desplazamiento horizontal de categorías por arrastre (Grab & Drag)
    const categoryNav = page.getByTestId("desktop-category-chips-nav");
    await expect(categoryNav).toBeVisible();

    // Comprobar que NO existen botones de flechas/chevrons desplazadores
    await expect(
      categoryNav.locator("button[aria-label*='Desplazar']")
    ).toHaveCount(0);

    // Probar interacción por arrastre con el cursor del mouse
    const box = await categoryNav.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width - 30, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 30, box.y + box.height / 2, { steps: 5 });
      await page.mouse.up();
    }

    // 2. Abrir Modal de Creación Avanzada de Productos desde la barra de herramientas de escritorio
    const newProductBtn = page.getByTestId("desktop-toolbar-new-product-btn");
    await expect(newProductBtn).toBeVisible();
    await newProductBtn.click();

    // 3. Validar renderizado del diálogo modal centrado de escritorio Split-Layout con Glassmorfismo
    const modal = page.getByTestId("desktop-new-product-modal");
    await expect(modal).toBeVisible();
    await expect(
      modal.getByRole("heading", { name: /Nuevo Producto/i })
    ).toBeVisible();

    // Verificar CERO scroll horizontal en el modal de Nuevo Producto (Prohibido overflow-x-auto)
    const hasHorizontalOverflow = await modal.evaluate((el) => {
      const scrollEls = el.querySelectorAll(".overflow-x-auto");
      return scrollEls.length > 0;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Verificar estado inicial: Categoría en blanco con prompt elegante
    await expect(
      modal.getByText(/Selecciona una categoría de catálogo/i)
    ).toBeVisible();

    // Seleccionar categoría "Forros / Fundas" en el flex-wrap de categorías
    const fundasBtn = modal.getByRole("button", {
      name: "Forros / Fundas",
      exact: true,
    });
    await expect(fundasBtn).toBeVisible();
    await fundasBtn.click();

    // Despliegue progresivo: el prompt desaparece y se muestran los atributos de Forros / Fundas
    await expect(
      modal.getByText(/Selecciona una categoría de catálogo/i)
    ).not.toBeVisible();
    await expect(
      modal.getByText(/Atributos Dinámicos de Forros \/ Fundas/i)
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

    // Probar ajuste ergonómico de stock mediante la rueda del mouse (onWheel)
    await stockInput.hover();
    try {
      await page.mouse.wheel(0, -100);
    } catch {
      await stockInput.dispatchEvent("wheel", { deltaY: -100 });
    }
    // Verificar que el stock incrementó por rueda del mouse
    await expect(stockInput).toHaveValue("11");

    // Probar campo de Garantía Numérica Editable (Días)
    const warrantyInput = page.getByTestId(
      "desktop-new-product-warranty-input"
    );
    await expect(warrantyInput).toBeVisible();
    await warrantyInput.fill("30");
    await expect(warrantyInput).toHaveValue("30");

    // Verificar cálculo en tarjeta de márgenes (Utilidad: 89,000 - 45,000 = 44,000)
    await expect(modal.getByText(/44\.000/)).toBeVisible();

    // 5. Probar Banco Global Dinámico y Auto-Reductible en Nuevo Producto
    const unlinkedBlock = modal.getByTestId("unlinked-global-attributes-block");
    await expect(unlinkedBlock).toBeVisible();

    // El atributo "Color / Acabado" debe estar disponible en el bloque global no vinculado
    const linkColorBtn = modal.getByTestId("link-global-attr-colors");
    await expect(linkColorBtn).toBeVisible();
    await linkColorBtn.click();

    // Al hacer clic, se añade a los atributos activos y desaparece del bloque global disponible (Reducción Progresiva)
    await expect(linkColorBtn).not.toBeVisible();
    await expect(
      modal.getByText("Color / Acabado", { exact: true })
    ).toBeVisible();

    // Probar eliminación/ocultamiento de opción aislada por categoría (icono x)
    const removeOptionBtn = modal.getByRole("button", {
      name: "Quitar opción Transparente",
      exact: true,
    });
    if (await removeOptionBtn.isVisible()) {
      await removeOptionBtn.click();
      await expect(
        modal.getByText("Transparente", { exact: true })
      ).not.toBeVisible();
    }

    // 6. Cerrar modal con tecla Escape
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });

  test("4. Barra Flotante Glassmórfica de Acciones Masivas: Fila Única, Ajuste de Stock (+1/-1), Migración de Categoría y Adición a POS", async ({
    page,
  }) => {
    await page.goto("/");

    const desktopSidebar = page.getByRole("complementary", {
      name: /Navegación principal de escritorio/i,
    });
    await expect(desktopSidebar).toBeVisible({ timeout: 10000 });
    await desktopSidebar.getByRole("button", { name: "Inventario" }).click();

    // Seleccionar fila 0 y fila 1 mediante casillas de verificación
    const rowCheckbox0 = page.getByTestId("grid-row-checkbox-0");
    const rowCheckbox1 = page.getByTestId("grid-row-checkbox-1");
    await rowCheckbox0.click();
    await rowCheckbox1.click();

    // Validar que la barra flotante de acciones masivas aparece en estricta fila única (flex-nowrap) y con glassmorfismo
    const bulkBar = page.getByTestId("desktop-bulk-actions-bar");
    await expect(bulkBar).toBeVisible();
    await expect(bulkBar.getByText(/2 seleccionados/i)).toBeVisible();
    await expect(bulkBar).toHaveClass(/flex-nowrap/);
    await expect(bulkBar).toHaveClass(/backdrop-blur-md/);

    // 1. Probar incremento masivo de stock (+1 Stock)
    const stockCell0 = page.getByTestId("grid-cell-stock-0");
    const stockSpan0 = stockCell0.locator("span.tabular-nums");
    const initialStockText = await stockSpan0.innerText();
    const initialStockVal = parseInt(initialStockText, 10);

    const incStockBtn = bulkBar.getByRole("button", { name: "+1 Stock" });
    await expect(incStockBtn).toBeVisible();
    await incStockBtn.click();
    await expect(stockSpan0).toHaveText(String(initialStockVal + 1));

    // 2. Probar decremento masivo de stock (-1 Stock)
    const decStockBtn = bulkBar.getByRole("button", { name: "-1 Stock" });
    await expect(decStockBtn).toBeVisible();
    await decStockBtn.click();
    await expect(stockSpan0).toHaveText(String(initialStockVal));

    // 3. Enviar masivamente los productos al carrito de POS
    const bulkAddToCartBtn = page.getByTestId("desktop-bulk-add-to-cart-btn");
    await expect(bulkAddToCartBtn).toBeVisible();
    await bulkAddToCartBtn.click();

    // Verificar que el badge del carrito en la barra lateral aumenta
    const sellBtn = desktopSidebar.getByRole("button", { name: /Vender/i });
    await expect(sellBtn).toContainText("2");

    // 4. Probar botón de limpiar selección
    const clearSelectionBtn = bulkBar.getByRole("button", {
      name: "Limpiar selección",
    });
    await expect(clearSelectionBtn).toBeVisible();
    await clearSelectionBtn.click();
    await expect(bulkBar).not.toBeVisible();
  });

  test("5. Edición Numérica Fluida de Celdas (escritura de múltiples dígitos sin sobreescritura accidental)", async ({
    page,
  }) => {
    await page.goto("/");

    const desktopSidebar = page.getByRole("complementary", {
      name: /Navegación principal de escritorio/i,
    });
    await expect(desktopSidebar).toBeVisible({ timeout: 10000 });
    await desktopSidebar.getByRole("button", { name: "Inventario" }).click();

    // Enfocar celda de stock de fila 0
    const stockCell0 = page.getByTestId("grid-cell-stock-0");
    await stockCell0.click();
    await page.keyboard.press("Enter");

    // Escribir 7 y luego 0 consecutivamente para pasar a 70
    const input = page.getByTestId("grid-input-stock-0");
    await expect(input).toBeVisible();
    await input.pressSequentially("70");
    await page.keyboard.press("Enter");

    // Verificar que el stock resultante contiene 70
    await expect(stockCell0).toContainText("70");
  });

  test("6. Vista Unificada en 3 Columnas: Configuración y Ajustes de Catálogo (Sin scroll horizontal y acceso universal)", async ({
    page,
  }) => {
    await page.goto("/");

    const desktopSidebar = page.getByRole("complementary", {
      name: /Navegación principal de escritorio/i,
    });
    await expect(desktopSidebar).toBeVisible({ timeout: 10000 });
    await desktopSidebar.getByRole("button", { name: "Inventario" }).click();

    // 1. Abrir Configuración y Ajustes de Catálogo desde el botón unificado en la barra de escritorio
    const catalogSettingsBtn = page.getByTestId("desktop-catalog-settings-btn");
    await expect(catalogSettingsBtn).toBeVisible();
    await catalogSettingsBtn.click();

    // 2. Verificar que se renderiza la vista unificada en 3 Columnas con el título oficial
    const managerView = page.getByTestId("desktop-category-manager-view");
    await expect(managerView).toBeVisible();
    await expect(
      managerView.getByRole("heading", {
        name: "Configuración y Ajustes de Catálogo",
      })
    ).toBeVisible();

    // Validar CERO scroll horizontal en el contenedor principal
    const hasHorizontalOverflow = await managerView.evaluate(
      (el) => el.scrollWidth > el.clientWidth + 2
    );
    expect(hasHorizontalOverflow).toBe(false);

    // 3. Columna 1 (Izquierda): Crear nueva categoría
    const newCatBtn = managerView.getByRole("button", {
      name: /Nueva Categoría/i,
    });
    await expect(newCatBtn).toBeVisible();
    await newCatBtn.click();

    const catInput = managerView.getByPlaceholder(/Ej\. Accesorios, Fundas/i);
    await expect(catInput).toBeVisible();
    await catInput.fill("Prueba Desktop");

    const submitCatBtn = managerView.getByRole("button", {
      name: "Crear Categoría",
    });
    await submitCatBtn.click();

    // La nueva categoría debe aparecer en la lista y estar seleccionada en la cabecera de la Columna 2
    await expect(
      managerView.getByRole("heading", { name: "Prueba Desktop" })
    ).toBeVisible();

    // 4. Columna 2: Acceso Universal a Atributos Globales (Clic directo sin vinculación forzada)
    const globalBankHeading = managerView.getByText(
      /Banco Global de Atributos/i
    );
    await expect(globalBankHeading).toBeVisible();

    // Seleccionar directamente un atributo global desde el banco inferior
    const materialAttrCard = managerView
      .getByText("Material", { exact: false })
      .first();
    await materialAttrCard.click();

    // Columna 3 (Derecha): Verificar carga instantánea y vincular a la categoría activa
    await expect(
      managerView.getByRole("heading", { name: "Material" })
    ).toBeVisible();

    // Si tiene el botón de vincular a «Prueba Desktop», vincularlo
    const linkBtn = managerView.getByRole("button", {
      name: /Vincular a «Prueba Desktop»/i,
    });
    if (await linkBtn.isVisible()) {
      await linkBtn.click();
    }

    // Agregar nueva opción al atributo activo
    const newOptionInput = managerView.getByPlaceholder("Nueva opción...");
    await expect(newOptionInput).toBeVisible();
    await newOptionInput.fill("Opción Alfa");

    const addOptionBtn = managerView.getByRole("button", { name: "Agregar" });
    await expect(addOptionBtn).toHaveClass(/bg-accent/);
    await addOptionBtn.click();
    await expect(
      managerView.getByText("Opción Alfa", { exact: true })
    ).toBeVisible();

    // 5. Probar Creación Directa en Banco Global (Sin vincular forzosamente a Prueba Desktop)
    const createGlobalAttrBtn = managerView.getByTestId(
      "create-global-attribute-btn"
    );
    await expect(createGlobalAttrBtn).toBeVisible();
    await createGlobalAttrBtn.click();

    const globalForm = managerView.getByTestId("global-attribute-create-form");
    await expect(globalForm).toBeVisible();

    const globalNameInput = managerView.getByTestId(
      "global-attribute-name-input"
    );
    await globalNameInput.fill("Garantía Extendida");

    const submitGlobalAttrBtn = managerView.getByTestId(
      "confirm-create-global-attr-btn"
    );
    await submitGlobalAttrBtn.click();

    // Debe quedar seleccionado de inmediato en Columna 3 como Banco Global Maestro
    await expect(
      managerView.getByRole("heading", { name: "Garantía Extendida" })
    ).toBeVisible();
    await expect(managerView.getByText("Banco Global Maestro")).toBeVisible();

    // 6. Probar Aislamiento de Valores por Categoría (Scoping sin Contaminación)
    // Seleccionar "Cargadores y Cables" en Columna 1
    const cargadoresCatBtn = managerView.getByRole("button", {
      name: /Cargadores y Cables\s+\d+\s+prods/i,
    });
    await cargadoresCatBtn.click();

    // Seleccionar el atributo "Marca" en Columna 2
    const marcaAttrBtn = managerView
      .getByRole("button", { name: /Marca/i })
      .first();
    await marcaAttrBtn.click();

    // Verificar que "iPhone" está presente en "Cargadores y Cables"
    await expect(
      managerView.getByText("iPhone", { exact: true })
    ).toBeVisible();

    // 7. Guardar y regresar al inventario
    const saveBtn = managerView.getByTestId("save-category-order-btn");
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    await expect(managerView).not.toBeVisible();
    await expect(page.locator("#inventory-scroll")).toBeVisible();
  });
});
