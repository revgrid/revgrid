/** @public */
export const enum HorizontalAlignEnum {
    left = 'left',
    right = 'right',
    center = 'center',
    start = 'start',
    end = 'end'
}

/** @public */
export type HorizontalAlign = keyof typeof HorizontalAlignEnum;
