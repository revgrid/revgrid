
import { CanvasRenderingContext2DEx, CellPainter, Revgrid, ViewCell } from '../../grid/grid-public-api';
import { GridSettings } from '../../grid/interfaces/grid-settings';
import { SimpleCellPaintConfig } from './simple-cell-paint-config';
import { SimpleCellPaintConfigAccessor } from './simple-cell-paint-config-accessor';

const WHITESPACE = /\s\s+/g;

/**
 * @constructor
 * @summary The default cell renderer for a vanilla cell.
 * @desc Great care has been taken in crafting this function as it needs to perform extremely fast.
 *
 * Use `gc.cache` instead which we have implemented to cache the graphics context properties. Reads on the graphics context (`gc`) properties are expensive but not quite as expensive as writes. On read of a `gc.cache` prop, the actual `gc` prop is read into the cache once and from then on only the cache is referenced for that property. On write, the actual prop is only written to when the new value differs from the cached value.
 *
 * Clipping bounds are not set here as this is also an expensive operation. Instead, we employ a number of strategies to truncate overflowing text and content.
 * @public
 */
export class SimpleCellPainter implements CellPainter {
    private _config: SimpleCellPaintConfig;

    loadConfig(grid: Revgrid, cell: ViewCell, prefillColor: string | undefined) {
        const config = new SimpleCellPaintConfigAccessor(grid, cell, cell.isHeaderCell, cell.isFilterCell);

        const dataPoint = cell.dataPoint;
        const selection = grid.selection;
        const subgrid = cell.subgrid;
        const isMainRow = subgrid.isMain;
        const isHeaderRow = subgrid.isHeader;
        const isFilterRow = subgrid.isFilter;
        const activeColumnIndex = cell.visibleColumn.activeColumnIndex;
        const dataRow = dataPoint.y;
        const value = subgrid.getValue(cell.visibleColumn.column, dataRow);

        config.dataCell = dataPoint;

        const {
            rowSelected: isRowSelected,
            columnSelected: isColumnSelected,
            cellSelected: isCellSelected
        } = selection.getCellSelectedAreaTypes(activeColumnIndex, dataRow, subgrid);

        /* if (isHandleColumn) {
            isSelected = isRowSelected || selectionModel.isCellSelectedInRow(r);
            config.halign = 'right';
        } else if (isTreeColumn) {
            isSelected = isRowSelected || selectionModel.isCellSelectedInRow(r);
            config.halign = 'left';
        } else if (isMainRow) {
            isSelected = isCellSelected || isRowSelected || isColumnSelected;
        } else if (isFilterRow) {
            isSelected = false;
        } else if (isColumnSelected) {
            isSelected = true;
        } else {
            isSelected = selection.isCellSelectedInColumn(x); // header or summary or other non-meta
        }*/

        const isSelected = isCellSelected || isRowSelected || isColumnSelected;
        // Set cell contents:
        // * For all cells: set `config.value` (writable property)
        // * For cells outside of row handle column: also set `config.dataRow` for use by valOrFunc
        // * For non-data row tree column cells, do nothing (these cells render blank so value is undefined)
        // if (!isHandleColumn) {
        config.dataRow = subgrid.getSingletonDataRow(dataRow);
        // } else if (isDataRow) {
            // row handle for a data row
            // if (config.rowHeaderNumbers) {
            //     value = r + 1; // row number is 1-based
            // }
        // } else
        if (isHeaderRow) {
            // row handle for header row: gets "master" checkbox
            config.allRowsSelected = selection.allRowsSelected;
        }

        config.isSelected = isSelected;
        config.isMainRow = isMainRow;
        config.isHeaderRow = isHeaderRow;
        config.isFilterRow = isFilterRow;
        config.isUserDataArea = isMainRow;
        const hoverCell = grid.mouse.hoverCell;
        const hasMouse = grid.canvasEx.hasMouse;
        const columnHovered =
            hasMouse &&
            (hoverCell !== undefined) &&
            (hoverCell.visibleColumn.activeColumnIndex === activeColumnIndex);
        const rowHovered =
            hasMouse &&
            subgrid.isMain &&
            (hoverCell !== undefined) &&
            (hoverCell.visibleRow.index === cell.visibleRow.index);

        config.isColumnHovered = columnHovered;
        config.isRowHovered = rowHovered;
        config.bounds = cell.bounds;
        const cellHovered = rowHovered && columnHovered;
        config.isCellHovered = cellHovered;
        config.isCellSelected = isCellSelected;
        config.isRowFocused = grid.focus.isMainSubgridRowFocused(dataRow);
        config.isRowSelected = isRowSelected;
        config.isColumnSelected = isColumnSelected;
        config.isInCurrentSelectionRectangle = selection.isPointInLastArea(activeColumnIndex, dataRow);
        config.prefillColor = prefillColor;

        config.value = value;

        config.snapshot = cell.paintSnapshot as SimpleCellPaintConfig.Snapshot; // supports partial render

        this._config = config;
    }

