import { expect, test } from "@playwright/test";

test.describe("Quiral POS — Directiva de Inmunidad UI y Ergonomía en Estación de Trabajo Desktop (>= 768px)", () => {
  test.use({
    viewport: { width: 1280, height: 800 },
  });
  test.skip(({ isMobile }) => isMobile, "Suite exclusiva para escritorio.");

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("quiral_demo_bypass", "true");
    });
  });

  test("1. Platform Split en Escritorio: Cero componentes móviles visibles, DesktopSidebar presente y Cero Doble-Scroll", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. DesktopSidebar visible y accesible con rol complementary
    const desktopSidebar = page.getByRole("complementary", {
      name: /Navegación principal de escritorio/i,
    });
    await expect(desktopSidebar).toBeVisible({ timeout: 10000 });

    // 2. Barra de navegación móvil inferior (Navbar) y Floating FAB no deben ser visibles en escritorio (md:hidden)
    const mobileNavbar = page.locator("nav.liquid-glass-surface");
    await expect(mobileNavbar).not.toBeVisible();

    const mobileFab = page.locator("button[aria-label='Ir a vender']");
    await expect(mobileFab).not.toBeVisible();

    // 3. Navegar a Inventario -> Cargar DesktopInventoryGrid y verificar CERO tarjetas móviles
    await desktopSidebar.getByRole("button", { name: "Inventario" }).click();
    await expect(page.getByTestId("desktop-inventory-table")).toBeVisible();
    await expect(page.locator("#inventory-scroll article")).toHaveCount(0);

    // 4. Navegar a Vender -> Cargar DesktopPosSplitView y DesktopPosTicket
    await desktopSidebar.getByRole("button", { name: "Vender" }).click();
    await expect(page.getByTestId("desktop-pos-split-view")).toBeVisible();
    await expect(page.getByTestId("desktop-pos-ticket")).toBeVisible();

    // 5. Cero Doble-Scroll: La ventana principal (window) no debe tener scroll vertical
    const windowScrollY = await page.evaluate(() => window.scrollY);
    expect(windowScrollY).toBe(0);
  });

  test("2. Vistas Administrativas Completas en Escritorio: Pantalla Completa sin Modales Angostos", async ({
    page,
  }) => {
    await page.goto("/");

    const desktopSidebar = page.getByRole("complementary", {
      name: /Navegación principal de escritorio/i,
    });
    await expect(desktopSidebar).toBeVisible({ timeout: 10000 });

    // 1. Abrir Gestión Proveedores
    await desktopSidebar
      .getByRole("button", { name: /Gestión Proveedores/i })
      .click();
    await expect(page.getByTestId("desktop-suppliers-view")).toBeVisible();
    // No debe haber hojas modales deslizables
    await expect(page.locator(".modal-sheet-dialog")).toHaveCount(0);

    // Regresar con botón integrado
    await page.getByTestId("suppliers-back-btn").click();
    await expect(page.getByTestId("desktop-suppliers-view")).not.toBeVisible();

    // 2. Abrir Configuración y Ajustes de Catálogo desde Inventario
    await desktopSidebar.getByRole("button", { name: "Inventario" }).click();
    await page.getByTestId("desktop-catalog-settings-btn").click();

    // Validar vista dedicada en 3 columnas
    const managerView = page.getByTestId("desktop-category-manager-view");
    await expect(managerView).toBeVisible();
    await expect(page.locator(".modal-sheet-dialog")).toHaveCount(0);

    // Cerrar con Escape
    await page.keyboard.press("Escape");
    await expect(managerView).not.toBeVisible();
  });
});

