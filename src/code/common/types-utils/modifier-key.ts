import { RevUnreachableCaseError } from './revgrid-error';

/** @public */
export type RevModifierKey =
    typeof RevModifierKey.control |
    typeof RevModifierKey.shift |
    typeof RevModifierKey.meta |
    typeof RevModifierKey.alt;

/** @public */
export namespace RevModifierKey {
    export const control = 'Control';
    export const shift = 'Shift';
    export const meta = 'Meta';
    export const alt = 'Alt';

    export function isDownInEvent<T extends MouseEvent | KeyboardEvent>(key: RevModifierKey | undefined, event: T) {
        switch (key) {
            case undefined: return false;
            case control: return event.ctrlKey;
            case shift: return event.shiftKey;
            case meta: return event.metaKey;
            case alt: return event.altKey;
            default:
                throw new RevUnreachableCaseError('HTMKIKIKE40941', key);
        }
    }
}

