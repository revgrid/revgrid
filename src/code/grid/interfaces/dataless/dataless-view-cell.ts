import { Rectangle } from '../../types-utils/rectangle';
import { SchemaServer } from '../schema/schema-server';
import { ViewLayoutColumn } from '../schema/view-layout-column';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { DatalessSubgrid } from './dataless-subgrid';
import { DatalessViewLayoutRow } from './dataless-view-layout-row';

/** @public */
export interface DatalessViewCell<BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>> {
    readonly viewLayoutColumn: ViewLayoutColumn<BCS, SC>;
    readonly subgrid: DatalessSubgrid;
    readonly viewLayoutRow: DatalessViewLayoutRow;

    readonly bounds: Rectangle;
    readonly columnSettings: BCS;

    readonly isRowVisible: boolean;
    readonly isColumnVisible: boolean;
    readonly isCellVisible: boolean;
    readonly isMainRow: boolean;
    readonly isMain: boolean;
    readonly isHeader: boolean;
    readonly isRowFixed: boolean;
    readonly isColumnFixed: boolean;
    readonly isFixed: boolean;
    readonly isHeaderOrRowFixed: boolean;
    readonly isScrollable: boolean;
    readonly isFilter: boolean;
    readonly isSummary: boolean;

    paintFingerprint: DatalessViewCell.PaintFingerprint | undefined;

    clearCellOwnProperties(): void;
}

/** @public */
export namespace DatalessViewCell {
    export type PaintFingerprint = Record<string, unknown>;

    export function sameByDataPoint<BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>>(left: DatalessViewCell<BCS, SC>, right: DatalessViewCell<BCS, SC>) {
        return (
            left.viewLayoutRow.subgridRowIndex === right.viewLayoutRow.subgridRowIndex &&
            left.viewLayoutColumn.column.index === right.viewLayoutColumn.column.index &&
            left.subgrid === right.subgrid
        );
    }
}
