import { CellPainter } from '../dataless/cell-painter';
import { DatalessSubgrid } from '../dataless/dataless-subgrid';
import { DatalessViewCell } from '../dataless/dataless-view-cell';
import { Column } from '../schema/column';
import { SchemaServer } from '../schema/schema-server';
import { MergableColumnSettings } from '../settings/mergable-column-settings';
import { DataServer } from './data-server';
import { MetaModel } from './meta-model';

/** @public */
export interface Subgrid<MCS extends MergableColumnSettings> extends DatalessSubgrid {
    readonly schemaServer: SchemaServer<MCS>;
    readonly dataServer: DataServer<MCS>;
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

    getValue(column: Column<MCS>, rowIndex: number): DataServer.DataValue;
    setValue(column: Column<MCS>, rowIndex: number, value: DataServer.DataValue): void;

    getValueFromDataRowAtColumn(dataRow: DataServer.DataRow, column: Column<MCS>): DataServer.DataValue;

    getCellPainter(viewCell: DatalessViewCell<MCS>): CellPainter;
}

/** @public */
export namespace Subgrid {
    export type GetCellPainterEventer<MCS extends MergableColumnSettings> = (this: void, viewCell: DatalessViewCell<MCS>) => CellPainter;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export import RoleEnum = DatalessSubgrid.RoleEnum;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export import Role = DatalessSubgrid.Role;

    export interface Definition<MCS extends MergableColumnSettings> {
        /** defaults to main */
        role?: Subgrid.Role;
        dataServer: DataServer<MCS> | DataServer.Constructor<MCS>;
        metaModel?: MetaModel | MetaModel.Constructor;
        selectable?: boolean;
        defaultRowHeight?: number;
        rowPropertiesCanSpecifyRowHeight?: boolean;
        rowPropertiesPrototype?: MetaModel.RowPropertiesPrototype;
        getCellPainterEventer: GetCellPainterEventer<MCS>;
    }
}
