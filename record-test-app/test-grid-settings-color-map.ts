import { RecordGridSettings } from './record-grid-settings';

export interface TestGridSettingsColorMap extends RecordGridSettings.ColorMap {
    bkgdGreyedOut: string;
    foreGreyedOut: string;
    bkgdFocusedRow: string;
    bkgdFocusedRowBorder: string;
    foreValueRecentlyModifiedBorder: string;
    foreValueRecentlyModifiedUpBorder: string;
    foreValueRecentlyModifiedDownBorder: string;
    foreRecordRecentlyUpdatedBorder: string;
    foreRecordRecentlyInsertedBorder: string;

    foreScrollbarThumbColor: string;
    scrollbarThumbShadowColor: string;

    // bkgdRowHeader: string;
    // foreRowHeader: string;
}
