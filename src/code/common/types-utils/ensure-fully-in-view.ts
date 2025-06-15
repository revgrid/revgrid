/** @public */
export const enum RevEnsureFullyInViewEnum {
    Never = 'Never',
    IfNotVisible = 'IfNotVisible',
    Always = 'Always',
}

/** @public */
export type RevEnsureFullyInView = keyof typeof RevEnsureFullyInViewEnum;
