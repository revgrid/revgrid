/* eslint-disable @typescript-eslint/no-empty-function */

import { RevBehavioredSettings } from '../../client';

/** @public */
export const revReadonlyBehavioredSettings: Readonly<RevBehavioredSettings> = {
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
