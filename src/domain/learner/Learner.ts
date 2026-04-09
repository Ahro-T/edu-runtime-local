import type { Pillar } from '../content/types.js';

export interface Learner {
  id: string;
  discordUserId: string;
  currentPillar: Pillar | null;
  currentSessionId: string | null;
}
