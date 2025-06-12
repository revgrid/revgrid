import { RevDataServer, RevRectangle, RevSchemaField } from '../../common/internal-api';
import { RevBehavioredColumnSettings } from '../settings/internal-api';
// eslint-disable-next-line import-x/no-cycle
import { RevSubgrid } from './subgrid';
import { RevViewLayoutColumn } from './view-layout-column';
import { RevViewLayoutRow } from './view-layout-row';

/** @public */
export interface RevViewCell<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {

    readonly viewValue: RevDataServer.ViewValue;

    readonly viewLayoutColumn: RevViewLayoutColumn<BCS, SF>;
    readonly subgrid: RevSubgrid<BCS, SF>;
    readonly viewLayoutRow: RevViewLayoutRow<BCS, SF>;

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

    paintFingerprint: RevViewCell.PaintFingerprint | undefined;

    clearCellOwnProperties(): void;
}

/** @public */
export namespace RevViewCell {
    export type PaintFingerprint = Record<string, unknown>;

    export function sameByDataPoint<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField>(left: RevViewCell<BCS, SF>, right: RevViewCell<BCS, SF>) {
        return (
            left.viewLayoutRow.subgridRowIndex === right.viewLayoutRow.subgridRowIndex &&
            left.viewLayoutColumn.column.field.index === right.viewLayoutColumn.column.field.index &&
            left.subgrid === right.subgrid
        );
    }
}
