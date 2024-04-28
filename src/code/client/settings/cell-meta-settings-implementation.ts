import { RevCellMetaSettings } from '../interfaces/data/cell-meta-settings';
import { RevMetaModel } from '../interfaces/data/meta-model';
import { RevColumnSettings } from '../interfaces/settings/column-settings';

export class CellMetaSettingsImplementation implements RevCellMetaSettings {
    constructor(
        private readonly _cellOwnProperties: RevMetaModel.CellOwnProperties | undefined,
        private readonly _columnSettings: RevColumnSettings
    ) {

    }

    get<T extends keyof RevColumnSettings>(key: T): RevColumnSettings[T];
    get(key: string | number): RevMetaModel.CellOwnProperty;
    get<T extends keyof RevColumnSettings>(key: string | number) {
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        let result: RevMetaModel.CellOwnProperty | undefined;
        if (this._cellOwnProperties !== undefined) {
            result = this._cellOwnProperties[key];
        }
        if (result === undefined) {
            result = this._columnSettings[key as T];
        }
        return result;
    }
}
