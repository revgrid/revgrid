import { CellMetaSettings } from '../interfaces/data/cell-meta-settings';
import { MetaModel } from '../interfaces/data/meta-model';
import { ColumnSettings } from '../interfaces/settings/column-settings';

export class CellMetaSettingsImplementation implements CellMetaSettings {
    constructor(
        private readonly _cellOwnProperties: MetaModel.CellOwnProperties | undefined,
        private readonly _columnSettings: ColumnSettings
    ) {

    }

    get<T extends keyof ColumnSettings>(key: T): ColumnSettings[T];
    get(key: string | number): MetaModel.CellOwnProperty;
    get<T extends keyof ColumnSettings>(key: string | number) {
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        let result: MetaModel.CellOwnProperty | undefined;
        if (this._cellOwnProperties !== undefined) {
            result = this._cellOwnProperties[key];
        }
        if (result === undefined) {
            result = this._columnSettings[key as T];
        }
        return result;
    }
}
