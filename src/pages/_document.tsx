import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        <meta name="theme-color" content="#eef7f4" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </Head>
      <body className="antialiased">
        <script
          id="pathologix-theme"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="pathologix:theme";var s=localStorage.getItem(k);var d=s==="dark"||(!s&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",d?"#08191f":"#eef7f4")}catch(e){}})();`,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
