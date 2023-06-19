import {
    GridSettings,
    StandardInMemoryBehavioredGridSettings
} from '..';
import { AppAllGridSettings } from './app-all-grid-settings';
import { AppBehavioredGridSettings } from './app-behaviored-grid-settings';
import { AppGridSettings } from './app-grid-settings';

/** @public */
export class AppInMemoryBehavioredGridSettings extends StandardInMemoryBehavioredGridSettings implements AppBehavioredGridSettings {
    // private _allChangedRecentDuration: RevRecordSysTick.Span;
    // private _recordInsertedRecentDuration: RevRecordSysTick.Span;
    // private _recordUpdatedRecentDuration: RevRecordSysTick.Span;
    // private _valueChangedRecentDuration: RevRecordSysTick.Span;
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

    // get allChangedRecentDuration() { return this._allChangedRecentDuration; }
    // set allChangedRecentDuration(value: RevRecordSysTick.Span) {
    //     if (value !== this._allChangedRecentDuration) {
    //         this.beginChange();
    //         this._allChangedRecentDuration = value;
    //         this.notifyChangedViewRender();
    //         this.endChange();
    //     }
    // }

    // get recordInsertedRecentDuration() { return this._recordInsertedRecentDuration; }
    // set recordInsertedRecentDuration(value: RevRecordSysTick.Span) {
    //     if (value !== this._recordInsertedRecentDuration) {
    //         this.beginChange();
    //         this._recordInsertedRecentDuration = value;
    //         this.notifyChangedViewRender();
    //         this.endChange();
    //     }
    // }

    // get recordUpdatedRecentDuration() { return this._recordUpdatedRecentDuration; }
    // set recordUpdatedRecentDuration(value: RevRecordSysTick.Span) {
    //     if (value !== this._recordUpdatedRecentDuration) {
    //         this.beginChange();
    //         this._recordUpdatedRecentDuration = value;
    //         this.notifyChangedViewRender();
    //         this.endChange();
    //     }
    // }

    // get valueChangedRecentDuration() { return this._valueChangedRecentDuration; }
    // set valueChangedRecentDuration(value: RevRecordSysTick.Span) {
    //     if (value !== this._valueChangedRecentDuration) {
    //         this.beginChange();
    //         this._valueChangedRecentDuration = value;
    //         this.notifyChangedViewRender();
    //         this.endChange();
    //     }
    // }

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
                // case 'allChangedRecentDuration':
                //     this._allChangedRecentDuration = settings.allChangedRecentDuration;
                //     break;
                // case 'recordInsertedRecentDuration':
                //     this._recordInsertedRecentDuration = settings.recordInsertedRecentDuration;
                //     break;
                // case 'recordUpdatedRecentDuration':
                //     this._recordUpdatedRecentDuration = settings.recordUpdatedRecentDuration;
                //     break;
                // case 'valueChangedRecentDuration':
                //     this._valueChangedRecentDuration = settings.valueChangedRecentDuration;
                //     break;
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
}
