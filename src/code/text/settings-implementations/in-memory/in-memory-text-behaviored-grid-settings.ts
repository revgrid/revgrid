import { InMemoryBehavioredGridSettings } from '../../../settings-implementations/settings-implementations-public-api';
import { HorizontalAlign, TextBehavioredGridSettings, TextGridSettings, TextOnlyGridSettings, TextTruncateType } from '../../settings/text-settings-public-api';

/** @public */
export class InMemoryTextBehavioredGridSettings extends InMemoryBehavioredGridSettings implements TextBehavioredGridSettings {
    private _horizontalAlign: HorizontalAlign;
    private _verticalOffset: number;
    private _textTruncateType: TextTruncateType | undefined;
    private _textStrikeThrough: boolean;

    get horizontalAlign() { return this._horizontalAlign; }
    set horizontalAlign(value: HorizontalAlign) {
        if (value !== this._horizontalAlign) {
            this.beginChange();
            this._horizontalAlign = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get verticalOffset() { return this._verticalOffset; }
    set verticalOffset(value: number) {
        if (value !== this._verticalOffset) {
            this.beginChange();
            this._verticalOffset = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get textTruncateType() { return this._textTruncateType; }
    set textTruncateType(value: TextTruncateType | undefined) {
        if (value !== this._textTruncateType) {
            this.beginChange();
            this._textTruncateType = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get textStrikeThrough() { return this._textStrikeThrough; }
    set textStrikeThrough(value: boolean) {
        if (value !== this._textStrikeThrough) {
            this.beginChange();
            this._textStrikeThrough = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }

    override merge(settings: Partial<TextGridSettings>) {
        this.beginChange();

        super.merge(settings);

        const requiredSettings = settings as Required<TextGridSettings>; // since we only iterate over keys that exist we can assume that settings is not partial in the switch loop
        for (const key in settings) {
            // Use loop so that compiler will report error if any setting missing
            const gridSettingsKey = key as keyof TextOnlyGridSettings;
            switch (gridSettingsKey) {
                case 'horizontalAlign':
                    this._horizontalAlign = requiredSettings.horizontalAlign;
                    break;
                case 'verticalOffset':
                    this._verticalOffset = requiredSettings.verticalOffset;
                    break;
                case 'textTruncateType':
                    this._textTruncateType = requiredSettings.textTruncateType;
                    break;
                case 'textStrikeThrough':
                    this._textStrikeThrough = requiredSettings.textStrikeThrough;
                    break;

                default: {
                    gridSettingsKey satisfies never;
                }
            }
        }

        this.endChange();
    }

    override clone() {
        const copy = new InMemoryTextBehavioredGridSettings();
        copy.merge(this);
        return copy;
    }
}
