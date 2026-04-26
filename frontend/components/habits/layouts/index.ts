import type { ComponentType } from "react";
import type { CategoryLayoutKey } from "@/src/types/category.types";
import type { HabitsLayoutProps } from "../layoutTypes";
import DefaultLayout from "./DefaultLayout";
import SportLayout from "./SportLayout";
import StudyLayout from "./StudyLayout";
import WellnessLayout from "./WellnessLayout";
import ProductivityLayout from "./ProductivityLayout";
import HealthLayout from "./HealthLayout";
import FinanceLayout from "./FinanceLayout";
import SocialLayout from "./SocialLayout";
import CreativityLayout from "./CreativityLayout";

export const layouts = {
  sport: SportLayout,
  study: StudyLayout,
  wellness: WellnessLayout,
  productivity: ProductivityLayout,
  health: HealthLayout,
  finance: FinanceLayout,
  social: SocialLayout,
  creativity: CreativityLayout,
  default: DefaultLayout,
} as const satisfies Record<CategoryLayoutKey, ComponentType<HabitsLayoutProps>>;

export function getLayout(layoutKey: string | undefined): ComponentType<HabitsLayoutProps> {
  if (!layoutKey) return layouts.default;
  const key = layoutKey as CategoryLayoutKey;
  return (layouts as Record<string, ComponentType<HabitsLayoutProps>>)[key] ?? layouts.default;
}

export {
  DefaultLayout,
  SportLayout,
  StudyLayout,
  WellnessLayout,
  ProductivityLayout,
  HealthLayout,
  FinanceLayout,
  SocialLayout,
  CreativityLayout,
};
