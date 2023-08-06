import { UnreachableCaseError } from './revgrid-error';

/** @public */
export const enum SelectionAreaTypeId {
    all,
    rectangle,
    row,
    column,
}

/** @internal */
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
}

/** @internal */
type RowOrColumnSelectionAreaTypeObject = Pick<SelectionAreaTypeObject, 'row' | 'column'>;

/** @public */
export type RowOrColumnSelectionAreaType = keyof RowOrColumnSelectionAreaTypeObject;
