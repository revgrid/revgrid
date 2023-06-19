/** @public */
export const enum Corner {
    TopLeft,
    TopRight,
    BottomRight,
    BottomLeft,
}

/** @public */
export function calculateCornerFromWidthHeight(width: number, height: number) {
    if (width >= 0) {
        return height >= 0 ? Corner.TopLeft : Corner.BottomLeft;
    } else {
        return height >= 0 ? Corner.TopRight : Corner.BottomRight;
    }
}
