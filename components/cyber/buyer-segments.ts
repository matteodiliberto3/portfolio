import { PALETTE } from "@/components/cyber/tokens";
import type { BuyerSegmentCopy } from "@/lib/i18n/dictionaries/types";

export type BuyerSegmentKey = "pmi" | "startup" | "enterprise";

export type SegmentSchemaNode = {
  role: string;
  label: string;
  detail: string;
  highlighted?: boolean;
};

export type BuyerSegmentStyle = {
  code: string;
  badgeColor: string;
  accentInk: string;
  buttonClass: string;
  solidButtonClass: string;
};

export type BuyerSegment = BuyerSegmentStyle & BuyerSegmentCopy;

export const BUYER_SEGMENT_KEYS: readonly BuyerSegmentKey[] = [
  "pmi",
  "startup",
  "enterprise",
] as const;

export const BUYER_SEGMENT_STYLES: Record<BuyerSegmentKey, BuyerSegmentStyle> = {
  pmi: {
    code: "01",
    badgeColor: PALETTE.red,
    accentInk: PALETTE.redText,
    buttonClass: "cyber-segment-btn-pmi",
    solidButtonClass: "cyber-segment-solid-pmi",
  },
  startup: {
    code: "02",
    badgeColor: PALETTE.blue,
    accentInk: PALETTE.blueText,
    buttonClass: "cyber-segment-btn-startup",
    solidButtonClass: "cyber-segment-solid-startup",
  },
  enterprise: {
    code: "03",
    badgeColor: PALETTE.ink,
    accentInk: PALETTE.enterpriseAccent,
    buttonClass: "cyber-segment-btn-enterprise",
    solidButtonClass: "cyber-segment-solid-enterprise",
  },
};

export function buildBuyerSegments(
  copy: Record<BuyerSegmentKey, BuyerSegmentCopy>,
): Record<BuyerSegmentKey, BuyerSegment> {
  return {
    pmi: { ...BUYER_SEGMENT_STYLES.pmi, ...copy.pmi },
    startup: { ...BUYER_SEGMENT_STYLES.startup, ...copy.startup },
    enterprise: { ...BUYER_SEGMENT_STYLES.enterprise, ...copy.enterprise },
  };
}
