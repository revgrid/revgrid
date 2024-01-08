/** @public */
export const enum EnsureFullyInViewEnum {
    Never = 'Never',
    IfNotVisible = 'IfNotVisible',
    Always = 'Always',
}

/** @public */
export type EnsureFullyInView = keyof typeof EnsureFullyInViewEnum;
