interface VirtualListRangeInput {
  itemCount: number;
  itemHeight: number;
  scrollTop: number;
  viewportHeight: number;
  overscan?: number;
}

export function getVirtualListRange({
  itemCount,
  itemHeight,
  scrollTop,
  viewportHeight,
  overscan = 4,
}: VirtualListRangeInput) {
  if (itemCount <= 0) {
    return {
      startIndex: 0,
      endIndex: 0,
      paddingTop: 0,
      paddingBottom: 0,
    };
  }

  const visibleStart = Math.min(
    itemCount,
    Math.floor(Math.max(0, scrollTop) / itemHeight),
  );
  const visibleEnd = Math.min(
    itemCount,
    Math.ceil((Math.max(0, scrollTop) + viewportHeight) / itemHeight),
  );
  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.max(
    startIndex,
    Math.min(itemCount, visibleEnd + overscan),
  );

  return {
    startIndex,
    endIndex,
    paddingTop: startIndex * itemHeight,
    paddingBottom: (itemCount - endIndex) * itemHeight,
  };
}
