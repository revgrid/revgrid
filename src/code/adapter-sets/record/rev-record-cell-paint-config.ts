import { SimpleCellPaintConfig } from '../../standard-cell-paint/standard-cell-paint-public-api';
import { RevRecordRecentChangeTypeId, RevRecordValueRecentChangeTypeId } from './rev-record-types';

/** @public */
export interface RevRecordCellPaintConfig extends SimpleCellPaintConfig {
    // /** Has color if internal border to be drawn  */
    // readonly internalBorder: string | undefined;
    /** Flags if cell has recently been changed and the change type */
    readonly valueRecentChangeTypeId?: RevRecordValueRecentChangeTypeId;
    /** Flags if row that cell has recently been changed and the change type */
    readonly recordRecentChangeTypeId?: RevRecordRecentChangeTypeId;
}
