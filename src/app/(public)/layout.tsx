import { PublicShell } from "@/components/layout/PublicShell";

/**
 * Wraps the pages a pupil can reach without signing in.
 *
 * This layout is a server component so the pages inside it stay statically
 * rendered — only the shell's header is interactive.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
