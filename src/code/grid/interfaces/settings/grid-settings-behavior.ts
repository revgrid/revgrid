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

    load(settings: GridSettings): void;
}

/** @public */
export namespace GridSettingsBehavior {
    /** @internal */
    export type ResizeEventer = (this: void) => void;
    /** @internal */
    export type ViewRenderInvalidatedEventer = (this: void) => void;
    /** @internal */
    export type ViewLayoutInvalidatedEventer = (this: void, scrollDimensionAsWell: boolean) => void;
}
