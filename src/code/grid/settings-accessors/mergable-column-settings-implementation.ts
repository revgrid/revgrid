import { ColumnSettings } from '../interfaces/settings/column-settings';
import { MergableColumnSettings } from '../interfaces/settings/mergable-column-settings';
import { deepExtendValue } from '../types-utils/utils';
import { ColumnSettingsAccessor } from './column-settings-accessor';

export class MergableColumnSettingsAccessor extends ColumnSettingsAccessor implements MergableColumnSettings {
    merge(properties: Partial<ColumnSettings>) {
        Object.keys(properties).forEach((key) => {
            const typedValue = properties[key as keyof ColumnSettings];
            const value = deepExtendValue({}, typedValue);
            (this[key as keyof ColumnSettingsAccessor] as unknown) = value;
        });
    }
}
