// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevUnreachableCaseError } from './revgrid-error';

/** @public */
export const enum RevSelectionAreaTypeId {
    all,
    rectangle,
    row,
    column,
}

/** @public */
export type RevSelectionAreaTypeObject = typeof RevSelectionAreaTypeId;

/** @public */
export type RevSelectionAreaType = keyof RevSelectionAreaTypeObject;

/** @public */
export namespace RevSelectionAreaType {
    export function toId(type: RevSelectionAreaType): RevSelectionAreaTypeId {
        switch (type) {
            case 'all': return RevSelectionAreaTypeId.all;
            case 'rectangle': return RevSelectionAreaTypeId.rectangle;
            case 'row': return RevSelectionAreaTypeId.row;
            case 'column': return RevSelectionAreaTypeId.column;
            default:
                throw new RevUnreachableCaseError('SATTI10198', type);
        }
    }
    export function fromId(id: RevSelectionAreaTypeId): RevSelectionAreaType {
        switch (id) {
            case RevSelectionAreaTypeId.all: return 'all';
            case RevSelectionAreaTypeId.rectangle: return 'rectangle';
            case RevSelectionAreaTypeId.row: return 'row';
            case RevSelectionAreaTypeId.column: return 'column';
            default:
                throw new RevUnreachableCaseError('SATFI10198', id);
        }
    }
    export function arrayFromIds(ids: RevSelectionAreaTypeId[]) {
        const count = ids.length;
        const typeArray = new Array<RevSelectionAreaType>(count);
        for (let i = 0; i < count; i++) {
            const id = ids[i];
            typeArray[i] = fromId(id);
        }
        return typeArray;
    }
}

/** @public */
export type RevRowOrColumnSelectionAreaTypeObject = Pick<RevSelectionAreaTypeObject, 'row' | 'column'>;

/** @public */
export type RevRowOrColumnSelectionAreaType = keyof RevRowOrColumnSelectionAreaTypeObject;
