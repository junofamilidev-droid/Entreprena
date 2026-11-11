import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { formulaire, signatureValide } = await import("@/lib/stripe");

describe("formulaire Stripe", () => {
  it("aplatit objets et tableaux au format a[b][0][c]=…", () => {
    const f = formulaire({ mode: "payment", line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: 7900 } }], metadata: { formation: "x" }, vide: undefined });
    expect(f.get("mode")).toBe("payment");
    expect(f.get("line_items[0][quantity]")).toBe("1");
    expect(f.get("line_items[0][price_data][unit_amount]")).toBe("7900");
    expect(f.get("metadata[formation]")).toBe("x");
    expect(f.has("vide")).toBe(false);
  });
});

describe("signature des événements Stripe", () => {
  const secret = "whsec_test";
  const corps = '{"type":"checkout.session.completed"}';
  const signe = (t: number, s = secret) => `t=${t},v1=${createHmac("sha256", s).update(`${t}.${corps}`).digest("hex")}`;
  const maintenant = 1_800_000_000_000;
  const t = maintenant / 1000;
  it("accepte une signature correcte et récente", () => expect(signatureValide(corps, signe(t), secret, maintenant)).toBe(true));
  it("refuse un autre secret", () => expect(signatureValide(corps, signe(t, "autre"), secret, maintenant)).toBe(false));
  it("refuse un corps modifié", () => expect(signatureValide(corps + " ", signe(t), secret, maintenant)).toBe(false));
  it("refuse un événement de plus de 5 minutes (rejeu)", () => expect(signatureValide(corps, signe(t - 301), secret, maintenant)).toBe(false));
  it("refuse sans en-tête", () => expect(signatureValide(corps, null, secret, maintenant)).toBe(false));
});
