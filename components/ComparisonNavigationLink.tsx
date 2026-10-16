"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { resolveStatefulHref } from "../lib/comparison-selection";

type Props = {
  href: string;
  addItem?: string;
  className?: string;
  children: ReactNode;
  // Search/paging params of the current page that the destination also uses.
  // Destinations that do not read them (e.g. group pages) pass [].
  carryKeys?: readonly string[];
};

function StatefulLink({ href, addItem, className, children, carryKeys }: Props) {
  const resolved = resolveStatefulHref({ href, addItem, carryKeys }, useSearchParams());
  if (resolved.kind === "full") return <p>이미 3개를 선택했습니다. <Link href={resolved.manageHref}>현재 비교에서 항목을 제거하세요</Link></p>;
  return <Link className={className} href={resolved.href}>{children}</Link>;
}

// Keep detail nutrition data eligible for ISR; selection belongs to the URL,
// never to the cached server result or cross-tab storage.
export function ComparisonNavigationLink(props: Props) {
  // Static/ISR HTML renders this fallback, so it must be a real, crawlable link
  // (without URL state); the stateful version replaces it after hydration.
  const fallbackHref = props.addItem ? `/compare?item=${encodeURIComponent(props.addItem)}` : props.href;
  return <Suspense fallback={<Link className={props.className} href={fallbackHref}>{props.children}</Link>}><StatefulLink {...props} /></Suspense>;
}
