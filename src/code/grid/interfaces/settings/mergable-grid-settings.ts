import { GridSettings } from './grid-settings';

export interface MergableGridSettings extends GridSettings {
    loadDefaults(): void;
    merge(properties: Partial<GridSettings>): boolean;
}
