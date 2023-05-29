import { ViewCell } from '../../grid/grid-public-api';
import { RevRecordCellPaintConfig } from './rev-record-cell-paint-config';
import { RevRecordMainDataServer } from './rev-record-main-data-server';
import { RevRecordRecentChangeTypeId, RevRecordValueRecentChangeTypeId } from './rev-record-types';

export class RevRecordCellPaintConfigAccessor implements RevRecordCellPaintConfig {
    readonly valueRecentChangeTypeId?: RevRecordValueRecentChangeTypeId;
    readonly recordRecentChangeTypeId?: RevRecordRecentChangeTypeId;

    constructor(cell: ViewCell, mainAdapter: RevRecordMainDataServer) {
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
