import { SITE_URL } from "@/components/Seo";
import { learnArticles } from "@/lib/learnArticles";
import type { GetServerSideProps } from "next";

const publicRoutes = [
  { path: "/", modified: "2026-07-17" },
  { path: "/learn", modified: "2026-07-17" },
  { path: "/emtrainer", modified: "2026-07-17" },
  { path: "/exam/nremt", modified: "2026-07-17" },
  { path: "/flashcards", modified: "2026-07-17" },
  { path: "/emtscene", modified: "2026-07-17" },
  { path: "/privacy", modified: "2026-07-23" },
  { path: "/terms", modified: "2026-07-23" },
  { path: "/contact", modified: "2026-07-23" },
];

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

function buildSitemap() {
  const routes = [
    ...publicRoutes,
    ...learnArticles.map((article) => ({
      path: `/learn/${article.slug}`,
      modified: article.updated,
    })),
  ];

  const urls = routes
    .map(
      ({ path, modified }) => `  <url>
    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>
    <lastmod>${modified}</lastmod>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export default function SitemapXml() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=86400, stale-while-revalidate=3600");
  res.write(buildSitemap());
  res.end();

  return { props: {} };
};
