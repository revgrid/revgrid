import { UnreachableCaseError } from './revgrid-error';

/** @public */
export const enum ModifierKeyEnum {
    Control = 'Control',
    Shift = 'Shift',
    Meta = 'Meta',
    Alt = 'Alt',
}

/** @public */
export type ModifierKey = keyof typeof ModifierKeyEnum;

/** @public */
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

