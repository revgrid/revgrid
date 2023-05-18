import { ViewCell } from '../../grid/grid-public-api';
import { RevRecordCellPaintConfig } from './rev-record-cell-paint-config';
import { RevRecordMainAdapter } from './rev-record-main-adapter';
import { RevRecordRecentChangeTypeId, RevRecordValueRecentChangeTypeId } from './rev-record-types';

export class RevRecordCellPaintConfigAccessor implements RevRecordCellPaintConfig {
    readonly valueRecentChangeTypeId?: RevRecordValueRecentChangeTypeId;
    readonly recordRecentChangeTypeId?: RevRecordRecentChangeTypeId;

    constructor(beingPaintedCell: ViewCell, mainAdapter: RevRecordMainAdapter) {
        let rowIndex = beingPaintedCell.dataPoint.y;

        if (mainAdapter.rowOrderReversed) {
            const rowCount = mainAdapter.getRowCount();
            rowIndex = rowCount - rowIndex - 1;
        }
        const recentChanges = mainAdapter.recentChanges;
        const fieldIndex = beingPaintedCell.dataPoint.x;
        this.valueRecentChangeTypeId = recentChanges.getValueRecentChangeTypeId(fieldIndex, rowIndex);
        this.recordRecentChangeTypeId = recentChanges.getRecordRecentChangeTypeId(rowIndex);
    }
}
