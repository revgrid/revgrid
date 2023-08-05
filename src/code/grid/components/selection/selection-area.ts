import { UnreachableCaseError } from '../../types-utils/revgrid-error';
import { SelectionAreaTypeId } from '../../types-utils/selection-area-type';
import { FirstCornerArea } from './first-corner-area';

/** @public */
export interface SelectionArea extends FirstCornerArea {
    readonly areaTypeId: SelectionAreaTypeId;
    readonly size: number;
}

/** @public */
export namespace SelectionArea {
    export function isEqual(left: SelectionArea, right: SelectionArea) {
        const leftTopLeft = left.topLeft;
        const rightTopLeft = right.topLeft;
        return (
            leftTopLeft.x === rightTopLeft.x &&
            leftTopLeft.y === rightTopLeft.y &&
            left.width === right.width &&
            left.height === right.height
        );
    }

    export function getTogglePriorityCellCoveringSelectionArea(areas: SelectionArea[]) {
        const areaCount = areas.length;
        switch (areaCount) {
            case 0: return undefined;
            case 1: return areas[0];
            default: {
                let priorityArea = areas[0];
                for (let i = 0; i < areaCount; i++) {
                    const area = areas[i];
                    if (isCellCoveringSelectionAreaHigherTogglePriority(area, priorityArea)) {
                        priorityArea = area;
                    }
                }
                return priorityArea;
            }
        }
    }

    export function isCellCoveringSelectionAreaHigherTogglePriority(area: SelectionArea, referenceArea: SelectionArea) {
        // Order of priority is:
        // 1 Row
        // 2 Column
        // 3 Rectangle of size 1
        // 4 Rectangle with size greater than 1
        // 5 All
        const typeId = area.areaTypeId;
        switch (typeId) {
            case SelectionAreaTypeId.All: return referenceArea.areaTypeId === SelectionAreaTypeId.All;
            case SelectionAreaTypeId.Rectangle: return (
                ((referenceArea.areaTypeId === SelectionAreaTypeId.Rectangle) && (referenceArea.size !== 1)) ||
                referenceArea.areaTypeId === SelectionAreaTypeId.All
            );
            case SelectionAreaTypeId.Column: return referenceArea.areaTypeId !== SelectionAreaTypeId.Row;
            case SelectionAreaTypeId.Row: return true;
            default:
                throw new UnreachableCaseError('SFICCSAHP35500', typeId);
        }
    }
}
