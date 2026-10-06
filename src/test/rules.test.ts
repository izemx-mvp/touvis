import { describe, expect, it } from "vitest";
import { stockStatus, quoteTotals } from "@/lib/store";

describe("TOUVIS business rules", () => {
  it("stock at 0 is a rupture", () => expect(stockStatus({ stock: 0, threshold: 20 })).toBe("Rupture"));
  it("stock at or under threshold is 'Seuil atteint'", () => expect(stockStatus({ stock: 20, threshold: 20 })).toBe("Seuil atteint"));
  it("stock up to 1.5x threshold is 'Stock faible'", () => expect(stockStatus({ stock: 30, threshold: 20 })).toBe("Stock faible"));
  it("stock above 1.5x threshold is normal", () => expect(stockStatus({ stock: 31, threshold: 20 })).toBe("Normal"));
  it("quote totals apply discount then 20% VAT", () => {
    const t = quoteTotals([{ id: "a", ref: "R", name: "n", qty: 10, price: 100, discount: 10 }]);
    expect(t.ht).toBe(900); expect(t.tva).toBe(180); expect(t.ttc).toBe(1080);
  });
});
