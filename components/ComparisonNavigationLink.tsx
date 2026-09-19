"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { buildComparisonHref, normalizeComparisonAmount, parseComparisonBasis, parseComparisonSelection, withComparisonState } from "../lib/comparison-selection";

type Props = { href: string; addItem?: string; className?: string; children: ReactNode };

function StatefulLink({ href, addItem, className, children }: Props) {
  const params = useSearchParams();
  const refs = parseComparisonSelection(params.getAll("item")).selectedRefs;
  const basis = parseComparisonBasis(params.get("basis") ?? undefined);
  const targetServingUnit = normalizeComparisonAmount(params.get("amount") ?? undefined);
  if (addItem) {
    const next = parseComparisonSelection([...refs.map((ref) => ref.value), addItem]);
    if (next.tooMany) return <p>이미 3개를 선택했습니다. <Link href={buildComparisonHref({ refs, basis, targetServingUnit })}>현재 비교에서 항목을 제거하세요</Link></p>;
    return <Link className={className} href={buildComparisonHref({ refs: next.selectedRefs, basis, targetServingUnit })}>{children}</Link>;
  }
  const target = new URL(href, "https://local.invalid");
  for (const key of ["q", "page"]) {
    const value = params.get(key);
    if (value) target.searchParams.set(key, value);
  }
  return <Link className={className} href={withComparisonState(`${target.pathname}${target.search}`, { refs, basis, targetServingUnit })}>{children}</Link>;
}

// Keep detail nutrition data eligible for ISR; selection belongs to the URL,
// never to the cached server result or cross-tab storage.
export function ComparisonNavigationLink(props: Props) {
  return <Suspense fallback={<span className={props.className} aria-busy="true">{props.children}</span>}><StatefulLink {...props} /></Suspense>;
}
