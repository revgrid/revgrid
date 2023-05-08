import { Revgrid, ViewCell } from '../../grid/grid-public-api';
import { SimpleCellPaintConfigAccessor } from '../../standard-cell-paint/standard-cell-paint-public-api';
import { RevRecordCellPaintConfig } from './rev-record-cell-paint-config';
import { RevRecordMainAdapter } from './rev-record-main-adapter';
import { RevRecordRecentChangeTypeId, RevRecordValueRecentChangeTypeId } from './rev-record-types';

export class RevRecordCellPaintConfigAccessor extends SimpleCellPaintConfigAccessor implements RevRecordCellPaintConfig {
    readonly valueRecentChangeTypeId?: RevRecordValueRecentChangeTypeId;
    readonly recordRecentChangeTypeId?: RevRecordRecentChangeTypeId;

    constructor(grid: Revgrid, beingPaintedCell: ViewCell, mainAdapter: RevRecordMainAdapter) {
        super(grid, beingPaintedCell, false, false)

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
