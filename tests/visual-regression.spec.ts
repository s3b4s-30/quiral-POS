import { test, expect } from "@playwright/test";

test.describe("Quiral POS — Pruebas de Regresión Visual y UI/UX (Apple HIG)", () => {
  test.use({
    viewport: { width: 390, height: 844 }, // iPhone 14 Standalone
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  });

  test.beforeEach(async ({ page }) => {
    // Iniciar con bypass de demo para acceder a las vistas del sistema
    await page.addInitScript(() => {
      localStorage.setItem("quiral_demo_bypass", "true");
    });
  });

  test("1. Verificación del título principal exacto en el HTML", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Quiral POS");
  });

  test("2. Inversión de campos financieros y valores por defecto en 'Nuevo Producto'", async ({ page }) => {
    await page.goto("/");

    // Navegar a inventario
    const mobileNavbar = page.locator("nav.liquid-glass-surface");
    await expect(mobileNavbar).toBeVisible({ timeout: 10000 });
    await mobileNavbar.locator("button").filter({ hasText: "Inventario" }).click();

    // Abrir modal de nuevo producto (botón con Plus en cabecera)
    const addProductBtn = page.locator('button[aria-label="Nuevo producto"]');
    await expect(addProductBtn).toBeVisible();
    await addProductBtn.click();

    // Validar título de la hoja modal
    await expect(page.getByRole("heading", { name: "Nuevo producto" })).toBeVisible();

    // Validar orden de campos financieros: 'Costo de compra' a la izquierda, 'Precio de venta *' a la derecha
    const labels = page.locator("form#new-product-form label");
    const labelsText = await labels.allInnerTexts();

    const costIndex = labelsText.findIndex((t) => t.includes("Costo de compra"));
    const priceIndex = labelsText.findIndex((t) => t.includes("Precio de venta"));

    expect(costIndex).toBeGreaterThan(-1);
    expect(priceIndex).toBeGreaterThan(-1);
    expect(costIndex).toBeLessThan(priceIndex);

    // Validar etiqueta 'Stock inicial' con valor por defecto 1
    const stockLabel = page.locator("form#new-product-form label").filter({ hasText: "Stock inicial" });
    await expect(stockLabel).toBeVisible();

    const stockInput = page.locator('input[placeholder="1"]');
    await expect(stockInput).toBeVisible();
    await expect(stockInput).toHaveValue("1");

    // Validar garantía por defecto 15 días
    const warrantyInput = page.locator('input[placeholder="15"]');
    await expect(warrantyInput).toBeVisible();
    await expect(warrantyInput).toHaveValue("15");
  });

  test("3. Reactividad dinámica de subtipos de cargadores (Cubo, Cable, Cargador Completo)", async ({ page }) => {
    await page.goto("/");

    const mobileNavbar = page.locator("nav.liquid-glass-surface");
    await expect(mobileNavbar).toBeVisible({ timeout: 10000 });
    await mobileNavbar.locator("button").filter({ hasText: "Inventario" }).click();

    const addProductBtn = page.locator('button[aria-label="Nuevo producto"]');
    await addProductBtn.click();

    // 3.1 Estado inicial: Cubo seleccionado
    const cuboBtn = page.locator("button").filter({ hasText: /^Cubo$/ });
    await expect(cuboBtn).toBeVisible();
    await expect(page.getByText("Potencia:")).toBeVisible();
    await expect(page.getByText("Acabado del cable:")).not.toBeVisible();

    // 3.2 Seleccionar Cable
    const cableBtn = page.locator("button").filter({ hasText: /^Cable$/ });
    await cableBtn.click();

    // Potencia se oculta, acabado de cable se muestra con opciones Normal y Trenzado
    await expect(page.getByText("Potencia:")).not.toBeVisible();
    await expect(page.getByText("Acabado del cable:")).toBeVisible();
    await expect(page.getByRole("button", { name: "Normal", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Trenzado", exact: true })).toBeVisible();

    // 3.3 Seleccionar Cargador Completo
    const completoBtn = page.locator("button").filter({ hasText: /^Cargador Completo$/ });
    await completoBtn.click();

    // Se fusionan ambas opciones: se muestra Potencia Y Acabado del cable
    await expect(page.getByText("Potencia:")).toBeVisible();
    await expect(page.getByText("Acabado del cable:")).toBeVisible();

    // Validar nombre autogenerado para Cargador Completo
    const nameInput = page.locator('input[placeholder="Ej. Cubo iPhone 20W"]');
    await expect(nameInput).toHaveValue(/Cargador Completo/);
  });

  test("4. Renderizado limpio y alternancia de temas Claro y Oscuro", async ({ page }) => {
    await page.goto("/");

    // Abrir menú de configuración superior (TopMenu)
    const menuBtn = page.getByRole("button", { name: /Abrir configuración y menú/i });
    await expect(menuBtn).toBeVisible({ timeout: 10000 });
    await menuBtn.click();

    // Seleccionar tema Oscuro
    const darkBtn = page.getByRole("button", { name: /Oscuro/i });
    await darkBtn.click();

    // Validar que la clase .dark se aplicó al elemento <html>
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);

    // Cambiar a Claro directamente mientras el menú está abierto
    const lightBtn = page.getByRole("button", { name: /Claro/i });
    await lightBtn.click();

    // Validar que la clase .dark fue removida
    await expect(html).not.toHaveClass(/dark/);

    // Validar que el backdrop de TopMenu cubre el 100% de la pantalla (y no solo la franja superior)
    const backdrop = page.locator('[data-testid="top-menu-backdrop"]');
    await expect(backdrop).toBeVisible();
    const box = await backdrop.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(390);
    expect(box!.height).toBeGreaterThanOrEqual(700);

    // Tocar fuera del menú (en la zona inferior del backdrop) debe cerrar el TopMenu bloqueando elementos inferiores
    await backdrop.click({ position: { x: 50, y: 650 } });
    await expect(page.locator("#top-menu-popover")).not.toBeVisible();
  });

  test("5. Apertura y aislamiento de StoreProfileModal desde TopMenu", async ({ page }) => {
    await page.goto("/");

    const mobileNavbar = page.locator("nav.liquid-glass-surface");
    await expect(mobileNavbar).toBeVisible({ timeout: 10000 });

    // Abrir menú de configuración superior (TopMenu)
    const menuBtn = page.getByRole("button", { name: /Abrir configuración y menú/i });
    await menuBtn.click();

    // Pulsar en 'Perfil'
    const profileBtn = page.locator("#top-menu-popover").getByRole("button", { name: "Perfil", exact: true });
    await expect(profileBtn).toBeVisible();
    await profileBtn.click();

    // Comprobar apertura del StoreProfileModal
    const profileModal = page.getByRole("heading", { name: "Perfil de la tienda" });
    await expect(profileModal).toBeVisible();

    // Comprobar desmontaje preventivo de Navbar (!hasActiveModal)
    await expect(mobileNavbar).not.toBeVisible();

    // Validar campos comerciales
    await expect(page.locator('input[placeholder="Ej. Quiral POS & Store"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Ej. +57 300 123 4567"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Ej. Calle 72 # 10-34, Local 201"]')).toBeVisible();

    // Cerrar modal
    const closeBtn = page.getByRole("button", { name: "Cerrar modal" });
    await closeBtn.click();
    await expect(profileModal).not.toBeVisible();

    // Restauración limpia de la Navbar
    await expect(mobileNavbar).toBeVisible();
  });

  test("6. Apertura y filtros combinados en AdvancedFiltersModal", async ({ page }) => {
    await page.goto("/");

    const mobileNavbar = page.locator("nav.liquid-glass-surface");
    await expect(mobileNavbar).toBeVisible({ timeout: 10000 });
    await mobileNavbar.locator("button").filter({ hasText: "Inventario" }).click();

    // Pulsar botón de filtros avanzados (icono Filter)
    const filterBtn = page.locator('button[aria-label="Filtros avanzados de inventario"]');
    await expect(filterBtn).toBeVisible();
    await filterBtn.click();

    // Comprobar apertura de modal
    const filtersHeading = page.getByRole("heading", { name: "Filtros avanzados" });
    await expect(filtersHeading).toBeVisible();

    // Navbar debe estar desmontada
    await expect(mobileNavbar).not.toBeVisible();

    // Comprobar presencia de opciones
    await expect(page.getByText("Estado de existencias")).toBeVisible();
    await expect(page.getByText("Rango de precios de venta")).toBeVisible();
    await expect(page.getByText("Garantía")).toBeVisible();

    // El botón de aplicar debe reflejar el contador dinámico de resultados
    const applyBtn = page.getByRole("button", { name: /Aplicar \(\d+ resultados\)/i });
    await expect(applyBtn).toBeVisible();

    // Cerrar modal
    const closeBtn = page.getByRole("button", { name: "Cerrar modal" });
    await closeBtn.click();
    await expect(filtersHeading).not.toBeVisible();

    // Navbar restaurada
    await expect(mobileNavbar).toBeVisible();
  });

  test("7. Sistema de Temas y Paletas de Colores de Acento (Azul, Esmeralda, Púrpura, Naranja, Rosa)", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Validar que la paleta por defecto en :root sea "blue"
    const htmlTag = page.locator("html");
    await expect(htmlTag).toHaveAttribute("data-theme-palette", "blue");

    // 2. Abrir menú de configuración superior (TopMenu) e ir a Perfil
    const menuBtn = page.getByRole("button", { name: /Abrir configuración y menú/i });
    await menuBtn.click();

    const profileBtn = page
      .locator("#top-menu-popover")
      .getByRole("button", { name: "Perfil", exact: true });
    await profileBtn.click();

    await expect(page.getByRole("heading", { name: "Perfil de la tienda" })).toBeVisible();

    // 3. Validar presencia del selector de paletas
    const paletteSelector = page.locator('[data-testid="theme-palette-selector"]');
    await expect(paletteSelector).toBeVisible();

    const blueOpt = page.locator('[data-testid="theme-palette-blue"]');
    const emeraldOpt = page.locator('[data-testid="theme-palette-emerald"]');
    const purpleOpt = page.locator('[data-testid="theme-palette-purple"]');
    const orangeOpt = page.locator('[data-testid="theme-palette-orange"]');
    const roseOpt = page.locator('[data-testid="theme-palette-rose"]');

    await expect(blueOpt).toHaveAttribute("aria-checked", "true");

    // 4. Alternar a Verde Esmeralda en vivo
    await emeraldOpt.click();
    await expect(emeraldOpt).toHaveAttribute("aria-checked", "true");
    await expect(htmlTag).toHaveAttribute("data-theme-palette", "emerald");

    const storedEmerald = await page.evaluate(() =>
      localStorage.getItem("quiral_accent_palette")
    );
    expect(storedEmerald).toBe("emerald");

    // 5. Alternar a Púrpura Pro en vivo
    await purpleOpt.click();
    await expect(purpleOpt).toHaveAttribute("aria-checked", "true");
    await expect(htmlTag).toHaveAttribute("data-theme-palette", "purple");

    // 6. Alternar a Naranja Dinámico en vivo
    await orangeOpt.click();
    await expect(orangeOpt).toHaveAttribute("aria-checked", "true");
    await expect(htmlTag).toHaveAttribute("data-theme-palette", "orange");

    // 7. Alternar a Rosa / Magenta en vivo
    await roseOpt.click();
    await expect(roseOpt).toHaveAttribute("aria-checked", "true");
    await expect(htmlTag).toHaveAttribute("data-theme-palette", "rose");

    // 8. Volver a Azul Clásico (predeterminado) y guardar perfil
    await blueOpt.click();
    await expect(blueOpt).toHaveAttribute("aria-checked", "true");
    await expect(htmlTag).toHaveAttribute("data-theme-palette", "blue");

    const saveBtn = page.getByRole("button", { name: "Guardar perfil" });
    await saveBtn.click();
    await expect(page.getByText("Guardado con éxito")).toBeVisible();
  });
});
