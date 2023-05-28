import { UnreachableCaseError } from './revgrid-error';

export namespace CssClassName {
    export const gridElementCssClass = 'revgrid';
    export const gridContainerElementCssIdBase = 'revgrid';
    export const gridContainerElementCssClass = 'revgrid-container';
}

export function isSecondaryMouseButton(event: MouseEvent) {
    return event.button === 2;
}

export const enum ModifierKeyEnum {
    Control = 'Control',
    Shift = 'Shift',
    Meta = 'Meta',
    Alt = 'Alt',
}

export type ModifierKey = keyof typeof ModifierKeyEnum;

export namespace ModifierKey {
    export const all = [ModifierKeyEnum.Control];

    export function isDownInEvent<T extends MouseEvent | KeyboardEvent>(keyEnum: ModifierKeyEnum | undefined, event: T) {
        switch (keyEnum) {
            case undefined: return false;
            case ModifierKeyEnum.Control: return event.ctrlKey;
            case ModifierKeyEnum.Shift: return event.shiftKey;
            case ModifierKeyEnum.Meta: return event.metaKey;
            case ModifierKeyEnum.Alt: return event.altKey;
            default:
                throw new UnreachableCaseError('HTMKIKIKE40941', keyEnum);
        }
    }
}

export namespace KeyboardEventKey {
    export const Tab = 'Tab';
    export const Escape = 'Escape';
    export const Return = 'Return';
}

export namespace CursorNames {
    export const cell = 'cell';
}
