import { DatalessViewLayoutRow } from '../dataless/dataless-view-layout-row';
import { Subgrid } from './subgrid';

export interface ViewLayoutRow extends DatalessViewLayoutRow {
    /** The subgrid to which the row belongs. */
    subgrid: Subgrid;
}
