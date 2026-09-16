/**
 * Public-facing HopeBridge Foundation content.
 *
 * This is DEMO / SAMPLE content for the HopeBridge demo organization.
 * It is not claimed as independently verified real-world statistics.
 * When Firestore public-safe content is available, pages can prefer that
 * data and fall back to these samples.
 */

export const CONTENT_DISCLAIMER =
  "Sample content for the HopeBridge demo organization. Figures and stories illustrate platform capabilities and are not independently verified production statistics.";

export type PublicNavLink = {
  label: string;
  href: string;
  description?: string;
};

export type PublicNavGroup = {
  id: string;
  label: string;
  href: string;
  items: PublicNavLink[];
};

export const PRIMARY_NAV: PublicNavGroup[] = [
  {
    id: "mission",
    label: "Our Mission",
    href: "/mission",
    items: [
      {
        label: "Mission & Vision",
        href: "/mission",
        description: "Why HopeBridge exists and where we are headed",
      },
      {
        label: "Our Approach",
        href: "/what-we-do#approach",
        description: "How we design programs with communities",
      },
    ],
  },
  {
    id: "what-we-do",
    label: "What We Do",
    href: "/what-we-do",
    items: [
      {
        label: "Programs",
        href: "/programs",
        description: "Education, health, environment, and community support",
      },
      {
        label: "Community Support",
        href: "/what-we-do#community",
        description: "Local partnerships that meet urgent needs",
      },
      {
        label: "Current Initiatives",
        href: "/what-we-do#initiatives",
        description: "Active focus areas this year",
      },
      {
        label: "Our Approach",
        href: "/what-we-do#approach",
        description: "Evidence-informed, community-led delivery",
      },
    ],
  },
  {
    id: "programs",
    label: "Programs",
    href: "/programs",
    items: [
      {
        label: "All Programs",
        href: "/programs",
        description: "Browse causes and program areas",
      },
      {
        label: "Education For Every Child",
        href: "/programs/education-for-every-child",
      },
      {
        label: "Healthcare Outreach",
        href: "/programs/healthcare-outreach",
      },
      {
        label: "Clean Water Initiative",
        href: "/programs/clean-water-initiative",
      },
      {
        label: "Food Distribution",
        href: "/programs/food-distribution",
      },
    ],
  },
  {
    id: "impact",
    label: "Impact",
    href: "/impact",
    items: [
      {
        label: "Impact Overview",
        href: "/impact",
        description: "Outcomes across people, programs, and partnerships",
      },
      {
        label: "Goals & Progress",
        href: "/impact#goals",
        description: "Strategic goals and progress visualization",
      },
      {
        label: "Results",
        href: "/impact#results",
        description: "Program outcomes and learning",
      },
      {
        label: "Stories",
        href: "/stories",
        description: "Community voices and program journeys",
      },
    ],
  },
  {
    id: "stories",
    label: "Stories",
    href: "/stories",
    items: [
      {
        label: "All Stories",
        href: "/stories",
        description: "Editorial stories from our work",
      },
    ],
  },
  {
    id: "get-involved",
    label: "Get Involved",
    href: "/get-involved",
    items: [
      {
        label: "Donate",
        href: "/donate",
        description: "Support programs with a one-time or monthly gift",
      },
      {
        label: "Volunteer",
        href: "/get-involved/volunteer",
        description: "Share time and skills with community teams",
      },
      {
        label: "Fundraise",
        href: "/get-involved/fundraise",
        description: "Start a peer-to-peer campaign for a cause",
      },
      {
        label: "Partner With Us",
        href: "/get-involved/partner",
        description: "Corporate, civic, and nonprofit partnerships",
      },
      {
        label: "Events",
        href: "/get-involved/events",
        description: "Upcoming community gatherings and drives",
      },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    href: "/resources",
    items: [
      {
        label: "Resource Hub",
        href: "/resources",
        description: "Guides, updates, and learning materials",
      },
      {
        label: "Help & Contact",
        href: "/contact",
        description: "Reach the HopeBridge team",
      },
      {
        label: "Platform for Nonprofits",
        href: "/platform",
        description: "HopeBridge operating software for organizations",
      },
    ],
  },
  {
    id: "about",
    label: "About",
    href: "/about",
    items: [
      {
        label: "Who We Are",
        href: "/about",
        description: "Organization overview",
      },
      {
        label: "Mission & Vision",
        href: "/mission",
      },
      {
        label: "Leadership",
        href: "/about/leadership",
        description: "Sample leadership roles for the demo org",
      },
      {
        label: "Organization",
        href: "/about/organization",
        description: "Structure and accountability",
      },
      {
        label: "Contact",
        href: "/contact",
      },
    ],
  },
];

export type PublicProgram = {
  slug: string;
  name: string;
  category: string;
  purpose: string;
  description: string;
  location: string;
  status: "Planning" | "Active" | "Completed" | "On Hold";
  goals: string[];
  outcomes: string[];
  image: string;
  imageAlt: string;
  ctaHref: string;
  ctaLabel: string;
  /** Linked internal program id when synced from workspace data */
  linkedProgramId?: string;
};

export const PUBLIC_PROGRAMS: PublicProgram[] = [
  {
    slug: "education-for-every-child",
    name: "Education For Every Child",
    category: "Education",
    purpose: "Expand learning access for underserved children and families.",
    description:
      "HopeBridge partners with schools and community centers to provide tutoring, digital learning tools, and family engagement workshops. This sample program illustrates how education-focused nonprofits can present cause detail on the public site while managing delivery in the HopeBridge workspace.",
    location: "Arizona (sample)",
    status: "Active",
    goals: [
      "Increase after-school tutoring capacity",
      "Distribute learning kits to participating families",
      "Support educator coaching cohorts",
    ],
    outcomes: [
      "Sample outcome: tutoring cohorts launched in partner sites",
      "Sample outcome: family workshops scheduled each quarter",
    ],
    image: "/hopebridge/programs/hero-program-nexus.png",
    imageAlt: "Abstract HopeBridge programs visual representing education pathways",
    ctaHref: "/donate?program=education-for-every-child",
    ctaLabel: "Support education",
    linkedProgramId: "PG001",
  },
  {
    slug: "healthcare-outreach",
    name: "Healthcare Outreach",
    category: "Healthcare",
    purpose: "Bring preventive and mobile care closer to rural communities.",
    description:
      "A sample healthcare initiative showing how community clinics, mobile units, and wellness education can be communicated publicly while operational records remain private in the authenticated platform.",
    location: "Nevada (sample)",
    status: "Completed",
    goals: [
      "Host mobile clinic days",
      "Increase preventive screening participation",
      "Coordinate referral pathways with local providers",
    ],
    outcomes: [
      "Sample outcome: mobile clinic schedule completed for the demo period",
      "Sample outcome: community health education sessions delivered",
    ],
    image: "/hopebridge/beneficiaries/hero-beneficiary-outreach.png",
    imageAlt: "HopeBridge community outreach visual",
    ctaHref: "/donate?program=healthcare-outreach",
    ctaLabel: "Support healthcare",
    linkedProgramId: "PG002",
  },
  {
    slug: "clean-water-initiative",
    name: "Clean Water Initiative",
    category: "Environment",
    purpose: "Improve reliable access to clean water systems.",
    description:
      "Illustrative conservation and infrastructure program content for organizations focused on water access, environmental stewardship, and community resilience.",
    location: "Texas (sample)",
    status: "Active",
    goals: [
      "Install or rehabilitate water access points",
      "Train local maintenance partners",
      "Monitor water quality with community stewards",
    ],
    outcomes: [
      "Sample outcome: partner sites identified for system upgrades",
      "Sample outcome: stewardship training materials prepared",
    ],
    image: "/hopebridge/campaigns/hero-earth-globe.png",
    imageAlt: "HopeBridge globe visual representing environmental programs",
    ctaHref: "/donate?program=clean-water-initiative",
    ctaLabel: "Support clean water",
    linkedProgramId: "PG003",
  },
  {
    slug: "food-distribution",
    name: "Food Distribution",
    category: "Community",
    purpose: "Strengthen local food security through reliable distribution.",
    description:
      "Sample hunger-relief programming that shows how food assistance nonprofits can share public cause pages while keeping beneficiary records private inside HopeBridge operations.",
    location: "California (sample)",
    status: "Planning",
    goals: [
      "Coordinate monthly distribution days",
      "Grow pantry partnerships",
      "Offer nutrition education alongside food support",
    ],
    outcomes: [
      "Sample outcome: distribution calendar drafted with partners",
      "Sample outcome: volunteer roles defined for packing and outreach",
    ],
    image: "/hopebridge/volunteers/hero-volunteer-community.png",
    imageAlt: "HopeBridge volunteer community visual",
    ctaHref: "/donate?program=food-distribution",
    ctaLabel: "Support food security",
    linkedProgramId: "PG004",
  },
];

export type PublicGoal = {
  id: string;
  title: string;
  description: string;
  category: string;
  progressPercent: number;
  status: string;
  targetOutcome: string;
};

export const PUBLIC_GOALS: PublicGoal[] = [
  {
    id: "goal-people",
    title: "Expand community reach",
    description:
      "Grow program participation across education, health, food, and water initiatives through trusted local partners.",
    category: "People & community",
    progressPercent: 62,
    status: "On Track (sample)",
    targetOutcome: "Demonstrate multi-program community coverage",
  },
  {
    id: "goal-outcomes",
    title: "Strengthen program outcomes",
    description:
      "Improve measurement of learning, wellness, and resilience outcomes so teams can learn and adapt.",
    category: "Program outcomes",
    progressPercent: 48,
    status: "Needs Focus (sample)",
    targetOutcome: "Publish quarterly outcome learning notes",
  },
  {
    id: "goal-finance",
    title: "Sustain responsible funding",
    description:
      "Build diversified support across individual giving, events, and partnerships while keeping SaaS billing separate from charitable gifts.",
    category: "Financial sustainability",
    progressPercent: 55,
    status: "On Track (sample)",
    targetOutcome: "Maintain multi-channel fundraising readiness",
  },
  {
    id: "goal-ops",
    title: "Operate with excellence",
    description:
      "Use the HopeBridge workspace to keep campaigns, volunteers, programs, and reporting connected.",
    category: "Operational excellence",
    progressPercent: 71,
    status: "On Track (sample)",
    targetOutcome: "Keep modules aligned around shared org data",
  },
  {
    id: "goal-partners",
    title: "Deepen partnerships",
    description:
      "Grow civic, nonprofit, and corporate collaborations that amplify local delivery.",
    category: "Partnerships",
    progressPercent: 40,
    status: "Planning (sample)",
    targetOutcome: "Establish repeatable partnership pathways",
  },
  {
    id: "goal-innovation",
    title: "Advance awareness & innovation",
    description:
      "Share stories, resources, and responsible AI-assisted insights that help teams communicate impact clearly.",
    category: "Innovation & awareness",
    progressPercent: 58,
    status: "On Track (sample)",
    targetOutcome: "Publish editorial stories and resource updates",
  },
];

export type PublicStory = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  programSlug?: string;
  image: string;
  imageAlt: string;
  body: string[];
  isSample: true;
};

