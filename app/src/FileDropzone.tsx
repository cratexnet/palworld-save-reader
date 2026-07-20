"use client";

import React, { useCallback, useRef, useState } from "react";
import { Box, Input, VStack, type BoxProps } from "@chakra-ui/react";

type FileDropzoneRootProps = BoxProps & {
  [key: `data-${string}`]: string | number | boolean | undefined;
};

export interface FileDropzoneRenderState {
  isActive: boolean;
  isDragging: boolean;
  disabled: boolean;
}

export interface FileDropzoneProps {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  highlighted?: boolean;
  inputId?: string;
  inputName?: string;
  inputAriaLabel?: string;
  onFilesSelect?: (files: File[]) => void;
  onError?: (message: string) => void;
  children?:
    React.ReactNode | ((state: FileDropzoneRenderState) => React.ReactNode);
  minH?: BoxProps["minH"];
  maxH?: BoxProps["maxH"];
  padding?: BoxProps["p"];
  surfaceVariant?: "default" | "workbench";
  rootProps?: FileDropzoneRootProps;
}

export const fileDropzoneSurfaceStyles = {
  borderWidth: "1px",
  borderStyle: "dashed",
  borderRadius: "lg",
  bg: "rgba(255, 255, 255, 0.68)",
  borderColor: "rgba(19, 47, 54, 0.32)",
  boxShadow: "none",
  hoverBoxShadow: "none",
  hoverBorderColor: "rgba(19, 47, 54, 0.58)",
  hoverBg: "rgba(255, 255, 255, 0.82)",
  activeBorderColor: "#168a86",
  activeBg: "rgba(226, 251, 245, 0.9)",
  activeBoxShadow: "0 0 0 2px rgba(22, 138, 134, 0.26)",
  activeBoxShadowColor: "transparent",
  focusBoxShadow: "0 0 0 3px rgba(255, 214, 107, 0.72)",
} as const;

const workbenchFileDropzoneSurfaceStyles = {
  borderColor: { base: "gray.300", _dark: "gray.600" },
  hoverBorderColor: { base: "gray.500", _dark: "gray.400" },
  bg: { base: "white", _dark: "bg.panel" },
  hoverBg: { base: "gray.50", _dark: "gray.900" },
  borderRadius: "xl",
  boxShadow: "none",
  hoverBoxShadow: "none",
} as const;

export function FileDropzone({
  accept,
  multiple = true,
  disabled = false,
  highlighted = false,
  inputId,
  inputName,
  inputAriaLabel,
  onFilesSelect,
  onError,
  children,
  minH,
  maxH,
  padding,
  surfaceVariant = "default",
  rootProps,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const triggerChooseFiles = useCallback(() => {
    if (disabled) {
      onError?.("disabled");
      return;
    }
    inputRef.current?.click();
  }, [disabled, onError]);

  const handleFiles = useCallback(
    (files: File[]) => {
      if (!files.length || disabled) return;
      onFilesSelect?.(files);
    },
    [disabled, onFilesSelect],
  );

  const handleInputChange = useCallback<
    React.ChangeEventHandler<HTMLInputElement>
  >(
    (event) => {
      handleFiles(Array.from(event.currentTarget.files ?? []));
      event.currentTarget.value = "";
    },
    [handleFiles],
  );

  const handleDrop = useCallback<React.DragEventHandler<HTMLDivElement>>(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      if (disabled) {
        onError?.("disabled");
        return;
      }
      handleFiles(Array.from(event.dataTransfer.files ?? []));
    },
    [disabled, handleFiles, onError],
  );

  const handleDragOver = useCallback<React.DragEventHandler<HTMLDivElement>>(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback<React.DragEventHandler<HTMLDivElement>>(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
    },
    [],
  );

  const handleKeyDown = useCallback<React.KeyboardEventHandler<HTMLDivElement>>(
    (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      triggerChooseFiles();
    },
    [triggerChooseFiles],
  );

  const isActive = highlighted || isDragging;
  const surfaceStyles =
    surfaceVariant === "workbench"
      ? workbenchFileDropzoneSurfaceStyles
      : fileDropzoneSurfaceStyles;
  const renderedChildren =
    typeof children === "function"
      ? children({ isActive, isDragging, disabled })
      : children;

  return (
    <Box
      borderWidth={fileDropzoneSurfaceStyles.borderWidth}
      borderStyle={fileDropzoneSurfaceStyles.borderStyle}
      borderColor={
        disabled
          ? "border.muted"
          : isActive
            ? fileDropzoneSurfaceStyles.activeBorderColor
            : surfaceStyles.borderColor
      }
      bg={
        disabled
          ? "bg.muted"
          : isActive
            ? fileDropzoneSurfaceStyles.activeBg
            : surfaceStyles.bg
      }
      borderRadius={surfaceStyles.borderRadius}
      boxShadow={
        disabled
          ? "none"
          : isActive
            ? fileDropzoneSurfaceStyles.activeBoxShadow
            : surfaceStyles.boxShadow
      }
      boxShadowColor={
        disabled
          ? undefined
          : isActive
            ? fileDropzoneSurfaceStyles.activeBoxShadowColor
            : "transparent"
      }
      p={padding ?? 8}
      w="full"
      minH={minH}
      maxH={maxH}
      cursor={disabled ? "not-allowed" : "pointer"}
      opacity={disabled ? 0.7 : 1}
      transition="background-color var(--chakra-durations-fast), border-color var(--chakra-durations-fast), box-shadow var(--chakra-durations-fast)"
      _hover={
        disabled
          ? undefined
          : {
              borderColor: surfaceStyles.hoverBorderColor,
              bg: isActive
                ? fileDropzoneSurfaceStyles.activeBg
                : surfaceStyles.hoverBg,
              boxShadow: isActive
                ? fileDropzoneSurfaceStyles.activeBoxShadow
                : surfaceStyles.hoverBoxShadow,
              boxShadowColor: isActive
                ? fileDropzoneSurfaceStyles.activeBoxShadowColor
                : "transparent",
            }
      }
      _active={
        disabled
          ? undefined
          : {
              bg: fileDropzoneSurfaceStyles.activeBg,
              borderColor: fileDropzoneSurfaceStyles.activeBorderColor,
              boxShadow: fileDropzoneSurfaceStyles.activeBoxShadow,
              boxShadowColor: fileDropzoneSurfaceStyles.activeBoxShadowColor,
            }
      }
      _focusVisible={{
        outline: 0,
        borderColor: surfaceStyles.hoverBorderColor,
        boxShadow: fileDropzoneSurfaceStyles.focusBoxShadow,
      }}
      display="flex"
      alignItems="center"
      justifyContent="center"
      data-group
      {...rootProps}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={triggerChooseFiles}
      onKeyDown={handleKeyDown}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <Input
        ref={inputRef}
        id={inputId}
        name={inputName}
        type="file"
        accept={accept}
        multiple={multiple}
        aria-label={inputAriaLabel}
        disabled={disabled}
        display="none"
        onClick={(event) => event.stopPropagation()}
        onChange={handleInputChange}
      />

      <VStack gap={3} align="center" pointerEvents="none">
        {renderedChildren}
      </VStack>
    </Box>
  );
}

export default FileDropzone;
