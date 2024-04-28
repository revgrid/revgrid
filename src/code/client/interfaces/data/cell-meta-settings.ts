import { RevColumnSettings } from '../settings/column-settings';
import { RevMetaModel } from './meta-model';

export interface RevCellMetaSettings {
    get<T extends keyof RevColumnSettings>(key: T): RevColumnSettings[T];
    get(key: string | number): RevMetaModel.CellOwnProperty;
}
