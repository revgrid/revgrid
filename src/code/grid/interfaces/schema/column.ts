import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { ColumnSettings } from '../settings/column-settings';
import { SchemaServer } from './schema-server';

/** @public */
export interface Column<BCS extends BehavioredColumnSettings> {
    readonly schemaColumn: SchemaServer.Column<BCS>;
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
export interface ColumnWidth<BCS extends BehavioredColumnSettings> {
    column: Column<BCS>;
    width: number | undefined;
}
