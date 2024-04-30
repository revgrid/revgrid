// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevTextFormattableValue } from '../../../../../cell-content/client/internal-api';

/** @public */
export abstract class RevTableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
    private _textFormattableValue: RevTextFormattableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> | undefined;
    private _renderAttributes: RevTextFormattableValue.Attribute<TextFormattableValueAttributeTypeId>[] = [];

    get textFormattableValue() {
        if (this._textFormattableValue === undefined) {
            this._textFormattableValue = this.createTextFormattableValue();
            this._textFormattableValue.setAttributes(this._renderAttributes);
        }
        return this._textFormattableValue;
    }

    addRenderAttribute(value: RevTextFormattableValue.Attribute<TextFormattableValueAttributeTypeId>) {
        this._renderAttributes.push(value);
    }

    clearRendering() {
        this._textFormattableValue = undefined;
    }

    abstract isUndefined(): boolean;

    protected abstract createTextFormattableValue(): RevTextFormattableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>;
}

/** @public */
export namespace RevTableValue {
    export type Constructor<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> = new() => RevTableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>;
}