export const PUBLIC_STORIES: PublicStory[] = [
  {
    slug: "learning-together-after-school",
    title: "Learning together after school",
    summary:
      "A sample story about tutoring circles and family workshops in an education program setting.",
    category: "Education",
    programSlug: "education-for-every-child",
    image: "/hopebridge/programs/hero-program-nexus.png",
    imageAlt: "Sample story imagery for education programming",
    isSample: true,
    body: [
      "This is a clearly marked sample story written for the HopeBridge demo organization. It does not describe a real beneficiary or claim a verified case study.",
      "In this illustrative narrative, community educators host after-school tutoring circles, share learning kits with families, and gather feedback to improve session design.",
      "Stories like this show how public storytelling can stay human and editorial while private beneficiary records remain protected inside the authenticated HopeBridge platform.",
    ],
  },
  {
    slug: "clinic-day-on-the-move",
    title: "Clinic day on the move",
    summary:
      "Sample storytelling around mobile healthcare outreach and community wellness education.",
    category: "Healthcare",
    programSlug: "healthcare-outreach",
    image: "/hopebridge/beneficiaries/hero-beneficiary-outreach.png",
    imageAlt: "Sample story imagery for healthcare outreach",
    isSample: true,
    body: [
      "This sample story demonstrates how a healthcare-focused nonprofit might describe outreach days without exposing private health information.",
      "Volunteers prepare welcome stations, clinicians offer preventive screenings where appropriate, and partners help families navigate referrals.",
      "HopeBridge keeps operational details in the workspace while the public site shares only intentionally public narrative content.",
    ],
  },
  {
    slug: "neighbors-packing-hope",
    title: "Neighbors packing hope",
    summary:
      "A sample community story about food packing days and local pantry partnerships.",
    category: "Community",
    programSlug: "food-distribution",
    image: "/hopebridge/volunteers/hero-volunteer-community.png",
    imageAlt: "Sample story imagery for volunteer food packing",
    isSample: true,
    body: [
      "Sample content only: neighbors gather to pack food boxes, label pantry routes, and welcome new volunteers.",
      "The story highlights dignity, coordination, and shared responsibility rather than fabricated personal identities.",
      "Organizations using HopeBridge can later replace sample stories with their own approved public narratives.",
    ],
  },
];

