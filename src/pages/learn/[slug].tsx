import { AppShell } from "@/components/AppShell";
import Header from "@/components/Header";
import Seo, { SITE_URL } from "@/components/Seo";
import {
  getLearnArticle,
  getRelatedLearnArticles,
  learnArticles,
  type LearnArticle,
} from "@/lib/learnArticles";
import type { GetStaticPaths, GetStaticProps } from "next";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

type LearnArticlePageProps = {
  article: LearnArticle;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default function LearnArticlePage({ article }: LearnArticlePageProps) {
  const related = getRelatedLearnArticles(article);
  const canonicalPath = `/learn/${article.slug}`;

  return (
    <AppShell>
      <Seo
        title={article.title}
        description={article.description}
        path={canonicalPath}
        type="article"
        publishedTime={article.published}
        modifiedTime={article.updated}
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              "@id": `${SITE_URL}${canonicalPath}#article`,
              headline: article.title,
              description: article.description,
              datePublished: article.published,
              dateModified: article.updated,
              mainEntityOfPage: `${SITE_URL}${canonicalPath}`,
              author: {
                "@type": "Organization",
                name: "PathoLogix",
                url: SITE_URL,
              },
              publisher: {
                "@type": "Organization",
                name: "PathoLogix",
                url: SITE_URL,
              },
              image: `${SITE_URL}/emt.png`,
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: SITE_URL,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Learn",
                  item: `${SITE_URL}/learn`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: article.shortTitle,
                  item: `${SITE_URL}${canonicalPath}`,
                },
              ],
            },
          ],
        }}
      />
      <Header />

      <main>
        <article>
          <header className="border-b border-slate-800 bg-slate-950 text-white">
            <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
              <nav aria-label="Breadcrumb">
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-2 text-sm font-bold text-teal-300 transition hover:text-teal-200"
                >
                  <ArrowLeft size={16} />
                  Learning Center
                </Link>
              </nav>
              <div className="mt-7 max-w-4xl">
                <p className="text-sm font-bold text-teal-300">{article.category}</p>
                <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">{article.title}</h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{article.intro}</p>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <Clock3 size={15} />
                    {article.readTime}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={15} />
                    Updated {formatDate(article.updated)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <BookOpenCheck size={15} />
                    Source-backed guide
                  </span>
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_240px] lg:px-8">
            <div className="min-w-0">
              <section aria-labelledby="key-points" className="border-y border-teal-200 bg-teal-50/80 py-6 sm:px-6">
                <h2 id="key-points" className="text-xl font-black text-slate-950">
                  Key points
                </h2>
                <ul className="mt-4 space-y-3">
                  {article.keyPoints.map((point) => (
                    <li key={point} className="flex gap-3 text-sm leading-6 text-slate-700">
                      <CheckCircle2 className="mt-1 shrink-0 text-teal-700" size={17} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="mt-10 space-y-12">
                {article.sections.map((section) => (
                  <section key={section.id} id={section.id} className="scroll-mt-28">
                    <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">{section.heading}</h2>
                    <div className="mt-4 space-y-4">
                      {section.paragraphs?.map((paragraph) => (
                        <p key={paragraph} className="text-base leading-8 text-slate-700">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    {section.bullets ? (
                      <ul className="mt-5 space-y-3 border-l-2 border-teal-300 pl-5">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="text-base leading-7 text-slate-700">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {section.note ? (
                      <div className="mt-6 border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-950">
                        {section.note}
                      </div>
                    ) : null}
                  </section>
                ))}
              </div>

              <section aria-labelledby="sources" className="mt-14 border-t border-slate-300 pt-8">
                <h2 id="sources" className="text-2xl font-black text-slate-950">
                  Sources
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Clinical and examination information was checked against the following authoritative
                  references.
                </p>
                <ul className="mt-5 space-y-3">
                  {article.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-start gap-2 text-sm font-bold leading-6 text-teal-800 underline decoration-teal-300 underline-offset-4 hover:text-teal-600"
                      >
                        {source.label}
                        <ExternalLink className="mt-1 shrink-0" size={14} />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-12 border-y border-slate-800 bg-slate-950 px-5 py-7 text-white sm:px-7">
                <p className="text-sm font-bold text-teal-300">Put the concept into practice</p>
                <h2 className="mt-2 text-2xl font-black">Use the decision, not just the definition.</h2>
                <Link
                  href={article.practiceHref}
                  className="mt-5 inline-flex items-center gap-2 rounded-md bg-teal-400 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-teal-300"
                >
                  {article.practiceLabel}
                  <ArrowRight size={16} />
                </Link>
              </section>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="border-t-2 border-teal-500 pt-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  In this guide
                </p>
                <nav className="mt-3 space-y-1" aria-label="Article sections">
                  {article.sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="block border-l border-slate-300 py-1.5 pl-3 text-sm font-semibold leading-5 text-slate-600 transition hover:border-teal-600 hover:text-teal-800"
                    >
                      {section.heading}
                    </a>
                  ))}
                  <a
                    href="#sources"
                    className="block border-l border-slate-300 py-1.5 pl-3 text-sm font-semibold text-slate-600 transition hover:border-teal-600 hover:text-teal-800"
                  >
                    Sources
                  </a>
                </nav>
              </div>
              <div className="mt-8 border-t border-slate-300 pt-5">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                  <ShieldCheck size={15} />
                  Study responsibly
                </p>
                <p className="mt-3 text-xs leading-5 text-slate-600">
                  Follow your approved curriculum, current local protocols, scope of practice, and
                  medical direction.
                </p>
              </div>
            </aside>
          </div>
        </article>

        <section className="border-t border-[#d4e5df] bg-white/65 py-10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-black text-slate-950">Continue learning</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/learn/${item.slug}`}
                  className="group rounded-lg border border-[#c8dcd6] bg-white p-5 transition hover:border-teal-400 hover:shadow-sm"
                >
                  <span className="text-xs font-bold text-teal-700">{item.category}</span>
                  <h3 className="mt-2 text-lg font-bold text-slate-950">{item.shortTitle}</h3>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-slate-600 group-hover:text-teal-700">
                    Read next
                    <ArrowRight size={15} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: learnArticles.map((article) => ({ params: { slug: article.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<LearnArticlePageProps> = async ({ params }) => {
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const article = getLearnArticle(slug);

  if (!article) return { notFound: true };
  return { props: { article } };
};
