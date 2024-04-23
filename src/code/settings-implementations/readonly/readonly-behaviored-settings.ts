/* eslint-disable @typescript-eslint/no-empty-function */

import { BehavioredSettings } from '../../grid/internal-api';

/** @public */
export const readonlyBehavioredSettings: Readonly<BehavioredSettings> = {
    resizeEventer: () => {},
    viewRenderInvalidatedEventer: () => {},
    viewLayoutInvalidatedEventer: () => {},
    horizontalViewLayoutInvalidatedEventer: () => {},
    verticalViewLayoutInvalidatedEventer: () => {},

    beginChange: () => {},
    endChange: () => false,

    subscribeChangedEvent: () => {},
    unsubscribeChangedEvent: () => {},
} as const;