export type VolunteerOpportunity = {
  id: string;
  title: string;
  summary: string;
  commitment: string;
  location: string;
  programSlug?: string;
};

export const VOLUNTEER_OPPORTUNITIES: VolunteerOpportunity[] = [
  {
    id: "tutoring",
    title: "After-school tutoring support",
    summary: "Help facilitate learning circles and materials prep for education partners.",
    commitment: "2–4 hours / week (sample)",
    location: "Hybrid / Arizona (sample)",
    programSlug: "education-for-every-child",
  },
  {
    id: "food-pack",
    title: "Food packing & distribution",
    summary: "Support packing days, pantry logistics, and guest hospitality.",
    commitment: "Half-day shifts (sample)",
    location: "California (sample)",
    programSlug: "food-distribution",
  },
  {
    id: "outreach",
    title: "Community outreach day support",
    summary: "Welcome guests, guide stations, and assist non-clinical logistics.",
    commitment: "Event-based (sample)",
    location: "Nevada (sample)",
    programSlug: "healthcare-outreach",
  },
];

export type PublicEvent = {
  id: string;
  title: string;
  dateLabel: string;
  summary: string;
  href: string;
};

export const PUBLIC_EVENTS: PublicEvent[] = [
  {
    id: "spring-giving",
    title: "Spring community giving day",
    dateLabel: "Sample date — scheduling TBD",
    summary: "A placeholder community event for peer fundraising and volunteer signup.",
    href: "/get-involved/events",
  },
  {
    id: "water-steward",
    title: "Water stewardship workshop",
    dateLabel: "Sample date — scheduling TBD",
    summary: "Learning session for partners supporting clean water maintenance.",
    href: "/get-involved/events",
  },
];

