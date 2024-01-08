import { BehavioredColumnSettings, ColumnSettings, GridSettings, gridSettingChangeInvalidateTypeIds } from '../../grid/grid-public-api';
import { InMemoryBehavioredSettings } from './in-memory-behaviored-settings';

/** @public */
export class InMemoryBehavioredColumnSettings extends InMemoryBehavioredSettings implements BehavioredColumnSettings {
    private _backgroundColor: string | undefined;
    private _color: string | undefined;
    private _columnAutoSizingMax: number | undefined | null;
    private _columnClip: boolean | undefined | null;
    private _defaultColumnAutoSizing: boolean | undefined;
    private _defaultColumnWidth: number | undefined;
    private _editable: boolean | undefined;
    private _editOnClick: boolean | undefined;
    private _editOnDoubleClick: boolean | undefined;
    private _editOnFocusCell: boolean | undefined;
    private _editOnKeyDown: boolean | undefined;
    private _editorClickableCursorName: string | undefined | null;
    private _filterable: boolean | undefined;
    private _maximumColumnWidth: number | undefined | null;
    private _minimumColumnWidth: number | undefined;
    private _resizeColumnInPlace: boolean | undefined;
    private _sortOnDoubleClick: boolean | undefined;
    private _sortOnClick: boolean | undefined;

    constructor(readonly gridSettings: GridSettings) {
        super();
    }

