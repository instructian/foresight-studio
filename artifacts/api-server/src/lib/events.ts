import { nanoid } from "nanoid";
import { FILES, appendJsonl, readJsonl } from "./store";

export interface ActivityEvent {
  id: string;
  actorId: string;
  actorName: string;
  type: string;
  entityKind: string;
  entityId: string;
  entityTitle: string | null;
  createdAt: string;
}

export async function logEvent(
  event: Omit<ActivityEvent, "id" | "createdAt">,
): Promise<void> {
  await appendJsonl(FILES.events, {
    ...event,
    id: nanoid(10),
    createdAt: new Date().toISOString(),
  });
}

export async function listEvents(): Promise<ActivityEvent[]> {
  return readJsonl<ActivityEvent>(FILES.events);
}
