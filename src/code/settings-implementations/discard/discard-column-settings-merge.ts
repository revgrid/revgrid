import { ColumnSettings, ColumnSettingsMerge } from '../../grid/grid-public-api';

/** @public */
export const discardColumnSettingsMerge: ColumnSettingsMerge = {
    merge: (settings: Partial<ColumnSettings>) => false,
}