export type ResourceItem = {
  title: string;
  summary: string;
  href: string;
  type: string;
};

export const RESOURCE_ITEMS: ResourceItem[] = [
  {
    title: "Getting started with HopeBridge",
    summary: "Sign in to the operating platform to manage programs, donors, and teams.",
    href: "/auth/login",
    type: "Platform",
  },
  {
    title: "Product overview for nonprofits",
    summary: "Learn how the HopeBridge SaaS workspace supports multi-module operations.",
    href: "/platform",
    type: "Product",
  },
  {
    title: "Volunteer interest",
    summary: "Share skills and availability so teams can follow up thoughtfully.",
    href: "/get-involved/volunteer",
    type: "Get involved",
  },
  {
    title: "Donation readiness",
    summary: "Review how charitable gifts will connect once a payment provider is configured.",
    href: "/donate",
    type: "Giving",
  },
  {
    title: "Contact HopeBridge",
    summary: "Ask about partnerships, press, or general inquiries.",
    href: "/contact",
    type: "Support",
  },
  {
    title: "Accessibility statement",
    summary: "Our commitment to an accessible digital experience.",
    href: "/accessibility",
    type: "Policy",
  },
];

export const ORG_CONTACT = {
  name: "HopeBridge Foundation",
  tagline: "Building bridges of hope in every community",
  email: "hello@hopebridge.example",
  phone: "+1 (555) 010-2040",
  addressLines: ["Demo headquarters", "United States"],
  note: "Contact details are sample placeholders for the demo organization. Replace with verified organization contact information before production launch.",
};

export const IMPACT_HIGHLIGHTS = [
  {
    label: "Program areas",
    value: "4",
    detail: "Education, healthcare, environment, community (sample)",
  },
  {
    label: "Strategic goals tracked",
    value: String(PUBLIC_GOALS.length),
    detail: "People, outcomes, funding, operations, partners, awareness",
  },
  {
    label: "Volunteer pathways",
    value: String(VOLUNTEER_OPPORTUNITIES.length),
    detail: "Tutoring, food support, outreach logistics",
  },
  {
    label: "Editorial stories",
    value: String(PUBLIC_STORIES.length),
    detail: "Clearly marked sample narratives",
  },
];

export function getProgramBySlug(slug: string) {
  return PUBLIC_PROGRAMS.find((program) => program.slug === slug);
}

export function getStoryBySlug(slug: string) {
  return PUBLIC_STORIES.find((story) => story.slug === slug);
}

export function getStoriesForProgram(programSlug: string) {
  return PUBLIC_STORIES.filter((story) => story.programSlug === programSlug);
}