    paint(gc: CanvasRenderingContext2DEx): CellPainter.PaintInfo {
        const config = this._config;

        const bounds = config.bounds;
        const x = bounds.x;
        const y = bounds.y;
        const width = bounds.width;
        const height = bounds.height;
        const partialRender = config.prefillColor === undefined; // signifies abort before rendering if same
        let valWidth = 0;
        let hover: GridSettings.HoverColors;
        let hoverColor: string | undefined;
        let selectColor: string | undefined;
        let foundationColor = false;
        let inheritsBackgroundColor: boolean;
        let c: number;

        // setting gc properties are expensive, let's not do it needlessly

        // Note: vf == 0 is fastest equivalent of vf === 0 || vf === false which excludes NaN, null, undefined

        const valText = config.value as string;

        const textFont = config.isSelected ? config.foregroundSelectionFont : config.font;

        const textColor = gc.cache.strokeStyle = config.isSelected
            ? config.foregroundSelectionColor
            : config.color;

        const snapshot = config.snapshot as SimpleCellPaintConfig.Snapshot | undefined;
        let snapshotColorsLength: number;
        let same: boolean;
        if (snapshot === undefined) {
            snapshotColorsLength = 0;
            same = false;
        } else {
            snapshotColorsLength = snapshot.colors.length;
            same = partialRender &&
                valText === snapshot.value &&
                textFont === snapshot.textFont &&
                textColor === snapshot.textColor;
        }

        // fill background only if our bgColor is populated or we are a selected cell
        const colors: string[] = [];
        c = 0;
        if (config.isCellHovered && config.hoverCellHighlight.enabled) {
            hoverColor = config.hoverCellHighlight.backgroundColor;
        } else if (config.isRowHovered && (hover = config.hoverRowHighlight).enabled) {
            hoverColor = !hover.header || hover.header.backgroundColor === undefined ? hover.backgroundColor : hover.header.backgroundColor;
        } else if (config.isColumnHovered && (hover = config.hoverColumnHighlight).enabled) {
            hoverColor = config.isMainRow || !hover.header || hover.header.backgroundColor === undefined ? hover.backgroundColor : hover.header.backgroundColor;
        }
        if (gc.alpha(hoverColor) < 1) {
            if (config.isSelected) {
                selectColor = config.backgroundSelectionColor;
            }

            if (gc.alpha(selectColor) < 1) {
                inheritsBackgroundColor = (config.backgroundColor === config.prefillColor);
                if (!inheritsBackgroundColor) {
                    foundationColor = true;
                    colors.push(config.backgroundColor);
                    same = same &&
                        snapshot !== undefined &&
                        foundationColor === snapshot.foundationColor &&
                        config.backgroundColor === snapshot.colors[c++];
                }
            }

            if (selectColor !== undefined) {
                colors.push(selectColor);
                same = same &&
                    snapshot !== undefined &&
                    selectColor === snapshot.colors[c++];
            }
        }
        if (hoverColor !== undefined) {
            colors.push(hoverColor);
            same = same && snapshot !== undefined && hoverColor === snapshot.colors[c++];
        }

        // return a snapshot to save in View cell for future comparisons by partial renderer
        const newSnapshot: SimpleCellPaintConfig.Snapshot = {
            value: valText,
            textColor,
            textFont,
            foundationColor,
            colors
        };

        // todo check if icons have changed
        if (same && c === snapshotColorsLength) {
            return {
                width: undefined,
                snapshot: newSnapshot,
            };
        } else {
            layerColors(gc, colors, x, y, width, height, foundationColor);

            // Measure left and right icons, needed for rendering and for return value (min width)
            const leftPadding = config.cellPadding;
            const rightPadding = config.cellPadding;

            // draw text
            gc.cache.fillStyle = textColor;
            gc.cache.font = textFont;
            valWidth = config.isHeaderRow && config.headerTextWrapping
                ? renderMultiLineText(gc, config, valText, leftPadding, rightPadding)
                : renderSingleLineText(gc, config, valText, leftPadding, rightPadding);

            return {
                width: leftPadding + valWidth + rightPadding,
                snapshot: newSnapshot,
            };
        }
    }
}

