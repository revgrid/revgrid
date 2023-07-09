/** @public */
export interface BehavioredSettings {
    /** @internal */
    resizeEventer: BehavioredSettings.ResizeEventer | undefined;
    /** @internal */
    viewRenderInvalidatedEventer: BehavioredSettings.ViewRenderInvalidatedEventer | undefined;
    /** @internal */
    viewLayoutInvalidatedEventer: BehavioredSettings.ViewLayoutInvalidatedEventer | undefined;
    /** @internal */
    horizontalViewLayoutInvalidatedEventer: BehavioredSettings.ViewLayoutInvalidatedEventer | undefined;
    /** @internal */
    verticalViewLayoutInvalidatedEventer: BehavioredSettings.ViewLayoutInvalidatedEventer | undefined;

    beginChange(): void;
    endChange(): boolean;

    subscribeChangedEvent(handler: BehavioredSettings.ChangedEventHandler): void;
    unsubscribeChangedEvent(handler: BehavioredSettings.ChangedEventHandler): void;
}

/** @public */
export namespace BehavioredSettings {
    export type ChangedEventHandler = (this: void) => void;

    /** @internal */
    export type ResizeEventer = (this: void) => void;
    /** @internal */
    export type ViewRenderInvalidatedEventer = (this: void) => void;
    /** @internal */
    export type ViewLayoutInvalidatedEventer = (this: void, scrollDimensionAsWell: boolean) => void;
}
