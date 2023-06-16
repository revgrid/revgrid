import { GridSettings } from './grid-settings';

/** @public */
export interface GridSettingsBehavior {
    /** @internal */
    resizeEventer: GridSettingsBehavior.ResizeEventer | undefined;
    /** @internal */
    viewRenderInvalidatedEventer: GridSettingsBehavior.ViewRenderInvalidatedEventer;
    /** @internal */
    viewLayoutInvalidatedEventer: GridSettingsBehavior.ViewLayoutInvalidatedEventer;
    /** @internal */
    horizontalViewLayoutInvalidatedEventer: GridSettingsBehavior.ViewLayoutInvalidatedEventer;
    /** @internal */
    verticalViewLayoutInvalidatedEventer: GridSettingsBehavior.ViewLayoutInvalidatedEventer;

    beginChange(): void;
    endChange(): void;
    load(settings: GridSettings): void;

    subscribeChangedEvent(handler: GridSettingsBehavior.ChangedEventHandler): void;
    unsubscribeChangedEvent(handler: GridSettingsBehavior.ChangedEventHandler): void;
}

/** @public */
export namespace GridSettingsBehavior {
    export type ChangedEventHandler = (this: void) => void;

    /** @internal */
    export type ResizeEventer = (this: void) => void;
    /** @internal */
    export type ViewRenderInvalidatedEventer = (this: void) => void;
    /** @internal */
    export type ViewLayoutInvalidatedEventer = (this: void, scrollDimensionAsWell: boolean) => void;
}
