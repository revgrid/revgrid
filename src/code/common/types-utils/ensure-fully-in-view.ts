/**
 * Specifies the behavior for ensuring that a cell is fully visible within a view.
 *
 * This enum is used to determine when a cell should be scrolled into view.
 * @public
 */
export const enum RevEnsureFullyInViewEnum {
    /** Never ensure the cell is fully in view */
    Never = 'Never',
    /** Ensure the cell is fully in view only if it is currently not visible */
    IfNotVisible = 'IfNotVisible',
    /** Always ensure the cell is fully in view, regardless of its current visibility */
    Always = 'Always',
}

/**
 * Represents the possible string keys of the {@link RevEnsureFullyInViewEnum} enumeration.
 * Use this type to restrict values to valid enum keys for ensuring a cell is fully in view.
 * @public
 */
export type RevEnsureFullyInView = keyof typeof RevEnsureFullyInViewEnum;
