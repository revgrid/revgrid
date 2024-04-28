import { RevRectangle } from '../../types-utils/rectangle';
import { RevDatalessViewCell } from '../dataless/dataless-view-cell';
import { RevSchemaField } from '../schema/schema-field';
import { RevBehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { RevCellPainter } from './cell-painter';

/** @public */
export interface RevClickBoxCellPainter<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevCellPainter<BCS, SF> {
    calculateClickBox(cell: RevDatalessViewCell<BCS, SF>): RevRectangle | undefined;
}
