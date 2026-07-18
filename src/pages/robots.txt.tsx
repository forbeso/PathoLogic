import { SITE_URL } from "@/components/Seo";
import type { GetServerSideProps } from "next";

export default function RobotsTxt() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const body = [`User-agent: *`, `Allow: /`, `Disallow: /api/`, ``, `Sitemap: ${SITE_URL}/sitemap.xml`, ``].join(
    "\n"
  );

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=86400, stale-while-revalidate=3600");
  res.write(body);
  res.end();

  return { props: {} };
};
