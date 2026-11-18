import type { BuyerSegmentKey, SegmentSchemaNode } from "@/components/cyber/buyer-segments";
import type { Locale } from "../config";

export type BuyerSegmentCopy = {
  shortLabel: string;
  label: string;
  headline: string;
  intro: string[];
  statement: string;
  approach: string;
  cta: string;
  schemaTitle: string;
  schemaNodes: readonly SegmentSchemaNode[];
  deliverableTitle: string;
  deliverableHeadline: string;
  deliverableSummary: string;
};

export interface Dictionary {
  lang: {
    switcherLabel: string;
    names: Record<Locale, string>;
  };
  metadata: {
    siteTitleDefault: string;
    siteTitleTemplate: string;
    siteDescription: string;
    jobTitle: string;
    countryName: string;
    pages: {
      home: { title: string; description: string };
      perChi: { title: string; description: string; ogDescription: string };
      metodologia: { title: string; description: string };
      prenota: { title: string; description: string };
    };
  };
  jsonLd: {
    websiteDescription: string;
    serviceDescription: string;
    offers: ReadonlyArray<{ name: string; description: string }>;
    faqs: ReadonlyArray<{ question: string; answer: string }>;
  };
  header: {
    brand: string;
    navAriaLabel: string;
    nav: {
      home: string;
      perChi: string;
      metodologia: string;
    };
    cta: string;
  };
  hero: {
    ariaLabel: string;
    portraitAlt: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  goDeeper: {
    ariaLabel: string;
    titleLine1: string;
    titleLine2: string;
    p1: string;
    p2: string;
  };
  risposte: {
    ariaLabel: string;
    headingLine1: string;
    headingLine2: string;
    bands: {
      RETOOL: { title: string; body: string[]; statement: string };
      ADAPT: { title: string; body: string[]; statement: string };
      EVOLVE: { title: string; body: string[]; statement: string };
    };
  };
  targetsHome: {
    ariaLabel: string;
    tablistAriaLabel: string;
    titleLine1: string;
    titleLine2Prefix: string;
    titleEmphasis: string;
    deepLinkPrefix: string;
  };
  conclusion: {
    ariaLabel: string;
    line1: string;
    line2: string;
    p1: string;
    p2: string;
    ctaPrimary: string;
    ctaDirect: string;
  };
  perChi: {
    headingLine1: string;
    headingLine2: string;
    intro: string;
    tabsAriaLabel: string;
    stageAriaLabel: string;
    asideAriaLabelPrefix: string;
    homeLink: string;
    topLink: string;
    methodLink: string;
  };
  segments: Record<BuyerSegmentKey, BuyerSegmentCopy>;
  methodology: {
    ariaLabel: string;
    headingLine1: string;
    headingLine2: string;
    phasePrefix: string;
    pillars: {
      deconstruct: { title: string; body: string[] };
      exploit: { title: string; body: string[] };
      remediate: { title: string; body: string[] };
    };
    closingQuote: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  booking: {
    backToSite: string;
    topMeta: string;
    pageTitle: string;
    phoneDisplay: string;
    calAriaLabel: string;
    prevMonth: string;
    nextMonth: string;
    weekDays: readonly [string, string, string, string, string, string, string];
    dayFullSuffix: string;
    fetchError: string;
    retry: string;
    stepsAriaLabel: string;
    steps: readonly [
      { num: string; label: string },
      { num: string; label: string },
      { num: string; label: string },
    ];
    guideTitle: string;
    guideFoot: string;
    howItWorks: readonly [
      { code: string; title: string; body: string },
      { code: string; title: string; body: string },
      { code: string; title: string; body: string },
    ];
    resetToGuide: string;
    loadingSlots: string;
    emptyDay: string;
    slotsAriaLabel: string;
    selectedPrefix: string;
    selectedGlue: string;
    changeSlot: string;
    fieldName: string;
    namePlaceholder: string;
    nameError: string;
    fieldEmail: string;
    emailPlaceholder: string;
    emailError: string;
    fieldTopic: string;
    topicPlaceholder: string;
    submitIdlePrefix: string;
    submitBusy: string;
    connectionError: string;
    genericError: string;
    confirmedBadge: string;
    confirmedTimePrefix: string;
    confirmedDemoNote: string;
    confirmedLivePrefix: string;
    confirmedLiveSuffix: string;
    openMeet: string;
    backToSiteDone: string;
    directAriaLabel: string;
    directEyebrow: string;
    directText: string;
    directButtonPrefix: string;
    apiErrors: {
      rateLimitDisp: string;
      invalidMonth: string;
      calUnreachable: string;
      rateLimitBook: string;
      badBody: string;
      invalidSlot: string;
      missingName: string;
      invalidEmail: string;
      slotTaken: string;
      calWriteFailed: string;
    };
    calendarInvite: {
      summaryPrefix: string;
      topicPrefix: string;
    };
  };
}