/* [SIZE NOTE] (11/1/2018): Always call `drawImage` with explicit width and height overload.
 * Possible browser bug: Although 3rd and 4th parameters to `drawImage` are optional,
 * when image data derived from SVG source, some browsers (e.g., Chrome 70) implementation
 * of `drawImage` only respects _implicit_ `width` x `height` specified in the root <svg>
 * element `width` & `height` attributes. Otherwise, image is copied into canvas using its
 * `naturalWidth` x `naturalHeight`. That is, _explict_ settings of `width` & `height`
 * (i.e, via property assignment, calling setAttribute, or in `new Image` call) have no
 * effect on `drawImage` in the case of SVGs on these browsers.
 */

/**
 * @summary Renders single line text.
 * @param val - The text to render in the cell.
 */
function renderMultiLineText(gc: CanvasRenderingContext2DEx, config: SimpleCellPaintConfig, val: string, leftPadding: number, rightPadding: number) {
    const x = config.bounds.x;
    const y = config.bounds.y;
    const width = config.bounds.width;
    const height = config.bounds.height;
    const cleanVal = (val + '').trim().replace(WHITESPACE, ' '); // trim and squeeze whitespace
    const lines = findLines(gc, config, cleanVal.split(' '), width);

    if (lines.length === 1) {
        return renderSingleLineText(gc, config, cleanVal, leftPadding, rightPadding);
    }

    let halignOffset = leftPadding;
    let valignOffset = config.voffset;
    const halign = config.halign;
    const textHeight = gc.getTextHeight(config.font).height;

    switch (halign) {
        case 'right':
            halignOffset = width - rightPadding;
            break;
        case 'center':
            halignOffset = width / 2;
            break;
    }

    const hMin = 0;
    const vMin = Math.ceil(textHeight / 2);

    valignOffset += Math.ceil((height - (lines.length - 1) * textHeight) / 2);

    halignOffset = Math.max(hMin, halignOffset);
    valignOffset = Math.max(vMin, valignOffset);

    gc.cache.save(); // define a clipping region for cell
    gc.beginPath();
    gc.rect(x, y, width, height);
    gc.clip();

    gc.cache.textAlign = halign;
    gc.cache.textBaseline = 'middle';

    for (let i = 0; i < lines.length; i++) {
        gc.fillText(lines[i], x + halignOffset, y + valignOffset + (i * textHeight));
    }

    gc.cache.restore(); // discard clipping region

    return width;
}

/**
 * @summary Renders single line text.
 * @param val - The text to render in the cell.
 */
