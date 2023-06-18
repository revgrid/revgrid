import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { ColumnSettings } from '../settings/column-settings';
import { SchemaServer } from './schema-server';

/** @public */
export interface Column<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> {
    readonly field: SF;
    readonly settings: BCS;

    autoSizing: boolean;
    width: number;
    preferredWidth: number | undefined;

    setAutoSizing(value: boolean): boolean;
    setWidth(width: number, ui: boolean): boolean;
    checkAutoSizing(widenOnly: boolean): boolean;
    autoSize(widenOnly: boolean): boolean;

    loadSettings(settings: ColumnSettings): void;
}

/** @public */
export interface ColumnAutoSizeableWidth<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> {
    column: Column<BCS, SF>;
    width: number | undefined;
}
