import { DatalessViewCell } from '../dataless/dataless-view-cell';
import { SchemaField } from '../schema/schema-field';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';

export interface CellPossiblyPaintable<BCS extends BehavioredColumnSettings, SF extends SchemaField> {
    paint?(cell: DatalessViewCell<BCS, SF>, prefillColor: string | undefined): number | undefined;
}
