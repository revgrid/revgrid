import { UnreachableCaseError } from './revgrid-error';

/** @public */
export const enum SelectionAreaTypeId {
    all,
    rectangle,
    row,
    column,
}

/** @public */
type SelectionAreaTypeObject = typeof SelectionAreaTypeId;

/** @public */
export type SelectionAreaType = keyof SelectionAreaTypeObject;

/** @public */
export namespace SelectionAreaType {
    export function toId(type: SelectionAreaType): SelectionAreaTypeId {
        switch (type) {
            case 'all': return SelectionAreaTypeId.all;
            case 'rectangle': return SelectionAreaTypeId.rectangle;
            case 'row': return SelectionAreaTypeId.row;
            case 'column': return SelectionAreaTypeId.column;
            default:
                throw new UnreachableCaseError('SATTI10198', type);
        }
    }
    export function fromId(id: SelectionAreaTypeId): SelectionAreaType {
        switch (id) {
            case SelectionAreaTypeId.all: return 'all';
            case SelectionAreaTypeId.rectangle: return 'rectangle';
            case SelectionAreaTypeId.row: return 'row';
            case SelectionAreaTypeId.column: return 'column';
            default:
                throw new UnreachableCaseError('SATFI10198', id);
        }
    }
    export function arrayFromIds(ids: SelectionAreaTypeId[]) {
        const count = ids.length;
        const typeArray = new Array<SelectionAreaType>(count);
        for (let i = 0; i < count; i++) {
            const id = ids[i];
            typeArray[i] = fromId(id);
        }
        return typeArray;
    }
}

/** @public */
type RowOrColumnSelectionAreaTypeObject = Pick<SelectionAreaTypeObject, 'row' | 'column'>;

/** @public */
export type RowOrColumnSelectionAreaType = keyof RowOrColumnSelectionAreaTypeObject;
