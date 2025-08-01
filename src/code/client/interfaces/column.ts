import { RevSchemaField } from '../../common';
import { RevBehavioredColumnSettings } from '../settings';

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
