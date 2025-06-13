import { RevSelectionAreaTypeId, RevUnreachableCaseError } from '../../../common/internal-api';
import { RevFirstCornerArea } from './first-corner-area';

/** @public */
export interface RevSelectionArea extends RevFirstCornerArea {
    readonly areaTypeId: RevSelectionAreaTypeId;
    readonly size: number;
}

/** @public */
export namespace RevSelectionArea {
    export function isEqual(left: RevSelectionArea, right: RevSelectionArea) {
        const leftTopLeft = left.topLeft;
        const rightTopLeft = right.topLeft;
        return (
            leftTopLeft.x === rightTopLeft.x &&
            leftTopLeft.y === rightTopLeft.y &&
            left.width === right.width &&
            left.height === right.height
        );
    }

    export function getTogglePriorityCellCoveringSelectionArea(areas: RevSelectionArea[]) {
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

    export function isCellCoveringSelectionAreaHigherTogglePriority(area: RevSelectionArea, referenceArea: RevSelectionArea) {
        // Order of priority is:
        // 1 Row
        // 2 Column
        // 3 Rectangle of size 1
        // 4 Rectangle with size greater than 1
        // 5 All
        const typeId = area.areaTypeId;
        switch (typeId) {
            case RevSelectionAreaTypeId.all: return referenceArea.areaTypeId === RevSelectionAreaTypeId.all;
            case RevSelectionAreaTypeId.rectangle: return (
                ((referenceArea.areaTypeId === RevSelectionAreaTypeId.rectangle) && (referenceArea.size !== 1)) ||
                referenceArea.areaTypeId === RevSelectionAreaTypeId.all
            );
            case RevSelectionAreaTypeId.column: return referenceArea.areaTypeId !== RevSelectionAreaTypeId.row;
            case RevSelectionAreaTypeId.row: return true;
            default:
                throw new RevUnreachableCaseError('SFICCSAHP35500', typeId);
        }
    }
}
