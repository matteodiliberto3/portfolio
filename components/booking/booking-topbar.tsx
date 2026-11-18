"use client";

import { BackHome } from "@/components/back-home";
import { ArrowIcon } from "@/components/cyber/arrow-icon";
import { LanguageSwitcher } from "@/components/cyber/language-switcher";
import { FixedLocaleLabel } from "@/components/i18n/fixed-locale-label";
import { useI18n } from "@/components/i18n/locale-provider";
import { getDictionary, LOCALES } from "@/lib/i18n";

const ALL_BACK_LABELS = LOCALES.map((l) => getDictionary(l).booking.backToSite);
const ALL_META_LABELS = LOCALES.map((l) => getDictionary(l).booking.topMeta);

export function BookingTopBar() {
  const { t } = useI18n();

  return (
    <header className="bk-top">
      <BackHome className="bk-back press">
        <ArrowIcon direction="left" />
        <FixedLocaleLabel values={ALL_BACK_LABELS} active={t.booking.backToSite} align="start" />
      </BackHome>

      <div className="bk-top-right">
        <span className="bk-top-meta">
          <FixedLocaleLabel values={ALL_META_LABELS} active={t.booking.topMeta} align="end" />
        </span>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
