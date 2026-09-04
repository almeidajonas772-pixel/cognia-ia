"use client";

import { useEffect, useRef } from "react";
import { recordContentView } from "@/lib/biblioteca/actions";

/** Registra a leitura do conteúdo uma vez, ao montar. */
export function ViewTracker({
  contentId,
  subjectSlug,
  title,
  href,
}: {
  contentId: string;
  subjectSlug?: string;
  title?: string;
  href?: string;
}) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void recordContentView(contentId, { subjectSlug, title, href });
  }, [contentId, subjectSlug, title, href]);

  return null;
}
