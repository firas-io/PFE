import type { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

/**
 * Resolves a PascalCase lucide-react export name to a component (fallback: Circle).
 */
export function resolveLucideIcon(name: string): LucideIcon {
  const map = LucideIcons as unknown as Record<string, LucideIcon | undefined>;
  const Icon = map[name];
  return Icon ?? LucideIcons.Circle;
}
