import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { ColumnSettings } from '../settings/column-settings';
import { SchemaServer } from './schema-server';

/** @public */
export interface Column<BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>> {
    readonly schemaColumn: SC;
    /** Always the same as SchemaColumn index */
    readonly index: number;
    readonly name: string;

    readonly width: number;

    readonly settings: BCS;

    maxPaintWidth: number | undefined;

    setWidth(width: number | undefined): boolean;
    checkColumnAutosizing(widenOnly: boolean): boolean;

    loadSettings(settings: ColumnSettings): void;
}

/** @public */
export interface ColumnWidth<BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>> {
    column: Column<BCS, SC>;
    width: number | undefined;
}
