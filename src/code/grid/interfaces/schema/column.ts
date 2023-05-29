import { ColumnSettings } from '../settings/column-settings';
import { MergableColumnSettings } from '../settings/mergable-column-settings';
import { SchemaServer } from './schema-server';

/** @public */
export interface Column {
    readonly schemaColumn: SchemaServer.Column;
    /** Always the same as SchemaColumn index */
    readonly index: number;
    readonly name: string;

    readonly settings: MergableColumnSettings;

    getWidth(): number;
    setWidth(width: number | undefined): boolean;
    setWidthToAutoSizing(): boolean;
    checkColumnAutosizing(force: boolean): boolean;

    addProperties(properties: Partial<ColumnSettings>): void;
}

/** @public */
export interface ColumnWidth {
    column: Column;
    width: number | undefined;
}
