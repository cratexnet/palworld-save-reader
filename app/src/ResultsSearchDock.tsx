"use client";

import { Box, Input } from "@chakra-ui/react";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { shouldShowResultsSearchDock } from "./results-search-dock-visibility";
import { AppIcon } from "./ui";

interface ResultsSearchDockProps {
  mode: "parents" | "target";
  anchorId: string;
  boundaryId: string;
  label: string;
  placeholder: string;
  value: string;
  onQueryChange: (query: string) => void;
}

export default function ResultsSearchDock({
  mode,
  anchorId,
  boundaryId,
  label,
  placeholder,
  value,
  onQueryChange,
}: ResultsSearchDockProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 62rem)");
    let animationFrame: number | null = null;

    function updateVisibility() {
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        const anchor = document.getElementById(anchorId);
        const boundary = document.getElementById(boundaryId);
        if (!anchor || !boundary) {
          setVisible(false);
          return;
        }

        const anchorRect = anchor.getBoundingClientRect();
        const boundaryRect = boundary.getBoundingClientRect();
        setVisible(
          shouldShowResultsSearchDock({
            anchorBottom: anchorRect.bottom,
            boundaryTop: boundaryRect.top,
            boundaryBottom: boundaryRect.bottom,
            viewportHeight: window.innerHeight,
            desktop: desktopQuery.matches,
          }),
        );
      });
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    desktopQuery.addEventListener("change", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
      desktopQuery.removeEventListener("change", updateVisibility);
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [anchorId, boundaryId]);

  if (!visible) return null;

  return (
    <Box
      data-testid="results-search-dock"
      data-search-mode={mode}
      className="palworld-results-search-dock"
    >
      <AppIcon
        as={Search}
        size="sm"
        position="absolute"
        zIndex={1}
        left={3}
        top="50%"
        transform="translateY(-50%)"
        color="var(--palworld-highlight)"
        pointerEvents="none"
        aria-hidden="true"
      />
      <Input
        id="palworld-floating-results-search"
        name="palworld-floating-results-search"
        className="palworld-results-search-dock__input"
        type="search"
        value={value}
        aria-label={label}
        placeholder={placeholder}
        ps={10}
        h={10}
        borderColor="rgba(255, 248, 229, 0.34)"
        borderRadius="6px"
        bg="rgba(7, 38, 46, 0.94)"
        boxShadow="var(--palworld-floating-shadow)"
        color="var(--palworld-accent-contrast)"
        fontSize="md"
        fontWeight="700"
        backdropFilter="blur(10px) saturate(1.08)"
        _placeholder={{ color: "rgba(255, 248, 229, 0.72)" }}
        _hover={{
          borderColor: "rgba(255, 214, 107, 0.72)",
          bg: "rgba(7, 38, 46, 0.98)",
        }}
        _focusVisible={{
          borderColor: "#ffd66b",
          outline: "2px solid rgba(255, 214, 107, 0.34)",
          outlineOffset: "2px",
        }}
        onChange={(event) => onQueryChange(event.currentTarget.value)}
      />
    </Box>
  );
}
