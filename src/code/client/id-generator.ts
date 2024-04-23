import { CssTypes } from './types-utils/css-types';

/** @internal */
export class IdGenerator {
    // stores count of Id's generated from each base id.
    private readonly _baseIds = new Map<string, number>();

    generateId(optionsId: string | undefined, hostElementId: string, firstGeneratedIdFromBaseIsAlsoNumbered: boolean  | undefined) {
        if (optionsId !== undefined) {
            const baseIdCount = this._baseIds.get(optionsId);
            if (baseIdCount === undefined) {
                this._baseIds.set(optionsId, 1);
            }
            return optionsId;
        } else {
            // create a unique Id based on host element's id
            const baseId = hostElementId;
            let baseCreateCount = this._baseIds.get(baseId);
            let suffix: string;
            if (baseCreateCount === undefined) {
                this._baseIds.set(baseId, 1);
                if (firstGeneratedIdFromBaseIsAlsoNumbered) {
                    suffix = '1';
                } else {
                    suffix = '';
                }
            } else {
                this._baseIds.set(baseId, ++baseCreateCount);
                suffix = baseCreateCount.toString(10);
            }

            let id = baseId === '' ? CssTypes.libraryName : `${baseId}-${CssTypes.libraryName}`;
            if (suffix !== '') {
                id += `-${suffix}`;
            }

            return id;
        }
    }
}