function renderSingleLineText(gc: CanvasRenderingContext2DEx, config: SimpleCellPaintConfig, val: string, leftPadding: number, rightPadding: number) {
    let x = config.bounds.x;
    let y = config.bounds.y;
    const width = config.bounds.width;
    let halignOffset = leftPadding;
    const halign = config.halign;
    let minWidth: number;

    const rightHaligned = halign === 'right';
    const truncateWidth = width - rightPadding - leftPadding;
    if (config.columnAutosizing) {
        const truncatedResult = gc.getTextWidthTruncated(val, truncateWidth, config.textTruncateType, false, rightHaligned);
        minWidth = truncatedResult.textWidth;
        val = truncatedResult.text ?? val;
        if (halign === 'center') {
            halignOffset = (width - truncatedResult.textWidth) / 2;
        }
    } else {
        const truncatedResult = gc.getTextWidthTruncated(val, truncateWidth, config.textTruncateType, true, rightHaligned);
        minWidth = 0;
        if (truncatedResult.text !== undefined) {
            // not enough space to show the extire text, the text is truncated to fit for the width
            val = truncatedResult.text;
        } else {
            // enought space to show the entire text
            if (halign === 'center') {
                halignOffset = (width - truncatedResult.textWidth) / 2;
            }
        }
    }

    if (val !== null) {
        // the position for x need to be relocated.
        // for canvas to print text, when textAlign is 'end' or 'right'
        // it will start with position x and print the text on the left
        // so the exact position for x need to increase by the acutal width - rightPadding
        x += halign === 'right'
            ? width - rightPadding
            : Math.max(leftPadding, halignOffset);
        y += Math.floor(config.bounds.height / 2);

        if (config.isUserDataArea) {
            if (config.link) {
                if (config.isCellHovered || !config.linkOnHover) {
                    if (config.linkColor) {
                        gc.cache.strokeStyle = config.linkColor;
                    }
                    gc.beginPath();
                    underline(config, gc, val, x, y, 1);
                    gc.stroke();
                    gc.closePath();
                }
                if (config.linkColor && (config.isCellHovered || !config.linkColorOnHover)) {
                    gc.cache.fillStyle = config.linkColor;
                }
            }

            if (config.strikeThrough === true) {
                gc.beginPath();
                strikeThrough(config, gc, val, x, y, 1);
                gc.stroke();
                gc.closePath();
            }
        }

        gc.cache.textAlign = halign === 'right'
            ? 'right'
            : 'left';
        gc.cache.textBaseline = 'middle';
        gc.fillText(val, x, y);
    }

    return minWidth;
}

function findLines(gc: CanvasRenderingContext2DEx, config: SimpleCellPaintConfig, words: string[], width: number) {

    if (words.length <= 1) {
        return words;
    } else {
        // starting with just the first word...
        let stillFits: boolean;
        let line = [words.shift() as string];
        while (
            // so lone as line still fits within current column...
            (stillFits = gc.getTextWidth(line.join(' ')) < width)
            // ...AND there are more words available...
            && words.length > 0
        ) {
            // ...add another word to end of line and retest
            line.push(words.shift() as string);
        }

        if (
            !stillFits && // if line is now too long...
            line.length > 1 // ...AND is multiple words...
        ) {
            words.unshift(line.pop() as string); // ...back off by (i.e., remove) one word
        }

        line = [line.join(' ')];

        if (words.length) {
            // if there's anything left...
            line = line.concat(findLines(gc, config, words, width)); // ...break it up as well
        }

        return line;
    }
}

function strikeThrough(config: SimpleCellPaintConfig, gc: CanvasRenderingContext2DEx, text: string, x: number, y: number, thickness: number) {
    const textWidth = gc.getTextWidth(text);

    switch (gc.cache.textAlign) {
        case 'center':
            x -= textWidth / 2;
            break;
        case 'right':
            x -= textWidth;
            break;
    }

    y = Math.round(y) + 0.5;

    gc.cache.lineWidth = thickness;
    gc.moveTo(x - 1, y);
    gc.lineTo(x + textWidth + 1, y);
}

function underline(config: SimpleCellPaintConfig, gc: CanvasRenderingContext2DEx, text: string, x: number, y: number, thickness: number) {
    const textHeight = gc.getTextHeight(config.font).height;
    const textWidth = gc.getTextWidth(text);

    switch (gc.cache.textAlign) {
        case 'center':
            x -= textWidth / 2;
            break;
        case 'right':
            x -= textWidth;
            break;
    }

    y = Math.ceil(y) + Math.round(textHeight / 2) - 0.5;

    //gc.beginPath();
    gc.cache.lineWidth = thickness;
    gc.moveTo(x, y);
    gc.lineTo(x + textWidth, y);
}

function layerColors(gc: CanvasRenderingContext2DEx, colors: string[], x: number, y: number, width: number, height: number, foundationColor: boolean) {
    for (let i = 0; i < colors.length; i++) {
        if (foundationColor && !i) {
            gc.clearFill(x, y, width, height, colors[i]);
        } else {
            gc.cache.fillStyle = colors[i];
            gc.fillRect(x, y, width, height);
        }
    }
}
