import { RevAssertError } from '../../../common/internal-api';
import { RevLinedHoverCell } from '../../interfaces/data/lined-hover-cell';
import { RevViewCell } from '../../interfaces/data/view-cell';
import { RevSchemaField } from '../../interfaces/schema/schema-field';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../../settings/internal-api';
import { RevUiController } from './ui-controller';

/** @internal */
export class RevCellClickUiController<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevUiController<BGS, BCS, SF> {

    readonly typeName = RevCellClickUiController.typeName;

    override handlePointerMove(event: PointerEvent, cell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        const sharedState = this.sharedState;
        if (sharedState.locationCursorName === undefined) {
            if (cell === null) {
                cell = this.tryGetHoverCellFromMouseEvent(event);
            }
            if (cell !== undefined) {
                const link = false// cell.columnSettings.link;
                const isActionableLink = link && typeof link !== 'boolean'; // actionable with truthy other than `true`

                sharedState.locationCursorName = isActionableLink ? 'pointer' : undefined;
                sharedState.locationTitleText = undefined;
            }
        }

        return super.handlePointerMove(event, cell);
    }

    override handleClick(event: MouseEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (hoverCell === undefined || hoverCell.viewCell.isMain) {
            return super.handleClick(event, hoverCell);
        } else {
            if (this.openLink(hoverCell.viewCell) !== undefined) {
                return hoverCell;
            } else {
                // if (this.grid.cellClicked(cell)) {
                //     return cell;
                // } else {
                    return super.handleClick(event, hoverCell);
                // }
            }
        }
    }

    /**
     * Open the cell's URL.
     *
     * @remarks The URL is found in the cell's {@link module:defaults.link|link} property, which serves two functions:
     * 1. **Renders as a link.** When truthy causes {@link SimpleCell} cell renderer to render the cell underlined with {@link module:defaults.linkColor|linkColor}. (See also {@link module:defaults.linkOnHover|linkOnHover} and {@link module:defaults.linkColorOnHover|linkColorOnHover}.) Therefore, setting this property to `true` will render as a link, although clicking on it will have no effect. This is useful if you wish to handle the click yourself by attaching a `'rev-click'` listener to your hypergrid.
     * 2. **Fetch the URL.** The value of the link property is interpreted as per {@link module:defaults.link|link}.
     * 3. **Decorate the URL.** The cell name (_i.e.,_ the data column name) and cell value are merged into the URL wherever the respective substrings `'%name'` and `'%value'` are found. For example, if the column name is "age" and the cell value is 6 (or a function returning 25), and the link is `'http://www.abc.com?%name=%value'`, then the actual link (first argument given to `grid.windowOpen`) would be `'http://www.abc.com?age=25'`.
     * 4. **Open the URL.** The link is then opened by {@link Hypergrid#windowOpen|grid.windowOpen}. If `link` is an array, it is "applied" to `grid.windowOpen` in its entirety; otherwise, `grid.windowOpen` is called with the link as the first argument and {@link module:defaults.linkTarget|linkTarget} as the second.
     * 5. **Decorate the link.** On successful return from `windowOpen()`, the text is colored as "visited" as per the cell's {@link module:defaults.linkVisitedColor|linkVisitedColor} property (by setting the cell's `linkColor` property to its `linkVisitedColor` property).

     * @returns One of:
     *
     * | Value | Meaning |
     * | :---- | :------ |
     * | `undefined` | no link to open |
     * | `null` | `grid.windowOpen` failed to open a window |
     * | _otherwise_ | A `window` reference returned by a successful call to `grid.windowOpen`. |
     */
    openLink(viewCell: RevViewCell<BCS, SF>): boolean | null | undefined | Window {
        let result: boolean | null | undefined | Window;
        let unknownUrl: unknown;
        const rowIndex = viewCell.viewLayoutRow.subgridRowIndex;
        const subgrid = viewCell.subgrid;
        const dataRow = subgrid.getSingletonViewDataRow(rowIndex);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const config = Object.create(viewCell.columnSettings, { dataRow: { value: dataRow } });
        const value = subgrid.getViewValue(viewCell.viewLayoutColumn.column, rowIndex);
        const linkProp: [url: string, target: string] | ((this: void, cellEvent: unknown) => string) = ['', '']// viewCell.columnSettings.link;

        let linkPropTuple: [url: string, target: string] | undefined;
        let link: boolean | string | ((this: void, cellEvent: unknown) => string);
        if (Array.isArray(linkProp)) {
            link = linkProp[0];
            linkPropTuple = linkProp;
        } else {
            link = linkProp;
        }

        // STEP 2: Fetch the URL
        switch (typeof link) {
            case 'string':
                if (link === '*') {
                    unknownUrl = value;
                } else if (/^\w+$/.test(link)) {
                    if (Array.isArray(dataRow)) {
                        throw new RevAssertError('CCFOL45455');
                    } else {
                        unknownUrl = dataRow[link];
                    }
                }
                break;

            case 'function':
                // unknownUrl = link(viewCell);
                break;
        }

        if (unknownUrl) {
            // STEP 3: Decorate the URL
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-base-to-string
            const url = unknownUrl.toString().replace(/%name/g, config.name).replace(/%value/g, value as string);

            // STEP 4: Open the URL
            if (linkPropTuple !== undefined) {
                linkPropTuple[0] = url;
                // result = grid.windowOpen(...linkPropTuple);
            } else {
                // result = grid.windowOpen(url, cellEvent.columnProperties.linkTarget);
            }
        }

        // STEP 5: Decorate the link as "visited"
        if (result) {
            const column = viewCell.viewLayoutColumn.column;
            this.cellPropertiesBehavior.setCellProperty(column, rowIndex, 'linkColor', RevCellClickUiController.linkVisitedColor, subgrid, viewCell);
            this.renderer.invalidateViewCell(viewCell);
        }

        return result;
    }
}

/** @internal */
export namespace RevCellClickUiController {
    export const typeName = 'cellclick';

    export const linkVisitedColor = '';
}
