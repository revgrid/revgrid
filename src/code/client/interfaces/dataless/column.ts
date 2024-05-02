import { RevSchemaField } from '../../../common/internal-api';
import { RevBehavioredColumnSettings } from '../../settings/internal-api';

/** @public */
export interface RevColumn<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    readonly field: SF;
    readonly settings: BCS;

    autoSizing: boolean;
    width: number;
    preferredWidth: number | undefined;

    setAutoWidthSizing(value: boolean): boolean;
    setWidth(width: number, ui: boolean): boolean;
    checkAutoWidthSizing(widenOnly: boolean): boolean;
    autoSizeWidth(widenOnly: boolean): boolean;

    loadSettings(settings: BCS): void;
}

/** @public */
export interface RevColumnAutoSizeableWidth<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    column: RevColumn<BCS, SF>;
    width: number | undefined;
}
