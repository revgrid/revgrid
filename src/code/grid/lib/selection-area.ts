import { Corner } from './corner';
import { Point } from './point';
import { RectangleInterface } from './rectangle-interface';
import { UnreachableCaseError } from './revgrid-error';

export interface SelectionArea extends RectangleInterface {
    readonly areaType: SelectionArea.Type;

    readonly topLeft: Point;
    readonly exclusiveBottomRight: Point;
    readonly firstCorner: Corner;

    readonly inclusiveFirst: Point;

    readonly width: number;
    readonly height: number;
    readonly size: number;
}

export namespace SelectionArea {
    export const enum Type {
        Rectangle,
        Column,
        Row,
    }

    export const enum TypeSpecifier {
        Primary,
        Secondary,
        Rectangle,
        Row,
        Column,
        LastOrPrimary,
    }

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
            case SelectionArea.Type.Rectangle: return (referenceArea.areaType === SelectionArea.Type.Rectangle) && (referenceArea.size !== 1);
            case SelectionArea.Type.Column: return referenceArea.areaType !== SelectionArea.Type.Row;
            case SelectionArea.Type.Row: return true;
            default:
                throw new UnreachableCaseError('SFICCSAHP35500', type);
        }
    }
}
