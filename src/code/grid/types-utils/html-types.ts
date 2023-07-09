/** @public */
export namespace CssClassName {
    export const gridElementCssClass = 'revgrid';
    export const gridHostElementCssIdBase = 'revgrid';
    export const gridHostElementCssClass = 'revgrid-host';
}

/** @internal */
export function isSecondaryMouseButton(event: MouseEvent) {
    return event.button === 2;
}
