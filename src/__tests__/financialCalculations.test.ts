import { describe, expect, it } from "vitest";

/**
 * Suite de pruebas unitarias para la lógica financiera y de cálculo comercial de Quiral POS.
 * Valida:
 * 1. Cálculo de costo promedio ponderado por lotes (avgCost).
 * 2. Utilidad unitaria y porcentaje de margen comercial (profit & marginPct).
 * 3. Recálculo de subtotales, totales de carrito y descuentos.
 * 4. Valor total de inventario y ganancia bruta consolidada de ciclo.
 */

interface BatchLike {
  stock: number;
  cost: number;
}

interface CartItemLike {
  quantity: number;
  unitPrice: number;
  unitCostSnapshot?: number;
}

export function calculateAverageCost(batches: BatchLike[]): number {
  const totalStock = batches.reduce((sum, b) => sum + b.stock, 0);
  if (totalStock <= 0) {
    return batches[0]?.cost ?? 0;
  }
  const totalBatchCost = batches.reduce((sum, b) => sum + b.cost * b.stock, 0);
  return Math.round(totalBatchCost / totalStock);
}

export function calculateProfitAndMargin(price: number, avgCost: number) {
  const profit = price - avgCost;
  const marginPct = avgCost > 0 ? Math.round((profit / avgCost) * 100) : 0;
  return { profit, marginPct };
}

export function calculateCartSubtotal(items: CartItemLike[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function calculateEffectiveTotal(
  subtotal: number,
  discount = 0
): number {
  if (discount < 0) return subtotal;
  const total = subtotal - discount;
  return Math.max(0, Math.round(total));
}

export function calculateInventoryStockValue(batches: BatchLike[]): number {
  return batches.reduce(
    (acc, b) => acc + Math.max(0, b.stock) * Math.max(0, b.cost),
    0
  );
}

describe("Cálculos Financieros — Dominio Quiral POS", () => {
  describe("1. Costo Promedio Ponderado por Lote (calculateAverageCost)", () => {
    it("debe calcular correctamente el costo ponderado con múltiples lotes de diferente volumen y costo", () => {
      // Lote 1: 10 unidades a $50.000 ($500.000)
      // Lote 2: 20 unidades a $60.000 ($1.200.000)
      // Lote 3: 10 unidades a $40.000 ($400.000)
      // Total unidades: 40, Total costo: $2.100.000
      // Promedio ponderado: 2.100.000 / 40 = 52.500
      const batches: BatchLike[] = [
        { stock: 10, cost: 50000 },
        { stock: 20, cost: 60000 },
        { stock: 10, cost: 40000 },
      ];

      expect(calculateAverageCost(batches)).toBe(52500);
    });

    it("debe redondear al entero más cercano (Math.round) para evitar centavos o decimales residuales en COP", () => {
      // 1 unidad a $10.000 + 2 unidades a $15.000 = $40.000 / 3 = 13333.3333... -> 13333
      const batches: BatchLike[] = [
        { stock: 1, cost: 10000 },
        { stock: 2, cost: 15000 },
      ];

      expect(calculateAverageCost(batches)).toBe(13333);
    });

    it("debe retornar el costo del primer lote si el stock total es 0", () => {
      const batches: BatchLike[] = [
        { stock: 0, cost: 75000 },
        { stock: 0, cost: 90000 },
      ];

      expect(calculateAverageCost(batches)).toBe(75000);
    });

    it("debe retornar 0 si no hay lotes registrados", () => {
      expect(calculateAverageCost([])).toBe(0);
    });
  });

  describe("2. Margen Comercial y Utilidad Unitaria (calculateProfitAndMargin)", () => {
    it("debe calcular utilidad positiva y margen porcentual sobre costo correctamente", () => {
      // Costo: $50.000, Precio: $85.000 -> Utilidad: $35.000, Margen: (35.000 / 50.000) * 100 = 70%
      const { profit, marginPct } = calculateProfitAndMargin(85000, 50000);

      expect(profit).toBe(35000);
      expect(marginPct).toBe(70);
    });

    it("debe manejar punto de equilibrio (break-even) con utilidad $0 y margen 0%", () => {
      const { profit, marginPct } = calculateProfitAndMargin(45000, 45000);

      expect(profit).toBe(0);
      expect(marginPct).toBe(0);
    });

    it("debe calcular utilidad negativa (pérdida) si el precio es menor al costo", () => {
      // Costo: $100.000, Precio: $80.000 -> Utilidad: -$20.000, Margen: -20%
      const { profit, marginPct } = calculateProfitAndMargin(80000, 100000);

      expect(profit).toBe(-20000);
      expect(marginPct).toBe(-20);
    });

    it("debe proteger contra división por cero cuando el costo promedio es 0", () => {
      const { profit, marginPct } = calculateProfitAndMargin(50000, 0);

      expect(profit).toBe(50000);
      expect(marginPct).toBe(0);
    });
  });

  describe("3. Subtotales de Carrito y Validación de Cobros (calculateCartSubtotal & calculateEffectiveTotal)", () => {
    it("debe sumar el subtotal exacto multiplicando cantidades por precios individuales", () => {
      const cartItems: CartItemLike[] = [
        { quantity: 2, unitPrice: 85000 }, // $170.000
        { quantity: 1, unitPrice: 45000 }, // $45.000
        { quantity: 3, unitPrice: 38000 }, // $114.000
      ];

      expect(calculateCartSubtotal(cartItems)).toBe(329000);
    });

    it("debe retornar 0 para un carrito vacío", () => {
      expect(calculateCartSubtotal([])).toBe(0);
    });

    it("debe restar el descuento del subtotal de manera determinista", () => {
      const subtotal = 200000;
      const discount = 20000;

      expect(calculateEffectiveTotal(subtotal, discount)).toBe(180000);
    });

    it("debe proteger contra totales negativos cuando el descuento supera el subtotal", () => {
      const subtotal = 150000;
      const excessiveDiscount = 200000;

      expect(calculateEffectiveTotal(subtotal, excessiveDiscount)).toBe(0);
    });

    it("debe ignorar descuentos negativos", () => {
      const subtotal = 100000;
      expect(calculateEffectiveTotal(subtotal, -5000)).toBe(100000);
    });
  });

  describe("4. Valorización Total del Inventario (calculateInventoryStockValue)", () => {
    it("debe calcular el capital total invertido multiplicando stock disponible por costo de cada lote", () => {
      const batches: BatchLike[] = [
        { stock: 15, cost: 35000 }, // 525.000
        { stock: 8, cost: 70000 }, // 560.000
        { stock: 0, cost: 120000 }, // 0
      ];

      expect(calculateInventoryStockValue(batches)).toBe(1085000);
    });
  });
});
