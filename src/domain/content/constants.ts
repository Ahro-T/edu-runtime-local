export const REQUIRED_SLOTS = ['definition', 'importance', 'relation', 'example', 'boundary'] as const;

export type RequiredSlot = (typeof REQUIRED_SLOTS)[number];
