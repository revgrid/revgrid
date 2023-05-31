import { GridSettings } from './grid-settings';

/** @public */
export interface MergableGridSettings extends GridSettings {
    /** @internal */
    resizeEventer: MergableGridSettings.ResizeEventer | undefined;
    /** @internal */
    viewRenderInvalidatedEventer: MergableGridSettings.ViewRenderInvalidatedEventer;
    /** @internal */
    viewLayoutInvalidatedEventer: MergableGridSettings.ViewLayoutInvalidatedEventer;
    /** @internal */
    horizontalViewLayoutInvalidatedEventer: MergableGridSettings.ViewLayoutInvalidatedEventer;
    /** @internal */
    verticalViewLayoutInvalidatedEventer: MergableGridSettings.ViewLayoutInvalidatedEventer;

    loadDefaults(): void;
    merge(properties: Partial<GridSettings>): boolean;
}

/** @public */
export namespace MergableGridSettings {
    /** @internal */
    export type ResizeEventer = (this: void) => void;
    /** @internal */
    export type ViewRenderInvalidatedEventer = (this: void) => void;
    /** @internal */
    export type ViewLayoutInvalidatedEventer = (this: void, scrollDimensionAsWell: boolean) => void;
}
