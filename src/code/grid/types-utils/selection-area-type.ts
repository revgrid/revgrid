import { UnreachableCaseError } from './revgrid-error';

/** @public */
export const enum SelectionAreaTypeId {
    All,
    Rectangle,
    Column,
    Row,
}

/** @public */
export type SelectionAreaType = keyof typeof SelectionAreaTypeId;

/** @public */
export namespace SelectionAreaType {
    export function toId(type: SelectionAreaType): SelectionAreaTypeId {
        switch (type) {
            case 'All': return SelectionAreaTypeId.All;
            case 'Rectangle': return SelectionAreaTypeId.Rectangle;
            case 'Column': return SelectionAreaTypeId.Column;
            case 'Row': return SelectionAreaTypeId.Row;
            default:
                throw new UnreachableCaseError('SATTI10198', type);
        }
    }
}
