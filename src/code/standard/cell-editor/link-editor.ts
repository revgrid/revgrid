export interface Settings {

    /** Display cell value as a link (with underline).
     * @remarks One of:
     * * `boolean` - No action occurs on click; you would need to attach a 'rev-click' listener to the hypergrid object.
     *   * `true` - Displays the cell as a link.
     *   * _falsy_ - Displays the cell normally.
     * * `string` -  The URL is decorated (see {}) and then opened in a separate window/tab. See also {@link module:defaults.linkTarget|linkTarget}.
     *   * `'*'` - Use the cell value as the URL, ready for decorating (see {CellClick#openLink|openLink)).
     *   * _field name_ - Fetches the string from the named field in the same row, assumed to be a URL ready for decorating. (May contain only alphanumerics and underscore; no spaces or other punctuation.)
     *   * _otherwise_ Assumed to contains a URL ready for decorating.
     * * `function` - A function to execute to get the URL ready for decorating. The function is passed a single parameter, `cellEvent`, from which you can get the field `name`, `dataRow`, _etc._
     * * `Array` - An array to "apply" to {@link https://developer.mozilla.org/docs/Web/API/Window/open window.open} in its entirety. The first element is interpreted as above for `string` or `function`.
     *
     * In the case of `string` or `Array`, the link is further unpacked by {@link module:CellClick.openLink|openLink} and then sent to `grid.windowOpen`.
     *
     * @example
     * // following affect upper-left data cell:
     * grid.behavior.setCellProperty(0, 0, 'https://nytimes.com'); // absolute address using specific protocol
     * grid.behavior.setCellProperty(0, 0, '//nytimes.com'); // absolute address using current protocol
     * grid.behavior.setCellProperty(0, 0, '/page2.com'); // relative to current site
     * grid.behavior.setCellProperty(0, 0, 'mypage.com'); // relative to current page
     * grid.behavior.setCellProperty(0, 0, 'mypage.com?id=%value'); // cell's value will replace %value
     * grid.behavior.setCellProperty(0, 0, ['//www.newyorker.com', 'ny', undefined, true]) // target='ny', replace=true
     * @type {boolean|string|Array}
     * @default
     */
    link: false,

    /** The window (or tab) in which to open the link.
     * @remarks The default ('_blank'`) will open a new window for every click.
     *
     * To have the first click open a new window and all subsequent clicks reuse that same window, set this to an arbitrary string.
     *
     * Otherwise, specific columns or cells can be set to open their links in their own window by setting the appropriate column's or cell's `linkTarget` property.
     * @default
     */
    linkTarget: '_blank',

    /** Underline link on hover only.
     * @type {boolean}
     * @default
     */
    linkOnHover: false,

    /** Color for link.
     * @remarks Falsy means defer to foreground color.
     * @type {string}
     * @default
     */
    linkColor: 'blue',

    /** Color for visited link.
     * @remarks Falsy means defer to foreground color.
     * @type {string}
     * @default
     */
    linkVisitedColor: 'purple',

    /** Color link on hover only.
     * @type {boolean}
     * @default
     */
    linkColorOnHover: false,

}

export namespace LinkEditor {
    export type Link = false | string | LinkEditor.LinkProp | LinkEditor.LinkFunction;
    export type LinkFunction = (this: void, cellEvent: unknown) => string;
    export type LinkProp = [url: string, target: string];


}
