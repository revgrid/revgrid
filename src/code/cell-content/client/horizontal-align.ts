import { UnreachableCaseError } from '@pbkware/js-utils';
import { RevApiError } from '../../common';

/** @public */
export const RevHorizontalAlignId = {
    Left: 0,
    Right: 1,
    Center: 2,
    Start: 3,
    End: 4,
} as const

export type RevHorizontalAlignId = (typeof RevHorizontalAlignId)[keyof typeof RevHorizontalAlignId];

/** @public */
export type RevHorizontalAlign =
    typeof RevHorizontalAlign.left |
    typeof RevHorizontalAlign.right |
    typeof RevHorizontalAlign.center |
    typeof RevHorizontalAlign.start |
    typeof RevHorizontalAlign.end;

/** @public */
export namespace RevHorizontalAlign {
    export type Id = RevHorizontalAlignId;

    export const left = 'left';
    export const right = 'right';
    export const center = 'center';
    export const start = 'start';
    export const end = 'end';

    export function tryToId(value: RevHorizontalAlign): Id | undefined {
        switch (value) {
            case left: return RevHorizontalAlignId.Left;
            case right: return RevHorizontalAlignId.Right;
            case center: return RevHorizontalAlignId.Center;
            case start: return RevHorizontalAlignId.Start;
            case end: return RevHorizontalAlignId.End;
            default: return undefined;
        }
    }

    export function toId(value: RevHorizontalAlign, noMatchFallbackId?: Id): Id {
        let id = tryToId(value);

        if (id === undefined) {
            id = noMatchFallbackId;
        }

        if (id === undefined) {
            throw new RevApiError('HATI41290', `Unknown RevHorizontalAlign: ${value}`);
        } else {
            return id;
        }
    }

    export function idToCanvasTextAlign(id: RevHorizontalAlignId): CanvasTextAlign {
        switch (id) {
            case RevHorizontalAlignId.Left: return 'left';
            case RevHorizontalAlignId.Right: return 'right';
            case RevHorizontalAlignId.Center: return 'center';
            case RevHorizontalAlignId.Start: return 'start';
            case RevHorizontalAlignId.End: return 'end';
            default:
                throw new UnreachableCaseError('HAITCTA41290', id);
        }
    }
}
