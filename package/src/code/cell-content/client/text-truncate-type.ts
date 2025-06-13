import { RevApiError } from '../../common/internal-api';

/** @public */
export const enum RevTextTruncateTypeId {
    WithEllipsis,
    BeforeLastPartiallyVisibleCharacter,
    AfterLastPartiallyVisibleCharacter,
}

/** @public */
export type RevTextTruncateType =
    typeof RevTextTruncateType.withEllipsis |
    typeof RevTextTruncateType.beforeLastPartiallyVisibleCharacter |
    typeof RevTextTruncateType.afterLastPartiallyVisibleCharacter;

/** @public */
export namespace RevTextTruncateType {
    export type Id = RevTextTruncateTypeId;

    export const withEllipsis = 'withEllipsis';
    export const beforeLastPartiallyVisibleCharacter = 'beforeLastPartiallyVisibleCharacter';
    export const afterLastPartiallyVisibleCharacter = 'afterLastPartiallyVisibleCharacter';

    export function tryToId(value: RevTextTruncateType): Id | undefined {
        switch (value) {
            case withEllipsis: return RevTextTruncateTypeId.WithEllipsis;
            case beforeLastPartiallyVisibleCharacter: return RevTextTruncateTypeId.BeforeLastPartiallyVisibleCharacter;
            case afterLastPartiallyVisibleCharacter: return RevTextTruncateTypeId.AfterLastPartiallyVisibleCharacter;
            default: return undefined;
        }
    }

    export function toId(value: RevTextTruncateType, noMatchFallbackId?: Id): Id {
        let id = tryToId(value);

        if (id === undefined) {
            id = noMatchFallbackId;
        }

        if (id === undefined) {
            throw new RevApiError('HATTT41290', `Unknown RevTextTruncateType: ${value}`);
        } else {
            return id;
        }
    }
}
