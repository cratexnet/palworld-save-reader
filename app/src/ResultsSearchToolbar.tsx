"use client";

import { Box, IconButton, Input } from "@chakra-ui/react";
import { Search, X } from "lucide-react";
import { useRef } from "react";
import { useTranslations } from "./i18n";
import { AppIcon } from "./ui";

interface ResultsSearchToolbarProps {
  id: string;
  resultsId: string;
  label: string;
  placeholder: string;
  value: string;
  onQueryChange: (query: string) => void;
}

export default function ResultsSearchToolbar({
  id,
  resultsId,
  label,
  placeholder,
  value,
  onQueryChange,
}: ResultsSearchToolbarProps) {
  const commonT = useTranslations("common");
  const inputRef = useRef<HTMLInputElement>(null);

  function clearQuery() {
    onQueryChange("");
    inputRef.current?.focus();
  }

  return (
    <Box
      role="search"
      data-testid="results-search-toolbar"
      className="palworld-results-search-toolbar"
    >
      <AppIcon
        as={Search}
        size="sm"
        position="absolute"
        zIndex={1}
        left={3}
        top="50%"
        transform="translateY(-50%)"
        color="var(--palworld-fg-subtle)"
        pointerEvents="none"
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        id={id}
        name={id}
        type="search"
        value={value}
        aria-label={label}
        aria-controls={resultsId}
        placeholder={placeholder}
        ps={10}
        pe={value ? 10 : 4}
        h={10}
        bg="var(--palworld-surface)"
        borderColor="var(--palworld-result-search-border)"
        color="var(--palworld-fg)"
        fontSize="md"
        _placeholder={{ color: "var(--palworld-fg-faint)" }}
        _hover={{ borderColor: "var(--palworld-border-strong)" }}
        _focusVisible={{
          borderColor: "var(--palworld-accent-border)",
          outline: "2px solid var(--palworld-focus-outline)",
          outlineOffset: "2px",
        }}
        onChange={(event) => onQueryChange(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value) {
            event.preventDefault();
            clearQuery();
          }
        }}
      />
      {value ? (
        <IconButton
          type="button"
          aria-label={commonT("clear")}
          title={commonT("clear")}
          variant="ghost"
          size="sm"
          position="absolute"
          zIndex={1}
          right={0.5}
          top="50%"
          transform="translateY(-50%)"
          color="var(--palworld-accent)"
          bg="transparent"
          _hover={{
            color: "var(--palworld-fg)",
            bg: "transparent",
          }}
          _focusVisible={{
            outline: "2px solid var(--palworld-focus-ring)",
            outlineOffset: "-2px",
          }}
          onClick={clearQuery}
        >
          <AppIcon as={X} size="sm" aria-hidden="true" />
        </IconButton>
      ) : null}
    </Box>
  );
}
