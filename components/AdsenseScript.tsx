"use client";

import { usePathname } from "next/navigation";
import { canRequestAdsForPath, isAdsenseRuntimeEnabled } from "../lib/ad-policy";
import { siteConfig } from "../lib/site";

// recordEligible: 서버에서 판정한 자료 충분성(값이 거의 없는 상세는 false)
export function AdsenseScript({ recordEligible = true }: { recordEligible?: boolean }) {
  const pathname = usePathname();
  if (!recordEligible || !isAdsenseRuntimeEnabled() || !canRequestAdsForPath(pathname)) {
    return null;
  }

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.publisherId}`}
      crossOrigin="anonymous"
    />
  );
}
