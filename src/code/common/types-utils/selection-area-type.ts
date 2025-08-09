import { RevUnreachableCaseError } from './revgrid-error';

/**
 * Identifies the types of selection areas in a grid.
 *
 * A selection can have one or more selection area. Each area will be of one of the types defined in this enum.
 * @public
 */
export const enum RevSelectionAreaTypeId {
    /** All the cells within a subgrid. Dynamically changes to reflect additions and deletions of rows and columns. */
    dynamicAll,
    /** A rectangle of cells within a subgrid. */
    rectangle,
    /** One or more contiguous rows within a subgrid. */
    row,
    /** One or more contiguous columns. */
    column,
}

/** @public */
export type RevSelectionAreaTypeObject = typeof RevSelectionAreaTypeId;

/**
 * String representation of {@link RevSelectionAreaTypeId} type identifiers.
 * @public
 */
export type RevSelectionAreaType = keyof RevSelectionAreaTypeObject;

/** @public */
export namespace RevSelectionAreaType {
    /**
     * Converts a {@link RevSelectionAreaType} string value to its corresponding {@link RevSelectionAreaTypeId} enum.
     *
     * @param type - The selection area type to convert.
     * @returns The corresponding `RevSelectionAreaTypeId` for the given type.
     * @throws `RevUnreachableCaseError` If the provided type is not a recognized selection area type.
     */
    export function toId(type: RevSelectionAreaType): RevSelectionAreaTypeId {
        switch (type) {
            case 'dynamicAll': return RevSelectionAreaTypeId.dynamicAll;
            case 'rectangle': return RevSelectionAreaTypeId.rectangle;
            case 'row': return RevSelectionAreaTypeId.row;
            case 'column': return RevSelectionAreaTypeId.column;
            default:
                throw new RevUnreachableCaseError('SATTI10198', type);
        }
    }
    /**
     * Converts a {@link RevSelectionAreaTypeId} to its corresponding {@link RevSelectionAreaType} string value.
     *
     * @param id - The selection area type identifier to convert.
     * @returns The string representation of the selection area type.
     * @throws `RevUnreachableCaseError` If the provided `id` does not match any known selection area type.
     */
    export function fromId(id: RevSelectionAreaTypeId): RevSelectionAreaType {
        switch (id) {
            case RevSelectionAreaTypeId.dynamicAll: return 'dynamicAll';
            case RevSelectionAreaTypeId.rectangle: return 'rectangle';
            case RevSelectionAreaTypeId.row: return 'row';
            case RevSelectionAreaTypeId.column: return 'column';
            default:
                throw new RevUnreachableCaseError('SATFI10198', id);
        }
    }
    /**
     * Converts an array of {@link RevSelectionAreaTypeId} values into an array of corresponding {@link RevSelectionAreaType}.
     *
     * @param ids - The array of selection area {@link RevSelectionAreaTypeId} to convert.
     * @returns An array of {@link RevSelectionAreaType} mapped from the provided {@link RevSelectionAreaTypeId} array.
     */
    export function arrayFromIds(ids: RevSelectionAreaTypeId[]): RevSelectionAreaType[] {
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
/**
 * String representation of ${@link RevSelectionAreaTypeId.row} or ${@link RevSelectionAreaTypeId.column} type identifiers.
 */
export type RevRowOrColumnSelectionAreaType = keyof RevRowOrColumnSelectionAreaTypeObject;
