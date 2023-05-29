import { Rectangle } from '../../types-utils/rectangle';
import { ViewLayoutColumn } from '../schema/view-layout-column';
import { ColumnSettings } from '../settings/column-settings';
import { DatalessSubgrid } from './dataless-subgrid';
import { DatalessViewLayoutRow } from './dataless-view-layout-row';

/** @public */
export interface DatalessViewCell {
    readonly viewLayoutColumn: ViewLayoutColumn;
    readonly subgrid: DatalessSubgrid;
    readonly viewLayoutRow: DatalessViewLayoutRow;

    readonly bounds: Rectangle;
    readonly columnSettings: ColumnSettings;

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
}

/** @public */
export namespace DatalessViewCell {
    export type PaintFingerprint = Record<string, unknown>;

    export function sameByDataPoint(left: DatalessViewCell, right: DatalessViewCell) {
        return (
            left.viewLayoutRow.subgridRowIndex === right.viewLayoutRow.subgridRowIndex &&
            left.viewLayoutColumn.column.index === right.viewLayoutColumn.column.index &&
            left.subgrid === right.subgrid
        );
    }
}
