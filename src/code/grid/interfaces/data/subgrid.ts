import { DatalessSubgrid } from '../dataless/dataless-subgrid';
import { Column } from '../schema/column';
import { SchemaServer } from '../schema/schema-server';
import { DataServer } from './data-server';
import { MetaModel } from './meta-model';

/** @public */
export interface Subgrid extends DatalessSubgrid {
    readonly schemaServer: SchemaServer;
    readonly dataServer: DataServer;
    readonly metaModel: MetaModel | undefined;

    getRowCount(): number;
    getSingletonDataRow(rowIndex: number): DataServer.DataRow;

    getRowMetadata(rowIndex: number): MetaModel.RowMetadata | undefined;
    setRowMetadata(rowIndex: number, newMetadata: MetaModel.RowMetadata | undefined): void;

    getRowProperties(rowIndex: number): MetaModel.RowProperties | undefined;
    setRowProperties(rowIndex: number, properties: MetaModel.RowProperties | undefined): boolean;

    getRowProperty(rowIndex: number, key: string): unknown | undefined;
    getRowHeight(rowIndex: number): number;

    setRowProperty(y: number, key: string, isHeight: boolean, value: unknown): boolean;

    getValue(column: Column, rowIndex: number): DataServer.DataValue;
    setValue(column: Column, rowIndex: number, value: DataServer.DataValue): void;

    getValueFromDataRowAtColumn(dataRow: DataServer.DataRow, column: Column): DataServer.DataValue;
}

/** @public */
export namespace Subgrid {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export import RoleEnum = DatalessSubgrid.RoleEnum;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export import Role = DatalessSubgrid.Role;

    export interface Definition {
        /** defaults to main */
        role?: Subgrid.Role;
        dataServer: DataServer | DataServer.Constructor;
        metaModel?: MetaModel | MetaModel.Constructor;
        selectable?: boolean;
        defaultRowHeight?: number;
        rowPropertiesCanSpecifyRowHeight?: boolean;
        rowPropertiesPrototype?: MetaModel.RowPropertiesPrototype;
    }
}
