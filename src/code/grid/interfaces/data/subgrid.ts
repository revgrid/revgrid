import { DatalessSubgrid } from '../dataless/dataless-subgrid';
import { DatalessViewCell } from '../dataless/dataless-view-cell';
import { Column } from '../schema/column';
import { SchemaServer } from '../schema/schema-server';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { CellPainter } from './cell-painter';
import { DataServer } from './data-server';
import { MetaModel } from './meta-model';

/** @public */
export interface Subgrid<BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>> extends DatalessSubgrid {
    readonly schemaServer: SchemaServer<BCS, SC>;
    readonly dataServer: DataServer<BCS>;
    readonly metaModel: MetaModel | undefined;

    getRowCount(): number;
    getSingletonDataRow(rowIndex: number): DataServer.DataRow;

    getDefaultRowHeight(): number;

    getRowMetadata(rowIndex: number): MetaModel.RowMetadata | undefined;
    setRowMetadata(rowIndex: number, newMetadata: MetaModel.RowMetadata | undefined): void;

    getRowProperties(rowIndex: number): MetaModel.RowProperties | undefined;
    setRowProperties(rowIndex: number, properties: MetaModel.RowProperties | undefined): boolean;

    getRowProperty(rowIndex: number, key: string): unknown | undefined;
    getRowHeight(rowIndex: number): number;

    setRowProperty(y: number, key: string, isHeight: boolean, value: unknown): boolean;

    getValue(column: Column<BCS, SC>, rowIndex: number): DataServer.DataValue;
    setValue(column: Column<BCS, SC>, rowIndex: number, value: DataServer.DataValue): void;

    getValueFromDataRowAtColumn(dataRow: DataServer.DataRow, column: Column<BCS, SC>): DataServer.DataValue;

    getCellPainter(viewCell: DatalessViewCell<BCS, SC>): CellPainter;
}

/** @public */
export namespace Subgrid {
    export type GetCellPainterEventer<BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>> = (this: void, viewCell: DatalessViewCell<BCS, SC>) => CellPainter;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export import RoleEnum = DatalessSubgrid.RoleEnum;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export import Role = DatalessSubgrid.Role;

    export interface Definition<BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>> {
        /** defaults to main */
        role?: DatalessSubgrid.Role;
        dataServer: DataServer<BCS> | DataServer.Constructor<BCS>;
        metaModel?: MetaModel | MetaModel.Constructor;
        selectable?: boolean;
        defaultRowHeight?: number;
        rowPropertiesCanSpecifyRowHeight?: boolean;
        rowPropertiesPrototype?: MetaModel.RowPropertiesPrototype;
        getCellPainterEventer: GetCellPainterEventer<BCS, SC>;
    }
}
