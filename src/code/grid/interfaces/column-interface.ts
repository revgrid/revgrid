import { ColumnSettings } from './column-settings';
import { SchemaModel } from './schema-model';

/** @public */
export interface ColumnInterface {
    readonly schemaColumn: SchemaModel.Column;
    readonly index: number; // always the same as SchemaColumn index
    readonly name: string;

    readonly settings: ColumnSettings;

    getWidth(): number;
    setWidth(width: number | undefined): boolean;
    setWidthToAutoSizing(): boolean;
    checkColumnAutosizing(force: boolean): boolean;
}
