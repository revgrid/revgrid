import { Rectangle } from '../../types-utils/rectangle';
import { ColumnSettings } from '../settings/column-settings';
import { ServerlessSubgrid } from './serverless-subgrid';
import { ServerlessViewLayoutColumn } from './serverless-view-layout-column';
import { ServerlessViewLayoutRow } from './serverless-view-layout-row';

export interface ServerlessViewCell {
    readonly subgrid: ServerlessSubgrid;
    readonly viewLayoutColumn: ServerlessViewLayoutColumn;
    readonly viewLayoutRow: ServerlessViewLayoutRow;

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
}
