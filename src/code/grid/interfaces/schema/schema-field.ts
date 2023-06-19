import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';

/** @public */
export interface SchemaField<BCS extends BehavioredColumnSettings> {
    name: string;
    index: number;
    readonly columnSettings: BCS;
}
