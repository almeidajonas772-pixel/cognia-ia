"use client";

import Script from "next/script";

/** Google Analytics — só carrega se o ID estiver configurado (spec §13). */
export function GoogleAnalytics({ id }: { id: string }) {
  if (!id || !/^G-|^UA-/.test(id)) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`}
      </Script>
    </>
  );
}
