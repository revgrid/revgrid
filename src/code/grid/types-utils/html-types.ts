/** @public */
export namespace CssClassName {
    export const gridElementCssClass = 'revgrid';
    export const gridContainerElementCssIdBase = 'revgrid';
    export const gridContainerElementCssClass = 'revgrid-container';
}

/** @internal */
export function isSecondaryMouseButton(event: MouseEvent) {
    return event.button === 2;
}
