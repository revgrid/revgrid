import { RevAssertError, RevPoint, RevSchemaField, RevSelectionAreaTypeId, RevUnreachableCaseError } from '../../../common';
import { RevSubgrid } from '../../interfaces';
import { RevBehavioredColumnSettings } from '../../settings';
import { RevFirstCornerRectangle } from './first-corner-rectangle';
import { RevSelectionArea } from './selection-area';

/** @public */
export class RevLastSelectionArea<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevFirstCornerRectangle implements RevSelectionArea<BCS, SF> {
    constructor(
        readonly areaTypeId: RevSelectionAreaTypeId,
        leftOrExRight: number, topOrExBottom: number, width: number, height: number,
        readonly subgrid: RevSubgrid<BCS, SF> | undefined
    ) {
        super(leftOrExRight, topOrExBottom, width, height);
    }

    get size() { return this.area; }

    /**
     * Determines whether the cell specified by the given point is contained in the last selection area.
     * @param point - The point of the cell to test for containment.
     * @returns `true` if the cell is within the last selection area; otherwise, `false`.
     */
    containsSubgridCellPoint(point: RevPoint, subgrid: RevSubgrid<BCS, SF>): boolean {
        return this.containsSubgridCell(point.x, point.y, subgrid);
    }

    /**
     * Determines whether the specified cell specified by the co-ordinates is contained within the last selection area.
     *
     * @param activeColumnIndex - The index of the active column.
     * @param subgridRowIndex - The index of the row within the specified subgrid.
     * @param subgrid - The subgrid containing the `subgridRowIndex`.
     * @returns `true` if the point is within the rectangle; otherwise, `false`.
     */
    containsSubgridCell(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): boolean {
        switch (this.areaTypeId) {
            case RevSelectionAreaTypeId.dynamicAll:
                return this.subgrid === undefined || this.subgrid === subgrid
            case RevSelectionAreaTypeId.rectangle:
                if (this.subgrid !== undefined) {
                    throw new RevAssertError('RLSACSC49993');
                } else {
                    if (this.subgrid !== subgrid) {
                        return false;
                    } else {
                        return this.containsXY(activeColumnIndex, subgridRowIndex);
                    }
                }
            case RevSelectionAreaTypeId.row:
                if (this.subgrid !== undefined) {
                    throw new RevAssertError('RLSACSC49994');
                } else {
                    if (this.subgrid !== subgrid) {
                        return false;
                    } else {
                        return this.containsY(subgridRowIndex);
                    }
                }
            case RevSelectionAreaTypeId.column:
                return this.containsX(activeColumnIndex);
            default:
                throw new RevUnreachableCaseError('RLSACSC49992', this.areaTypeId);
        }
    }

    checkAdjustForXRangeInserted(subgrid: RevSubgrid<BCS, SF>, index: number, count: number): void {
        if (this.subgrid !== undefined && this.subgrid === subgrid) {
            this.adjustForXRangeInserted(index, count);
        }
    }

    checkAdjustForYRangeInserted(subgrid: RevSubgrid<BCS, SF>, index: number, count: number): void {
        if (this.subgrid !== undefined && this.subgrid === subgrid) {
            this.adjustForYRangeInserted(index, count);
        }
    }

    checkAdjustForXRangeDeleted(subgrid: RevSubgrid<BCS, SF>, deletionLeft: number, deletionCount: number): boolean | null {
        if (this.subgrid !== undefined && this.subgrid === subgrid) {
            return this.adjustForXRangeDeleted(deletionLeft, deletionCount);
        } else {
            return false;
        }
    }

    checkAdjustForYRangeDeleted(subgrid: RevSubgrid<BCS, SF>, deletionTop: number, deletionCount: number): boolean | null {
        if (this.subgrid !== undefined && this.subgrid === subgrid) {
            return this.adjustForYRangeDeleted(deletionTop, deletionCount);
        } else {
            return false;
        }
    }

    checkAdjustForXRangeMoved(subgrid: RevSubgrid<BCS, SF>, oldIndex: number, newIndex: number, count: number): void {
        if (this.subgrid !== undefined && this.subgrid === subgrid) {
            this.adjustForXRangeMoved(oldIndex, newIndex, count);
        }
    }

    checkAdjustForYRangeMoved(subgrid: RevSubgrid<BCS, SF>, oldIndex: number, newIndex: number, count: number): void {
        if (this.subgrid !== undefined && this.subgrid === subgrid) {
            this.adjustForYRangeMoved(oldIndex, newIndex, count);
        }
    }
}
