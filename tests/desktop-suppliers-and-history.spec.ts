import { expect, test } from "@playwright/test";

test.describe("Quiral POS — Estación de Trabajo Desktop: Proveedores Full-View y Tipografía en Historial (1280x800)", () => {
  test.use({
    viewport: { width: 1280, height: 800 },
  });

  test.skip(({ isMobile }) => isMobile, "Suite exclusiva para escritorio.");

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("quiral_demo_bypass", "true");
    });
  });

  test("1. Vista Dedicada de Pantalla Completa para Gestión de Proveedores (Sin Modales)", async ({
    page,
  }) => {
    await page.goto("/");

    const desktopSidebar = page.getByRole("complementary", {
      name: /Navegación principal de escritorio/i,
    });
    await expect(desktopSidebar).toBeVisible({ timeout: 10000 });

    // Acceder a Gestión Proveedores desde la barra lateral
    const openSuppliersBtn = desktopSidebar.getByRole("button", {
      name: /Gestión Proveedores/i,
    });
    await expect(openSuppliersBtn).toBeVisible();
    await openSuppliersBtn.click();

    // Validar que la Vista Dedicada a pantalla completa se renderiza (NO como modal flotante con backdrop)
    const suppliersView = page.getByTestId("desktop-suppliers-view");
    await expect(suppliersView).toBeVisible();
    await expect(page.locator(".modal-sheet-dialog")).not.toBeVisible();

    // Validar título y tabla de proveedores
    await expect(
      page.getByRole("heading", {
        name: /Gestión de Proveedores y Canales de Abastecimiento/i,
      })
    ).toBeVisible();

    const suppliersTable = page.getByTestId("desktop-suppliers-table");
    await expect(suppliersTable).toBeVisible();

    // Registrar un nuevo proveedor mediante el formulario integrado
    const nameInput = page.getByTestId("supplier-name-input");
    const phoneInput = page.getByTestId("supplier-phone-input");
    const saveBtn = page.getByTestId("save-supplier-btn");

    await nameInput.fill("Importadora Tech Mayorista");
    await phoneInput.fill("+57 310 999 8877");
    await saveBtn.click();

    // Verificar confirmación y aparición inmediata en la tabla
    await expect(
      suppliersTable.getByText("Importadora Tech Mayorista")
    ).toBeVisible();

    // Pulsar botón "← Regresar" y verificar retorno fluido a la vista anterior
    const backBtn = page.getByTestId("suppliers-back-btn");
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    await expect(suppliersView).not.toBeVisible();
  });

  test("2. Ampliación tipográfica y legibilidad de alto contraste en el Data Grid de Historial", async ({
    page,
  }) => {
    await page.goto("/");

    const desktopSidebar = page.getByRole("complementary", {
      name: /Navegación principal de escritorio/i,
    });
    await expect(desktopSidebar).toBeVisible({ timeout: 10000 });

    // Navegar a Historial
    await desktopSidebar.getByRole("button", { name: "Historial" }).click();

    // Validar contenedor de la tabla de historial en escritorio
    const historyTableContainer = page.getByTestId(
      "desktop-history-table-container"
    );
    await expect(historyTableContainer).toBeVisible();

    // Verificar que los nombres de clientes usan clases de tipografía ampliada (text-base / font-bold)
    const firstRow = historyTableContainer.locator("tbody tr").first();
    await expect(firstRow).toBeVisible();

    const customerName = firstRow.locator("p.font-bold").first();
    await expect(customerName).toBeVisible();
    await expect(customerName).toHaveClass(/text-base/);

    // Verificar que el monto total tiene tipografía destacada (text-base / text-lg / font-black)
    const totalAmount = firstRow.locator("td:nth-child(5) span").first();
    await expect(totalAmount).toBeVisible();
    await expect(totalAmount).toHaveClass(/text-base|text-lg/);
  });
});
