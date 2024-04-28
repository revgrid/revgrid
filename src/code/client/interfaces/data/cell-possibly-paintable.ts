import { RevDatalessViewCell } from '../dataless/dataless-view-cell';
import { RevSchemaField } from '../schema/schema-field';
import { RevBehavioredColumnSettings } from '../settings/behaviored-column-settings';

export interface RevCellPossiblyPaintable<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    paint?(cell: RevDatalessViewCell<BCS, SF>, prefillColor: string | undefined): number | undefined;
}
