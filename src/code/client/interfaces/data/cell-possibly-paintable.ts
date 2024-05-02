import { RevSchemaField } from '../../../common/internal-api';
import { RevBehavioredColumnSettings } from '../../settings/internal-api';
import { RevDatalessViewCell } from '../dataless/dataless-view-cell';

export interface RevCellPossiblyPaintable<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    paint?(cell: RevDatalessViewCell<BCS, SF>, prefillColor: string | undefined): number | undefined;
}
