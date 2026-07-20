"use client";

import { IconButton } from "@chakra-ui/react";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { shouldShowBackToTopButton } from "./back-to-top-visibility";
import { AppIcon, AppTooltip } from "./ui";

interface BackToTopButtonProps {
  label: string;
}

export default function BackToTopButton({ label }: BackToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let animationFrame: number | null = null;

    function updateVisibility() {
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        setVisible(
          shouldShowBackToTopButton({
            scrollY: window.scrollY,
            viewportHeight: window.innerHeight,
          }),
        );
      });
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  if (!visible) return null;

  function scrollToTop() {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <AppTooltip content={label} positioning={{ placement: "left" }}>
      <IconButton
        data-testid="back-to-top"
        className="palworld-back-to-top"
        type="button"
        variant="plain"
        aria-label={label}
        onClick={scrollToTop}
      >
        <AppIcon as={ArrowUp} size="xl" aria-hidden="true" />
      </IconButton>
    </AppTooltip>
  );
}
