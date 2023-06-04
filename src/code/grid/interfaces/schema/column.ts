import { ColumnSettings } from '../settings/column-settings';
import { MergableColumnSettings } from '../settings/mergable-column-settings';
import { SchemaServer } from './schema-server';

/** @public */
export interface Column<MCS extends MergableColumnSettings> {
    readonly schemaColumn: SchemaServer.Column<MCS>;
    /** Always the same as SchemaColumn index */
    readonly index: number;
    readonly name: string;

    readonly width: number;

    readonly settings: MCS;

    maxPaintWidth: number | undefined;

    setWidth(width: number | undefined): boolean;
    setWidthToAutoSizing(): boolean;
    checkColumnAutosizing(widenOnly: boolean): boolean;

    mergeSettings(properties: Partial<ColumnSettings>): void;
}

/** @public */
export interface ColumnWidth<MCS extends MergableColumnSettings> {
    column: Column<MCS>;
    width: number | undefined;
}
