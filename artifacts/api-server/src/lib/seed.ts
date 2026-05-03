import { scryptSync, randomBytes } from "node:crypto";
import { nanoid } from "nanoid";
import { FILES, readJson, writeJson } from "./store";

export interface RosterMember {
  id: string;
  name: string;
  role: "student" | "instructor";
  createdAt: string;
}

export interface RosterFile {
  members: RosterMember[];
  instructorPasscodeHash: string | null;
  instructorPasscodeSalt: string | null;
}

export interface CourseConfig {
  courseTitle: string;
  assignmentTitle: string;
  assignmentDescription: string;
  dueDate: string | null;
  mode: "PESTLE" | "STEEP";
  categories: string[];
  archetypes: string[];
  timeHorizons: string[];
  novelties: string[];
  signalTargetPerStudent: number;
  scenarioMinSignals: number;
  trendMinSignals: number;
}

export const PESTLE_CATEGORIES = [
  "Political",
  "Economic",
  "Social",
  "Technological",
  "Legal",
  "Environmental",
];

export const STEEP_CATEGORIES = [
  "Social",
  "Technological",
  "Economic",
  "Environmental",
  "Political",
];

export function hashPasscode(passcode: string, salt?: string): {
  hash: string;
  salt: string;
} {
  const useSalt = salt ?? randomBytes(16).toString("hex");
  const hash = scryptSync(passcode, useSalt, 64).toString("hex");
  return { hash, salt: useSalt };
}

export function verifyPasscode(
  passcode: string,
  hash: string,
  salt: string,
): boolean {
  const { hash: candidate } = hashPasscode(passcode, salt);
  return candidate === hash;
}

const DEFAULT_CONFIG: CourseConfig = {
  courseTitle: "DES 740 — Speculative Design",
  assignmentTitle: "Foresight Studio: Signals → Scenarios",
  assignmentDescription:
    "Throughout the semester, collect signals of change from credible sources, cluster them into emerging trends, share collections with classmates, and compose evidence-grounded future scenarios. Every claim must trace back to a signal; every signal must trace back to a source.",
  dueDate: null,
  mode: "PESTLE",
  categories: PESTLE_CATEGORIES,
  archetypes: ["Continuation", "New Equilibrium", "Collapse", "Transformation"],
  timeHorizons: ["0-2y", "2-5y", "5-10y", "10-25y"],
  novelties: ["weak", "emerging", "accelerating", "plateauing", "declining"],
  signalTargetPerStudent: 12,
  scenarioMinSignals: 5,
  trendMinSignals: 3,
};

const DEFAULT_STUDENTS = [
  "Amara Okonkwo",
  "Liang Chen",
  "Priya Raman",
  "Mateo Alvarez",
  "Noor Haddad",
  "Rin Takeda",
  "Theo Larsson",
  "Zoë Bennett",
];

export async function seedIfEmpty(): Promise<void> {
  const roster = await readJson<RosterFile>(FILES.roster, {
    members: [],
    instructorPasscodeHash: null,
    instructorPasscodeSalt: null,
  });
  if (roster.members.length === 0) {
    const now = new Date().toISOString();
    const members: RosterMember[] = [
      {
        id: nanoid(10),
        name: "Prof. Devereaux",
        role: "instructor",
        createdAt: now,
      },
      ...DEFAULT_STUDENTS.map((name) => ({
        id: nanoid(10),
        name,
        role: "student" as const,
        createdAt: now,
      })),
    ];
    const { hash, salt } = hashPasscode("foresight2026");
    await writeJson<RosterFile>(FILES.roster, {
      members,
      instructorPasscodeHash: hash,
      instructorPasscodeSalt: salt,
    });
  } else if (!roster.instructorPasscodeHash) {
    const { hash, salt } = hashPasscode("foresight2026");
    await writeJson<RosterFile>(FILES.roster, {
      ...roster,
      instructorPasscodeHash: hash,
      instructorPasscodeSalt: salt,
    });
  }

  const existing = await readJson<CourseConfig | null>(FILES.config, null);
  if (!existing) {
    await writeJson<CourseConfig>(FILES.config, DEFAULT_CONFIG);
  }
}
