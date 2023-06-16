/* eslint-disable @typescript-eslint/no-empty-function */
import { ColumnSettingsBehavior } from '../../grid/grid-public-api';

/** @public */
export const readonlyColumnSettingsBehavior: ColumnSettingsBehavior = {
    viewRenderInvalidatedEventer: () => {},

    load: () => {},
}
