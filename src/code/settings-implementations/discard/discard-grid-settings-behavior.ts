/* eslint-disable @typescript-eslint/no-empty-function */

import { GridSettingsBehavior } from '../../grid/grid-public-api';

/** @public */
export const discardGridSettingsBehavior: GridSettingsBehavior = {
    resizeEventer: () => {},
    viewRenderInvalidatedEventer: () => {},
    viewLayoutInvalidatedEventer: () => {},
    horizontalViewLayoutInvalidatedEventer: () => {},
    verticalViewLayoutInvalidatedEventer: () => {},

    beginChange: () => {},
    endChange: () => {},
    load: () => {},
}
