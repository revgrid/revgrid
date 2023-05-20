import { ViewCell } from '../../grid/grid-public-api';
import { RevRecordCellPaintConfig } from './rev-record-cell-paint-config';
import { RevRecordMainAdapter } from './rev-record-main-adapter';
import { RevRecordRecentChangeTypeId, RevRecordValueRecentChangeTypeId } from './rev-record-types';

export class RevRecordCellPaintConfigAccessor implements RevRecordCellPaintConfig {
    readonly valueRecentChangeTypeId?: RevRecordValueRecentChangeTypeId;
    readonly recordRecentChangeTypeId?: RevRecordRecentChangeTypeId;

    constructor(cell: ViewCell, mainAdapter: RevRecordMainAdapter) {
        let rowIndex = cell.viewLayoutRow.subgridRowIndex;

        if (mainAdapter.rowOrderReversed) {
            const rowCount = mainAdapter.getRowCount();
            rowIndex = rowCount - rowIndex - 1;
        }
        const recentChanges = mainAdapter.recentChanges;
        const fieldIndex = cell.viewLayoutColumn.column.index;
        this.valueRecentChangeTypeId = recentChanges.getValueRecentChangeTypeId(fieldIndex, rowIndex);
        this.recordRecentChangeTypeId = recentChanges.getRecordRecentChangeTypeId(rowIndex);
    }
}
