import { ColumnSettings } from './column-settings';
import { SchemaModel } from './schema-model';

/** @public */
export interface ColumnInterface {
    readonly schemaColumn: SchemaModel.Column;
    /** Always the same as SchemaColumn index */
    readonly index: number;
    readonly name: string;

    readonly settings: ColumnSettings;

    getWidth(): number;
    setWidth(width: number | undefined): boolean;
    setWidthToAutoSizing(): boolean;
    checkColumnAutosizing(force: boolean): boolean;
}
