import {
  Building2,
  CreditCard,
  Landmark,
  PiggyBank,
  Shield,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { AssetType } from "@/lib/types";
import { ASSET_META, type AssetTypeMeta } from "@/lib/asset-meta";

const ICONS: Record<AssetTypeMeta["icon"], LucideIcon> = {
  "trending-up": TrendingUp,
  landmark: Landmark,
  "piggy-bank": PiggyBank,
  building: Building2,
  shield: Shield,
  "credit-card": CreditCard,
};

export function AssetIcon({
  type,
  className,
}: {
  type: AssetType;
  className?: string;
}) {
  const Icon = ICONS[ASSET_META[type].icon];
  return <Icon className={className} aria-hidden />;
}
