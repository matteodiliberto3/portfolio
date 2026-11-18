import type { Dictionary } from "./types";

export const en: Dictionary = {
  lang: {
    switcherLabel: "Language selector",
    names: {
      it: "Italiano",
      en: "English",
      de: "Deutsch",
    },
  },
  metadata: {
    siteTitleDefault: "Matteo Di Liberto — Cybersecurity Engineer & Penetration Testing",
    siteTitleTemplate: "%s — Matteo Di Liberto",
    siteDescription:
      "Matteo Di Liberto — Computer Engineer and Cybersecurity Consultant: Penetration Testing, Source Code Audits, DevSecOps, and hardening of cloud infrastructures and AI systems.",
    jobTitle: "Cybersecurity Engineer · Penetration Testing & Security Advisory",
    countryName: "Italy",
    pages: {
      home: {
        title: "Cybersecurity — Matteo Di Liberto",
        description:
          "The digital world has changed. Targeted security assessments across systems, access controls, and applications to help businesses, startups, and enterprises catch risks before they escalate.",
      },
      perChi: {
        title: "Who it's for",
        description:
          "Risk does not check the size of your company: security reviews for business owners & SMEs, startups & software houses, and multinational organizations.",
        ogDescription:
          "SMEs & business owners, startups & software houses, and large organizations: how to uncover and manage digital security risks in your operating context.",
      },
      metodologia: {
        title: "Method",
        description:
          "You cannot protect what you don't know: Deconstruct, Exploit, Remediate. A three-phase method to identify and resolve concrete security risks.",
      },
      prenota: {
        title: "Book an initial call",
        description:
          "Thirty minutes on Google Meet with Matteo Di Liberto to review your company setup, real-world risks, and practical first steps.",
      },
    },
  },
  jsonLd: {
    websiteDescription:
      "Matteo Di Liberto — Computer Engineer and Cybersecurity Consultant: Penetration Testing, Source Code Audits, DevSecOps, and cloud & AI security hardening.",
    serviceDescription:
      "High-rigor Cybersecurity services: Manual Penetration Testing, Source Code Audits, DevSecOps, and Cloud Infrastructure Hardening.",
    offers: [
      {
        name: "Web & API Penetration Testing",
        description:
          "Manual intrusion testing focused on business-logic flaws, authentication bypasses, and OWASP Top 10 vulnerabilities.",
      },
      {
        name: "Code Audit & DevSecOps",
        description:
          "Source code security review, dependency hardening, and CI/CD pipeline integration with automated checks and proof verification.",
      },
      {
        name: "Cloud Hardening & MLOps Security",
        description:
          "Container isolation, zero-trust IAM policies, and prompt-injection defenses for production AI pipelines.",
      },
    ],
    faqs: [
      {
        question: "Who is Matteo Di Liberto?",
        answer:
          "A Computer Engineer specializing in Cybersecurity, MLOps, and resilient architectures. I run manual penetration tests, source code reviews, and security assessments for organizations handling critical data and workflows.",
      },
      {
        question: "What Cybersecurity services do you provide?",
        answer:
          "Web and API penetration testing (OWASP Top 10 and business-logic flaws), source code and DevSecOps audits, cloud/container hardening, and security reviews for AI/ML systems.",
      },
      {
        question: "How does your assessment differ from an automated scanner?",
        answer:
          "Automated scanners generate noise and false positives while missing business logic. I test manually like a real attacker, delivering reproducible proofs of concept and remediation code for each finding.",
      },
      {
        question: "What is delivered at the end of a security assessment?",
        answer:
          "An executive risk matrix for leadership plus a detailed technical report for developers with reproduction steps, recommended fixes, and an included re-test to validate patches.",
      },
      {
        question: "How do we get started?",
        answer:
          "With a 30-minute NDA-covered call to define engagement scope, critical assets, and operational constraints. You can book a slot directly online.",
      },
    ],
  },
  header: {
    brand: "MATTEO DI LIBERTO",
    navAriaLabel: "Main navigation",
    nav: {
      home: "Home",
      perChi: "Who it's for",
      metodologia: "Method",
    },
    cta: "BOOK AN INITIAL CALL",
  },
  hero: {
    ariaLabel: "The digital shift",
    portraitAlt: "ASCII art portrait of Matteo Di Liberto",
    subtitle: "Has your business kept pace?",
    ctaPrimary: "Let's discuss your business",
    ctaSecondary: "See what has changed ↓",
  },
  goDeeper: {
    ariaLabel: "Awareness: running smoothly does not mean being secure",
    titleLine1: "Working properly",
    titleLine2: "doesn't mean being secure",
    p1: "Your company can operate every day without visible issues while quietly carrying vulnerabilities nobody is inspecting.",
    p2: "As threats and regulatory responsibilities evolve, knowing your real digital exposure is the first step toward protecting what matters.",
  },
  risposte: {
    ariaLabel: "Three responses to change: Retool, Adapt, Evolve",
    headingLine1: "THE WORLD CHANGES.",
    headingLine2: "STANDING STILL IS A CHOICE.",
    bands: {
      RETOOL: {
        title: "Question the tools you rely on.",
        body: [
          "An aging system, unsupported software, or neglected infrastructure can quietly turn into a structural weak point.",
        ],
        statement:
          "Modernizing does not mean replacing everything. It means knowing what to keep, what to harden, and what you can no longer afford to ignore.",
      },
      ADAPT: {
        title: "Change how you approach risk.",
        body: [
          "Deploying new technology achieves little if the organization keeps operating with the exact same habits.",
        ],
        statement:
          "Security depends on tools, but just as much on the decisions and daily practices of the people using them.",
      },
      EVOLVE: {
        title: "Don't wait for an incident to force change.",
        body: [
          "Threats evolve, architectures grow, and compliance obligations move alongside them.",
        ],
        statement:
          "Evolving means recognizing when it is time to verify, update, and strengthen the systems your business depends on.",
      },
    },
  },
  targetsHome: {
    ariaLabel: "Who it's for: SMEs, Startups and software houses, Multinationals",
    tablistAriaLabel: "Select your organization type",
    titleLine1: "EVERY BUSINESS HAS SOMETHING",
    titleLine2Prefix: "IT CANNOT AFFORD ",
    titleEmphasis: "TO LOSE.",
    deepLinkPrefix: "Explore:",
  },
  conclusion: {
    ariaLabel: "From awareness to action",
    line1: "THE NEXT ATTACK",
    line2: "WON'T WARN YOU.",
    p1: "That doesn't mean you have to wait for one before asking the right questions.",
    p2: "You don't need all the answers today. You need to know where to start looking for them.",
    ctaPrimary: "Book an initial call",
    ctaDirect: "Direct contact",
  },
  perChi: {
    headingLine1: "RISK DOESN'T CHECK",
    headingLine2: "THE SIZE OF YOUR COMPANY.",
    intro:
      "Three operating realities, similar real-world threats, different priorities. Pick your context to see where exposures hide and what you get from an assessment.",
    tabsAriaLabel: "Select your business context",
    stageAriaLabel: "Selected scenario details",
    asideAriaLabelPrefix: "Visual summary and outcome for",
    homeLink: "Back to home",
    topLink: "Back to top ↑",
    methodLink: "Explore the method",
  },
  segments: {
    pmi: {
      shortLabel: "Owners & SMEs",
      label: "Business owners & SMEs",
      headline: "If your core business software stopped tomorrow, what would happen?",
      intro: [
        "How much of your daily work depends on a software platform, an account, or an external IT vendor?",
        "Most organizations only realize how critical those dependencies are the day something breaks.",
      ],
      statement:
        "You don't need to become a cybersecurity specialist. You need clarity on which risks affect your operations and which decisions actually matter.",
      approach:
        "Through targeted checks we map weaknesses across systems and access permissions, separate urgent exposure from noise, and set a practical plan for remediation.",
      cta: "Talk about your business",
      schemaTitle: "WHERE OPERATIONS STOP",
      schemaNodes: [
        {
          role: "OPERATIONS",
          label: "ERP, invoicing & daily orders",
          detail: "Billing, fulfillment, and internal workflows rely on continuous system uptime.",
        },
        {
          role: "CRITICAL POINT",
          label: "Shared accounts or external access",
          detail: "Weak credentials or stale permissions left active for outside vendors.",
          highlighted: true,
        },
        {
          role: "CONSEQUENCE",
          label: "Downtime & customer disruption",
          detail: "A technical failure immediately turns into a commercial halt.",
        },
      ],
      deliverableTitle: "WHAT YOU GET",
      deliverableHeadline: "Clear direction, not technical jargon",
      deliverableSummary:
        "A structured view of critical exposures across applications and access controls, distinguishing urgent fixes from what can wait.",
    },
    startup: {
      shortLabel: "Startups & software houses",
      label: "Startups & software houses",
      headline:
        "Your product works as designed. Have you verified what happens when someone tries to abuse it?",
      intro: [
        "You invested real effort building, launching, and growing it in the market.",
        "Yet every new feature, third-party integration, or authentication change introduces behavior that needs security testing.",
        "One missed flaw can expose customer data, disrupt availability, or damage trust with enterprise buyers.",
      ],
      statement:
        "Security doesn't mean slowing delivery down. It means preventing one overlooked flaw from undermining everything you shipped.",
      approach:
        "Focused manual tests target the most sensitive areas of your application, delivering reproducible findings your developers can act on right away.",
      cta: "Talk about your software",
      schemaTitle: "WHERE THE PRODUCT IS TESTED",
      schemaNodes: [
        {
          role: "EXPECTED FLOW",
          label: "Authenticated user in their workspace",
          detail: "Normal features behave reliably under standard test cases.",
        },
        {
          role: "CRITICAL POINT",
          label: "Authorization & API business logic",
          detail: "Tampered requests or cross-role state transitions missed before release.",
          highlighted: true,
        },
        {
          role: "EXPOSURE",
          label: "User data & market credibility",
          detail: "A broken permission check can expose another tenant's records.",
        },
      ],
      deliverableTitle: "WHAT YOU GET",
      deliverableHeadline: "Reproducible proof for developers",
      deliverableSummary:
        "Exact reproduction steps showing how an anomaly was exploited and pragmatic fix guidance your engineering team can ship fast.",
    },
    enterprise: {
      shortLabel: "Multinationals & enterprises",
      label: "Multinationals & large organizations",
      headline: "Having many controls in place does not mean every critical path has been tested.",
      intro: [
        "Applications, regional offices, suppliers, and engineering teams constantly share data and credentials.",
        "In complex organizations, subtle weaknesses emerge precisely at the boundaries between components that look healthy in isolation.",
      ],
      statement:
        "Targeted testing isn't meant to replace existing governance. Its value is shedding light on blind spots nobody has checked together yet.",
      approach:
        "Deliver deep technical evidence along agreed perimeter paths, giving internal security and engineering teams clear facts to prioritize fixes.",
      cta: "Let's discuss scope",
      schemaTitle: "WHERE BLIND SPOTS EMERGE",
      schemaNodes: [
        {
          role: "ISOLATED MODULES",
          label: "Components covered by standard checks",
          detail: "Each silo enforces its own internal policies and baseline safeguards.",
        },
        {
          role: "CRITICAL POINT",
          label: "Handoffs across sites, teams & vendors",
          detail: "Cross-boundary flows where trust assumptions and ownership shift.",
          highlighted: true,
        },
        {
          role: "VISIBILITY",
          label: "Critical paths across an agreed scope",
          detail: "Manual verification of attack chains invisible at the single-module level.",
        },
      ],
      deliverableTitle: "WHAT YOU GET",
      deliverableHeadline: "Targeted findings on the agreed scope",
      deliverableSummary:
        "Substantiated technical evidence on specific cross-system paths, tailored to internal security owners and remediation priorities.",
    },
  },
  methodology: {
    ariaLabel: "Three-phase operating method",
    headingLine1: "YOU CANNOT PROTECT",
    headingLine2: "WHAT YOU DON'T KNOW.",
    phasePrefix: "PHASE",
    pillars: {
      deconstruct: {
        title: "First, we understand how it actually works.",
        body: [
          "Every company runs a different stack. We start from the systems, access paths, and applications supporting daily work to focus testing where impact is real.",
        ],
      },
      exploit: {
        title: "Next, we put security to the test.",
        body: [
          "Through authorized, targeted testing we check whether subtle weaknesses can actually be exploited.",
          "Knowing a theoretical vulnerability exists is very different from seeing its real business impact.",
        ],
      },
      remediate: {
        title: "Finally, we define what to fix first.",
        body: [
          "Assessments must produce clarity, not just raw lists of warnings.",
          "Every confirmed issue is explained, documented, and turned into actionable remediation guidance so you can decide where to act and in what order.",
        ],
      },
    },
    closingQuote: "Awareness alone is not enough. It has to lead to a clear decision.",
    ctaPrimary: "Book an initial call",
    ctaSecondary: "Back to home",
  },
  booking: {
    backToSite: "BACK TO SITE",
    topMeta: "GOOGLE MEET · 30 MIN · BY APPOINTMENT ONLY",
    pageTitle: "Book an initial call",
    phoneDisplay: "+39 371 150 0055",
    calAriaLabel: "Select a day",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    dayFullSuffix: "no time slots available",
    fetchError: "Unable to load calendar availability.",
    retry: "RETRY",
    stepsAriaLabel: "Booking progress",
    steps: [
      { num: "01", label: "DAY" },
      { num: "02", label: "TIME" },
      { num: "03", label: "DETAILS" },
    ],
    guideTitle: "HOW THE CALL WORKS",
    guideFoot: "← SELECT AN AVAILABLE DAY ON THE CALENDAR TO VIEW GOOGLE MEET SLOTS.",
    howItWorks: [
      {
        code: "01",
        title: "Map the context",
        body: "Tell me which software, access workflows, or applications support your operations and what you need to protect.",
      },
      {
        code: "02",
        title: "Separate priorities",
        body: "Together we assess whether urgent exposure exists right now and which aspects can wait.",
      },
      {
        code: "03",
        title: "No sales pressure",
        body: "Leave the call with clear direction on practical next steps, without technical jargon or hard pitches.",
      },
    ],
    resetToGuide: "GUIDE",
    loadingSlots: "Refreshing available times…",
    emptyDay: "No open times left on this date. Please select another day on the calendar.",
    slotsAriaLabel: "Available times",
    selectedPrefix: "SELECTED:",
    selectedGlue: "·",
    changeSlot: "CHANGE TIME",
    fieldName: "NAME *",
    namePlaceholder: "e.g. Alex Miller",
    nameError: "Please enter at least 2 characters for your name.",
    fieldEmail: "EMAIL *",
    emailPlaceholder: "name@company.com",
    emailError: "Please enter a valid email address (e.g. name@company.com).",
    fieldTopic: "WHAT WE'LL DISCUSS (OPTIONAL)",
    topicPlaceholder: "e.g. internal ERP, access controls, web application, or an initial security check.",
    submitIdlePrefix: "CONFIRM CALL",
    submitBusy: "BOOKING IN PROGRESS…",
    connectionError: "Connection lost. Please try again.",
    genericError: "Something went wrong.",
    confirmedBadge: "BOOKING CONFIRMED",
    confirmedTimePrefix: "at",
    confirmedDemoNote:
      "Demo mode: the calendar is not connected, so no event was created.",
    confirmedLivePrefix: "I've sent the calendar invite to ",
    confirmedLiveSuffix: ". The Google Meet link is already inside.",
    openMeet: "OPEN GOOGLE MEET LINK",
    backToSiteDone: "BACK TO SITE",
    directAriaLabel: "Direct phone contact",
    directEyebrow: "DIRECT CONTACT",
    directText: "Can't find a convenient slot or prefer to talk right away?",
    directButtonPrefix: "CALL NOW",
    apiErrors: {
      rateLimitDisp: "Too many requests.",
      invalidMonth: "Invalid month.",
      calUnreachable: "Calendar unavailable.",
      rateLimitBook: "Too many bookings from this address.",
      badBody: "Invalid request payload.",
      invalidSlot: "Invalid time slot.",
      missingName: "Name is required.",
      invalidEmail: "Invalid email address.",
      slotTaken: "This slot was just taken. Please pick another time.",
      calWriteFailed: "Could not write the event to the calendar.",
    },
    calendarInvite: {
      summaryPrefix: "Call with",
      topicPrefix: "Discussion topic:",
    },
  },
};
