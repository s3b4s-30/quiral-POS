import { describe, expect, it } from "vitest";
import {
  foldDiacritics,
  formatCOP,
  formatDateWithTime,
  formatFullDate,
  formatMonthYear,
  formatPercent,
  formatProductCount,
  formatShortDate,
  formatUnits,
  getWarrantyStatus,
  parseCOPInput,
} from "../utils/formatters";

describe("Utilidades del Dominio — Formatters Universales", () => {
  describe("formatCOP", () => {
    it("debe formatear números enteros estándar en Pesos Colombianos", () => {
      // En es-CO el separador de miles es '.'
      const formatted = formatCOP(150000);
      expect(formatted).toMatch(/^\$150[.,]000$/);
    });

    it("debe retornar $0 para valores nulos, indefinidos o vacíos", () => {
      expect(formatCOP(undefined)).toBe("$0");
      expect(formatCOP(null)).toBe("$0");
      expect(formatCOP("")).toBe("$0");
    });

    it("debe redondear decimales al entero más cercano", () => {
      const formatted = formatCOP(19999.85);
      expect(formatted).toMatch(/^\$20[.,]000$/);
    });

    it("debe procesar cadenas con símbolos de moneda o espacios", () => {
      const formatted = formatCOP("$ 250000 COP");
      expect(formatted).toMatch(/^\$250[.,]000$/);
    });

    it("debe manejar números negativos correctamente", () => {
      const formatted = formatCOP(-50000);
      expect(formatted).toBe("$-50.000");
    });
  });

  describe("parseCOPInput", () => {
    it("debe extraer el valor numérico limpio a partir de una cadena formateada con puntos y símbolos", () => {
      expect(parseCOPInput("$185.000")).toBe(185000);
      expect(parseCOPInput("COP 1.500.000")).toBe(1500000);
    });

    it("debe retornar 0 si la cadena está vacía o solo contiene letras", () => {
      expect(parseCOPInput("")).toBe(0);
      expect(parseCOPInput("abc")).toBe(0);
    });

    it("debe procesar entradas numéricas directas como string", () => {
      expect(parseCOPInput("45000")).toBe(45000);
    });
  });

  describe("formatUnits & formatProductCount", () => {
    it("debe formatear unidades agregando el sufijo 'uds'", () => {
      expect(formatUnits(1)).toBe("1 uds");
      expect(formatUnits(25)).toBe("25 uds");
      expect(formatUnits(0)).toBe("0 uds");
    });

    it("debe pluralizar y singularizar correctamente el conteo de productos", () => {
      expect(formatProductCount(1)).toBe("1 producto");
      expect(formatProductCount(2)).toBe("2 productos");
      expect(formatProductCount(0)).toBe("0 productos");
    });
  });

  describe("formatPercent", () => {
    it("debe formatear porcentajes redondeados sin decimales", () => {
      expect(formatPercent(33.333)).toBe("33%");
      expect(formatPercent(75)).toBe("75%");
      expect(formatPercent(0)).toBe("0%");
    });
  });

  describe("Formateadores de Fechas (formatShortDate, formatFullDate, formatDateWithTime, formatMonthYear)", () => {
    it("debe retornar cadena vacía ante fechas inválidas", () => {
      expect(formatShortDate("invalid-date")).toBe("");
      expect(formatFullDate("invalid-date")).toBe("");
      expect(formatDateWithTime("invalid-date")).toBe("");
    });

    it("debe formatear fechas válidas en formato corto (día y mes)", () => {
      const result = formatShortDate("2026-11-02T14:30:00Z");
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });

    it("debe formatear fechas completas con año", () => {
      const result = formatFullDate("2026-11-02T14:30:00Z");
      expect(result).toContain("2026");
    });

    it("debe formatear mes y año en español", () => {
      const date = new Date(2026, 10, 1); // Noviembre 2026
      const result = formatMonthYear(date);
      expect(result.toLowerCase()).toContain("noviembre");
      expect(result).toContain("2026");
    });
  });

  describe("getWarrantyStatus", () => {
    it("debe reportar estado 'active' cuando la venta está dentro del periodo de garantía", () => {
      const todayISO = new Date().toISOString();
      const status = getWarrantyStatus(todayISO, 30, false);

      expect(status.status).toBe("active");
      expect(status.remainingDays).toBeGreaterThan(0);
      expect(status.label).toContain("días restantes");
    });

    it("debe reportar estado 'claimed' si la garantía ya fue aplicada por el usuario", () => {
      const todayISO = new Date().toISOString();
      const status = getWarrantyStatus(todayISO, 30, true);

      expect(status.status).toBe("claimed");
      expect(status.label).toBe("Garantía Aplicada");
    });

    it("debe reportar estado 'expired' si han transcurrido más días que el periodo de garantía", () => {
      // Venta de hace 60 días con 15 días de garantía
      const sixtyDaysAgo = new Date(
        Date.now() - 60 * 24 * 60 * 60 * 1000
      ).toISOString();
      const status = getWarrantyStatus(sixtyDaysAgo, 15, false);

      expect(status.status).toBe("expired");
      expect(status.remainingDays).toBe(0);
      expect(status.progressPct).toBe(0);
      expect(status.label).toBe("Garantía Vencida");
    });

    it("debe manejar periodo de garantía de 0 días sin fallar", () => {
      const todayISO = new Date().toISOString();
      const status = getWarrantyStatus(todayISO, 0, false);

      expect(status.status).toBe("expired");
      expect(status.remainingDays).toBe(0);
      expect(status.progressPct).toBe(0);
    });
  });
  describe("foldDiacritics", () => {
    it("debe remover tildes y acentos manteniendo texto en minúsculas", () => {
      expect(foldDiacritics("Cámara")).toBe("camara");
      expect(foldDiacritics("Silicona Líquida")).toBe("silicona liquida");
      expect(foldDiacritics("Batería Portátil")).toBe("bateria portatil");
      expect(foldDiacritics("Andrés Gómez")).toBe("andres gomez");
      expect(foldDiacritics("USB-C 20W")).toBe("usb-c 20w");
    });

    it("debe manejar valores nulos, vacíos o indefinidos de forma segura", () => {
      expect(foldDiacritics(null)).toBe("");
      expect(foldDiacritics(undefined)).toBe("");
      expect(foldDiacritics("")).toBe("");
      expect(foldDiacritics("   ")).toBe("");
    });

    it("debe ignorar diferencias entre términos con y sin tildes para búsqueda en mostrador", () => {
      const query = foldDiacritics("rapida");
      const target = foldDiacritics("Carga Rápida");
      expect(target.includes(query)).toBe(true);
    });
  });
});
