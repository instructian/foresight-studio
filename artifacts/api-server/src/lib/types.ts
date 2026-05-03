export interface Source {
  id: string;
  title: string;
  url: string;
  publication?: string | null;
  author?: string | null;
  publishedDate?: string | null;
  type: string;
  credibilityNote?: string | null;
  createdAt: string;
}

export interface Signal {
  id: string;
  title: string;
  summary: string;
  category: string;
  novelty: string;
  timeHorizon: string;
  keywords: string[];
  implications: string;
  context: string;
  assumptions: string;
  unknowns: string;
  ethicsEquity: string;
  leadingIndicators: string;
  strategicResponse: string;
  impactRating: number;
  uncertaintyRating: number;
  plausibilityRating: number;
  status: "draft" | "submitted" | "needs_revision" | "archived";
  sources: Source[];
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
}

export interface Trend {
  id: string;
  title: string;
  claim: string;
  rationale: string;
  category: string;
  timeHorizon: string;
  confidenceRating: number;
  impactRating: number;
  status: "preliminary" | "established" | "contested";
  supportingSignalIds: string[];
  contradictingSignalIds: string[];
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItem {
  id: string;
  kind: "signal" | "trend";
  refId: string;
  note: string;
  addedBy: string;
  addedByName: string;
  addedAt: string;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  visibility: "private" | "class";
  items: CollectionItem[];
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemStatement {
  id: string;
  text: string;
  signalIds: string[];
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  background: string;
  needs: string;
  problemStatementId: string;
}

export interface JourneyStep {
  label: string;
  detail: string;
  signalIds: string[];
}

export interface Journey {
  id: string;
  personaId: string;
  steps: JourneyStep[];
}

export interface SignalAnnotation {
  signalId: string;
  role: "key_driver" | "uncertainty" | "wildcard" | "supporting";
}

export interface Scenario {
  id: string;
  title: string;
  timeHorizon: string;
  archetype: string;
  environmentDescription: string;
  vignette: string;
  signalIds: string[];
  signalAnnotations: SignalAnnotation[];
  problemStatements: ProblemStatement[];
  personas: Persona[];
  journeys: Journey[];
  currentStep: number;
  status: "draft" | "submitted";
  collectionId: string | null;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
}

export interface Comment {
  id: string;
  entityId: string;
  body: string;
  authorId: string;
  authorName: string;
  authorRole: "student" | "instructor";
  createdAt: string;
}

export interface CommentsFile {
  comments: Comment[];
}

export interface SignalsFile {
  signals: Signal[];
}
export interface TrendsFile {
  trends: Trend[];
}
export interface CollectionsFile {
  collections: Collection[];
}
export interface ScenariosFile {
  scenarios: Scenario[];
}
