import { DataModel } from '../model/data-model';
import { MetaModel } from '../model/meta-model';
import { SchemaModel } from '../model/schema-model';
import { ColumnInterface } from './column-interface';

export interface SubgridInterface {
    readonly role: SubgridInterface.Role;
    readonly schemaModel: SchemaModel;
    readonly dataModel: DataModel;
    readonly metaModel: MetaModel | undefined;

    readonly isMain: boolean;
    readonly isHeader: boolean;
    readonly isFilter: boolean;
    readonly isSummary: boolean;
    readonly selectable: boolean;

    getRowCount(): number;
    getSingletonDataRow(rowIndex: number): DataModel.DataRow;

    getRowMetadata(rowIndex: number): MetaModel.RowMetadata | undefined;
    setRowMetadata(rowIndex: number, newMetadata: MetaModel.RowMetadata | undefined): void;

    getValue(column: ColumnInterface, rowIndex: number): DataModel.DataValue;
    setValue(column: ColumnInterface, rowIndex: number, value: DataModel.DataValue): void;
}

export namespace SubgridInterface {
    export const enum RoleEnum {
        main = 'main',
        header = 'header',
        footer = 'footer',
        filter = 'filter',
        summary = 'summary',
    }

    export type Role = keyof typeof RoleEnum;
}
