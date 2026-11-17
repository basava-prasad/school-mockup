"use client";
import { useEffect, useState } from "react";
export type Route = { page: string; sub: string; param: string };
function parse(): Route {
  if (typeof window === "undefined") return { page: "overview", sub: "", param: "" };
  const h = window.location.hash.replace(/^#\/?/, "");
  const [page = "overview", sub = "", param = ""] = h.split("/");
  return { page: page || "overview", sub, param };
}
export function useRoute() {
  const [r, setR] = useState<Route>({ page: "overview", sub: "", param: "" });
  useEffect(() => {
    const f = () => { setR(parse()); document.getElementById("main-scroll")?.scrollTo(0, 0); };
    f();
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return r;
}
export const go = (path: string) => { window.location.hash = "/" + path.replace(/^\//, ""); };
export const href = (path: string) => "#/" + path.replace(/^\//, "");
