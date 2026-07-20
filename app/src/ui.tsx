import React from "react";
import {
  CloseButton,
  createToaster,
  Icon,
  Portal,
  Toast,
  Toaster,
  Tooltip as ChakraTooltip,
  type IconProps,
} from "@chakra-ui/react";

const ICON_SIZES = {
  xs: "3",
  sm: "4",
  md: "5",
  lg: "6",
  xl: "8",
  "2xl": "10",
  "3xl": "16",
} as const;

export function AppIcon({
  size = "sm",
  boxSize,
  ...props
}: Omit<IconProps, "size"> & { size?: keyof typeof ICON_SIZES }) {
  return <Icon boxSize={boxSize ?? ICON_SIZES[size]} {...props} />;
}

export interface AppTooltipProps extends ChakraTooltip.RootProps {
  content: React.ReactNode;
  children: React.ReactElement;
}

export function AppTooltip({
  content,
  children,
  positioning = { placement: "top" },
  ...props
}: AppTooltipProps) {
  return (
    <ChakraTooltip.Root
      openDelay={400}
      positioning={positioning}
      lazyMount
      unmountOnExit
      {...props}
    >
      <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>
      <Portal>
        <ChakraTooltip.Positioner>
          <ChakraTooltip.Content
            maxW="18rem"
            px={2.5}
            py={1.5}
            borderRadius="sm"
            bg="var(--palworld-fg)"
            color="var(--palworld-surface)"
            fontSize="xs"
            fontWeight="700"
            lineHeight="1.4"
            textAlign="center"
          >
            <ChakraTooltip.Arrow>
              <ChakraTooltip.ArrowTip />
            </ChakraTooltip.Arrow>
            {content}
          </ChakraTooltip.Content>
        </ChakraTooltip.Positioner>
      </Portal>
    </ChakraTooltip.Root>
  );
}

export const appToaster = createToaster({
  placement: "top",
  pauseOnPageIdle: true,
  offsets: {
    top: "64px",
    right: "12px",
    bottom: "12px",
    left: "12px",
  },
});

export function AppToaster({ closeLabel }: { closeLabel: string }) {
  return (
    <Portal>
      <Toaster toaster={appToaster} w="calc(100vw - 24px)">
        {(toast) => (
          <Toast.Root
            w={{ base: "full", sm: "22rem" }}
            maxW="full"
            borderWidth="1px"
            borderColor="var(--palworld-border-strong)"
            borderRadius="md"
            bg="var(--palworld-surface)"
            color="var(--palworld-fg)"
            boxShadow="var(--palworld-floating-shadow)"
          >
            <Toast.Indicator />
            {toast.title ? <Toast.Title>{toast.title}</Toast.Title> : null}
            <Toast.CloseTrigger asChild>
              <CloseButton size="sm" aria-label={closeLabel} />
            </Toast.CloseTrigger>
          </Toast.Root>
        )}
      </Toaster>
    </Portal>
  );
}

export type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  critical?: boolean;
  hoverDelayMs?: number;
};

export function Link({
  critical: _critical,
  hoverDelayMs: _hoverDelayMs,
  ...props
}: LinkProps) {
  return <a {...props} />;
}

export default Link;
