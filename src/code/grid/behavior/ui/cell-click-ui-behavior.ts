import { CellEvent } from '../../cell/cell-event';
import { ViewportCell } from '../../cell/viewport-cell';
import { GridProperties } from '../../grid-properties';
import { AssertError } from '../../lib/revgrid-error';
import { DataModel } from '../../model/data-model';
import { UiBehavior } from './ui-behavior';

export class CellClickUiBehavior extends UiBehavior {

    readonly typeName = CellClickUiBehavior.typeName;

    override handleMouseMove(event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewportCellFromMouseEvent(event);
        }
        if (cell !== null) {
            const link = cell.columnProperties.link;
            const isActionableLink = link && typeof link !== 'boolean'; // actionable with truthy other than `true`

            this.cursor = isActionableLink ? 'pointer' : undefined;
        }

        return super.handleMouseMove(event, cell);
    }

    override handleClick(event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewportCellFromMouseEvent(event);
        }
        if (cell === null || cell.isDataCell) {
            return super.handleClick(event, cell);
        } else {
            if (this.openLink(cell) !== undefined) {
                return cell;
            } else {
                if (this.grid.cellClicked(cell)) {
                    return cell;
                } else {
                    return super.handleClick(event, cell);
                }
            }
        }
    }

    /**
     * @summary Open the cell's URL.
     *
     * @desc The URL is found in the cell's {@link module:defaults.link|link} property, which serves two functions:
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
    openLink(cellEvent: CellEvent): boolean | null | undefined | Window {
        const grid = this.grid;
        let result: boolean | null | undefined | Window;
        let unknownUrl: unknown;
        const rowIndex = cellEvent.dataPoint.y;
        const subgrid = cellEvent.subgrid;
        const dataRow = subgrid.getSingletonDataRow(rowIndex);
        const config = Object.create(cellEvent.columnProperties, { dataRow: { value: dataRow } });
        const value = subgrid.getValue(cellEvent.visibleColumn.column, rowIndex);
        const linkProp = cellEvent.columnProperties.link;

        let linkPropTuple: GridProperties.LinkProp | undefined;
        let link: boolean | string | GridProperties.LinkFunction;
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
                        throw new AssertError('CCFOL45455');
                    } else {
                        unknownUrl = dataRow[link as keyof DataModel.ObjectDataRow];
                    }
                }
                break;

            case 'function':
                unknownUrl = link(cellEvent);
                break;
        }

        if (unknownUrl) {
            // STEP 3: Decorate the URL
            const url = unknownUrl.toString().replace(/%name/g, config.name).replace(/%value/g, value as string);

            // STEP 4: Open the URL
            if (linkPropTuple !== undefined) {
                linkPropTuple[0] = url;
                result = grid.windowOpen(...linkPropTuple);
            } else {
                result = grid.windowOpen(url, cellEvent.columnProperties.linkTarget);
            }
        }

        // STEP 5: Decorate the link as "visited"
        if (result) {
            const column = cellEvent.visibleColumn.column;
            this.cellPropertiesBehavior.setCellProperty(column, rowIndex, 'linkColor', grid.properties.linkVisitedColor, subgrid);
            this.viewport.resetCellPropertiesCache(cellEvent);
            this.renderer.repaint();
        }

        return result;
    }
}

export namespace CellClickUiBehavior {
    export const typeName = 'cellclick';
}
