import { DatalessViewCell } from '../dataless/dataless-view-cell';
import { SchemaServer } from '../schema/schema-server';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';

export interface CellPossiblyPaintable<BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>> {
    paint?(cell: DatalessViewCell<BCS, SC>, prefillColor: string | undefined): number | undefined;
}
