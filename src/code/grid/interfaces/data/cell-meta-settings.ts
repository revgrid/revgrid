import { ColumnSettings } from '../settings/column-settings';
import { MetaModel } from './meta-model';

export interface CellMetaSettings {
    get<T extends keyof ColumnSettings>(key: T): ColumnSettings[T];
    get(key: string | number): MetaModel.CellOwnProperty;
}
