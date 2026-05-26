import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * PageShellAuth — v2 wrapper for all auth / onboarding "loud" surfaces.
 *
 * Renders a full-bleed hot-pink background with a centered violet card mat,
 * inside which the actual form (white inner card) sits. Per design spec
 * §1 (dual treatment system): transactional surfaces are loud, app chrome
 * is calm.
 *
 * Usage:
 *   <PageShellAuth>
 *     <PageShellAuth.Card>
 *       <Logo />
 *       <h1 className="font-display text-3xl">Ravi de vous revoir.</h1>
 *       <form>...</form>
 *     </PageShellAuth.Card>
 *   </PageShellAuth>
 *
 * Spec ref: design-extraction-web.md §1 "saturated brand color blocks" +
 * §7 Auth "hot-pink full-bleed + violet card + white inner card".
 */

interface PageShellAuthProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Override the background intensity. Default `loud` = hot-pink full-bleed.
   *  `soft` = warm paper bg for less critical auxiliary screens. */
  intensity?: "loud" | "soft"
}

function PageShellAuthRoot({
  className,
  intensity = "loud",
  children,
  ...props
}: PageShellAuthProps) {
  return (
    <div
      data-slot="page-shell-auth"
      data-intensity={intensity}
      className={cn(
        "relative flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-8 sm:py-12",
        intensity === "loud"
          ? "bg-[var(--accent-hot-pink)]"
          : "bg-[var(--paper-warm)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface PageShellAuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Inner card width. Defaults to `md` (max-w-md). */
  width?: "sm" | "md" | "lg"
}

function PageShellAuthCard({
  className,
  width = "md",
  children,
  ...props
}: PageShellAuthCardProps) {
  const widthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  }[width]

  return (
    <div
      data-slot="page-shell-auth-card"
      className={cn(
        "relative w-full rounded-3xl p-1.5",
        // Violet mat (outer)
        "bg-[var(--accent)]",
        widthClass,
        className
      )}
      {...props}
    >
      {/* White inner card */}
      <div className="relative rounded-[calc(theme(borderRadius.3xl)-0.375rem)] bg-[var(--paper-white)] p-6 sm:p-8">
        {children}
      </div>
    </div>
  )
}

/* Composite export so consumers use <PageShellAuth.Card> sugar. */
const PageShellAuth = Object.assign(PageShellAuthRoot, {
  Card: PageShellAuthCard,
})

export { PageShellAuth }
