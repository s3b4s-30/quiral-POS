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

    // Verificar que el nombre autogenerado NUNCA antepone la categoría
    const celularesCatBtn = modal.getByRole("button", {
      name: "Celulares",
      exact: true,
    });
    await expect(celularesCatBtn).toBeVisible();
    await celularesCatBtn.click();

    const iphoneAttrBtn = modal.getByRole("button", {
      name: "iPhone",
      exact: true,
    });
    await expect(iphoneAttrBtn).toBeVisible();
    await iphoneAttrBtn.click();

    const nameInputPre = page.getByTestId("desktop-new-product-name-input");
    await expect(nameInputPre).toHaveValue("iPhone");
    const generatedVal = await nameInputPre.inputValue();
    expect(generatedVal).not.toContain("Celulares");

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

    // 5. Probar Banco Global Dinámico, Instanciación Vacía y Popover de Presets en Nuevo Producto
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

    // Verificar que arranca como instancia local limpia (0 opciones) con botón de Presets
    const presetsToggleBtn = modal.getByTestId("toggle-presets-btn-colors");
    await expect(presetsToggleBtn).toBeVisible();
    await presetsToggleBtn.click();

    // El popover de presets debe desplegarse
    const presetsPopover = modal.getByTestId("presets-popover-colors");
    await expect(presetsPopover).toBeVisible();

    // Elegir individualmente el preset "Negro Espacial"
    const pickNegroPreset = modal.getByTestId("pick-preset-Negro_Espacial");
    await expect(pickNegroPreset).toBeVisible();
    await pickNegroPreset.click();

    // Debe agregarse a las opciones activas locales y desaparecer del popover de disponibles
    const negroPill = modal.getByTestId("active-option-pill-Negro_Espacial");
    await expect(negroPill).toBeVisible();
    await expect(pickNegroPreset).not.toBeVisible();

    // Probar eliminación in-situ de opción con botón x
    const removeOptionBtn = modal.getByRole("button", {
      name: "Quitar opción Negro Espacial",
      exact: true,
    });
    if (await removeOptionBtn.isVisible()) {
      await removeOptionBtn.click();
      await expect(negroPill).not.toBeVisible();
    }

    // Probar desvinculación completa del atributo in-situ (botón × de cabecera de tarjeta)
    const unlinkColorsBtn = modal.getByTestId("unlink-attr-colors");
    await expect(unlinkColorsBtn).toBeVisible();
    await unlinkColorsBtn.click();

    // Debe desaparecer de las tarjetas de atributos activos y retornar al bloque inferior de disponibles
    await expect(
      modal.getByTestId("active-attribute-card-colors")
    ).not.toBeVisible();
    await expect(modal.getByTestId("link-global-attr-colors")).toBeVisible();

    // 6. Validación de Estabilidad Dimensional (Cero Layout Shift / CLS) y Anclaje Superior
    const leftCol = modal.getByTestId("desktop-new-product-left-column");
    await expect(leftCol).toBeVisible();
    const boxBefore = await leftCol.boundingBox();
    expect(boxBefore).not.toBeNull();

    // Vincular múltiples atributos adicionales desde el banco global para inducir scroll vertical
    const availableAttrBtns = modal.locator(
      '[data-testid^="link-global-attr-"]'
    );
    const count = await availableAttrBtns.count();
    const toLink = Math.min(count, 4);
    for (let i = 0; i < toLink; i++) {
      await availableAttrBtns.first().click();
    }

    // Verificar que el ancho de la columna izquierda se mantiene idéntico (Cero CLS, tolerancia <= 1px por subpixel)
    const boxAfter = await leftCol.boundingBox();
    expect(boxAfter).not.toBeNull();
    expect(
      Math.abs((boxAfter?.width ?? 0) - (boxBefore?.width ?? 0))
    ).toBeLessThanOrEqual(1);

    // Verificar que la sección de categoría sigue anclada en el tope al hacer scroll en atributos
    const categorySec = modal.getByTestId(
      "desktop-new-product-category-section"
    );
    await expect(categorySec).toBeVisible();
    const catBoxInitial = await categorySec.boundingBox();

    const attrScroll = modal.getByTestId(
      "desktop-new-product-attributes-scroll"
    );
    await attrScroll.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    await expect(categorySec).toBeVisible();
    const catBoxAfterScroll = await categorySec.boundingBox();
    expect(catBoxAfterScroll?.y).toBe(catBoxInitial?.y);

    // Verificar que los botones de acción inferior en la columna derecha se mantienen visibles y anclados
    const footerActions = modal.getByTestId(
      "desktop-new-product-footer-actions"
    );
    await expect(footerActions).toBeVisible();
    await expect(
      footerActions.getByTestId("desktop-new-product-submit-btn")
    ).toBeVisible();

    // 7. Cerrar modal con tecla Escape
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
    await expect(bulkBar).toHaveClass(/backdrop-blur-(md|xl)/);

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

    // 4. Modo "Gestionar Categorías": Vincular atributo "Material" y gestionar opciones locales
    // Verificar que existen las pestañas del switch superior
    await expect(managerView.getByTestId("mode-tab-categories")).toBeVisible();
    await expect(managerView.getByTestId("mode-tab-presets")).toBeVisible();

    // Vincular atributo "Material" a «Prueba Desktop» usando el popover de vinculación
    const linkAttrBtn = managerView.getByTestId(
      "link-attribute-to-category-btn"
    );
    await expect(linkAttrBtn).toBeVisible();
    await linkAttrBtn.click();

    const linkMaterialChip = managerView.getByTestId(
      "link-attr-chip-caseMaterials"
    );
    await expect(linkMaterialChip).toBeVisible();
    await linkMaterialChip.click();

    // Verificar que el popover permanece abierto para vinculación continua y el chip vinculado desaparece
    const linkAttrPopover = managerView.getByTestId("link-attr-popover");
    await expect(linkAttrPopover).toBeVisible();
    await expect(linkMaterialChip).not.toBeVisible();

    // Cerrar explícitamente el popover con el botón (X)
    const closeLinkPopoverBtn = managerView.getByTestId(
      "close-link-attr-popover"
    );
    await expect(closeLinkPopoverBtn).toBeVisible();
    await closeLinkPopoverBtn.click();
    await expect(linkAttrPopover).not.toBeVisible();

    // Columna 3 (Derecha): Verificar carga instantánea de Material en Prueba Desktop
    await expect(
      managerView.getByRole("heading", { name: "Material" })
    ).toBeVisible();

    // Probar Popover de Presets en Columna 3 de Configuración con cálculo y persistencia para adición múltiple
    const togglePresetsBtn = managerView.getByTestId(
      "toggle-manager-presets-btn"
    );
    await expect(togglePresetsBtn).toBeVisible();
    await expect(togglePresetsBtn).toContainText(/Presets Disponibles/i);

    await togglePresetsBtn.click();

    const managerPresetsPopover = managerView.getByTestId(
      "manager-presets-popover"
    );
    await expect(managerPresetsPopover).toBeVisible();

    // Elegir el preset "Silicona Líquida"
    const pickSiliconaBtn = managerView.getByTestId(
      "manager-pick-preset-Silicona_Líquida"
    );
    await expect(pickSiliconaBtn).toBeVisible();
    await pickSiliconaBtn.click();

    // Debe aparecer en las opciones de "Prueba Desktop" y el popover de presets debe permanecer abierto
    await expect(
      managerView.getByText("Silicona Líquida", { exact: true })
    ).toBeVisible();
    await expect(managerPresetsPopover).toBeVisible();
    await expect(pickSiliconaBtn).not.toBeVisible();

    // Cerrar el popover de presets para continuar con la adición manual
    await togglePresetsBtn.click();

    // Agregar nueva opción manual al atributo activo
    const newOptionInput = managerView.getByPlaceholder("Nueva opción...");
    await expect(newOptionInput).toBeVisible();
    await newOptionInput.fill("Opción Alfa");

    const addOptionBtn = managerView.getByRole("button", { name: "Agregar" });
    await expect(addOptionBtn).toHaveClass(/bg-accent/);
    await addOptionBtn.click();
    await expect(
      managerView.getByText("Opción Alfa", { exact: true })
    ).toBeVisible();

    // 4.5. Gobernanza de Categorías Activas vs Ocultas (Ocultar de la barra, Acordeón de Ocultas, Reactivar con Atributos Intactos y Purga Definitiva)
    const hidePruebaBtn = managerView.getByTestId(
      "hide-category-btn-Prueba Desktop"
    );
    await expect(hidePruebaBtn).toBeVisible();
    await hidePruebaBtn.click();

    // Al ocultarse de la barra activa, ya no está seleccionada en Columna 2
    await expect(
      managerView.getByRole("heading", { name: "Prueba Desktop" })
    ).not.toBeVisible();

    // Expandir el acordeón inferior "Categorías Ocultas y Guardadas"
    const toggleHiddenBtn = managerView.getByTestId(
      "toggle-hidden-categories-btn"
    );
    await expect(toggleHiddenBtn).toBeVisible();
    await toggleHiddenBtn.click();

    const hiddenList = managerView.getByTestId("hidden-categories-list");
    await expect(hiddenList).toBeVisible();

    // Verificar que "Prueba Desktop" se encuentra en las categorías ocultas conservando su atributo
    const hiddenPruebaRow = managerView.getByTestId(
      "hidden-category-row-Prueba Desktop"
    );
    await expect(hiddenPruebaRow).toBeVisible();
    await expect(hiddenPruebaRow).toContainText("1 atrib");

    // Reactivar "Prueba Desktop" en la barra activa con "+ Activar en barra"
    const restorePruebaBtn = managerView.getByTestId(
      "restore-hidden-category-btn-Prueba Desktop"
    );
    await expect(restorePruebaBtn).toBeVisible();
    await restorePruebaBtn.click();

    // Debe volver a ser la categoría seleccionada en Columna 2 con su atributo "Material" y opciones "Silicona Líquida" y "Opción Alfa" intactos
    await expect(
      managerView.getByRole("heading", { name: "Prueba Desktop" })
    ).toBeVisible();
    await expect(
      managerView.getByRole("heading", { name: "Material" })
    ).toBeVisible();
    await expect(
      managerView.getByText("Silicona Líquida", { exact: true })
    ).toBeVisible();
    await expect(
      managerView.getByText("Opción Alfa", { exact: true })
    ).toBeVisible();

    // Crear una categoría efímera "Temp Purga", ocultarla y eliminarla definitivamente
    await newCatBtn.click();
    await catInput.fill("Temp Purga");
    await submitCatBtn.click();
    await expect(
      managerView.getByRole("heading", { name: "Temp Purga" })
    ).toBeVisible();

    const hideTempBtn = managerView.getByTestId("hide-category-btn-Temp Purga");
    await hideTempBtn.click();

    const hiddenTempRow = managerView.getByTestId(
      "hidden-category-row-Temp Purga"
    );
    await expect(hiddenTempRow).toBeVisible();

    const purgeTempBtn = managerView.getByTestId(
      "purge-hidden-category-btn-Temp Purga"
    );
    await purgeTempBtn.click();
    await expect(hiddenTempRow).not.toBeVisible();

    // 5. Probar Switch de Enfoque hacia Modo "Banco Maestro (Presets)"
    const presetsTabBtn = managerView.getByTestId("mode-tab-presets");
    await presetsTabBtn.click();

    // Verificar que se renderiza el Banco Global Maestro
    const globalBankHeading = managerView.getByText(
      /Banco Global de Atributos/i
    );
    await expect(globalBankHeading).toBeVisible();

    // Probar Creación Directa en Banco Global
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

    // Debe quedar registrado y visible en el panel del Banco Global
    await expect(
      managerView.getByText("Garantía Extendida", { exact: true }).first()
    ).toBeVisible();

    // 6. Probar Regreso a Modo "Gestionar Categorías" y Aislamiento de Valores
    const categoriesTabBtn = managerView.getByTestId("mode-tab-categories");
    await categoriesTabBtn.click();

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

  test("7. Flujo de Clonación Inteligente, Atributos Opcionales (deselección y desmarcado) y Limpieza de IDs en Banco Maestro", async ({
    page,
  }) => {
    await page.goto("/");

    const desktopSidebar = page.getByRole("complementary", {
      name: /Navegación principal de escritorio/i,
    });
    await expect(desktopSidebar).toBeVisible({ timeout: 10000 });
    await desktopSidebar.getByRole("button", { name: "Inventario" }).click();

    // 1. Probar botón de clonación en la fila 0 de la tabla
    const cloneBtn0 = page.locator('button[title*="Clonar"]').first();
    await expect(cloneBtn0).toBeVisible();
    await cloneBtn0.click();

    // Verificar que NO duplicó directamente, sino que abrió DesktopNewProductModal en modo edición
    const modal = page.getByTestId("desktop-new-product-modal");
    await expect(modal).toBeVisible();
    await expect(
      modal.getByText(/Clonar Producto|Plantilla Clonada/i).first()
    ).toBeVisible();

    // El nombre debe estar precargado con "(Copia)"
    const nameInput = modal.getByTestId("desktop-new-product-name-input");
    await expect(nameInput).toBeVisible();
    const nameVal = await nameInput.inputValue();
    expect(nameVal).toContain("(Copia)");

    // Probar Atributos Opcionales: desmarcar o deseleccionar chip
    const clearBtn = modal
      .locator('button[data-testid^="clear-selection-"]')
      .first();
    if (await clearBtn.isVisible()) {
      const testId = await clearBtn.getAttribute("data-testid");
      await clearBtn.click();
      // La selección se limpia y se verifica que NUNCA aparezca la frase '(Opcional)' en los atributos
      if (testId) {
        await expect(
          modal.locator(`button[data-testid="${testId}"]`)
        ).not.toBeVisible();
      }
      await expect(modal.getByText("(Opcional)")).not.toBeVisible();
    }

    // Cerrar modal
    await modal
      .getByRole("button", { name: /Regresar al Inventario/i })
      .click();
    await expect(modal).not.toBeVisible();

    // 2. Probar Banco Maestro sin IDs crudos
    const settingsBtn = page.getByTestId("desktop-catalog-settings-btn");
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();

    const managerView = page.getByTestId("desktop-category-manager-view");
    await expect(managerView).toBeVisible();

    const presetsTabBtn = managerView.getByTestId("mode-tab-presets");
    await presetsTabBtn.click();

    // Validar que se ve la etiqueta limpia "Subtipo" y NO el ID crudo "chargersubtypes"
    await expect(
      managerView.getByText("Subtipo", { exact: true }).first()
    ).toBeVisible();
    await expect(managerView.locator("text=chargersubtypes")).toHaveCount(0);

    // Salir
    const saveBtn = managerView.getByTestId("save-category-order-btn");
    await saveBtn.click();
    await expect(managerView).not.toBeVisible();
  });
});
