import { RevCssTypes } from '../common';
import { RevCanvas } from './components';

/** @internal */
export class RevIdGenerator {
    // stores count of Id's generated from each base id.
    private readonly _baseIds = new Set<string>();

    generateId(optionsId: string | undefined, canvasElementId: string, firstGeneratedIdFromBaseIsAlsoNumbered: boolean  | undefined) {
        let baseId: string;
        if (optionsId !== undefined && optionsId !== '') {
            baseId = optionsId;
        } else {
            if (canvasElementId !== '') {
                if (canvasElementId.includes(`-${RevCanvas.canvasCssSuffix}-`)) {
                    baseId = canvasElementId.replaceAll(`-${RevCanvas.canvasCssSuffix}-`, '-');
                } else {
                    baseId = canvasElementId;
                }
            } else {
                baseId = RevCssTypes.libraryName;
            }
        }

        let suffixInt = 1;
        let suffix = firstGeneratedIdFromBaseIsAlsoNumbered ? '1' : '';
        let id = `${baseId}-${suffix}`;
        while (this._baseIds.has(id)) {
            suffixInt++;
            suffix = suffixInt.toString(10);
            id = `${baseId}-${suffix}`;
        }
        this._baseIds.add(id);
        return id;
    }
}
