import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { EditableColKey } from "../modules/inventory/components/DesktopInventoryGrid";
import { EditableGridCell } from "../modules/inventory/components/DesktopInventoryGridParts";

/**
 * Matriz de navegación de teclado tipo Excel para DesktopInventoryGrid.
 * Modela las transiciones de celda activa ante flechas, Tab, Enter, Esc y dígitos.
 */
export function computeNextCell(
  current: { rowIndex: number; colKey: EditableColKey },
  key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Tab",
  isShift: boolean,
  cols: EditableColKey[],
  maxRow: number
): { rowIndex: number; colKey: EditableColKey } {
  const colIdx = cols.indexOf(current.colKey);

  switch (key) {
    case "ArrowUp":
      return {
        rowIndex: Math.max(0, current.rowIndex - 1),
        colKey: current.colKey,
      };
    case "ArrowDown":
      return {
        rowIndex: Math.min(maxRow, current.rowIndex + 1),
        colKey: current.colKey,
      };
    case "ArrowRight":
      if (colIdx < cols.length - 1) {
        return { rowIndex: current.rowIndex, colKey: cols[colIdx + 1] };
      }
      if (current.rowIndex < maxRow) {
        return { rowIndex: current.rowIndex + 1, colKey: cols[0] };
      }
      return current;
    case "ArrowLeft":
      if (colIdx > 0) {
        return { rowIndex: current.rowIndex, colKey: cols[colIdx - 1] };
      }
      if (current.rowIndex > 0) {
        return {
          rowIndex: current.rowIndex - 1,
          colKey: cols[cols.length - 1],
        };
      }
      return current;
    case "Tab":
      if (!isShift) {
        if (colIdx < cols.length - 1) {
          return { rowIndex: current.rowIndex, colKey: cols[colIdx + 1] };
        }
        if (current.rowIndex < maxRow) {
          return { rowIndex: current.rowIndex + 1, colKey: cols[0] };
        }
      } else {
        if (colIdx > 0) {
          return { rowIndex: current.rowIndex, colKey: cols[colIdx - 1] };
        }
        if (current.rowIndex > 0) {
          return {
            rowIndex: current.rowIndex - 1,
            colKey: cols[cols.length - 1],
          };
        }
      }
      return current;
  }
}

