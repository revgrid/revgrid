import { SchemaServer } from '../schema/schema-server';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { Subgrid } from './subgrid';

/** @public */
export interface MainSubgrid<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> extends Subgrid<BCS, SF> {

}
