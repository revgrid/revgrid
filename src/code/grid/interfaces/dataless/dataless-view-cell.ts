import { Rectangle } from '../../types-utils/rectangle';
import { ViewLayoutColumn } from '../schema/view-layout-column';
import { MergableColumnSettings } from '../settings/mergable-column-settings';
import { DatalessSubgrid } from './dataless-subgrid';
import { DatalessViewLayoutRow } from './dataless-view-layout-row';

/** @public */
export interface DatalessViewCell<MCS extends MergableColumnSettings> {
    readonly viewLayoutColumn: ViewLayoutColumn<MCS>;
    readonly subgrid: DatalessSubgrid;
    readonly viewLayoutRow: DatalessViewLayoutRow;

    readonly bounds: Rectangle;
    readonly columnSettings: MCS;

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

    export function sameByDataPoint<MCS extends MergableColumnSettings>(left: DatalessViewCell<MCS>, right: DatalessViewCell<MCS>) {
        return (
            left.viewLayoutRow.subgridRowIndex === right.viewLayoutRow.subgridRowIndex &&
            left.viewLayoutColumn.column.index === right.viewLayoutColumn.column.index &&
            left.subgrid === right.subgrid
        );
    }
}
