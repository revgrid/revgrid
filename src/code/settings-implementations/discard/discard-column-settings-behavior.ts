/* eslint-disable @typescript-eslint/no-empty-function */
import { ColumnSettingsBehavior } from '../../grid/grid-public-api';

/** @public */
export const discardColumnSettingsBehavior: ColumnSettingsBehavior = {
    viewRenderInvalidatedEventer: () => {},

    load: () => {},
}