    get backgroundColor() { return this._backgroundColor !== undefined ? this._backgroundColor : this.gridSettings.backgroundColor; }
    set backgroundColor(value: string) {
        if (value !== this._backgroundColor) {
            this.beginChange();
            this._backgroundColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.backgroundColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get color() { return this._color !== undefined ? this._color : this.gridSettings.color; }
    set color(value: string) {
        if (value !== this._color) {
            this.beginChange();
            this._color = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.color;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get columnAutoSizingMax() {
        if (this._columnAutoSizingMax === null) {
            return undefined;
        } else {
            return this._columnAutoSizingMax !== undefined ? this._columnAutoSizingMax : this.gridSettings.columnAutoSizingMax;
        }
    }
    set columnAutoSizingMax(value: number | undefined) {
        if (value !== this._columnAutoSizingMax) {
            this.beginChange();
            if (this._columnAutoSizingMax === undefined) {
                this._columnAutoSizingMax = null;
            } else {
                this._columnAutoSizingMax = value;
            }
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnAutoSizingMax;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get columnClip() {
        if (this._columnClip === null) {
            return undefined;
        } else {
            return this._columnClip !== undefined ? this._columnClip : this.gridSettings.columnClip;
        }
    }
    set columnClip(value: boolean | undefined) {
        if (value !== this._columnClip) {
            this.beginChange();
            if (this._columnClip === undefined) {
                this._columnClip = null;
            } else {
                this._columnClip = value;
            }
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnClip;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get defaultColumnAutoSizing() { return this._defaultColumnAutoSizing !== undefined ? this._defaultColumnAutoSizing : this.gridSettings.defaultColumnAutoSizing; }
    set defaultColumnAutoSizing(value: boolean) {
        if (value !== this._defaultColumnAutoSizing) {
            this.beginChange();
            this._defaultColumnAutoSizing = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.defaultColumnAutoSizing;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get defaultColumnWidth() { return this._defaultColumnWidth !== undefined ? this._defaultColumnWidth : this.gridSettings.defaultColumnWidth; }
    set defaultColumnWidth(value: number) {
        if (value !== this._defaultColumnWidth) {
            this.beginChange();
            this._defaultColumnWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.defaultColumnWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get editable() { return this._editable !== undefined ? this._editable : this.gridSettings.editable; }
    set editable(value: boolean) {
        if (value !== this._editable) {
            this.beginChange();
            this._editable = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editable;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get editOnClick() { return this._editOnClick !== undefined ? this._editOnClick : this.gridSettings.editOnClick; }
    set editOnClick(value: boolean) {
        if (value !== this._editOnClick) {
            this.beginChange();
            this._editOnClick = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnClick;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get editOnDoubleClick() { return this._editOnDoubleClick !== undefined ? this._editOnDoubleClick : this.gridSettings.editOnDoubleClick; }
    set editOnDoubleClick(value: boolean) {
        if (value !== this._editOnDoubleClick) {
            this.beginChange();
            this._editOnDoubleClick = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnDoubleClick;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get editOnFocusCell() { return this._editOnFocusCell !== undefined ? this._editOnFocusCell : this.gridSettings.editOnFocusCell; }
    set editOnFocusCell(value: boolean) {
        if (value !== this._editOnFocusCell) {
            this.beginChange();
            this._editOnFocusCell = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnFocusCell;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get editOnKeyDown() { return this._editOnKeyDown !== undefined ? this._editOnKeyDown : this.gridSettings.editOnKeyDown; }
    set editOnKeyDown(value: boolean) {
        if (value !== this._editOnKeyDown) {
            this.beginChange();
            this._editOnKeyDown = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnKeyDown;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get editorClickableCursorName() {
        if (this._editorClickableCursorName === null) {
            return undefined;
        } else {
            return this._editorClickableCursorName !== undefined ? this._editorClickableCursorName : this.gridSettings.editorClickableCursorName;
        }
    }
    set editorClickableCursorName(value: string | undefined) {
        if (value !== this._editorClickableCursorName) {
            this.beginChange();
            if (this._editorClickableCursorName === undefined) {
                this._editorClickableCursorName = null;
            } else {
                this._editorClickableCursorName = value;
            }
            const invalidateType = gridSettingChangeInvalidateTypeIds.editorClickableCursorName;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get filterable() { return this._filterable !== undefined ? this._filterable : this.gridSettings.filterable; }
    set filterable(value: boolean) {
        if (value !== this._filterable) {
            this.beginChange();
            this._filterable = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterable;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get maximumColumnWidth() {
        if (this._maximumColumnWidth === null) {
            return undefined;
        } else {
            return this._maximumColumnWidth !== undefined ? this._maximumColumnWidth : this.gridSettings.maximumColumnWidth;
        }
    }
    set maximumColumnWidth(value: number | undefined) {
        if (value !== this._maximumColumnWidth) {
            this.beginChange();
            if (this._maximumColumnWidth === undefined) {
                this._maximumColumnWidth = null;
            } else {
                this._maximumColumnWidth = value;
            }
            const invalidateType = gridSettingChangeInvalidateTypeIds.maximumColumnWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get minimumColumnWidth() { return this._minimumColumnWidth !== undefined ? this._minimumColumnWidth : this.gridSettings.minimumColumnWidth; }
    set minimumColumnWidth(value: number) {
        if (value !== this._minimumColumnWidth) {
            this.beginChange();
            this._minimumColumnWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.minimumColumnWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get resizeColumnInPlace() { return this._resizeColumnInPlace !== undefined ? this._resizeColumnInPlace : this.gridSettings.resizeColumnInPlace; }
    set resizeColumnInPlace(value: boolean) {
        if (value !== this._resizeColumnInPlace) {
            this.beginChange();
            this._resizeColumnInPlace = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.resizeColumnInPlace;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get sortOnDoubleClick() { return this._sortOnDoubleClick !== undefined ? this._sortOnDoubleClick : this.gridSettings.sortOnDoubleClick; }
    set sortOnDoubleClick(value: boolean) {
        if (value !== this._sortOnDoubleClick) {
            this.beginChange();
            this._sortOnDoubleClick = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.sortOnDoubleClick;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get sortOnClick() { return this._sortOnClick !== undefined ? this._sortOnClick : this.gridSettings.sortOnClick; }
    set sortOnClick(value: boolean) {
        if (value !== this._sortOnClick) {
            this.beginChange();
            this._sortOnClick = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.sortOnClick;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    merge(settings: Partial<ColumnSettings>) {
        this.beginChange();

        const requiredSettings = settings as Required<ColumnSettings>; // since we only iterate over keys that exist we can assume that settings is not partial in the switch loop
        for (const key in settings) {
            // Use loop so that compiler will report error if any setting missing
            const columnSettingsKey = key as keyof ColumnSettings;
            switch (columnSettingsKey) {
                case 'backgroundColor':
                    if (this._backgroundColor !== requiredSettings.backgroundColor) {
                        this._backgroundColor = requiredSettings.backgroundColor;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.backgroundColor);
                    }
                    break;
                case 'color':
                    if (this._color !== requiredSettings.color) {
                        this._color = requiredSettings.color;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.color);
                    }
                    break;
                case 'columnAutoSizingMax':
                    if (this._columnAutoSizingMax !== requiredSettings.columnAutoSizingMax) {
                        this._columnAutoSizingMax = requiredSettings.columnAutoSizingMax;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.columnAutoSizingMax);
                    }
                    break;
                case 'columnClip':
                    if (this._columnClip !== requiredSettings.columnClip) {
                        this._columnClip = requiredSettings.columnClip;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.columnClip);
                    }
                    break;
                case 'defaultColumnAutoSizing':
                    if (this._defaultColumnAutoSizing !== requiredSettings.defaultColumnAutoSizing) {
                        this._defaultColumnAutoSizing = requiredSettings.defaultColumnAutoSizing;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.defaultColumnAutoSizing);
                    }
                    break;
                case 'defaultColumnWidth':
                    if (this._defaultColumnWidth !== requiredSettings.defaultColumnWidth) {
                        this._defaultColumnWidth = requiredSettings.defaultColumnWidth;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.defaultColumnWidth);
                    }
                    break;
                case 'editable':
                    if (this._editable !== requiredSettings.editable) {
                        this._editable = requiredSettings.editable;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.editable);
                    }
                    break;
                case 'editOnClick':
                    if (this._editOnClick !== requiredSettings.editOnClick) {
                        this._editOnClick = requiredSettings.editOnClick;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.editOnClick);
                    }
                    break;
                case 'editOnDoubleClick':
                    if (this._editOnDoubleClick !== requiredSettings.editOnDoubleClick) {
                        this._editOnDoubleClick = requiredSettings.editOnDoubleClick;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.editOnDoubleClick);
                    }
                    break;
                case 'editOnFocusCell':
                    if (this._editOnFocusCell !== requiredSettings.editOnFocusCell) {
                        this._editOnFocusCell = requiredSettings.editOnFocusCell;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.editOnFocusCell);
                    }
                    break;
                case 'editOnKeyDown':
                    if (this._editOnKeyDown !== requiredSettings.editOnKeyDown) {
                        this._editOnKeyDown = requiredSettings.editOnKeyDown;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.editOnKeyDown);
                    }
                    break;
                case 'editorClickableCursorName':
                    if (this._editorClickableCursorName !== requiredSettings.editorClickableCursorName) {
                        this._editorClickableCursorName = requiredSettings.editorClickableCursorName;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.editorClickableCursorName);
                    }
                    break;
                case 'filterable':
                    if (this._filterable !== requiredSettings.filterable) {
                        this._filterable = requiredSettings.filterable;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.filterable);
                    }
                    break;
                case 'maximumColumnWidth':
                    if (this._maximumColumnWidth !== requiredSettings.maximumColumnWidth) {
                        this._maximumColumnWidth = requiredSettings.maximumColumnWidth;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.maximumColumnWidth);
                    }
                    break;
                case 'minimumColumnWidth':
                    if (this._minimumColumnWidth !== requiredSettings.minimumColumnWidth) {
                        this._minimumColumnWidth = requiredSettings.minimumColumnWidth;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.minimumColumnWidth);
                    }
                    break;
                case 'resizeColumnInPlace':
                    if (this._resizeColumnInPlace !== requiredSettings.resizeColumnInPlace) {
                        this._resizeColumnInPlace = requiredSettings.resizeColumnInPlace;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.resizeColumnInPlace);
                    }
                    break;
                case 'sortOnDoubleClick':
                    if (this._sortOnDoubleClick !== requiredSettings.sortOnDoubleClick) {
                        this._sortOnDoubleClick = requiredSettings.sortOnDoubleClick;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.sortOnDoubleClick);
                    }
                    break;
                case 'sortOnClick':
                    if (this._sortOnClick !== requiredSettings.sortOnClick) {
                        this._sortOnClick = requiredSettings.sortOnClick;
                        this.flagChanged(gridSettingChangeInvalidateTypeIds.sortOnClick);
                    }
                    break;

                default: {
                    columnSettingsKey satisfies never;
                }
            }
        }

        return this.endChange();
    }

    clone() {
        const copy = new InMemoryBehavioredColumnSettings(this.gridSettings);
        copy.merge(this);
        return copy;
    }
}
