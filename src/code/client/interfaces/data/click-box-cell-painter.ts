import { Rectangle } from '../../types-utils/rectangle';
import { DatalessViewCell } from '../dataless/dataless-view-cell';
import { SchemaField } from '../schema/schema-field';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { CellPainter } from './cell-painter';

/** @public */
export interface ClickBoxCellPainter<BCS extends BehavioredColumnSettings, SF extends SchemaField> extends CellPainter<BCS, SF> {
    calculateClickBox(cell: DatalessViewCell<BCS, SF>): Rectangle | undefined;
}
