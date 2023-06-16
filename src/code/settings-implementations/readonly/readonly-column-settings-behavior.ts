/* eslint-disable @typescript-eslint/no-empty-function */
import { ColumnSettingsBehavior } from '../../grid/grid-public-api';

/** @public */
export const readonlyColumnSettingsBehavior: ColumnSettingsBehavior = {
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