test.describe("Quiral POS — Directiva de Inmunidad UI y Aislamiento en iOS Safari PWA Standalone (< 768px)", () => {
  test.use({
    viewport: { width: 390, height: 844 }, // iPhone 14
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("quiral_demo_bypass", "true");
    });
  });

  test("1. Aislamiento físico de componentes de escritorio en móvil y Navbar flotante activa", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Componentes exclusivos de escritorio NO deben existir en el DOM móvil
    const desktopSidebar = page.getByRole("complementary", {
      name: /Navegación principal de escritorio/i,
    });
    await expect(desktopSidebar).toHaveCount(0);

    const desktopGrid = page.getByTestId("desktop-inventory-table");
    await expect(desktopGrid).toHaveCount(0);

    const desktopTicket = page.getByTestId("desktop-pos-ticket");
    await expect(desktopTicket).toHaveCount(0);

    // 2. Barra de navegación móvil inferior visible y fixed
    const mobileNavbar = page.locator("nav.liquid-glass-surface");
    await expect(mobileNavbar).toBeVisible({ timeout: 10000 });
  });

  test("2. Inmunidad de UI móvil: TopHeader edge-to-edge con safe-area-inset y ausencia de clases intrusas", async ({
    page,
  }) => {
    await page.goto("/");

    const mobileNavbar = page.locator("nav.liquid-glass-surface");
    await expect(mobileNavbar).toBeVisible({ timeout: 10000 });

    // 1. TopHeader edge-to-edge con safe-area-inset
    const topHeader = page.locator(".quiral-top-header");
    await expect(topHeader).toBeVisible();
    await expect(topHeader).toHaveClass(/fixed/);
    await expect(topHeader).toHaveClass(/top-0/);
    await expect(topHeader).toHaveClass(/backdrop-blur/);

    // 2. Comprobar que los contenedores de scroll NO tienen clases intrusas que rompan márgenes
    // Prohibidas expresamente por AGENTS.md Directiva 0: pt-16, mt-14, mt-16, pb-32, pb-44, mb-20, h-screen
    const forbiddenPattern =
      /\b(pt-16|mt-14|mt-16|pb-32|pb-44|mb-20|h-screen)\b/;

    // Vista Inventario
    await mobileNavbar
      .locator("button")
      .filter({ hasText: "Inventario" })
      .click();
    await expect(page.locator("#inventory-scroll")).toBeVisible();
    const invClass =
      (await page.locator("#inventory-scroll").getAttribute("class")) || "";
    expect(invClass).not.toMatch(forbiddenPattern);

    // Vista Vender
    await mobileNavbar.locator("button").filter({ hasText: "Vender" }).click();
    await expect(page.locator("#pos-scroll")).toBeVisible();
    const posClass =
      (await page.locator("#pos-scroll").getAttribute("class")) || "";
    expect(posClass).not.toMatch(forbiddenPattern);

    // Vista Resumen
    await mobileNavbar.locator("button").filter({ hasText: "Resumen" }).click();
    await expect(page.locator("#summary-scroll")).toBeVisible();
    const sumClass =
      (await page.locator("#summary-scroll").getAttribute("class")) || "";
    expect(sumClass).not.toMatch(forbiddenPattern);

    // Vista Historial
    await mobileNavbar
      .locator("button")
      .filter({ hasText: "Historial" })
      .click();
    await expect(page.locator("#history-scroll")).toBeVisible();
    const histClass =
      (await page.locator("#history-scroll").getAttribute("class")) || "";
    expect(histClass).not.toMatch(forbiddenPattern);
  });

  test("3. Resiliencia de Empty States (LottiePlayer + icono vectorial) y aislamiento táctil en Bottom Sheets", async ({
    page,
  }) => {
    await page.goto("/");

    const mobileNavbar = page.locator("nav.liquid-glass-surface");
    await expect(mobileNavbar).toBeVisible({ timeout: 10000 });

    // 1. Navegar a Inventario
    await mobileNavbar
      .locator("button")
      .filter({ hasText: "Inventario" })
      .click();
    await expect(page.locator("#inventory-scroll")).toBeVisible();

    // 2. Búsqueda inexistente para detonar el Empty State resiliente
    const searchInput = page.getByPlaceholder(/Buscar por nombre, categoría/i);
    await searchInput.fill("NONEXISTENT_ITEM_XYZ_999");

    // Verificar que el contenedor de estado vacío se muestra sin errores de JavaScript
    await expect(page.getByText(/No se encontraron productos/i)).toBeVisible();

    // Limpiar búsqueda
    await searchInput.fill("");

    // 3. Abrir Modal de Gestión / Purgar stock agotado desde TopHeader
    const purgeBtn = page.locator('button[aria-label="Purgar stock agotado"]');
    await expect(purgeBtn).toBeVisible();
    await purgeBtn.click();

    // ModalSheet debe abrirse y el fondo debe aislarse con clase modal-open en body
    const modalDialog = page.locator('[role="dialog"]');
    await expect(modalDialog).toBeVisible();
    await expect(page.locator("body")).toHaveClass(/modal-open/);

    // Cerrar modal
    const cancelBtn = modalDialog.getByRole("button", { name: "Cancelar" });
    await cancelBtn.click();
    await expect(modalDialog).not.toBeVisible();
    await expect(page.locator("body")).not.toHaveClass(/modal-open/);
  });
});
