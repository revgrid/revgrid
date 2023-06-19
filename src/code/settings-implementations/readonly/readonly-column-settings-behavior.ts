/* eslint-disable @typescript-eslint/no-empty-function */
import { ColumnSettingsBehavior } from '../../grid/grid-public-api';
import { readonlyGridSettingsBehavior } from './readonly-grid-settings-behavior';

/** @public */
export const readonlyColumnSettingsBehavior: ColumnSettingsBehavior = {
    ...readonlyGridSettingsBehavior,
    load: () => {},
}
