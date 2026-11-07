import { expect, test } from "@playwright/test";

test.describe("Quiral POS — Estación de Trabajo Desktop POS Split-View (1280x800)", () => {
  test.use({
    viewport: { width: 1280, height: 800 },
  });

  test.skip(({ isMobile }) => isMobile, "Suite exclusiva para escritorio.");

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("quiral_demo_bypass", "true");
    });
  });

  test("1. Renderizado de Layout Split-Screen, Catálogo izquierdo y Ticket lateral derecho permanente sin modales", async ({
    page,
  }) => {
    await page.goto("/");

    // En Desktop (1280x800), navegar a Vender usando la barra lateral de escritorio (DesktopSidebar)
    const desktopSidebar = page.getByRole("complementary", {
      name: /Navegación principal de escritorio/i,
    });
    await expect(desktopSidebar).toBeVisible({ timeout: 10000 });
    await desktopSidebar.getByRole("button", { name: "Vender" }).click();

    // Validar que el contenedor Split View y el ticket lateral están visibles en pantalla
    const splitView = page.getByTestId("desktop-pos-split-view");
    await expect(splitView).toBeVisible();

    const ticket = page.getByTestId("desktop-pos-ticket");
    await expect(ticket).toBeVisible();
    await expect(
      ticket.getByRole("heading", { name: "Ticket de Venta" })
    ).toBeVisible();
    await expect(ticket.getByText("Ticket Vacío")).toBeVisible();

    // El botón Completar Venta debe estar deshabilitado cuando el carrito está vacío
    const completeBtn = page.getByTestId("complete-sale-desktop-btn");
    await expect(completeBtn).toBeDisabled();

    // Agregar un producto desde el catálogo haciendo clic en su botón/tarjeta
    const productCard = page.getByRole("button", {
      name: /Agregar Cubo iPhone 20W al carrito/i,
    });
    await expect(productCard).toBeVisible();
    await productCard.click();

    // El ticket derecho debe actualizarse inmediatamente en 0ms mostrando el ítem
    await expect(ticket.getByText("Ticket Vacío")).not.toBeVisible();
    await expect(ticket.getByText(/1 artículo/i)).toBeVisible();
    await expect(completeBtn).toBeEnabled();

    // Ajustar cliente en su apartado dedicado del ticket
    const customerInput = page.getByTestId("pos-customer-input");
    await customerInput.fill("Juan Pérez - Mostrador");

    // Probar apartado de nota opcional con botón +
    const addNoteBtn = page.getByTestId("pos-add-note-btn");
    await expect(addNoteBtn).toBeVisible();
    await expect(addNoteBtn).toContainText(/Añadir una nota/i);
    await addNoteBtn.click();

    const noteInput = page.getByTestId("pos-note-input");
    await expect(noteInput).toBeVisible();
    await noteInput.fill("Garantía extendida por el local");

    // Cambiar método de pago a Nequi
    const nequiBtn = page.getByTestId("payment-method-nequi");
    await nequiBtn.click();
    await expect(nequiBtn).toHaveClass(/bg-accent/);

    // Completar la venta sin modales
    await completeBtn.click();

    // Debe mostrar el flash de éxito y vaciar el ticket al instante
    await expect(page.getByText(/¡Venta registrada con éxito!/i)).toBeVisible();
    await expect(ticket.getByText("Ticket Vacío")).toBeVisible();
    await expect(completeBtn).toBeDisabled();
  });

  test("2. Atajo global de búsqueda '/' y Vaciar carrito con confirmación en Ticket", async ({
    page,
  }) => {
    await page.goto("/");

    const desktopSidebar = page.getByRole("complementary", {
      name: /Navegación principal de escritorio/i,
    });
    await expect(desktopSidebar).toBeVisible({ timeout: 10000 });
    await desktopSidebar.getByRole("button", { name: "Vender" }).click();

    // Probar atajo de teclado '/' para enfocar el buscador
    await page.keyboard.press("/");
    const searchInput = page.getByPlaceholder(
      /Buscar referencia, cargador, funda/i
    );
    await expect(searchInput).toBeFocused();

    // Escribir un filtro
    await searchInput.fill("Anker");
    await expect(page.getByText("Cubo Anker 30W")).toBeVisible();

    // Agregar producto al ticket
    const ankerCard = page.getByRole("button", {
      name: /Agregar Cubo Anker 30W al carrito/i,
    });
    await expect(ankerCard).toBeVisible();
    await ankerCard.click();

    const ticket = page.getByTestId("desktop-pos-ticket");
    await expect(ticket.getByText(/1 artículo/i)).toBeVisible();

    // Probar botón de vaciar carrito
    const clearBtn = page.getByTestId("clear-cart-btn");
    await clearBtn.click();

    const confirmClearBtn = page.getByTestId("confirm-clear-cart-btn");
    await expect(confirmClearBtn).toBeVisible();
    await confirmClearBtn.click();

    // El ticket vuelve a estar vacío
    await expect(ticket.getByText("Ticket Vacío")).toBeVisible();
  });

  test("3. Vista Tabla por Defecto en POS, Subfiltros de Atributos por Categoría y Alternancia a Tarjetas", async ({
    page,
  }) => {
    await page.goto("/");

    const desktopSidebar = page.getByRole("complementary", {
      name: /Navegación principal de escritorio/i,
    });
    await expect(desktopSidebar).toBeVisible({ timeout: 10000 });
    await desktopSidebar.getByRole("button", { name: "Vender" }).click();

    // 1. Validar que la Vista de Tabla de Ventas está activa por defecto a la izquierda
    const tableView = page.getByTestId("pos-products-table-view");
    await expect(tableView).toBeVisible();
    const cardsGrid = page.getByTestId("pos-products-cards-grid");
    await expect(cardsGrid).not.toBeVisible();

    // 2. Probar subfiltros de atributos cuando se selecciona una categoría específica
    const cargadoresChip = page.getByRole("button", {
      name: "Cargadores y Cables",
    });
    await expect(cargadoresChip).toBeVisible();
    await cargadoresChip.click();

    // Aparece la segunda barra de subfiltros de atributos/subtipos de la categoría
    const subfiltersNav = page.getByTestId("pos-category-attribute-subfilters");
    await expect(subfiltersNav).toBeVisible();

    // Filtrar por subtipo (ejemplo: Anker)
    const ankerSubfilter = subfiltersNav.getByRole("button", { name: "Anker" });
    if (await ankerSubfilter.isVisible()) {
      await ankerSubfilter.click();
      await expect(tableView.getByText("Cubo Anker 30W")).toBeVisible();
    }

    // Restablecer subfiltro con "Todos en Cargadores y Cables"
    const resetSubfilterBtn = subfiltersNav.getByRole("button", {
      name: /Todos en Cargadores y Cables/i,
    });
    await expect(resetSubfilterBtn).toBeVisible();
    await resetSubfilterBtn.click();

    // 3. Agregar producto haciendo clic en la fila de la tabla
    const tableRow = tableView.getByRole("button", {
      name: /Agregar Cubo iPhone 20W al carrito/i,
    });
    await expect(tableRow).toBeVisible();
    await tableRow.click();

    // Verificar que el ticket se actualiza con el producto
    const ticket = page.getByTestId("desktop-pos-ticket");
    await expect(ticket.getByText(/1 artículo/i)).toBeVisible();

    // 4. Alternar a Vista de Tarjetas (3 Columnas)
    const cardsBtn = page.getByTestId("pos-view-cards-btn");
    await expect(cardsBtn).toBeVisible();
    await cardsBtn.click();
    await expect(cardsGrid).toBeVisible();
    await expect(tableView).not.toBeVisible();

    // 5. Alternar de vuelta a Vista de Tabla
    const tableBtn = page.getByTestId("pos-view-table-btn");
    await expect(tableBtn).toBeVisible();
    await tableBtn.click();
    await expect(tableView).toBeVisible();
    await expect(cardsGrid).not.toBeVisible();
  });

  test("4. Ergonomía de Teclado, Ajuste de Total y Atajo Ctrl+Enter para Cobro Directo en Estación Desktop", async ({
    page,
  }) => {
    await page.goto("/");

    const desktopSidebar = page.getByRole("complementary", {
      name: /Navegación principal de escritorio/i,
    });
    await expect(desktopSidebar).toBeVisible({ timeout: 10000 });
    await desktopSidebar.getByRole("button", { name: "Vender" }).click();

    // 1. Agregar un producto al ticket
    const tableView = page.getByTestId("pos-products-table-view");
    await expect(tableView).toBeVisible();

    const tableRow = tableView.getByRole("button", {
      name: /Agregar Cubo iPhone 20W al carrito/i,
    });
    await expect(tableRow).toBeVisible();
    await tableRow.click();

    const ticket = page.getByTestId("desktop-pos-ticket");
    await expect(ticket.getByText(/1 artículo/i)).toBeVisible();

    // 2. Asignar cliente institucional
    const customerInput = page.getByTestId("pos-customer-input");
    await customerInput.fill("Cliente Corporativo Express");

    // 3. Ajustar monto total a cobrar con descuento en pos-custom-total-input
    const customTotalInput = page.getByTestId("pos-custom-total-input");
    await expect(customTotalInput).toBeVisible();
    await customTotalInput.fill("60000");

    // Verificar que el botón de completar venta refleja el nuevo monto con clase tabular-nums
    const completeBtn = page.getByTestId("complete-sale-desktop-btn");
    await expect(completeBtn).toContainText("60.000");

    // 4. Completar venta usando el atajo de teclado Ctrl+Enter
    await page.keyboard.press("Control+Enter");

    // 5. Verificar flash de éxito instantáneo y reseteo del ticket a vacío
    await expect(page.getByText(/¡Venta registrada con éxito!/i)).toBeVisible();
    await expect(ticket.getByText("Ticket Vacío")).toBeVisible();
    await expect(completeBtn).toBeDisabled();
  });
});
