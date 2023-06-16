import { DatalessViewCell } from '../dataless/dataless-view-cell';
import { SchemaServer } from '../schema/schema-server';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';

export interface CellPossiblyPaintable<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> {
    paint?(cell: DatalessViewCell<BCS, SF>, prefillColor: string | undefined): number | undefined;
}
