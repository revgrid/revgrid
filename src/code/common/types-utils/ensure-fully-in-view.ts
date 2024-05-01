// (c) 2024 Xilytix Pty Ltd / Paul Klink

/** @public */
export const enum RevEnsureFullyInViewEnum {
    Never = 'Never',
    IfNotVisible = 'IfNotVisible',
    Always = 'Always',
}

/** @public */
export type RevEnsureFullyInView = keyof typeof RevEnsureFullyInViewEnum;
