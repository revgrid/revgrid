import { RevInexclusiveArea, RevPoint } from '../../../common';

/** @public */
export interface RevFirstCornerArea extends RevInexclusiveArea {
    readonly firstCorner: RevFirstCornerArea.CornerId;
    readonly inclusiveFirst: RevPoint;
}

/** @public */
export namespace RevFirstCornerArea {
    export const enum CornerId {
        TopLeft,
        TopRight,
        BottomRight,
        BottomLeft,
    }

    export namespace Corner {
        export function calculateFromWidthHeight(width: number, height: number) {
            if (width >= 0) {
                return height >= 0 ? CornerId.TopLeft : CornerId.BottomLeft;
            } else {
                return height >= 0 ? CornerId.TopRight : CornerId.BottomRight;
            }
        }
    }
}
