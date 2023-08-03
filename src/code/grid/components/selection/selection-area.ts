import { UnreachableCaseError } from '../../types-utils/revgrid-error';
import { SelectionAreaType } from '../../types-utils/types';
import { FirstCornerArea } from './first-corner-area';

/** @public */
export interface SelectionArea extends FirstCornerArea {
    readonly areaType: SelectionAreaType;
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

    export function getPriorityCellCoveringSelectionArea(areas: SelectionArea[]) {
        const areaCount = areas.length;
        switch (areaCount) {
            case 0: return undefined;
            case 1: return areas[0];
            default: {
                let priorityArea = areas[0];
                for (let i = 0; i < areaCount; i++) {
                    const area = areas[i];
                    if (isCellCoveringSelectionAreaHigherPriority(area, priorityArea)) {
                        priorityArea = area;
                    }
                }
                return priorityArea;
            }
        }
    }

    export function isCellCoveringSelectionAreaHigherPriority(area: SelectionArea, referenceArea: SelectionArea) {
        const type = area.areaType;
        switch (type) {
            case SelectionAreaType.Rectangle: return (referenceArea.areaType === SelectionAreaType.Rectangle) && (referenceArea.size !== 1);
            case SelectionAreaType.Column: return referenceArea.areaType !== SelectionAreaType.Row;
            case SelectionAreaType.Row: return true;
            default:
                throw new UnreachableCaseError('SFICCSAHP35500', type);
        }
    }
}
