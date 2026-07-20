export interface PalworldRawCharacterDecodedProperty {
  type: string;
  value?: unknown;
  values?: unknown[];
  enum_type?: string;
  inner_type?: string;
  struct_id?: string;
  struct_type?: string;
}

export type PalworldRawCharacterDecodedProperties = Record<
  string,
  PalworldRawCharacterDecodedProperty
>;

const utf8Decoder = new TextDecoder();

export class PalworldRawCharacterDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PalworldRawCharacterDecodeError";
  }
}

export function decodePalworldRawCharacterSaveParameter(
  rawValues: readonly number[] | Uint8Array,
): PalworldRawCharacterDecodedProperties {
  return new PalworldRawCharacterReader(
    toUint8Array(rawValues),
  ).readPropertyList();
}

class PalworldRawCharacterReader {
  private readonly view: DataView;
  private offset = 0;

  constructor(private readonly data: Uint8Array) {
    this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  }

  readPropertyList(endOffset = this.data.byteLength) {
    const properties: PalworldRawCharacterDecodedProperties = {};

    while (this.offset < endOffset) {
      const name = this.readFString();
      if (name === "None") {
        return properties;
      }

      properties[name] = this.readPropertyValue();
    }

    throw new PalworldRawCharacterDecodeError(
      "Palworld raw character property list is missing the None terminator.",
    );
  }

  private readPropertyValue(): PalworldRawCharacterDecodedProperty {
    const type = this.readFString();
    const size = this.readInt64();
    let boolValue: boolean | undefined;
    let enumType: string | undefined;
    let innerType: string | undefined;
    let structId: string | undefined;
    let structType: string | undefined;

    if (type === "StructProperty") {
      structType = this.readFString();
      structId = this.readGuidString();
    } else if (type === "EnumProperty") {
      enumType = this.readFString();
    } else if (type === "ArrayProperty") {
      innerType = this.readFString();
    } else if (type === "ByteProperty") {
      enumType = this.readFString();
    } else if (type === "BoolProperty") {
      boolValue = this.readByte() !== 0;
    }

    this.skipPropertyGuid();
    const valueStart = this.offset;
    const valueEnd = valueStart + size;
    this.assertOffset(valueEnd, "property value");

    const property: PalworldRawCharacterDecodedProperty = { type };
    if (enumType) property.enum_type = enumType;
    if (innerType) property.inner_type = innerType;
    if (structId) property.struct_id = structId;
    if (structType) property.struct_type = structType;

    if (type === "NameProperty" || type === "StrProperty") {
      property.value = this.readFString();
    } else if (type === "EnumProperty") {
      property.value = this.readFString();
    } else if (type === "ArrayProperty") {
      property.value = this.readArrayValue(innerType, valueEnd);
    } else if (type === "StructProperty") {
      property.value = this.readStructValue(structType, valueEnd);
    } else if (type === "IntProperty") {
      property.value = this.readInt32();
    } else if (type === "Int64Property") {
      property.value = this.readInt64();
    } else if (type === "FloatProperty") {
      property.value = this.readFloat32();
    } else if (type === "ByteProperty") {
      property.value = this.readByte();
    } else if (type === "BoolProperty") {
      property.value = boolValue ?? false;
    }

    this.offset = valueEnd;
    return property;
  }

  private readArrayValue(innerType: string | undefined, valueEnd: number) {
    const count = this.readInt32();
    if (count < 0) {
      throw new PalworldRawCharacterDecodeError(
        `Palworld raw character array has invalid count ${count}.`,
      );
    }

    const values: PalworldRawCharacterDecodedProperty[] = [];
    if (innerType !== "NameProperty" && innerType !== "EnumProperty") {
      this.offset = valueEnd;
      return { values };
    }

    for (let index = 0; index < count; index += 1) {
      values.push({
        type: innerType,
        value: this.readFString(),
      });
    }

    return { values };
  }

  private readStructValue(
    structType: string | undefined,
    valueEnd: number,
  ): unknown {
    if (structType === "Guid") {
      return this.readGuidString();
    }

    if (
      structType === "PalIndividualCharacterSaveParameter" ||
      structType === "PalCharacterSlotId" ||
      structType === "PalContainerId"
    ) {
      return this.readPropertyList(valueEnd);
    }

    this.offset = valueEnd;
    return undefined;
  }

  private skipPropertyGuid() {
    if (this.readByte() !== 0) {
      this.skip(16);
    }
  }

  private readFString() {
    const length = this.readInt32();
    if (length === 0) return "";

    if (length < 0) {
      const codeUnitCount = -length;
      this.assertReadable(codeUnitCount * 2, "UTF-16 FString");
      let value = "";
      for (let index = 0; index < codeUnitCount - 1; index += 1) {
        value += String.fromCharCode(this.view.getUint16(this.offset, true));
        this.offset += 2;
      }
      this.offset += 2;
      return value;
    }

    this.assertReadable(length, "UTF-8 FString");
    const bytes = this.data.subarray(this.offset, this.offset + length - 1);
    this.offset += length;
    return utf8Decoder.decode(bytes);
  }

  private readGuidString() {
    const hex = [
      this.readUint32(),
      this.readUint32(),
      this.readUint32(),
      this.readUint32(),
    ]
      .map((part) => part.toString(16).padStart(8, "0"))
      .join("");

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join("-");
  }

  private readByte() {
    this.assertReadable(1, "byte");
    const value = this.data[this.offset];
    this.offset += 1;
    return value;
  }

  private readInt32() {
    this.assertReadable(4, "int32");
    const value = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return value;
  }

  private readUint32() {
    this.assertReadable(4, "uint32");
    const value = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return value;
  }

  private readInt64() {
    const low = this.readUint32();
    const high = this.readUint32();
    const value = high * 0x100000000 + low;
    if (!Number.isSafeInteger(value)) {
      throw new PalworldRawCharacterDecodeError(
        "Palworld raw character int64 exceeds JavaScript safe integer range.",
      );
    }
    return value;
  }

  private readFloat32() {
    this.assertReadable(4, "float32");
    const value = this.view.getFloat32(this.offset, true);
    this.offset += 4;
    return value;
  }

  private skip(byteLength: number) {
    this.assertReadable(byteLength, "skipped bytes");
    this.offset += byteLength;
  }

  private assertReadable(byteLength: number, label: string) {
    this.assertOffset(this.offset + byteLength, label);
  }

  private assertOffset(offset: number, label: string) {
    if (offset > this.data.byteLength) {
      throw new PalworldRawCharacterDecodeError(
        `Palworld raw character ${label} is truncated.`,
      );
    }
  }
}

function toUint8Array(rawValues: readonly number[] | Uint8Array) {
  if (rawValues instanceof Uint8Array) {
    return rawValues;
  }

  const bytes: number[] = [];
  for (const value of rawValues) {
    if (!Number.isInteger(value) || value < 0 || value > 255) {
      throw new PalworldRawCharacterDecodeError(
        "Palworld raw character values must be bytes.",
      );
    }
    bytes.push(value);
  }
  return Uint8Array.from(bytes);
}
