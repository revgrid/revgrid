import { InexclusiveArea } from '../../types-utils/inexclusive-area';
import { Point } from '../../types-utils/point';

/** @public */
export interface FirstCornerArea extends InexclusiveArea {
    readonly firstCorner: FirstCornerArea.Corner;
    readonly inclusiveFirst: Point;
}

/** @public */
export namespace FirstCornerArea {
    export const enum Corner {
        TopLeft,
        TopRight,
        BottomRight,
        BottomLeft,
    }

    export function calculateCornerFromWidthHeight(width: number, height: number) {
        if (width >= 0) {
            return height >= 0 ? Corner.TopLeft : Corner.BottomLeft;
        } else {
            return height >= 0 ? Corner.TopRight : Corner.BottomRight;
        }
    }
}
