
import {
    CanvasRenderingContext2DEx,
    CellEditor,
    CellPainter,
    CellSettingsAccessor,
    GridSettings,
    IndexSignatureHack,
    RectangleInterface,
    Revgrid,
    ViewCell,
} from '../grid/grid-public-api';

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
export class TextCellPainter implements CellPainter {
    private readonly _settingsAccessor = new CellSettingsAccessor();

    private _cell: ViewCell;
    private _cellEditorPainter: CellEditor.Painter | undefined;
    private _grid: Revgrid;

    setCell(cell: ViewCell, cellEditorPainter: CellEditor.Painter | undefined, grid: Revgrid) {
        this._cell = cell;
        this._cellEditorPainter = cellEditorPainter;
        this._grid = grid;
    }

    paint(gc: CanvasRenderingContext2DEx, prefillColor: string | undefined): number | undefined {
        const grid = this._grid;
        const cell = this._cell;

        this._settingsAccessor.setColumn(cell.viewLayoutColumn.column, cell.isHeaderCell, cell.isFilterCell);
        const settings = this._settingsAccessor;

        const selection = grid.selection;
        const activeColumnIndex = cell.viewLayoutColumn.activeColumnIndex;
        const subgridRowIndex = cell.viewLayoutRow.subgridRowIndex;

        // setting gc properties are expensive, let's not do it needlessly

        // Note: vf == 0 is fastest equivalent of vf === 0 || vf === false which excludes NaN, null, undefined


        const subgrid = cell.subgrid;
        const {
            rowSelected: isRowSelected,
            columnSelected: isColumnSelected,
            cellSelected: isCellSelected
        } = selection.getCellSelectedAreaTypes(activeColumnIndex, subgridRowIndex, subgrid);
        const isSelected = isCellSelected || isRowSelected || isColumnSelected;

        const textFont = isSelected ? settings.foregroundSelectionFont : settings.font;

        const textColor = gc.cache.strokeStyle = isSelected
            ? settings.foregroundSelectionColor
            : settings.color;

        const value = subgrid.getValue(cell.viewLayoutColumn.column, subgridRowIndex);
        const valText = value as string;

        const fingerprint = cell.paintFingerprint as PaintFingerprint | undefined;
        let fingerprintColorsLength: number;
        let same: boolean;
        if (fingerprint === undefined) {
            fingerprintColorsLength = 0;
            same = false;
        } else {
            fingerprintColorsLength = fingerprint.layerColors.length;
            const partialRender = prefillColor === undefined; // signifies abort before rendering if same
            same = partialRender &&
                valText === fingerprint.value &&
                textFont === fingerprint.textFont &&
                textColor === fingerprint.textColor;
        }

        const isMainSubgrid = subgrid.isMain;

        // Since this painter supports colors with alpha, we need to layer colors so that they blend
        // fill background only if our bgColor is populated or we are a selected cell
        const layerColors: string[] = [];
        let layerColorIndex = 0;

        const hoverCell = grid.mouse.hoverCell;
        const hasMouse = grid.canvasEx.hasMouse;
        const columnHovered =
            hasMouse &&
            (hoverCell !== undefined) &&
            (hoverCell.viewLayoutColumn.activeColumnIndex === activeColumnIndex);
        const rowHovered =
            hasMouse &&
            isMainSubgrid &&
            (hoverCell !== undefined) &&
            (hoverCell.viewLayoutRow.index === cell.viewLayoutRow.index);
        const cellHovered = rowHovered && columnHovered;

        let hoverColor: string | undefined;
        if (cellHovered && settings.hoverCellHighlight.enabled) {
            hoverColor = settings.hoverCellHighlight.backgroundColor;
        } else {
            let hover: GridSettings.HoverColors;
            if (rowHovered && (hover = settings.hoverRowHighlight).enabled) {
                hoverColor = !hover.header || hover.header.backgroundColor === undefined ? hover.backgroundColor : hover.header.backgroundColor;
            } else {
                if (columnHovered && (hover = settings.hoverColumnHighlight).enabled) {
                    hoverColor = isMainSubgrid || !hover.header || hover.header.backgroundColor === undefined ? hover.backgroundColor : hover.header.backgroundColor;
                }
            }
        }

        let firstColorIsFill = false;
        if (gc.alpha(hoverColor) < 1) {
            let selectColor: string | undefined;
            if (isSelected) {
                selectColor = settings.backgroundSelectionColor;
            }

            if (gc.alpha(selectColor) < 1) {
                const inheritsBackgroundColor = (settings.backgroundColor === prefillColor);
                if (!inheritsBackgroundColor) {
                    firstColorIsFill = true;
                    layerColors.push(settings.backgroundColor);
                    same = same &&
                        fingerprint !== undefined &&
                        firstColorIsFill === fingerprint.firstColorIsFill && settings.backgroundColor === fingerprint.layerColors[layerColorIndex++];
                }
            }

            if (selectColor !== undefined) {
                layerColors.push(selectColor);
                same = same &&
                    fingerprint !== undefined &&
                    selectColor === fingerprint.layerColors[layerColorIndex++];
            }
        }
        if (hoverColor !== undefined) {
            layerColors.push(hoverColor);
            same = same && fingerprint !== undefined && hoverColor === fingerprint.layerColors[layerColorIndex++];
        }

        const cellFocused = isMainSubgrid && grid.focus.isMainSubgridCellFocused(activeColumnIndex, subgridRowIndex);
        let borderColor: string | undefined;
        if (cellFocused) {
            borderColor = settings.focusedCellBorderColor;
        } else {
            borderColor = undefined;
        }
        same &&= fingerprint !== undefined && fingerprint.borderColor === borderColor;

        const cellEditorPainter = this._cellEditorPainter;
        const editorPaint = cellEditorPainter === undefined
        same &&= fingerprint !== undefined && fingerprint.editorPaint === editorPaint;

        // return a fingerprint to save in View cell for future comparisons by partial renderer
        const newFingerprint: PaintFingerprint = {
            value: valText,
            textColor,
            textFont,
            borderColor,
            firstColorIsFill,
            layerColors,
            editorPaint,
        };
        cell.paintFingerprint = newFingerprint; // supports partial render

        if (same && layerColorIndex === fingerprintColorsLength) {
            return undefined;
        } else {
            const bounds = cell.bounds;
            const leftPadding = settings.cellPadding;
            const rightPadding = settings.cellPadding;

            if (editorPaint) {
                paintLayerColors(gc, bounds, layerColors, firstColorIsFill);
                checkPaintBorder(gc, bounds, borderColor);
                // draw text
                gc.cache.fillStyle = textColor;
                gc.cache.font = textFont;
                return subgrid.isHeader && settings.headerTextWrapping
                    ? renderMultiLineText(gc, settings, bounds, valText, leftPadding, rightPadding, isMainSubgrid, cellHovered)
                    : renderSingleLineText(gc, settings, bounds, valText, leftPadding, rightPadding, isMainSubgrid, cellHovered);
            } else {
                let valWidth: number | undefined;

                if (cellEditorPainter.beforeCellBackground) {
                    cellEditorPainter.paint(cell, settings);
                }
                if (cellEditorPainter.paintCellBackground) {
                    paintLayerColors(gc, bounds, layerColors, firstColorIsFill);
                }
                if (cellEditorPainter.beforeCellBorder) {
                    cellEditorPainter.paint(cell, settings);
                }
                if (cellEditorPainter.paintCellBorder) {
                    checkPaintBorder(gc, bounds, borderColor);
                }
                if (cellEditorPainter.beforeCellContent) {
                    cellEditorPainter.paint(cell, settings);
                }
                if (cellEditorPainter.paintCellContent) {
                    // draw text - should be exactly the same as above (apart from the return)
                    gc.cache.fillStyle = textColor;
                    gc.cache.font = textFont;
                    valWidth = subgrid.isHeader && settings.headerTextWrapping
                        ? renderMultiLineText(gc, settings, bounds, valText, leftPadding, rightPadding, isMainSubgrid, cellHovered)
                        : renderSingleLineText(gc, settings, bounds, valText, leftPadding, rightPadding, isMainSubgrid, cellHovered);
                }
                if (cellEditorPainter.afterCell) {
                    valWidth = cellEditorPainter.paint(cell, settings);
                }

                if (valWidth === undefined) {
                    return undefined;
                } else {
                    return valWidth
                }
            }
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

export interface PaintFingerprintInterface {
    readonly value: string;
    readonly textColor: string;
    readonly textFont: string;
    readonly borderColor: string | undefined;
    readonly firstColorIsFill: boolean;
    readonly layerColors: string[];
    readonly editorPaint: boolean;
}

export type PaintFingerprint = IndexSignatureHack<PaintFingerprintInterface>;

/**
 * @summary Renders single line text.
 * @param val - The text to render in the cell.
 */
function renderMultiLineText(
    gc: CanvasRenderingContext2DEx,
    settings: CellSettingsAccessor,
    bounds: RectangleInterface,
    val: string,
    leftPadding: number,
    rightPadding: number,
    isMainSubgrid: boolean,
    cellHovered: boolean,
) {
    const x = bounds.x;
    const y = bounds.y;
    const width = bounds.width;
    const height = bounds.height;
    const cleanVal = (val + '').trim().replace(WHITESPACE, ' '); // trim and squeeze whitespace
    const lines = findLines(gc, cleanVal.split(' '), width);

    if (lines.length === 1) {
        return renderSingleLineText(gc, settings, bounds, cleanVal, leftPadding, rightPadding, isMainSubgrid, cellHovered);
    } else {
        let halignOffset = leftPadding;
        let valignOffset = settings.voffset;
        const halign = settings.halign;
        const textHeight = gc.getTextHeight(settings.font).height;

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

        return leftPadding + width + rightPadding;
    }
}

/**
 * @summary Renders single line text.
 * @param val - The text to render in the cell.
 */
function renderSingleLineText(
    gc: CanvasRenderingContext2DEx,
    settings: CellSettingsAccessor,
    bounds: RectangleInterface,
    val: string,
    leftPadding: number,
    rightPadding: number,
    isMainSubgrid: boolean,
    cellHovered: boolean,
) {
    let x = bounds.x;
    let y = bounds.y;
    const width = bounds.width;
    let halignOffset = leftPadding;
    const halign = settings.halign;
    let minWidth: number;

    const rightHaligned = halign === 'right';
    const truncateWidth = width - rightPadding - leftPadding;
    if (settings.columnAutosizing) {
        const truncatedResult = gc.getTextWidthTruncated(val, truncateWidth, settings.textTruncateType, false, rightHaligned);
        minWidth = truncatedResult.textWidth;
        val = truncatedResult.text ?? val;
        if (halign === 'center') {
            halignOffset = (width - truncatedResult.textWidth) / 2;
        }
    } else {
        const truncatedResult = gc.getTextWidthTruncated(val, truncateWidth, settings.textTruncateType, true, rightHaligned);
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
        y += Math.floor(bounds.height / 2);

        if (isMainSubgrid) {
            if (settings.link) {
                if (cellHovered || !settings.linkOnHover) {
                    if (settings.linkColor) {
                        gc.cache.strokeStyle = settings.linkColor;
                    }
                    gc.beginPath();
                    underline(gc, settings, val, x, y, 1);
                    gc.stroke();
                    gc.closePath();
                }
                if (settings.linkColor && (cellHovered || !settings.linkColorOnHover)) {
                    gc.cache.fillStyle = settings.linkColor;
                }
            }

            if (settings.strikeThrough === true) {
                gc.beginPath();
                strikeThrough(gc, val, x, y, 1);
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

    return leftPadding + minWidth + rightPadding;
}

function findLines(gc: CanvasRenderingContext2DEx, words: string[], width: number) {

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
            line = line.concat(findLines(gc, words, width)); // ...break it up as well
        }

        return line;
    }
}

function strikeThrough(gc: CanvasRenderingContext2DEx, text: string, x: number, y: number, thickness: number) {
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

function underline(gc: CanvasRenderingContext2DEx, settings: CellSettingsAccessor, text: string, x: number, y: number, thickness: number) {
    const textHeight = gc.getTextHeight(settings.font).height;
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

function paintLayerColors(gc: CanvasRenderingContext2DEx, bounds: RectangleInterface, colors: string[], firstColorIsFill: boolean) {
    const x = bounds.x;
    const y = bounds.y;
    const width = bounds.width;
    const height = bounds.height;

    for (let i = 0; i < colors.length; i++) {
        if (firstColorIsFill && i === 0) {
            gc.clearFill(x, y, width, height, colors[i]);
        } else {
            gc.cache.fillStyle = colors[i];
            gc.fillRect(x, y, width, height);
        }
    }
}

function checkPaintBorder(gc: CanvasRenderingContext2DEx, bounds: RectangleInterface, borderColor: string | undefined) {
    // paint border if required
    if (borderColor !== undefined) {
        gc.beginPath();
        gc.cache.strokeStyle = borderColor;
        gc.cache.lineDash = [1, 2];
        gc.strokeRect(bounds.x + 0.5, bounds.y + 0.5, bounds.width - 2, bounds.height - 2);
        gc.cache.lineDash = [];
    }
}
