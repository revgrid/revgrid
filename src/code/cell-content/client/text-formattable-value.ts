/** @public */
export interface RevTextFormattableValue<TypeId, AttributeTypeId> {
    readonly typeId: TypeId;
    readonly attributes: readonly RevTextFormattableValue.Attribute<AttributeTypeId>[];

    hasAttribute(value: RevTextFormattableValue.Attribute<AttributeTypeId>): boolean;
    addAttribute(value: RevTextFormattableValue.Attribute<AttributeTypeId>): void;
    removeAttribute(value: RevTextFormattableValue.Attribute<AttributeTypeId>): void;
    addOrRemoveAttribute(value: RevTextFormattableValue.Attribute<AttributeTypeId>, add: boolean): void
    setAttributes(value: RevTextFormattableValue.Attribute<AttributeTypeId>[]): void;

    isUndefined(): boolean
}

/** @public */
export namespace RevTextFormattableValue {
    export interface Attribute<TypeId> {
        readonly typeId: TypeId;
    }
}
