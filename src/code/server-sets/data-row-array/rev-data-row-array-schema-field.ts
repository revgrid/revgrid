import { BehavioredColumnSettings, SchemaField } from '../../grid/grid-public-api';

/** @public */
export interface RevDataRowArraySchemaField<BCS extends BehavioredColumnSettings> extends SchemaField<BCS> {
    headers: string[];
}
