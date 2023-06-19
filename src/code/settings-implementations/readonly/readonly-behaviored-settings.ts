/* eslint-disable @typescript-eslint/no-empty-function */

import { BehavioredSettings } from '../../grid/grid-public-api';

/** @public */
export const readonlyBehavioredSettings: BehavioredSettings = {
    resizeEventer: () => {},
    viewRenderInvalidatedEventer: () => {},
    viewLayoutInvalidatedEventer: () => {},
    horizontalViewLayoutInvalidatedEventer: () => {},
    verticalViewLayoutInvalidatedEventer: () => {},

    beginChange: () => {},
    endChange: () => {},

    subscribeChangedEvent: () => {},
    unsubscribeChangedEvent: () => {},
}
