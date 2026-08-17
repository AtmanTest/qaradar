import { describe, expect, it } from "vitest";
import type { Job } from "../src/types";
import {
  annualized,
  formatCountdown,
  formatPay,
  initialsOf,
  jobsToCsv,
  jobsToRss,
  stripHtml,
  timeAgo,
} from "../src/lib/utils";

const baseJob: Job = {
  id: "t-1",
  title: "QA Engineer Senior",
  company: "Doctolib",
  location: "Paris",
  workMode: "Hybride",
  contract: "CDI",
  salaryMin: 60,
  salaryMax: 68,
  tags: ["Playwright", "CI/CD"],
  source: "wttj",
  url: "https://example.com/offre-1",
  publishedAt: Date.now() - 3_600_000,
  description: "Description de test.",
  seniority: "Senior · 8 ans et +",
};

describe("timeAgo", () => {
  it("affiche « à l'instant » sous 45 s", () => {
    expect(timeAgo(Date.now() - 10_000)).toBe("à l'instant");
  });
  it("affiche les minutes, heures, hier et semaines", () => {
    expect(timeAgo(Date.now() - 5 * 60_000)).toBe("il y a 5 min");
    expect(timeAgo(Date.now() - 3 * 3_600_000)).toBe("il y a 3 h");
    expect(timeAgo(Date.now() - 26 * 3_600_000)).toBe("hier");
    expect(timeAgo(Date.now() - 20 * 86_400_000)).toBe("il y a 2 sem.");
  });
  it("ne retourne jamais de valeur négative", () => {
    expect(timeAgo(Date.now() + 60_000)).toBe("à l'instant");
  });
});

describe("formatPay / annualized", () => {
  it("formate une fourchette CDI en k€", () => {
    expect(formatPay(baseJob)).toBe("60–68 k€");
  });
  it("formate un TJM freelance et l'annualise (218 j)", () => {
    const freelance: Job = { ...baseJob, contract: "Freelance", tjm: 600, salaryMax: undefined };
    expect(formatPay(freelance)).toBe("600 €/j");
    expect(annualized(freelance)).toBe(600 * 218);
  });
  it("retourne « — » sans rémunération connue", () => {
    expect(formatPay({ ...baseJob, salaryMin: undefined, salaryMax: undefined })).toBe("—");
  });
});

describe("jobsToCsv", () => {
  it("produit un CSV avec BOM, en-têtes FR et séparateur « ; »", () => {
    const csv = jobsToCsv([baseJob]);
    expect(csv.startsWith("﻿")).toBe(true);
    const [head, row] = csv.split("\n");
    expect(head).toContain("Titre");
    expect(head.split(";")).toHaveLength(11);
    expect(row).toContain('"QA Engineer Senior"');
    expect(row).toContain('"Playwright | CI/CD"');
  });
  it("échappe les guillemets doubles", () => {
    const csv = jobsToCsv([{ ...baseJob, title: 'QA "Lead"' }]);
    expect(csv).toContain('"QA ""Lead"""');
  });
});

describe("jobsToRss", () => {
  it("produit un flux RSS 2.0 valide avec un item par offre", () => {
    const rss = jobsToRss([baseJob], () => "Welcome to the Jungle");
    expect(rss).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(rss).toContain("<rss version=\"2.0\">");
    expect(rss).toContain("<title>QA Engineer Senior — Doctolib</title>");
    expect(rss).toContain("<category>Welcome to the Jungle</category>");
  });
  it("échappe les entités XML", () => {
    const rss = jobsToRss([{ ...baseJob, company: "A & B <Tech>" }], (id) => id);
    expect(rss).toContain("A &amp; B &lt;Tech&gt;");
    expect(rss).not.toContain("A & B");
  });
});

describe("stripHtml", () => {
  it("retire les balises et normalise les espaces", () => {
    expect(stripHtml("<p>Bonjour <b>monde</b></p>")).toBe("Bonjour monde");
  });
});

describe("initialsOf", () => {
  it("gère un et deux mots", () => {
    expect(initialsOf("Doctolib")).toBe("DO");
    expect(initialsOf("BNP Paribas")).toBe("BP");
  });
});

describe("formatCountdown", () => {
  it("formate mm:ss avec padding", () => {
    expect(formatCountdown(65_000)).toBe("01:05");
    expect(formatCountdown(0)).toBe("00:00");
  });
});
