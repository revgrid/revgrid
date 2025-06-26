import { RevRectangle, RevSchemaField } from '../../common';
import { RevBehavioredColumnSettings } from '../settings';
import { RevCellPainter } from './cell-painter';
import { RevViewCell } from './view-cell';

/** @public */
export interface RevClickBoxCellPainter<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevCellPainter<BCS, SF> {
    calculateClickBox(cell: RevViewCell<BCS, SF>): RevRectangle | undefined;
}
