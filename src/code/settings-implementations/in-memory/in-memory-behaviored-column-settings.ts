import { RevBehavioredColumnSettings, RevColumnSettings, RevGridSettings, revGridSettingChangeInvalidateTypeIds } from '../../client';
import { RevInMemoryBehavioredSettings } from './in-memory-behaviored-settings';

/** @public */
export class RevInMemoryBehavioredColumnSettings extends RevInMemoryBehavioredSettings implements RevBehavioredColumnSettings {
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

    constructor(readonly gridSettings: RevGridSettings) {
        super();
    }

    get backgroundColor() { return this._backgroundColor !== undefined ? this._backgroundColor : this.gridSettings.backgroundColor; }
    set backgroundColor(value: string) {
        if (value !== this._backgroundColor) {
            this.beginChange();
            this._backgroundColor = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.backgroundColor;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get color() { return this._color !== undefined ? this._color : this.gridSettings.color; }
    set color(value: string) {
        if (value !== this._color) {
            this.beginChange();
            this._color = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.color;
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
            const invalidateType = revGridSettingChangeInvalidateTypeIds.columnAutoSizingMax;
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
            const invalidateType = revGridSettingChangeInvalidateTypeIds.columnClip;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get defaultColumnAutoSizing() { return this._defaultColumnAutoSizing !== undefined ? this._defaultColumnAutoSizing : this.gridSettings.defaultColumnAutoSizing; }
    set defaultColumnAutoSizing(value: boolean) {
        if (value !== this._defaultColumnAutoSizing) {
            this.beginChange();
            this._defaultColumnAutoSizing = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.defaultColumnAutoSizing;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get defaultColumnWidth() { return this._defaultColumnWidth !== undefined ? this._defaultColumnWidth : this.gridSettings.defaultColumnWidth; }
    set defaultColumnWidth(value: number) {
        if (value !== this._defaultColumnWidth) {
            this.beginChange();
            this._defaultColumnWidth = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.defaultColumnWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get editable() { return this._editable !== undefined ? this._editable : this.gridSettings.editable; }
    set editable(value: boolean) {
        if (value !== this._editable) {
            this.beginChange();
            this._editable = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.editable;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get editOnClick() { return this._editOnClick !== undefined ? this._editOnClick : this.gridSettings.editOnClick; }
    set editOnClick(value: boolean) {
        if (value !== this._editOnClick) {
            this.beginChange();
            this._editOnClick = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.editOnClick;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get editOnDoubleClick() { return this._editOnDoubleClick !== undefined ? this._editOnDoubleClick : this.gridSettings.editOnDoubleClick; }
    set editOnDoubleClick(value: boolean) {
        if (value !== this._editOnDoubleClick) {
            this.beginChange();
            this._editOnDoubleClick = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.editOnDoubleClick;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get editOnFocusCell() { return this._editOnFocusCell !== undefined ? this._editOnFocusCell : this.gridSettings.editOnFocusCell; }
    set editOnFocusCell(value: boolean) {
        if (value !== this._editOnFocusCell) {
            this.beginChange();
            this._editOnFocusCell = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.editOnFocusCell;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get editOnKeyDown() { return this._editOnKeyDown !== undefined ? this._editOnKeyDown : this.gridSettings.editOnKeyDown; }
    set editOnKeyDown(value: boolean) {
        if (value !== this._editOnKeyDown) {
            this.beginChange();
            this._editOnKeyDown = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.editOnKeyDown;
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
            const invalidateType = revGridSettingChangeInvalidateTypeIds.editorClickableCursorName;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get filterable() { return this._filterable !== undefined ? this._filterable : this.gridSettings.filterable; }
    set filterable(value: boolean) {
        if (value !== this._filterable) {
            this.beginChange();
            this._filterable = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.filterable;
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
            const invalidateType = revGridSettingChangeInvalidateTypeIds.maximumColumnWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get minimumColumnWidth() { return this._minimumColumnWidth !== undefined ? this._minimumColumnWidth : this.gridSettings.minimumColumnWidth; }
    set minimumColumnWidth(value: number) {
        if (value !== this._minimumColumnWidth) {
            this.beginChange();
            this._minimumColumnWidth = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.minimumColumnWidth;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get resizeColumnInPlace() { return this._resizeColumnInPlace !== undefined ? this._resizeColumnInPlace : this.gridSettings.resizeColumnInPlace; }
    set resizeColumnInPlace(value: boolean) {
        if (value !== this._resizeColumnInPlace) {
            this.beginChange();
            this._resizeColumnInPlace = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.resizeColumnInPlace;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get sortOnDoubleClick() { return this._sortOnDoubleClick !== undefined ? this._sortOnDoubleClick : this.gridSettings.sortOnDoubleClick; }
    set sortOnDoubleClick(value: boolean) {
        if (value !== this._sortOnDoubleClick) {
            this.beginChange();
            this._sortOnDoubleClick = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.sortOnDoubleClick;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    get sortOnClick() { return this._sortOnClick !== undefined ? this._sortOnClick : this.gridSettings.sortOnClick; }
    set sortOnClick(value: boolean) {
        if (value !== this._sortOnClick) {
            this.beginChange();
            this._sortOnClick = value;
            const invalidateType = revGridSettingChangeInvalidateTypeIds.sortOnClick;
            this.flagChanged(invalidateType);
            this.endChange();
        }
    }

    merge(settings: Partial<RevColumnSettings>, overrideGrid = false): boolean {
        this.beginChange();

        const requiredSettings = settings as Required<RevColumnSettings>; // since we only iterate over keys that exist we can assume that settings is not partial in the switch loop
        for (const key in settings) {
            // Use loop so that compiler will report error if any setting missing
            const columnSettingsKey = key as keyof RevColumnSettings;
            switch (columnSettingsKey) {
                case 'backgroundColor': {
                    const currentBackgroundColor = overrideGrid ? this._backgroundColor : this.backgroundColor;
                    if (currentBackgroundColor !== requiredSettings.backgroundColor) {
                        this._backgroundColor = requiredSettings.backgroundColor;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.backgroundColor);
                    }
                    break;
                }
                case 'color': {
                    const currentColor = overrideGrid ? this._color : this.color;
                    if (currentColor !== requiredSettings.color) {
                        this._color = requiredSettings.color;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.color);
                    }
                    break;
                }
                case 'columnAutoSizingMax': {
                    const currentColumnAutoSizingMax = overrideGrid ? this._columnAutoSizingMax : this.columnAutoSizingMax;
                    if (currentColumnAutoSizingMax !== requiredSettings.columnAutoSizingMax) {
                        this._columnAutoSizingMax = requiredSettings.columnAutoSizingMax;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.columnAutoSizingMax);
                    }
                    break;
                }
                case 'columnClip': {
                    const currentColumnClip = overrideGrid ? this._columnClip : this.columnClip;
                    if (currentColumnClip !== requiredSettings.columnClip) {
                        this._columnClip = requiredSettings.columnClip;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.columnClip);
                    }
                    break;
                }
                case 'defaultColumnAutoSizing': {
                    const currentDefaultColumnAutoSizing = overrideGrid ? this._defaultColumnAutoSizing : this.defaultColumnAutoSizing;
                    if (currentDefaultColumnAutoSizing !== requiredSettings.defaultColumnAutoSizing) {
                        this._defaultColumnAutoSizing = requiredSettings.defaultColumnAutoSizing;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.defaultColumnAutoSizing);
                    }
                    break;
                }
                case 'defaultColumnWidth': {
                    const currentDefaultColumnWidth = overrideGrid ? this._defaultColumnWidth : this.defaultColumnWidth;
                    if (currentDefaultColumnWidth !== requiredSettings.defaultColumnWidth) {
                        this._defaultColumnWidth = requiredSettings.defaultColumnWidth;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.defaultColumnWidth);
                    }
                    break;
                }
                case 'editable': {
                    const currentEditable = overrideGrid ? this._editable : this.editable;
                    if (currentEditable !== requiredSettings.editable) {
                        this._editable = requiredSettings.editable;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.editable);
                    }
                    break;
                }
                case 'editOnClick': {
                    const currentEditOnClick = overrideGrid ? this._editOnClick : this.editOnClick;
                    if (currentEditOnClick !== requiredSettings.editOnClick) {
                        this._editOnClick = requiredSettings.editOnClick;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.editOnClick);
                    }
                    break;
                }
                case 'editOnDoubleClick': {
                    const currentEditOnDoubleClick = overrideGrid ? this._editOnDoubleClick : this.editOnDoubleClick;
                    if (currentEditOnDoubleClick !== requiredSettings.editOnDoubleClick) {
                        this._editOnDoubleClick = requiredSettings.editOnDoubleClick;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.editOnDoubleClick);
                    }
                    break;
                }
                case 'editOnFocusCell': {
                    const currentEditOnFocusCell = overrideGrid ? this._editOnFocusCell : this.editOnFocusCell;
                    if (currentEditOnFocusCell !== requiredSettings.editOnFocusCell) {
                        this._editOnFocusCell = requiredSettings.editOnFocusCell;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.editOnFocusCell);
                    }
                    break;
                }
                case 'editOnKeyDown': {
                    const currentEditOnKeyDown = overrideGrid ? this._editOnKeyDown : this.editOnKeyDown;
                    if (currentEditOnKeyDown !== requiredSettings.editOnKeyDown) {
                        this._editOnKeyDown = requiredSettings.editOnKeyDown;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.editOnKeyDown);
                    }
                    break;
                }
                case 'editorClickableCursorName': {
                    const currentEditorClickableCursorName = overrideGrid ? this._editorClickableCursorName : this.editorClickableCursorName;
                    if (currentEditorClickableCursorName !== requiredSettings.editorClickableCursorName) {
                        this._editorClickableCursorName = requiredSettings.editorClickableCursorName;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.editorClickableCursorName);
                    }
                    break;
                }
                case 'filterable': {
                    const currentFilterable = overrideGrid ? this._filterable : this.filterable;
                    if (currentFilterable !== requiredSettings.filterable) {
                        this._filterable = requiredSettings.filterable;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.filterable);
                    }
                    break;
                }
                case 'maximumColumnWidth': {
                    const currentMaximumColumnWidth = overrideGrid ? this._maximumColumnWidth : this.maximumColumnWidth;
                    if (currentMaximumColumnWidth !== requiredSettings.maximumColumnWidth) {
                        this._maximumColumnWidth = requiredSettings.maximumColumnWidth;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.maximumColumnWidth);
                    }
                    break;
                }
                case 'minimumColumnWidth': {
                    const currentMinimumColumnWidth = overrideGrid ? this._minimumColumnWidth : this.minimumColumnWidth;
                    if (currentMinimumColumnWidth !== requiredSettings.minimumColumnWidth) {
                        this._minimumColumnWidth = requiredSettings.minimumColumnWidth;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.minimumColumnWidth);
                    }
                    break;
                }
                case 'resizeColumnInPlace': {
                    const currentResizeColumnInPlace = overrideGrid ? this._resizeColumnInPlace : this.resizeColumnInPlace;
                    if (currentResizeColumnInPlace !== requiredSettings.resizeColumnInPlace) {
                        this._resizeColumnInPlace = requiredSettings.resizeColumnInPlace;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.resizeColumnInPlace);
                    }
                    break;
                }
                case 'sortOnDoubleClick': {
                    const currentSortOnDoubleClick = overrideGrid ? this._sortOnDoubleClick : this.sortOnDoubleClick;
                    if (currentSortOnDoubleClick !== requiredSettings.sortOnDoubleClick) {
                        this._sortOnDoubleClick = requiredSettings.sortOnDoubleClick;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.sortOnDoubleClick);
                    }
                    break;
                }
                case 'sortOnClick': {
                    const currentSortOnClick = overrideGrid ? this._sortOnClick : this.sortOnClick;
                    if (currentSortOnClick !== requiredSettings.sortOnClick) {
                        this._sortOnClick = requiredSettings.sortOnClick;
                        this.flagChanged(revGridSettingChangeInvalidateTypeIds.sortOnClick);
                    }
                    break;
                }

                default: {
                    columnSettingsKey satisfies never;
                }
            }
        }

        return this.endChange();
    }

    clone(overrideGrid = false) {
        const copy = new RevInMemoryBehavioredColumnSettings(this.gridSettings);
        copy.merge(this, overrideGrid);
        return copy;
    }
}