describe("Navegación Matricial con Teclado (DesktopInventoryGrid)", () => {
  const standardCols: EditableColKey[] = ["stock", "cost", "price"];
  const maxRow = 4; // 5 filas (0..4)

  describe("1. Transición de Coordenadas Matriciales (computeNextCell)", () => {
    it("debe avanzar verticalmente hacia abajo con ArrowDown sin exceder maxRow", () => {
      const from = { rowIndex: 2, colKey: "stock" as const };
      const next = computeNextCell(
        from,
        "ArrowDown",
        false,
        standardCols,
        maxRow
      );
      expect(next).toEqual({ rowIndex: 3, colKey: "stock" });

      // En el límite inferior no debe sobrepasar maxRow
      const atBottom = { rowIndex: maxRow, colKey: "stock" as const };
      const nextAtBottom = computeNextCell(
        atBottom,
        "ArrowDown",
        false,
        standardCols,
        maxRow
      );
      expect(nextAtBottom).toEqual({ rowIndex: maxRow, colKey: "stock" });
    });

    it("debe retroceder verticalmente hacia arriba con ArrowUp sin bajar de fila 0", () => {
      const from = { rowIndex: 2, colKey: "price" as const };
      const next = computeNextCell(
        from,
        "ArrowUp",
        false,
        standardCols,
        maxRow
      );
      expect(next).toEqual({ rowIndex: 1, colKey: "price" });

      const atTop = { rowIndex: 0, colKey: "price" as const };
      const nextAtTop = computeNextCell(
        atTop,
        "ArrowUp",
        false,
        standardCols,
        maxRow
      );
      expect(nextAtTop).toEqual({ rowIndex: 0, colKey: "price" });
    });

    it("debe avanzar horizontalmente a la siguiente columna con ArrowRight y saltar a la fila siguiente al llegar al extremo derecho", () => {
      // De stock a cost
      expect(
        computeNextCell(
          { rowIndex: 1, colKey: "stock" },
          "ArrowRight",
          false,
          standardCols,
          maxRow
        )
      ).toEqual({ rowIndex: 1, colKey: "cost" });

      // De price (última col) a stock de la fila siguiente
      expect(
        computeNextCell(
          { rowIndex: 1, colKey: "price" },
          "ArrowRight",
          false,
          standardCols,
          maxRow
        )
      ).toEqual({ rowIndex: 2, colKey: "stock" });
    });

    it("debe retroceder horizontalmente con ArrowLeft y saltar a la fila anterior en el extremo izquierdo", () => {
      // De price a cost
      expect(
        computeNextCell(
          { rowIndex: 2, colKey: "price" },
          "ArrowLeft",
          false,
          standardCols,
          maxRow
        )
      ).toEqual({ rowIndex: 2, colKey: "cost" });

      // De stock (primera col) a price de la fila previa
      expect(
        computeNextCell(
          { rowIndex: 2, colKey: "stock" },
          "ArrowLeft",
          false,
          standardCols,
          maxRow
        )
      ).toEqual({ rowIndex: 1, colKey: "price" });
    });

    it("debe respetar la navegación con Tab (avance) y Shift+Tab (retroceso)", () => {
      expect(
        computeNextCell(
          { rowIndex: 0, colKey: "stock" },
          "Tab",
          false,
          standardCols,
          maxRow
        )
      ).toEqual({ rowIndex: 0, colKey: "cost" });

      expect(
        computeNextCell(
          { rowIndex: 1, colKey: "stock" },
          "Tab",
          true,
          standardCols,
          maxRow
        )
      ).toEqual({ rowIndex: 0, colKey: "price" });
    });

    it("en Modo Conteo Rápido (solo columna stock) debe restringir el movimiento horizontal", () => {
      const quickCols: EditableColKey[] = ["stock"];
      // ArrowRight salta a la fila siguiente en columna stock
      expect(
        computeNextCell(
          { rowIndex: 0, colKey: "stock" },
          "ArrowRight",
          false,
          quickCols,
          maxRow
        )
      ).toEqual({ rowIndex: 1, colKey: "stock" });
    });
  });

  describe("2. Renderizado e Interacción en Componente EditableGridCell", () => {
    function TestGridCellHarness({
      initialEditing = false,
      colKey = "price" as EditableColKey,
      initialValue = 85000,
    }) {
      const [isFocused, setIsFocused] = useState(true);
      const [isEditing, setIsEditing] = useState(initialEditing);
      const [draft, setDraft] = useState(String(initialValue));
      const [val, setVal] = useState(initialValue);

      const handlers = {
        registerCell: vi.fn(),
        registerActiveInput: vi.fn(),
        focusCell: (_r: number, _c: EditableColKey) => setIsFocused(true),
        startEditing: (_r: number, _c: EditableColKey) => setIsEditing(true),
        setDraft: (v: string) => setDraft(v),
        commitEdit: (_r: number, _c: EditableColKey, v: string) => {
          setVal(Number(v) || 0);
          setIsEditing(false);
        },
        cellKeyDown: vi.fn((e: React.KeyboardEvent) => {
          if (e.key === "Enter") {
            if (isEditing) {
              setVal(Number(draft) || 0);
              setIsEditing(false);
            } else {
              setIsEditing(true);
            }
          } else if (e.key === "Escape") {
            setIsEditing(false);
          }
        }),
        adjustStock: vi.fn(),
        toggleRowSelect: vi.fn(),
        addToCart: vi.fn(),
        inspect: vi.fn(),
        duplicate: vi.fn(),
        remove: vi.fn(),
      };

      return (
        <EditableGridCell
          rowIndex={0}
          rowId="prod-1"
          colKey={colKey}
          productName="Cubo iPhone 20W"
          value={val}
          isFocused={isFocused}
          isEditing={isEditing}
          draftValue={draft}
          handlers={handlers}
        />
      );
    }

    it("debe renderizar la celda con estilo de foco activo (ring-accent)", () => {
      render(<TestGridCellHarness />);
      const cell = screen.getByTestId("grid-cell-price-0");
      expect(cell).toBeInTheDocument();
      expect(cell).toHaveClass("ring-2");
      expect(cell).toHaveClass("ring-accent");
    });

    it("debe iniciar edición con Enter y desplegar el input numérico", () => {
      render(<TestGridCellHarness initialEditing={false} />);
      const cell = screen.getByTestId("grid-cell-price-0");

      fireEvent.keyDown(cell, { key: "Enter" });

      const input = screen.getByTestId("grid-input-price-0");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("85000");
    });

    it("debe cancelar la edición con Escape sin persistir cambios en draft", () => {
      render(<TestGridCellHarness initialEditing={true} />);
      const input = screen.getByTestId("grid-input-price-0");
      expect(input).toBeInTheDocument();

      fireEvent.keyDown(input, { key: "Escape" });

      expect(
        screen.queryByTestId("grid-input-price-0")
      ).not.toBeInTheDocument();
    });

    it("debe renderizar el badge de stock y botones de incremento/decremento para colKey='stock'", () => {
      render(<TestGridCellHarness colKey="stock" initialValue={14} />);
      const cell = screen.getByTestId("grid-cell-stock-0");
      expect(cell).toBeInTheDocument();
      expect(screen.getByText("14")).toBeInTheDocument();
      expect(screen.getByLabelText(/Disminuir stock/i)).toBeInTheDocument();
    });
  });
});
