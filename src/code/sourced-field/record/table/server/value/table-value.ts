// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { isArrayEqual } from '@pbkware/js-utils';
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

    clearRendering() {
        this._textFormattableValue = undefined;
    }

    hasRenderAttribute(value: RevTextFormattableValue.Attribute<TextFormattableValueAttributeTypeId>): boolean {
        const attributes = this._renderAttributes;
        const attributeCount = attributes.length;
        if (attributeCount === 0) {
            return false;
        } else {
            for (let i = 0; i < attributeCount; i++) {
                const attribute = attributes[i];
                if (attribute === value) {
                    return true;
                }
            }
            return false;
        }
    }

    addRenderAttribute(value: RevTextFormattableValue.Attribute<TextFormattableValueAttributeTypeId>) {
        if (!this.hasRenderAttribute(value)) {
            this._renderAttributes.push(value);
            this._textFormattableValue = undefined;
        }
    }

    removeRenderAttribute(value: RevTextFormattableValue.Attribute<TextFormattableValueAttributeTypeId>): void {
        const attributes = this._renderAttributes;
        const attributeCount = attributes.length;
        if (attributeCount > 0) {
            for (let i = attributeCount - 1; i >= 0; i--) {
                const attribute = attributes[i];
                if (attribute === value) {
                    attributes.splice(i, 1);
                    this._textFormattableValue = undefined;
                    break;
                }
            }
        }
    }

    addOrRemoveRenderAttribute(value: RevTextFormattableValue.Attribute<TextFormattableValueAttributeTypeId>, add: boolean): void {
        if (add) {
            this.addRenderAttribute(value);
        } else {
            this.removeRenderAttribute(value);
        }
    }

    setRenderAttributes(value: readonly RevTextFormattableValue.Attribute<TextFormattableValueAttributeTypeId>[]): void {
        if (!isArrayEqual(value, this._renderAttributes)) {
            this._renderAttributes = value.slice();
            this._textFormattableValue = undefined;
        }
    }

    abstract isUndefined(): boolean;

    protected abstract createTextFormattableValue(): RevTextFormattableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>;
}

/** @public */
export namespace RevTableValue {
    export type Constructor<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> = new() => RevTableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>;
}
