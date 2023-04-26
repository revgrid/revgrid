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

    export function isDownInKeyboardEvent(keyEnum: ModifierKeyEnum, keyboardEvent: KeyboardEvent) {
        switch (keyEnum) {
            case ModifierKeyEnum.Control: return keyboardEvent.ctrlKey;
            case ModifierKeyEnum.Shift: return keyboardEvent.shiftKey;
            case ModifierKeyEnum.Meta: return keyboardEvent.metaKey;
            case ModifierKeyEnum.Alt: return keyboardEvent.altKey;
            default:
                throw new UnreachableCaseError('HTMKIKIKE40941', keyEnum);
        }
    }

    export function isDownInMouseEvent(keyEnum: ModifierKeyEnum, mouseEvent: MouseEvent) {
        switch (keyEnum) {
            case ModifierKeyEnum.Control: return mouseEvent.ctrlKey;
            case ModifierKeyEnum.Shift: return mouseEvent.shiftKey;
            case ModifierKeyEnum.Meta: return mouseEvent.metaKey;
            case ModifierKeyEnum.Alt: return mouseEvent.altKey;
            default:
                throw new UnreachableCaseError('HTMKIKIKE40941', keyEnum);
        }
    }
}
