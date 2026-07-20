import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("standalone search combobox accessibility", () => {
  it("registers the public input id with the combobox state machine", () => {
    const source = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );
    expect(source).toContain(
      "<Field.Root disabled={disabled} invalid={invalid}>",
    );
    expect(source).toContain("<Field.Label");
    expect(source).toContain("htmlFor={id}");
    expect(source).toContain("ids={{ input: id }}");
    expect(source).not.toContain(
      "<ControlledComboboxInput\n                id={id}",
    );
    expect(source).not.toContain("<Field.Root id={id}");
  });

  it("uses one square frame for decorative child and parent label icons", () => {
    const source = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );
    const comboboxSource = source.slice(
      source.indexOf("function SearchCombobox"),
      source.indexOf("function PassiveSkillPickerDialog"),
    );

    expect(comboboxSource).toContain("labelIconSrc?: string | null;");
    expect(comboboxSource).not.toContain("labelAvatarInternalId");
    expect(comboboxSource).toContain(
      "{labelIconSrc ? <FieldLabelIcon src={labelIconSrc} /> : null}",
    );
    expect(comboboxSource).toContain('fontSize="md"');
  });

  it("keeps square field icons visually distinct from circular select avatars", () => {
    const source = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );
    const frameSource = source.slice(
      source.indexOf("function FieldLabelIcon"),
      source.indexOf("function SearchCombobox"),
    );
    const avatarSource = source.slice(
      source.indexOf("function PalAvatar"),
      source.indexOf("function PaldeckBadge"),
    );

    expect(frameSource).toContain("w={6}");
    expect(frameSource).toContain("h={6}");
    expect(frameSource).toContain('borderRadius="sm"');
    expect(frameSource).toContain('overflow="hidden"');
    expect(frameSource).toContain('objectFit="contain"');
    expect(avatarSource).toContain('size?: "sm" | "md";');
    expect(avatarSource).toContain('borderRadius="full"');
    expect(avatarSource).toContain('objectFit: "cover"');
  });

  it("enters typing mode before applying the first search character", () => {
    const source = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );

    expect(source).toContain(
      'onInputValueChange={(details) => {\n          if (details.reason !== "input-change") return;\n          setInputValue(details.inputValue);\n          setIsTyping(true);\n          setQuery(details.inputValue);',
    );
    expect(source).not.toContain("onInput={() => setIsTyping(true)}");
  });

  it("keeps the root and native combobox input values controlled", () => {
    const source = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );
    const inputSource = source.slice(
      source.indexOf("<ControlledComboboxInput"),
      source.indexOf("/>", source.indexOf("<ControlledComboboxInput")),
    );

    expect(source).toContain(
      "const [inputValue, setInputValue] = useState(selectedInputValue);",
    );
    expect(source).toContain("inputValue={inputValue}");
    expect(source).toContain("<Combobox.Input asChild>");
    expect(inputSource).toContain("value={inputValue}");
    expect(source).toContain("defaultValue: _defaultValue");
  });

  it("clears a dismissed search instead of leaving stale query text", () => {
    const source = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );

    expect(source).toContain(
      'if (!details.open) {\n            setIsTyping(false);\n            setQuery("");\n            return;',
    );
  });

  it("clears the combobox input through the component state machine", () => {
    const source = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );

    expect(source).toContain("<Combobox.ClearTrigger asChild>");
  });

  it("keeps the native selected text out of the custom value overlay", () => {
    const source = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );

    expect(source).toContain(
      'textIndent={selectedAvatarInternalId ? "-9999px" : undefined}',
    );
  });

  it("keeps visual value affordances above the controlled input surface", () => {
    const source = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );
    const comboboxSource = source.slice(
      source.indexOf("function SearchCombobox"),
      source.indexOf("function PassiveSkillPickerDialog"),
    );

    expect(comboboxSource.match(/zIndex=\{1\}/gu)).toHaveLength(4);
  });

  it("does not mount every Pal and passive option while the picker is closed", () => {
    const source = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );

    expect(source).toContain("lazyMount");
    expect(source).toContain("unmountOnExit");
  });

  it("keeps the full searchable collection while rendering only the virtual window", () => {
    const source = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );

    expect(source).toContain("createListCollection({");
    expect(source).toContain("items: filteredOptions");
    expect(source).toContain("virtualOptions.map((option) => (");
    expect(source).not.toContain("filteredOptions.map((option) => (");
  });

  it("keeps the option list below the field and within the available viewport", () => {
    const source = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );

    expect(source).toContain(
      'positioning={{\n          sameWidth: true,\n          placement: "bottom-start",\n          flip: false,\n        }}',
    );
    expect(source).toContain('maxH="min(20rem, var(--available-height))"');
  });

  it("applies the virtual scroll position after the lazy content mounts", () => {
    const source = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );

    expect(source).toContain(
      "const syncContentRef = useCallback(\n    (content: HTMLDivElement | null) => {\n      contentRef.current = content;\n      if (content) content.scrollTop = scrollTop;\n    },\n    [scrollTop],\n  );",
    );
    expect(source).toContain("ref={syncContentRef}");
    expect(source).not.toContain(
      "window.requestAnimationFrame(() => {\n      if (contentRef.current)",
    );
  });

  it("gives native language and file fields stable form identifiers", () => {
    const source = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );

    expect(source).toContain('id="palworld-language"');
    expect(source).toContain('name="palworld-language"');
    expect(source).toContain('inputId="palworld-save-file"');
    expect(source).toContain('inputName="palworld-save-file"');
  });
});
