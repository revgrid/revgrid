import { AppGridSettings } from './app-grid-settings';

/** @public */
export const defaultAppGridSettings: AppGridSettings = {
    focusedRowBorderWidth: 1,

    alternateBackgroundColor: '#2b2b2b',
    grayedOutForegroundColor: '#595959',
    focusedRowBackgroundColor: '#6e6835',
    focusedRowBorderColor: '#C8B900',

    valueRecentlyModifiedBorderColor: '#8C5F46',
    valueRecentlyModifiedUpBorderColor: '#64FA64',
    valueRecentlyModifiedDownBorderColor: '#4646FF',
    recordRecentlyUpdatedBorderColor: 'orange',
    recordRecentlyInsertedBorderColor: 'pink',
} as const;
