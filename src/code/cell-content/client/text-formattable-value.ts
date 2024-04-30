// (c) 2024 Xilytix Pty Ltd / Paul Klink

/** @public */
export interface RevTextFormattableValue<TypeId, AttributeTypeId> {
    readonly typeId: TypeId;
    readonly attributes: readonly RevTextFormattableValue.Attribute<AttributeTypeId>[];

    addAttribute(value: RevTextFormattableValue.Attribute<AttributeTypeId>): void;
    setAttributes(value: RevTextFormattableValue.Attribute<AttributeTypeId>[]): void;

    isUndefined(): boolean
}

/** @public */
export namespace RevTextFormattableValue {
    export interface Attribute<TypeId> {
        readonly typeId: TypeId;
    }
}
