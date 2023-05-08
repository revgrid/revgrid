import { CellProperties } from '../interfaces/cell-properties';
import { ColumnSettings } from '../interfaces/column-settings';
import { MetaModel } from '../interfaces/meta-model';

export class CellPropertiesAccessor implements CellProperties {
    constructor(
        private readonly _cellOwnProperties: MetaModel.CellOwnProperties | undefined,
        private readonly _columnProperties: ColumnSettings
    ) {

    }

    get<T extends keyof ColumnSettings>(key: T): ColumnSettings[T];
    get(key: string | number): MetaModel.CellOwnProperty;
    get<T extends keyof ColumnSettings>(key: string | number | T) {
        let result: MetaModel.CellOwnProperty | undefined;
        if (this._cellOwnProperties !== undefined) {
            result = this._cellOwnProperties[key as string | number];
        }
        if (result === undefined) {
            result = this._columnProperties[key as T];
        }
        return result;
    }
}
