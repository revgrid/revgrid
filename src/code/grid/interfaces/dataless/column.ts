import { SchemaField } from '../schema/schema-field';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';

/** @public */
export interface Column<BCS extends BehavioredColumnSettings, SF extends SchemaField> {
    readonly field: SF;
    readonly settings: BCS;

    autoSizing: boolean;
    width: number;
    preferredWidth: number | undefined;

    setAutoWidthSizing(value: boolean): boolean;
    setWidth(width: number, ui: boolean): boolean;
    checkAutoWidthSizing(widenOnly: boolean): boolean;
    autoSizeWidth(widenOnly: boolean): boolean;

    loadSettings(settings: BCS): void;
}

/** @public */
export interface ColumnAutoSizeableWidth<BCS extends BehavioredColumnSettings, SF extends SchemaField> {
    column: Column<BCS, SF>;
    width: number | undefined;
}
