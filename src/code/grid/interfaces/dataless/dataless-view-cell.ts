import { Rectangle } from '../../types-utils/rectangle';
import { SchemaField } from '../schema/schema-field';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { DatalessSubgrid } from './dataless-subgrid';
import { DatalessViewLayoutRow } from './dataless-view-layout-row';
import { ViewLayoutColumn } from './view-layout-column';

/** @public */
export interface DatalessViewCell<BCS extends BehavioredColumnSettings, SF extends SchemaField> {
    readonly viewLayoutColumn: ViewLayoutColumn<BCS, SF>;
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

    export function sameByDataPoint<BCS extends BehavioredColumnSettings, SF extends SchemaField>(left: DatalessViewCell<BCS, SF>, right: DatalessViewCell<BCS, SF>) {
        return (
            left.viewLayoutRow.subgridRowIndex === right.viewLayoutRow.subgridRowIndex &&
            left.viewLayoutColumn.column.field.index === right.viewLayoutColumn.column.field.index &&
            left.subgrid === right.subgrid
        );
    }
}
