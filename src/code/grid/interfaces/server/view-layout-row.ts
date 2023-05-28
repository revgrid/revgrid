import { ServerlessViewLayoutRow } from '../serverless/serverless-view-layout-row';
import { Subgrid } from './subgrid';

export interface ViewLayoutRow extends ServerlessViewLayoutRow {
    /** The subgrid to which the row belongs. */
    subgrid: Subgrid;
}
