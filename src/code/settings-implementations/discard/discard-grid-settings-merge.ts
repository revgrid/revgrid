/* eslint-disable @typescript-eslint/no-empty-function */

import { GridSettings, GridSettingsMerge } from '../../grid/grid-public-api';

/** @public */
export const discardGridSettingsMerge: GridSettingsMerge = {
    /** @internal */
    resizeEventer: () => {},
    /** @internal */
    viewRenderInvalidatedEventer: () => {},
    /** @internal */
    viewLayoutInvalidatedEventer: () => {},
    /** @internal */
    horizontalViewLayoutInvalidatedEventer: () => {},
    /** @internal */
    verticalViewLayoutInvalidatedEventer: () => {},

    loadAllSettings: () => {},
    loadDefaults: () => {},
    merge: (settings: Partial<GridSettings>) => true,
}
