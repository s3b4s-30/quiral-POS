import { expect, test } from "@playwright/test";

test.describe("Quiral POS — Estación de Trabajo Desktop POS Split-View (1280x800)", () => {
  test.use({
    viewport: { width: 1280, height: 800 },
  });

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
    await expect(ticket.getByRole("heading", { name: "Ticket de Venta" })).toBeVisible();
    await expect(ticket.getByText("Ticket Vacío")).toBeVisible();

    // El botón Completar Venta debe estar deshabilitado cuando el carrito está vacío
    const completeBtn = page.getByTestId("complete-sale-desktop-btn");
    await expect(completeBtn).toBeDisabled();

    // Agregar un producto desde el catálogo haciendo clic en su botón/tarjeta
    const productCard = page.getByRole("button", { name: /Agregar Cubo iPhone 20W al carrito/i });
    await expect(productCard).toBeVisible();
    await productCard.click();

    // El ticket derecho debe actualizarse inmediatamente en 0ms mostrando el ítem
    await expect(ticket.getByText("Ticket Vacío")).not.toBeVisible();
    await expect(ticket.getByText(/1 artículo/i)).toBeVisible();
    await expect(completeBtn).toBeEnabled();

    // Ajustar notas / cliente en el ticket
    const customerInput = page.getByTestId("pos-customer-input");
    await customerInput.fill("Juan Pérez - Mostrador");

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
    const searchInput = page.getByPlaceholder(/Buscar referencia, cargador, funda/i);
    await expect(searchInput).toBeFocused();

    // Escribir un filtro
    await searchInput.fill("Anker");
    await expect(page.getByText("Cubo Anker 30W")).toBeVisible();

    // Agregar producto al ticket
    const ankerCard = page.getByRole("button", { name: /Agregar Cubo Anker 30W al carrito/i });
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
});
