import { DatalessSubgrid } from '../dataless/dataless-subgrid';
import { DatalessViewCell } from '../dataless/dataless-view-cell';
import { Column } from '../schema/column';
import { SchemaServer } from '../schema/schema-server';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { CellPainter } from './cell-painter';
import { DataServer } from './data-server';
import { MetaModel } from './meta-model';

/** @public */
export interface Subgrid<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> extends DatalessSubgrid {
    readonly schemaServer: SchemaServer<BCS, SF>;
    readonly dataServer: DataServer<SF>;
    readonly metaModel: MetaModel | undefined;

    getRowCount(): number;
    getSingletonViewDataRow(rowIndex: number): DataServer.ViewRow;

    getDefaultRowHeight(): number;

    getRowMetadata(rowIndex: number): MetaModel.RowMetadata | undefined;
    setRowMetadata(rowIndex: number, newMetadata: MetaModel.RowMetadata | undefined): void;

    getRowProperties(rowIndex: number): MetaModel.RowProperties | undefined;
    setRowProperties(rowIndex: number, properties: MetaModel.RowProperties | undefined): boolean;

    getRowProperty(rowIndex: number, key: string): unknown | undefined;
    getRowHeight(rowIndex: number): number;

    setRowProperty(y: number, key: string, isHeight: boolean, value: unknown): boolean;

    getViewValue(column: Column<BCS, SF>, rowIndex: number): DataServer.ViewValue;

    getViewValueFromDataRowAtColumn(dataRow: DataServer.ViewRow, column: Column<BCS, SF>): DataServer.ViewValue;

    getCellPainter(viewCell: DatalessViewCell<BCS, SF>): CellPainter<BCS, SF>;
}

/** @public */
export namespace Subgrid {
    export type GetCellPainterEventer<
        BCS extends BehavioredColumnSettings,
        SF extends SchemaServer.Field
    > = (this: void, viewCell: DatalessViewCell<BCS, SF>) => CellPainter<BCS, SF>;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export import RoleEnum = DatalessSubgrid.RoleEnum;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export import Role = DatalessSubgrid.Role;

    export interface Definition<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> {
        /** defaults to main */
        role?: DatalessSubgrid.Role;
        dataServer: DataServer<SF> | DataServer.Constructor<SF>;
        metaModel?: MetaModel | MetaModel.Constructor;
        selectable?: boolean;
        defaultRowHeight?: number;
        rowPropertiesCanSpecifyRowHeight?: boolean;
        rowPropertiesPrototype?: MetaModel.RowPropertiesPrototype;
        getCellPainterEventer: GetCellPainterEventer<BCS, SF>;
    }
}
