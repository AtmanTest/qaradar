export type JobSource =
  | "wttj"
  | "indeed"
  | "francetravail"
  | "hellowork"
  | "linkedin"
  | "remotive"
  | "adzuna"
  | "arbeitnow";

/** URL de recherche native par source : le bouton « Postuler » doit renvoyer
 *  vers le job board concerné, jamais vers Google. */
export function searchUrl(src: JobSource, title: string, company: string): string {
  const q = encodeURIComponent(`${title} ${company}`);
  switch (src) {
    case "wttj":
      return `https://www.welcometothejungle.com/fr/jobs?query=${q}`;
    case "indeed":
      return `https://fr.indeed.com/jobs?q=${q}`;
    case "francetravail":
      return `https://candidat.francetravail.fr/offres/recherche?motsCles=${q}`;
    case "hellowork":
      return `https://www.hellowork.com/fr-fr/emploi/recherche.html?k=${q}`;
    case "linkedin":
      return `https://www.linkedin.com/jobs/search/?keywords=${q}`;
    case "remotive":
      return `https://remotive.com/remote-jobs?search=${encodeURIComponent(title)}`;
    case "adzuna":
      return `https://www.adzuna.fr/search?q=${encodeURIComponent(title)}`;
    case "arbeitnow":
      return `https://www.arbeitnow.com/jobs?search=${encodeURIComponent(title)}`;
    default:
      return `https://www.google.com/search?q=${encodeURIComponent(
        `"${title}" ${company} offre emploi`
      )}`;
  }
}
