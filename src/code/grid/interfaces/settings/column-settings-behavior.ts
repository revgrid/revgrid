import { ColumnSettings } from './column-settings';

/** @public */
export interface ColumnSettingsBehavior {
    /** @internal */
    viewRenderInvalidatedEventer: ColumnSettingsBehavior.ViewRenderInvalidatedEventer;

    load(properties: ColumnSettings): void;
}

/** @public */
export namespace ColumnSettingsBehavior {
    /** @internal */
    export type ViewRenderInvalidatedEventer = (this: void) => void;
}
