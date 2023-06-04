import { GridSettings } from './grid-settings';

/** @public */
export interface GridSettingsMerge {
    /** @internal */
    resizeEventer: GridSettingsMerge.ResizeEventer | undefined;
    /** @internal */
    viewRenderInvalidatedEventer: GridSettingsMerge.ViewRenderInvalidatedEventer;
    /** @internal */
    viewLayoutInvalidatedEventer: GridSettingsMerge.ViewLayoutInvalidatedEventer;
    /** @internal */
    horizontalViewLayoutInvalidatedEventer: GridSettingsMerge.ViewLayoutInvalidatedEventer;
    /** @internal */
    verticalViewLayoutInvalidatedEventer: GridSettingsMerge.ViewLayoutInvalidatedEventer;

    loadAllSettings(newSettings: GridSettings): void;
    loadDefaults(): void;
    merge(settings: Partial<GridSettings>): boolean;
}

/** @public */
export namespace GridSettingsMerge {
    /** @internal */
    export type ResizeEventer = (this: void) => void;
    /** @internal */
    export type ViewRenderInvalidatedEventer = (this: void) => void;
    /** @internal */
    export type ViewLayoutInvalidatedEventer = (this: void, scrollDimensionAsWell: boolean) => void;
}
