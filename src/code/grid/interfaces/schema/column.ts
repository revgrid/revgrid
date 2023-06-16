import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { ColumnSettings } from '../settings/column-settings';
import { SchemaServer } from './schema-server';

/** @public */
export interface Column<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> {
    readonly field: SF;

    readonly width: number;

    readonly settings: BCS;

    preferredWidth: number | undefined;

    setWidth(width: number | undefined): boolean;
    checkColumnAutosizing(widenOnly: boolean): boolean;

    loadSettings(settings: ColumnSettings): void;
}

/** @public */
export interface ColumnWidth<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> {
    column: Column<BCS, SF>;
    width: number | undefined;
}
