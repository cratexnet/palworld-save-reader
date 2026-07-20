export interface BackToTopVisibilityInput {
  scrollY: number;
  viewportHeight: number;
}

export function shouldShowBackToTopButton({
  scrollY,
  viewportHeight,
}: BackToTopVisibilityInput): boolean {
  return scrollY >= viewportHeight;
}
