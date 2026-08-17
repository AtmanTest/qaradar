import { describe, expect, it } from "vitest";
import type { Job } from "../src/types";
import { locationMatches, matchScore, PROFILE } from "../src/data/jobs";

function job(partial: Partial<Job>): Job {
  return {
    id: "s-1",
    title: "QA Engineer",
    company: "ACME",
    location: "Paris",
    workMode: "Hybride",
    contract: "CDI",
    tags: [],
    source: "wttj",
    url: "https://example.com",
    publishedAt: Date.now(),
    description: "",
    seniority: "Senior · 8 ans et +",
    ...partial,
  };
}

describe("matchScore", () => {
  it("reste dans la borne 36–99 sans compétence correspondante", () => {
    const score = matchScore(job({ tags: ["COBOL"], description: "As400." }));
    expect(score).toBeGreaterThanOrEqual(36);
    expect(score).toBeLessThanOrEqual(99);
  });

  it("augmente avec les compétences du profil détectées", () => {
    const low = matchScore(job({ tags: [], description: "Aucune techno." }));
    const high = matchScore(
      job({ tags: ["Playwright", "CI/CD", "ISTQB"], description: "Selenium et Cypress." })
    );
    expect(high).toBeGreaterThan(low);
  });

  it("ajoute un bonus pour les titres lead/senior", () => {
    const plain = matchScore(job({ title: "QA Engineer" }));
    const lead = matchScore(job({ title: "Lead QA Engineer" }));
    expect(lead).toBe(plain + 8);
  });

  it("plafonne à 99", () => {
    const all = job({
      title: "Lead QA Principal",
      tags: [...PROFILE.skills],
      description: PROFILE.skills.join(" "),
    });
    expect(matchScore(all)).toBe(99);
  });
});

describe("locationMatches", () => {
  it("détecte Paris", () => {
    expect(locationMatches("Paris 9e", "paris")).toBe(true);
    expect(locationMatches("Lyon", "paris")).toBe(false);
  });
  it("détecte la petite couronne", () => {
    expect(locationMatches("Boulogne-Billancourt", "couronne")).toBe(true);
    expect(locationMatches("La Défense", "couronne")).toBe(true);
    expect(locationMatches("Paris", "couronne")).toBe(false);
  });
  it("détecte le full remote", () => {
    expect(locationMatches("Full remote", "remote")).toBe(true);
  });
});
