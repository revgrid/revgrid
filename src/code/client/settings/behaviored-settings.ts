// (c) 2024 Xilytix Pty Ltd / Paul Klink

/** @public */
export interface RevBehavioredSettings {
    /** @internal */
    resizeEventer: RevBehavioredSettings.ResizeEventer | undefined;
    /** @internal */
    viewRenderInvalidatedEventer: RevBehavioredSettings.ViewRenderInvalidatedEventer | undefined;
    /** @internal */
    viewLayoutInvalidatedEventer: RevBehavioredSettings.ViewLayoutInvalidatedEventer | undefined;
    /** @internal */
    horizontalViewLayoutInvalidatedEventer: RevBehavioredSettings.ViewLayoutInvalidatedEventer | undefined;
    /** @internal */
    verticalViewLayoutInvalidatedEventer: RevBehavioredSettings.ViewLayoutInvalidatedEventer | undefined;

    beginChange(): void;
    endChange(): boolean;

    subscribeChangedEvent(handler: RevBehavioredSettings.ChangedEventHandler): void;
    unsubscribeChangedEvent(handler: RevBehavioredSettings.ChangedEventHandler): void;
}

/** @public */
export namespace RevBehavioredSettings {
    export type ChangedEventHandler = (this: void) => void;

    /** @internal */
    export type ResizeEventer = (this: void) => void;
    /** @internal */
    export type ViewRenderInvalidatedEventer = (this: void) => void;
    /** @internal */
    export type ViewLayoutInvalidatedEventer = (this: void, scrollDimensionAsWell: boolean) => void;
}
