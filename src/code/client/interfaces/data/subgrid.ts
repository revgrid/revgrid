import { RevColumn } from '../dataless/column';
import { RevDatalessSubgrid } from '../dataless/dataless-subgrid';
import { RevDatalessViewCell } from '../dataless/dataless-view-cell';
import { RevSchemaField } from '../schema/schema-field';
import { RevSchemaServer } from '../schema/schema-server';
import { RevBehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { RevCellPainter } from './cell-painter';
import { RevDataServer } from './data-server';
import { RevMetaModel } from './meta-model';

/** @public */
export interface RevSubgrid<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevDatalessSubgrid {
    readonly schemaServer: RevSchemaServer<SF>;
    readonly dataServer: RevDataServer<SF>;
    readonly metaModel: RevMetaModel | undefined;

    /** Only valid if {@link RevSubgrid:interface.viewRowCount} > 0 */
    readonly firstViewRowIndex: number;
    /** Only valid if {@link RevSubgrid:interface.viewRowCount} > 0 */
    readonly firstViewableSubgridRowIndex: number;
    /** Number of Subgrid rows visible in viewport */
    readonly viewRowCount: number;

    getRowCount(): number;
    getSingletonViewDataRow(rowIndex: number): RevDataServer.ViewRow;

    getDefaultRowHeight(): number;

    getRowMetadata(rowIndex: number): RevMetaModel.RowMetadata | undefined;
    setRowMetadata(rowIndex: number, newMetadata: RevMetaModel.RowMetadata | undefined): void;

    getRowProperties(rowIndex: number): RevMetaModel.RowProperties | undefined;
    setRowProperties(rowIndex: number, properties: RevMetaModel.RowProperties | undefined): boolean;

    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    getRowProperty(rowIndex: number, key: string): unknown | undefined;
    getRowHeight(rowIndex: number): number;

    setRowProperty(y: number, key: string, isHeight: boolean, value: unknown): boolean;

    getViewValue(column: RevColumn<BCS, SF>, rowIndex: number): RevDataServer.ViewValue;

    getViewValueFromDataRowAtColumn(dataRow: RevDataServer.ViewRow, column: RevColumn<BCS, SF>): RevDataServer.ViewValue;

    getCellPainterEventer(viewCell: RevDatalessViewCell<BCS, SF>): RevCellPainter<BCS, SF>;
}

/** @public */
export namespace RevSubgrid {
    export type GetCellPainterEventer<
        BCS extends RevBehavioredColumnSettings,
        SF extends RevSchemaField
    > = (this: void, viewCell: RevDatalessViewCell<BCS, SF>) => RevCellPainter<BCS, SF>;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export import Role = RevDatalessSubgrid.Role;

    export interface Definition<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
        /** defaults to main */
        role?: RevDatalessSubgrid.Role;
        dataServer: RevDataServer<SF> | RevDataServer.Constructor<SF>;
        metaModel?: RevMetaModel | RevMetaModel.Constructor;
        selectable?: boolean;
        defaultRowHeight?: number;
        rowPropertiesCanSpecifyRowHeight?: boolean;
        rowPropertiesPrototype?: RevMetaModel.RowPropertiesPrototype;
        getCellPainterEventer: GetCellPainterEventer<BCS, SF>;
    }
}
