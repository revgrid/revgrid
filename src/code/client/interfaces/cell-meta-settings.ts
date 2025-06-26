import { RevMetaServer } from '../../common';
import { RevColumnSettings } from '../settings';

/** @public */
export interface RevCellMetaSettings {
    get<T extends keyof RevColumnSettings>(key: T): RevColumnSettings[T];
    get(key: string | number): RevMetaServer.CellOwnProperty;
}
