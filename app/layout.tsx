import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AdsenseScript } from "../components/AdsenseScript";
import { GAProvider } from "../components/GAProvider";
import { absoluteUrl, siteConfig } from "../lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  alternates: {
    canonical: absoluteUrl("/")
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    url: absoluteUrl("/")
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: siteConfig.name,
    url: absoluteUrl("/")
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: siteConfig.name,
    url: absoluteUrl("/"),
    publisher: {
      "@id": absoluteUrl("/#organization")
    }
  };

  return (
    <html lang="ko">
      <body>
        <GAProvider />
        <AdsenseScript />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationSchema, websiteSchema]) }}
        />
        <header className="site-header">
          <Link className="brand" href="/">
            <span className="brand__mark">영</span>
            <span>
              <strong>{siteConfig.name}</strong>
              <small>{siteConfig.tagline}</small>
            </span>
          </Link>
          <nav className="site-nav" aria-label="주요 메뉴">
            <Link href="/blog">블로그</Link>
            <a href="/llms.txt">llms.txt</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>출처, 기준량, 검토일을 함께 표시하는 식품영양 데이터 사이트입니다.</p>
          <p>효능·질병 표현을 피하고 건강기능식품 제휴 표현을 사용하지 않습니다.</p>
        </footer>
      </body>
    </html>
  );
}
