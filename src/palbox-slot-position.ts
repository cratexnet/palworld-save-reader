const PALBOX_COLUMNS_PER_PAGE = 6;
const PALBOX_ROWS_PER_PAGE = 5;
const PALBOX_SLOTS_PER_PAGE = PALBOX_COLUMNS_PER_PAGE * PALBOX_ROWS_PER_PAGE;

export interface PalboxSlotPosition {
  page: number;
  row: number;
  column: number;
}

export function getPalboxSlotPosition(slot: string): PalboxSlotPosition | null {
  if (!/^\d+$/u.test(slot)) return null;

  const slotIndex = Number(slot);
  if (!Number.isSafeInteger(slotIndex)) return null;

  const pageSlotIndex = slotIndex % PALBOX_SLOTS_PER_PAGE;
  return {
    page: Math.floor(slotIndex / PALBOX_SLOTS_PER_PAGE) + 1,
    row: Math.floor(pageSlotIndex / PALBOX_COLUMNS_PER_PAGE) + 1,
    column: (pageSlotIndex % PALBOX_COLUMNS_PER_PAGE) + 1,
  };
}

export function getDisplayContainerSlot(slot: string) {
  if (!/^\d+$/u.test(slot)) return slot;

  const slotIndex = Number(slot);
  const displaySlot = slotIndex + 1;
  return Number.isSafeInteger(displaySlot) ? String(displaySlot) : slot;
}
