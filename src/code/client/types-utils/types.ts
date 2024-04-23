/** @public */
export const enum HorizontalWheelScrollingAllowed {
    Never,
    Always,
    CtrlKeyDown,
}

/** @public */
export type Writable<T> = {
    -readonly [P in keyof T]: T[P];
};

/** @public */
export const enum RevListChangedTypeId {
    Set,
    Insert,
    Remove,
    Move,
    Clear,
}

/** @public */
export type RevListChangedEventer = (
    this: void,
    typeId: RevListChangedTypeId,
    index: number,
    count: number,
    targetIndex: number | undefined
) => void;

/** @public */
export const enum SelectionAreaTypeSpecifier {
    Primary,
    Secondary,
    Rectangle,
    Row,
    Column,
    LastOrPrimary,
}

/** @public */
export type RevUiableListChangedEventHandler = (
    this: void,
    typeId: RevListChangedTypeId,
    index: number,
    count: number,
    targetIndex: number | undefined,
    ui: boolean
) => void;
