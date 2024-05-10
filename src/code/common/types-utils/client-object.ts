// (c) 2024 Xilytix Pty Ltd / Paul Klink

/**
 * The major classes in RevClient implement this interface to assist with debugging.
 * @public
 */
export interface RevClientObject {
    /** A unique string allowing you to identify different instances */
    clientId: string;
    /** The parent of an object allowing you to easily navigate during debugging */
    internalParent: RevClientObject | undefined;
}
