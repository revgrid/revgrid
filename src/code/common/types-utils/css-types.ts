// (c) 2024 Xilytix Pty Ltd / Paul Klink

/** @public */
export namespace RevCssTypes {
    export const libraryName = 'revgrid';

    export const enum Overflow {
        auto = 'auto',
        clip = 'clip',
        hidden = 'hidden',
        scroll = 'scroll',
        visible = 'visible',
    }

    export const enum Position {
        static = 'static',
        relative = 'relative',
        fixed = 'fixed',
        absolute = 'absolute',
        sticky = 'sticky',
    }

    export const enum Display {
        inline = 'inline',
        block = 'block',
    }
}
