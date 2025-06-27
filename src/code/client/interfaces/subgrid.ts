import { RevDataServer, RevMetaServer, RevSchemaField, RevSchemaServer } from '../../common';
import { RevBehavioredColumnSettings } from '../settings';
// eslint-disable-next-line import-x/no-cycle
import { RevCellPainter } from './cell-painter';
import { RevColumn } from './column';
import { RevViewCell } from './view-cell';

/** @public */
export interface RevSubgrid<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    readonly schemaServer: RevSchemaServer<SF>;
    readonly dataServer: RevDataServer<SF>;
    readonly metaServer: RevMetaServer | undefined;

    /** Only valid if {@link viewRowCount} \> 0 */
    readonly firstViewRowIndex: number;
    /** Only valid if {@link viewRowCount} \> 0 */
    readonly firstViewableSubgridRowIndex: number;
    /** Number of Subgrid rows visible in viewport */
    readonly viewRowCount: number;

    readonly role: RevSubgrid.Role;

    readonly isMain: boolean;
    readonly isHeader: boolean;
    readonly isFilter: boolean;
    readonly isSummary: boolean;
    readonly isFooter: boolean;

    readonly selectable: boolean;

    readonly rowHeightsCanDiffer: boolean;
    readonly fixedRowCount: number;

    getCellPainterEventer: RevSubgrid.GetCellPainterEventer<BCS, SF>;

    isRowFixed(rowIndex: number): boolean;

    getRowCount(): number;
    getSingletonViewDataRow(rowIndex: number): RevDataServer.ViewRow;

    getDefaultRowHeight(): number;

    getRowMetadata(rowIndex: number): RevMetaServer.RowMetadata | undefined;
    setRowMetadata(rowIndex: number, newMetadata: RevMetaServer.RowMetadata | undefined): void;

    getRowProperties(rowIndex: number): RevMetaServer.RowProperties | undefined;
    setRowProperties(rowIndex: number, properties: RevMetaServer.RowProperties | undefined): boolean;

    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    getRowProperty(rowIndex: number, key: string): unknown | undefined;
    getRowHeight(rowIndex: number): number;

    setRowProperty(y: number, key: string, isHeight: boolean, value: unknown): boolean;

    getViewValue(column: RevColumn<BCS, SF>, rowIndex: number): RevDataServer.ViewValue;

    getViewValueFromDataRowAtColumn(dataRow: RevDataServer.ViewRow, column: RevColumn<BCS, SF>): RevDataServer.ViewValue;
}

/** @public */
export namespace RevSubgrid {
    export type GetCellPainterEventer<
        BCS extends RevBehavioredColumnSettings,
        SF extends RevSchemaField
    > = (this: void, viewCell: RevViewCell<BCS, SF>) => RevCellPainter<BCS, SF>;

    export interface Definition<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
        /** defaults to main */
        role?: RevSubgrid.Role;
        dataServer: RevDataServer<SF> | RevDataServer.Constructor<SF>;
        metaServer?: RevMetaServer | RevMetaServer.Constructor;
        selectable?: boolean;
        defaultRowHeight?: number;
        rowPropertiesCanSpecifyRowHeight?: boolean;
        rowPropertiesPrototype?: RevMetaServer.RowPropertiesPrototype;
        getCellPainterEventer: GetCellPainterEventer<BCS, SF>;
    }

    export type Role =
        typeof Role.header |
        typeof Role.filter |
        typeof Role.main |
        typeof Role.summary |
        typeof Role.footer;

    export namespace Role {
        export const header = 'header';
        export const filter = 'filter';
        export const main = 'main';
        export const summary = 'summary';
        export const footer = 'footer';

        export const defaultRole = main;

        const gridOrder: Role[] = [
            header,
            filter,
            main,
            summary,
            footer,
        ];

        export function gridOrderCompare(left: Role | undefined, right: Role | undefined) {
            return gridOrder.indexOf(left ?? defaultRole) - gridOrder.indexOf(right ?? defaultRole);
        }
    }
}
