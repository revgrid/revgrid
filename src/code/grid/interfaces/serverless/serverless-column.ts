import { ColumnSettings } from '../settings/column-settings';
import { MergableColumnSettings } from '../settings/mergable-column-settings';

/** @public */
export interface ServerlessColumn {
    /** Always the same as SchemaColumn index */
    readonly index: number;
    readonly name: string;

    readonly settings: MergableColumnSettings;

    getWidth(): number;
    setWidth(width: number | undefined): boolean;
    setWidthToAutoSizing(): boolean;
    checkColumnAutosizing(force: boolean): boolean;

    addProperties(properties: Partial<ColumnSettings>): void;
}
