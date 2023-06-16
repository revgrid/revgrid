/* eslint-disable @typescript-eslint/no-empty-function */

import { GridSettingsBehavior } from '../../grid/grid-public-api';

/** @public */
export const readonlyGridSettingsBehavior: GridSettingsBehavior = {
    resizeEventer: () => {},
    viewRenderInvalidatedEventer: () => {},
    viewLayoutInvalidatedEventer: () => {},
    horizontalViewLayoutInvalidatedEventer: () => {},
    verticalViewLayoutInvalidatedEventer: () => {},

    beginChange: () => {},
    endChange: () => {},
    load: () => {},

    subscribeChangedEvent: () => {},
    unsubscribeChangedEvent: () => {},
}
