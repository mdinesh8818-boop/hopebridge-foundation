import Link from "next/link";
import type { ReactNode } from "react";

export function PageHero({
  kicker,
  title,
  summary,
  actions,
  imageSrc,
  imageAlt,
}: {
  kicker?: string;
  title: string;
  summary: string;
  actions?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-[#e8decb] bg-[#003f2f] text-[#fffdf6]">
      {imageSrc ? (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSrc} alt={imageAlt ?? ""} className="h-full w-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#002a20]/95 via-[#003f2f]/82 to-[#003f2f]/45" />
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,224,121,0.14),transparent_28%)]" />
      )}
      <div className="pub-container relative py-16 sm:py-20">
        {kicker ? <p className="text-xs font-bold tracking-[0.16em] text-[#f1ce55] uppercase">{kicker}</p> : null}
        <h1 className="pub-serif mt-3 max-w-3xl text-4xl leading-tight sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#d7e4dc] sm:text-lg">{summary}</p>
        {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

export function SectionHeading({
  kicker,
  title,
  summary,
  align = "left",
}: {
  kicker?: string;
  title: string;
  summary?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {kicker ? <p className="pub-kicker">{kicker}</p> : null}
      <h2 className="pub-serif mt-3 text-3xl leading-tight text-[#18392e] sm:text-4xl">{title}</h2>
      {summary ? <p className="mt-4 text-base leading-relaxed text-[#4d6359]">{summary}</p> : null}
    </div>
  );
}

export function CtaLink({
  href,
  children,
  variant = "gold",
}: {
  href: string;
  children: ReactNode;
  variant?: "gold" | "emerald" | "secondary" | "light";
}) {
  const className =
    variant === "gold"
      ? "hb-gold-btn"
      : variant === "emerald"
        ? "hb-emerald-btn"
        : variant === "light"
          ? "rounded-xl border border-white/30 bg-white/10 text-[#fffdf6] hover:bg-white/15"
          : "hb-secondary-btn";

  return (
    <Link
      href={href}
      className={`${className} pub-focus-ring inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold`}
    >
      {children}
    </Link>
  );
}
