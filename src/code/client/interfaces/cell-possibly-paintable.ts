import { RevSchemaField } from '../../common';
import { RevBehavioredColumnSettings } from '../settings';
// eslint-disable-next-line import-x/no-cycle
import { RevViewCell } from './view-cell';

/** @public */
export interface RevCellPossiblyPaintable<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    paint?(cell: RevViewCell<BCS, SF>, prefillColor: string | undefined): number | undefined;
}
