import { describe, expect, it } from "vitest";
import { parseSalaryK } from "../src/lib/api";

describe("parseSalaryK", () => {
  it("retourne un objet vide sans chaîne", () => {
    expect(parseSalaryK(undefined)).toEqual({});
    expect(parseSalaryK("")).toEqual({});
  });

  it("parse une fourchette en k€", () => {
    expect(parseSalaryK("50k - 65k EUR")).toEqual({ min: 50, max: 65 });
  });

  it("convertit les montants annuels en k€", () => {
    expect(parseSalaryK("$60,000 - $80,000")).toEqual({ min: 60, max: 80 });
  });

  it("accepte une valeur unique pour min et max", () => {
    expect(parseSalaryK("55k")).toEqual({ min: 55, max: 55 });
  });

  it("rejette les valeurs aberrantes (> 250 k€)", () => {
    expect(parseSalaryK("900k - 1200k")).toEqual({});
  });
});
