import { ColumnProperties } from '../column/column-properties';
import { SchemaModel } from '../model/schema-model';

/** @internal */
export interface ColumnInterface {
    readonly schemaColumn: SchemaModel.Column;
    readonly index: number; // always the same as SchemaColumn index
    readonly name: string;

    readonly properties: ColumnProperties;

    getWidth(): number;
    setWidth(width: number | undefined): boolean;
    checkColumnAutosizing(force: boolean): boolean;
}

/** @internal */
export namespace ColumnInterface {

}
