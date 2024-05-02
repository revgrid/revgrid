import { RevMetaServer } from '../../../common/internal-api';
import { RevColumnSettings } from '../../settings/internal-api';

export interface RevCellMetaSettings {
    get<T extends keyof RevColumnSettings>(key: T): RevColumnSettings[T];
    get(key: string | number): RevMetaServer.CellOwnProperty;
}
