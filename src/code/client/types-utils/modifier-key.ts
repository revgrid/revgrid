import { RevUnreachableCaseError } from './revgrid-error';

/** @public */
export const enum RevModifierKeyEnum {
    Control = 'Control',
    Shift = 'Shift',
    Meta = 'Meta',
    Alt = 'Alt',
}

/** @public */
export type RevModifierKey = keyof typeof RevModifierKeyEnum;

/** @public */
export namespace RevModifierKey {
    export const all = [RevModifierKeyEnum.Control];

    export function isDownInEvent<T extends MouseEvent | KeyboardEvent>(keyEnum: RevModifierKeyEnum | undefined, event: T) {
        switch (keyEnum) {
            case undefined: return false;
            case RevModifierKeyEnum.Control: return event.ctrlKey;
            case RevModifierKeyEnum.Shift: return event.shiftKey;
            case RevModifierKeyEnum.Meta: return event.metaKey;
            case RevModifierKeyEnum.Alt: return event.altKey;
            default:
                throw new RevUnreachableCaseError('HTMKIKIKE40941', keyEnum);
        }
    }
}

