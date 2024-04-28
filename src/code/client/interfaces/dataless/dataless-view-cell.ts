import { RevRectangle } from '../../types-utils/rectangle';
import { RevSchemaField } from '../schema/schema-field';
import { RevBehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { RevDatalessSubgrid } from './dataless-subgrid';
import { RevDatalessViewLayoutRow } from './dataless-view-layout-row';
import { RevViewLayoutColumn } from './view-layout-column';

/** @public */
export interface RevDatalessViewCell<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    readonly viewLayoutColumn: RevViewLayoutColumn<BCS, SF>;
    readonly subgrid: RevDatalessSubgrid;
    readonly viewLayoutRow: RevDatalessViewLayoutRow;

    readonly bounds: RevRectangle;
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

    paintFingerprint: RevDatalessViewCell.PaintFingerprint | undefined;

    clearCellOwnProperties(): void;
}

/** @public */
export namespace RevDatalessViewCell {
    export type PaintFingerprint = Record<string, unknown>;

    export function sameByDataPoint<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField>(left: RevDatalessViewCell<BCS, SF>, right: RevDatalessViewCell<BCS, SF>) {
        return (
            left.viewLayoutRow.subgridRowIndex === right.viewLayoutRow.subgridRowIndex &&
            left.viewLayoutColumn.column.field.index === right.viewLayoutColumn.column.field.index &&
            left.subgrid === right.subgrid
        );
    }
}
