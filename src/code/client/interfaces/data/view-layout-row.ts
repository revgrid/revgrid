import { RevBehavioredColumnSettings } from '../../settings/internal-api';
import { RevDatalessViewLayoutRow } from '../dataless/dataless-view-layout-row';
import { RevSchemaField } from '../schema/schema-field';
import { RevSubgrid } from './subgrid';

/** @public */
export interface RevViewLayoutRow<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevDatalessViewLayoutRow {
    /** The subgrid to which the row belongs. */
    subgrid: RevSubgrid<BCS, SF>;
}
