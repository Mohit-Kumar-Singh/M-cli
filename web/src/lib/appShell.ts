import { useEffect } from "react";

/** Lets /book install as its own home-screen app, distinct from the owner
 *  console, while both stay one deployment on one service worker. Chrome's
 *  install prompt and iOS "Add to Home Screen" both read the *current* DOM
 *  state at the moment of installing, so swapping these on route mount is
 *  enough — no separate build or deploy needed. */
const OWNER = {
  title: "Milk Garage",
  manifest: "/manifest.webmanifest",
  appleTitle: "Milk Garage",
};
const CUSTOMER = {
  title: "Order — Milk Garage",
  manifest: "/manifest-customer.webmanifest",
  appleTitle: "MG Order",
};

export function useAppShellMeta(isCustomer: boolean) {
  useEffect(() => {
    const cfg = isCustomer ? CUSTOMER : OWNER;
    document.title = cfg.title;

    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "manifest";
      document.head.appendChild(link);
    }
    link.href = cfg.manifest;

    const appleTitleMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-title"]',
    );
    if (appleTitleMeta) appleTitleMeta.content = cfg.appleTitle;
  }, [isCustomer]);
}
