import {
    GridSettings,
    InMemoryStandardBehavioredGridSettings
} from '..';
import { AppAllGridSettings } from './app-all-grid-settings';
import { AppBehavioredGridSettings } from './app-behaviored-grid-settings';
import { AppGridSettings } from './app-grid-settings';

/** @public */
export class InMemoryAppBehavioredGridSettings extends InMemoryStandardBehavioredGridSettings implements AppBehavioredGridSettings {
    private _focusedRowBorderWidth: number;
    private _alternateBackgroundColor: GridSettings.Color;
    private _grayedOutForegroundColor: GridSettings.Color;
    private _focusedRowBackgroundColor: GridSettings.Color | undefined;
    private _focusedRowBorderColor: GridSettings.Color | undefined;
    private _valueRecentlyModifiedBorderColor: GridSettings.Color;
    private _valueRecentlyModifiedUpBorderColor: GridSettings.Color;
    private _valueRecentlyModifiedDownBorderColor: GridSettings.Color;
    private _recordRecentlyUpdatedBorderColor: GridSettings.Color;
    private _recordRecentlyInsertedBorderColor: GridSettings.Color;

    get focusedRowBorderWidth() { return this._focusedRowBorderWidth; }
    set focusedRowBorderWidth(value: number) {
        if (value !== this._focusedRowBorderWidth) {
            this.beginChange();
            this._focusedRowBorderWidth = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }

    get alternateBackgroundColor() { return this._alternateBackgroundColor; }
    set alternateBackgroundColor(value: GridSettings.Color) {
        if (value !== this._alternateBackgroundColor) {
            this.beginChange();
            this._alternateBackgroundColor = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }

    get grayedOutForegroundColor() { return this._grayedOutForegroundColor; }
    set grayedOutForegroundColor(value: GridSettings.Color) {
        if (value !== this._grayedOutForegroundColor) {
            this.beginChange();
            this._grayedOutForegroundColor = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }

    get focusedRowBackgroundColor() { return this._focusedRowBackgroundColor; }
    set focusedRowBackgroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._focusedRowBackgroundColor) {
            this.beginChange();
            this._focusedRowBackgroundColor = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }

    get focusedRowBorderColor() { return this._focusedRowBorderColor; }
    set focusedRowBorderColor(value: GridSettings.Color | undefined) {
        if (value !== this._focusedRowBorderColor) {
            this.beginChange();
            this._focusedRowBorderColor = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }

    get valueRecentlyModifiedBorderColor() { return this._valueRecentlyModifiedBorderColor; }
    set valueRecentlyModifiedBorderColor(value: GridSettings.Color) {
        if (value !== this._valueRecentlyModifiedBorderColor) {
            this.beginChange();
            this._valueRecentlyModifiedBorderColor = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }

    get valueRecentlyModifiedUpBorderColor() { return this._valueRecentlyModifiedUpBorderColor; }
    set valueRecentlyModifiedUpBorderColor(value: GridSettings.Color) {
        if (value !== this._valueRecentlyModifiedUpBorderColor) {
            this.beginChange();
            this._valueRecentlyModifiedUpBorderColor = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }

    get valueRecentlyModifiedDownBorderColor() { return this._valueRecentlyModifiedDownBorderColor; }
    set valueRecentlyModifiedDownBorderColor(value: GridSettings.Color) {
        if (value !== this._valueRecentlyModifiedDownBorderColor) {
            this.beginChange();
            this._valueRecentlyModifiedDownBorderColor = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }

    get recordRecentlyUpdatedBorderColor() { return this._recordRecentlyUpdatedBorderColor; }
    set recordRecentlyUpdatedBorderColor(value: GridSettings.Color) {
        if (value !== this._recordRecentlyUpdatedBorderColor) {
            this.beginChange();
            this._recordRecentlyUpdatedBorderColor = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }

    get recordRecentlyInsertedBorderColor() { return this._recordRecentlyInsertedBorderColor; }
    set recordRecentlyInsertedBorderColor(value: GridSettings.Color) {
        if (value !== this._recordRecentlyInsertedBorderColor) {
            this.beginChange();
            this._recordRecentlyInsertedBorderColor = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }

    override load(settings: AppAllGridSettings) {
        this.beginChange();

        super.load(settings);

        for (const key in settings) {
            // Use loop so that compiler will report error if any setting missing
            const gridSettingsKey = key as keyof AppGridSettings;
            switch (gridSettingsKey) {
                case 'alternateBackgroundColor':
                    this._alternateBackgroundColor = settings.alternateBackgroundColor;
                    break;
                case 'focusedRowBorderWidth':
                    this._focusedRowBorderWidth = settings.focusedRowBorderWidth;
                    break;
                case 'grayedOutForegroundColor':
                    this._grayedOutForegroundColor = settings.grayedOutForegroundColor;
                    break;
                case 'focusedRowBackgroundColor':
                    this._focusedRowBackgroundColor = settings.focusedRowBackgroundColor;
                    break;
                case 'focusedRowBorderColor':
                    this._focusedRowBorderColor = settings.focusedRowBorderColor;
                    break;
                case 'valueRecentlyModifiedBorderColor':
                    this._valueRecentlyModifiedBorderColor = settings.valueRecentlyModifiedBorderColor;
                    break;
                case 'valueRecentlyModifiedUpBorderColor':
                    this._valueRecentlyModifiedUpBorderColor = settings.valueRecentlyModifiedUpBorderColor;
                    break;
                case 'valueRecentlyModifiedDownBorderColor':
                    this._valueRecentlyModifiedDownBorderColor = settings.valueRecentlyModifiedDownBorderColor;
                    break;
                case 'recordRecentlyUpdatedBorderColor':
                    this._recordRecentlyUpdatedBorderColor = settings.recordRecentlyUpdatedBorderColor;
                    break;
                case 'recordRecentlyInsertedBorderColor':
                    this._recordRecentlyInsertedBorderColor = settings.recordRecentlyInsertedBorderColor;
                    break;

                default: {
                    gridSettingsKey satisfies never;
                }
            }
        }

        this.endChange();
    }

    override clone() {
        const copy = new InMemoryAppBehavioredGridSettings();
        copy.load(this);
        return copy;
    }
}
