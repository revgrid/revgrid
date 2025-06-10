import { RevGridSettings } from '../..';

/** @public */
export interface AppOnlyGridSettings {
    // /** The highlight duration when all values/records are changed. 0 to disable*/
    // allChangedRecentDuration: RevRecordSysTick.Span;
    // /** The highlight duration for added values. 0 to disable*/
    // recordInsertedRecentDuration: RevRecordSysTick.Span;
    // /** The highlight duration for updated records. 0 to disable*/
    // recordUpdatedRecentDuration: RevRecordSysTick.Span;
    // /** The highlight duration for changed values. 0 to disable */
    // valueChangedRecentDuration: RevRecordSysTick.Span;

    focusedRowBorderWidth: number;

    grayedOutForegroundColor: RevGridSettings.Color;
    focusedRowBackgroundColor: RevGridSettings.Color | undefined;
    focusedRowBorderColor: RevGridSettings.Color | undefined;
    focusedCellBorderColor: RevGridSettings.Color;

    valueRecentlyModifiedBorderColor: RevGridSettings.Color;
    valueRecentlyModifiedUpBorderColor: RevGridSettings.Color;
    valueRecentlyModifiedDownBorderColor: RevGridSettings.Color;
    recordRecentlyUpdatedBorderColor: RevGridSettings.Color;
    recordRecentlyInsertedBorderColor: RevGridSettings.Color;
}
