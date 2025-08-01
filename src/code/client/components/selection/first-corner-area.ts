import { RevCornerArea, RevPoint } from '../../../common';

/**
 * Represents a rectangular area with one corner designated as its first corner.
 *
 * @see RevCornerArea
 * @public
 */
export interface RevFirstCornerArea extends RevCornerArea {
    /** The corner of the area designated as its first corner. */
    readonly firstCorner: RevFirstCornerArea.CornerId;
    /**
     * A point representing the first corner of the area.
     *
     * The x and y coordinates represent the relevant edges of the rectangle (ie are inclusive).
     */
    readonly inclusiveFirst: RevPoint;
}

/** @public */
export namespace RevFirstCornerArea {
    /**
     * Identifies the four corners of a rectangle.
     */
    export const enum CornerId {
        TopLeft,
        TopRight,
        BottomRight,
        BottomLeft,
    }

    export namespace Corner {
        /**
         * Calculates the corner of a rectangle/area based on the sign of width and height values (used in to create the rectangle/area).
         */
        export function calculateFromWidthHeight(width: number, height: number): CornerId {
            if (width >= 0) {
                return height >= 0 ? CornerId.TopLeft : CornerId.BottomLeft;
            } else {
                return height >= 0 ? CornerId.TopRight : CornerId.BottomRight;
            }
        }
    }
}
