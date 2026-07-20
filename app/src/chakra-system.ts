import { createSystem, defineConfig } from "@chakra-ui/react";
import { defaultBaseConfig } from "@chakra-ui/react/preset-base";
import {
  alertSlotRecipe,
  animationStyles,
  badgeRecipe,
  breakpoints,
  buttonRecipe,
  collapsibleSlotRecipe,
  comboboxSlotRecipe,
  cssVarsPrefix,
  cssVarsRoot,
  dialogSlotRecipe,
  fieldSlotRecipe,
  globalCss,
  headingRecipe,
  iconRecipe,
  inputRecipe,
  keyframes,
  layerStyles,
  linkRecipe,
  nativeSelectSlotRecipe,
  semanticTokens,
  textStyles,
  toastSlotRecipe,
  tokens,
} from "@chakra-ui/react/theme";

const calculatorThemeConfig = defineConfig({
  preflight: true,
  cssVarsPrefix,
  cssVarsRoot,
  globalCss,
  theme: {
    breakpoints,
    keyframes,
    tokens,
    semanticTokens,
    recipes: {
      badge: badgeRecipe,
      button: buttonRecipe,
      heading: headingRecipe,
      icon: iconRecipe,
      input: inputRecipe,
      link: linkRecipe,
    },
    slotRecipes: {
      alert: alertSlotRecipe,
      collapsible: collapsibleSlotRecipe,
      combobox: comboboxSlotRecipe,
      dialog: dialogSlotRecipe,
      field: fieldSlotRecipe,
      nativeSelect: nativeSelectSlotRecipe,
      toast: toastSlotRecipe,
    },
    textStyles,
    layerStyles,
    animationStyles,
  },
});

export const calculatorSystem = createSystem(
  defaultBaseConfig,
  calculatorThemeConfig,
);
