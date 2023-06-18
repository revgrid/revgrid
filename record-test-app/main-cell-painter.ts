import {
    CellPainter,
    DatalessViewCell,
    RevRecordMainDataServer,
    RevRecordRecentChangeTypeId,
    RevRecordValueRecentChangeTypeId,
    StandardBehavioredColumnSettings,
    StandardTextCellPainter,
    UnreachableCaseError
} from '..';
import { AppBehavioredGridSettings } from './app-behaviored-grid-settings';
import { GridField } from './grid-field';
import { RecordGrid } from './record-grid';

export class MainCellPainter
    extends StandardTextCellPainter<AppBehavioredGridSettings, StandardBehavioredColumnSettings, GridField>
    implements CellPainter<StandardBehavioredColumnSettings, GridField> {

    protected declare readonly _dataServer: RevRecordMainDataServer<StandardBehavioredColumnSettings, GridField>;

    constructor (
        grid: RecordGrid,
        dataServer: RevRecordMainDataServer<StandardBehavioredColumnSettings, GridField>,
        private readonly _getValueRecentChangeTypeIdEventer: AppCellPainter.GetValueRecentChangeTypeIdEventer,
        private readonly _getRecordRecentChangeTypeIdEventer: AppCellPainter.GetRecordRecentChangeTypeIdEventer,
    ) {
        super(grid, dataServer);
    }

    paint(cell: DatalessViewCell<StandardBehavioredColumnSettings, GridField>, prefillColor: string | undefined): number | undefined {
        const grid = this._grid;

        const gridSettings = this._gridSettings;
        const columnSettings = cell.columnSettings;
        this.setColumnSettings(columnSettings);

        const gc = this._renderingContext;
        const subgridRowIndex = cell.viewLayoutRow.subgridRowIndex;

        const altRow = subgridRowIndex % 2 === 1;

        const foreColor = gridSettings.color;

        let bkgdColor: string;
        const subgrid = cell.subgrid;
        const isMainSubgrid = subgrid.isMain;
        const isRowFocused = isMainSubgrid && grid.focus.isMainSubgridRowFocused(subgridRowIndex);
        if (isRowFocused && gridSettings.focusedRowBackgroundColor !== undefined) {
            bkgdColor = gridSettings.focusedRowBackgroundColor;
        } else {
            //  bkgdColor = config.backgroundColor;
            bkgdColor = altRow
                ? gridSettings.alternateBackgroundColor
                : gridSettings.backgroundColor;
        }

        /* if (altRow) {
            foreColor = _settings.colorMap.foreBaseAlt;
        } else {
            foreColor = _settings.colorMap.foreBase;
        }*/

        const graphicId = GraphicId.None;
        let proportionBarGraphic: ProportionBarGraphic | undefined;

        const field = cell.viewLayoutColumn.column.field;
        const foreText = this._dataServer.getViewValue(field, subgridRowIndex) as string;
        const foreFont = gridSettings.font;
        let internalBorderRowOnly: boolean;
        const valueRecentChangeTypeId = this._getValueRecentChangeTypeIdEventer(field, subgridRowIndex);

        let internalBorderColor: string | undefined;
        if (valueRecentChangeTypeId !== undefined) {
            internalBorderRowOnly = false;
            switch (valueRecentChangeTypeId) {
                case RevRecordValueRecentChangeTypeId.Update:
                    internalBorderColor = gridSettings.valueRecentlyModifiedBorderColor;
                    break;
                case RevRecordValueRecentChangeTypeId.Increase:
                    internalBorderColor = gridSettings.valueRecentlyModifiedUpBorderColor;
                    break;
                case RevRecordValueRecentChangeTypeId.Decrease:
                    internalBorderColor = gridSettings.valueRecentlyModifiedDownBorderColor;
                    break;
                default:
                    throw new UnreachableCaseError('TCPPRVCTU02775', valueRecentChangeTypeId);
            }
        } else {
            const rowRecentChangeTypeId = this._getRecordRecentChangeTypeIdEventer(subgridRowIndex);
            if (rowRecentChangeTypeId !== undefined) {
                internalBorderRowOnly = true;

                switch (rowRecentChangeTypeId) {
                    case RevRecordRecentChangeTypeId.Update:
                        internalBorderColor = gridSettings.recordRecentlyUpdatedBorderColor;
                        break;
                    case RevRecordRecentChangeTypeId.Insert:
                        internalBorderColor = gridSettings.recordRecentlyInsertedBorderColor;
                        break;
                    case RevRecordRecentChangeTypeId.Remove:
                        internalBorderColor = undefined;
                        break;
                    default:
                        throw new UnreachableCaseError('TCPPRRCTU02775', rowRecentChangeTypeId);
                }

            } else {
                internalBorderRowOnly = false;
                internalBorderColor = undefined;
            }
        }

        let bkgdRenderingRequired: boolean;
        let textProcessingRequired: boolean;
        let internalBorderProcessingRequired: boolean;
        if (prefillColor !== undefined) {
            bkgdRenderingRequired = prefillColor !== bkgdColor;
            textProcessingRequired = true;
            internalBorderProcessingRequired = true;
        } else {
            const fingerprint = cell.paintFingerprint as PaintFingerprint | undefined;
            if (fingerprint === undefined) {
                bkgdRenderingRequired = true;
                textProcessingRequired = true;
                internalBorderProcessingRequired = true;
            } else {
                if (fingerprint.bkgdColor !== bkgdColor) {
                    bkgdRenderingRequired = true;
                    textProcessingRequired = true;
                    internalBorderProcessingRequired = true;
                } else {
                    bkgdRenderingRequired = false;
                    textProcessingRequired =
                        fingerprint.foreColor !== foreColor
                        || fingerprint.foreText !== foreText
                        || graphicId !== GraphicId.None;
                    internalBorderProcessingRequired =
                        fingerprint.internalBorderColor !== internalBorderColor
                        || fingerprint.internalBorderRowOnly !== internalBorderRowOnly
                        || graphicId !== GraphicId.None;
                }
            }
        }

        if (
            !bkgdRenderingRequired &&
            !textProcessingRequired &&
            !internalBorderProcessingRequired
        ) {
            return undefined;
        } else {
            const newFingerprint: PaintFingerprint = {
                bkgdColor,
                foreColor,
                internalBorderColor,
                internalBorderRowOnly,
                foreText,
            };

            cell.paintFingerprint = newFingerprint;

            const bounds = cell.bounds;
            const x = bounds.x;
            const y = bounds.y;
            const width = bounds.width;
            const height = bounds.height;

            if (bkgdRenderingRequired) {
                gc.cache.fillStyle = bkgdColor;
                gc.fillRect(x, y, width, height);
            }

            if (isRowFocused && gridSettings.focusedRowBorderColor !== undefined) {
                const borderWidth = gridSettings.focusedRowBorderWidth;
                gc.cache.strokeStyle = gridSettings.focusedRowBorderColor;
                gc.cache.lineWidth = borderWidth;
                const midOffset = borderWidth / 2;
                gc.beginPath();
                gc.moveTo(x, y + midOffset);
                gc.lineTo(x + width, y + midOffset);
                gc.stroke();

                gc.beginPath();
                gc.moveTo(x, y + height - midOffset);
                gc.lineTo(x + width, y + height - midOffset);
                gc.stroke();
            }

            if (
                internalBorderProcessingRequired &&
                internalBorderColor !== undefined
            ) {
                gc.cache.strokeStyle = internalBorderColor;
                gc.cache.lineWidth = 1;
                if (internalBorderRowOnly) {
                    gc.beginPath();
                    gc.moveTo(x, y + 0.5);
                    gc.lineTo(x + width, y + 0.5);
                    gc.stroke();

                    gc.beginPath();
                    gc.moveTo(x, y + height - 0.5);
                    gc.lineTo(x + width, y + height - 0.5);
                    gc.stroke();
                } else {
                    gc.beginPath();
                    gc.strokeRect(x + 0.5, y + 0.5, width - 2, height - 2);
                }
            }

            const cellPadding = gridSettings.cellPadding;

            if (graphicId !== GraphicId.None) {
                switch (graphicId) {
                    case GraphicId.UndefinedColor: {
                        const paddedLeftX = x + cellPadding;
                        const paddedRightX = x + width - cellPadding;
                        const paddedTopY = y + cellPadding;
                        const paddedBottomY = y + height - cellPadding;

                        gc.cache.strokeStyle = foreColor;
                        gc.beginPath();
                        gc.moveTo(paddedLeftX, paddedTopY);
                        gc.lineTo(paddedRightX, paddedBottomY);
                        gc.stroke();
                        gc.beginPath();
                        gc.moveTo(paddedRightX, paddedTopY);
                        gc.lineTo(paddedLeftX, paddedBottomY);
                        gc.stroke();
                        break;
                    }

                    case GraphicId.InheritColor: {
                        const inheritColorCenterY = y + height / 2 - 0.5;

                        gc.cache.strokeStyle = foreColor;
                        gc.beginPath();
                        gc.moveTo(x + cellPadding + 2, inheritColorCenterY);
                        gc.lineTo(
                            x + width - cellPadding - 2,
                            inheritColorCenterY
                        );
                        gc.stroke();
                        break;
                    }

                    case GraphicId.ProportionBar: {
                        if (proportionBarGraphic !== undefined) {
                            const barWidth =
                                proportionBarGraphic.proportion * width;
                            gc.cache.fillStyle = proportionBarGraphic.color;
                            gc.fillRect(x, y, barWidth, height);
                        }
                        break;
                    }

                    case GraphicId.LineThrough: {
                        const lineThroughcenterY = y + height / 2 - 0.5;

                        gc.cache.strokeStyle = foreColor;
                        gc.beginPath();
                        gc.moveTo(x, lineThroughcenterY);
                        gc.lineTo(x + width, lineThroughcenterY);
                        gc.stroke();
                        break;
                    }

                    default:
                        throw new UnreachableCaseError('GCRDGCRP2284', graphicId);
                }
            }

            if (textProcessingRequired && foreText === '') {
                return undefined;
            } else {
                gc.cache.fillStyle = foreColor;
                gc.cache.font = foreFont;
                return this.renderSingleLineText(bounds, foreText, cellPadding, cellPadding);
            }
        }
    }
}

export namespace AppCellPainter {
    export type GetValueRecentChangeTypeIdEventer = (this: void, field: GridField, subgridRowIndex: number) => RevRecordValueRecentChangeTypeId;
    export type GetRecordRecentChangeTypeIdEventer = (this: void, subgridRowIndex: number) => RevRecordRecentChangeTypeId;
}

const enum GraphicId {
    None,
    UndefinedColor,
    InheritColor,
    ProportionBar,
    LineThrough,
}

interface PaintFingerprintInterface {
    bkgdColor: string;
    foreColor: string;
    internalBorderColor: string | undefined;
    internalBorderRowOnly: boolean;
    foreText: string;
}

type PaintFingerprint = IndexSignatureHack<PaintFingerprintInterface>;

interface ProportionBarGraphic {
    color: string;
    proportion: number;
}
type IndexSignatureHack<T> = { [K in keyof T]: IndexSignatureHack<T[K]> };
