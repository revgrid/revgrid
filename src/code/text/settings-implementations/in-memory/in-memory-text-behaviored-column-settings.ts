import { InMemoryBehavioredColumnSettings } from '../../../settings-implementations/settings-implementations-public-api';
import { HorizontalAlign, TextBehavioredColumnSettings, TextColumnSettings, TextGridSettings, TextOnlyColumnSettings, TextTruncateType } from '../../settings/text-settings-public-api';

/** @public */
export class InMemoryTextBehavioredColumnSettings extends InMemoryBehavioredColumnSettings implements TextBehavioredColumnSettings {
    declare gridSettings: TextGridSettings;

    private _horizontalAlign: HorizontalAlign | undefined;
    private _verticalOffset: number | undefined;
    private _textTruncateType: TextTruncateType | undefined | null;
    private _textStrikeThrough: boolean | undefined;

    constructor(gridSettings: TextGridSettings) {
        super(gridSettings);
    }

    get horizontalAlign() { return this._horizontalAlign !== undefined ? this._horizontalAlign : this.gridSettings.horizontalAlign; }
    set horizontalAlign(value: HorizontalAlign) {
        if (value !== this._horizontalAlign) {
            this.beginChange();
            this._horizontalAlign = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get verticalOffset() { return this._verticalOffset !== undefined ? this._verticalOffset : this.gridSettings.verticalOffset; }
    set verticalOffset(value: number) {
        if (value !== this._verticalOffset) {
            this.beginChange();
            this._verticalOffset = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get textTruncateType() {
        if (this._textTruncateType === null) {
            return undefined;
        } else {
            return this._textTruncateType !== undefined ? this._textTruncateType : this.gridSettings.textTruncateType;
        }
    }
    set textTruncateType(value: TextTruncateType | undefined) {
        if (value !== this._textTruncateType) {
            this.beginChange();
            if (value === undefined) {
                this._textTruncateType = null;
            } else {
                this._textTruncateType = value;
            }
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get textStrikeThrough() { return this._textStrikeThrough !== undefined ? this._textStrikeThrough : this.gridSettings.textStrikeThrough; }
    set textStrikeThrough(value: boolean) {
        if (value !== this._textStrikeThrough) {
            this.beginChange();
            this._textStrikeThrough = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }

    override merge(settings: Partial<TextColumnSettings>) {
        this.beginChange();

        super.merge(settings);

        const requiredSettings = settings as Required<TextColumnSettings>; // since we only iterate over keys that exist we can assume that settings is not partial in the switch loop
        for (const key in settings) {
            // Use loop so that compiler will report error if any setting missing
            const columnSettingsKey = key as keyof TextOnlyColumnSettings;
            switch (columnSettingsKey) {
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

                default:
                    columnSettingsKey satisfies never;
            }
        }

        this.endChange();
    }

    override clone() {
        const copy = new InMemoryTextBehavioredColumnSettings(this.gridSettings);
        copy.merge(this);
        return copy;
    }
}
