import { BehavioredColumnSettings, ColumnSettings, GridSettingChangeInvalidateTypeId, gridSettingChangeInvalidateTypeIds } from '../../grid/grid-public-api';
import { AllGridSettings } from '../../grid/interfaces/settings/all-grid-settings';
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
    private _filterable: boolean | undefined;
    private _maximumColumnWidth: number | undefined | null;
    private _minimumColumnWidth: number | undefined;
    private _resizeColumnInPlace: boolean | undefined;
    private _sortOnDoubleClick: boolean | undefined;
    private _sortOnClick: boolean | undefined;

    constructor(readonly gridSettings: AllGridSettings) {
        super();
    }

    get backgroundColor() { return this._backgroundColor !== undefined ? this._backgroundColor : this.gridSettings.backgroundColor; }
    set backgroundColor(value: string) {
        if (value !== this._backgroundColor) {
            this.beginChange();
            this._backgroundColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.backgroundColor;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }

    get color() { return this._color !== undefined ? this._color : this.gridSettings.color; }
    set color(value: string) {
        if (value !== this._color) {
            this.beginChange();
            this._color = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.color;
            this.notifyChanged(invalidateType);
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
            this.notifyChanged(invalidateType);
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
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }

    get defaultColumnAutoSizing() { return this._defaultColumnAutoSizing !== undefined ? this._defaultColumnAutoSizing : this.gridSettings.defaultColumnAutoSizing; }
    set defaultColumnAutoSizing(value: boolean) {
        if (value !== this._defaultColumnAutoSizing) {
            this.beginChange();
            this._defaultColumnAutoSizing = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.defaultColumnAutoSizing;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }

    get defaultColumnWidth() { return this._defaultColumnWidth !== undefined ? this._defaultColumnWidth : this.gridSettings.defaultColumnWidth; }
    set defaultColumnWidth(value: number) {
        if (value !== this._defaultColumnWidth) {
            this.beginChange();
            this._defaultColumnWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.defaultColumnWidth;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }

    get editable() { return this._editable !== undefined ? this._editable : this.gridSettings.editable; }
    set editable(value: boolean) {
        if (value !== this._editable) {
            this.beginChange();
            this._editable = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editable;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }

    get editOnClick() { return this._editOnClick !== undefined ? this._editOnClick : this.gridSettings.editOnClick; }
    set editOnClick(value: boolean) {
        if (value !== this._editOnClick) {
            this.beginChange();
            this._editOnClick = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnClick;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }

    get editOnDoubleClick() { return this._editOnDoubleClick !== undefined ? this._editOnDoubleClick : this.gridSettings.editOnDoubleClick; }
    set editOnDoubleClick(value: boolean) {
        if (value !== this._editOnDoubleClick) {
            this.beginChange();
            this._editOnDoubleClick = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnDoubleClick;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }

    get editOnFocusCell() { return this._editOnFocusCell !== undefined ? this._editOnFocusCell : this.gridSettings.editOnFocusCell; }
    set editOnFocusCell(value: boolean) {
        if (value !== this._editOnFocusCell) {
            this.beginChange();
            this._editOnFocusCell = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnFocusCell;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }

    get editOnKeyDown() { return this._editOnKeyDown !== undefined ? this._editOnKeyDown : this.gridSettings.editOnKeyDown; }
    set editOnKeyDown(value: boolean) {
        if (value !== this._editOnKeyDown) {
            this.beginChange();
            this._editOnKeyDown = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnKeyDown;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }

    get filterable() { return this._filterable !== undefined ? this._filterable : this.gridSettings.filterable; }
    set filterable(value: boolean) {
        if (value !== this._filterable) {
            this.beginChange();
            this._filterable = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterable;
            this.notifyChanged(invalidateType);
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
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }

    get minimumColumnWidth() { return this._minimumColumnWidth !== undefined ? this._minimumColumnWidth : this.gridSettings.minimumColumnWidth; }
    set minimumColumnWidth(value: number) {
        if (value !== this._minimumColumnWidth) {
            this.beginChange();
            this._minimumColumnWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.minimumColumnWidth;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }

    get resizeColumnInPlace() { return this._resizeColumnInPlace !== undefined ? this._resizeColumnInPlace : this.gridSettings.resizeColumnInPlace; }
    set resizeColumnInPlace(value: boolean) {
        if (value !== this._resizeColumnInPlace) {
            this.beginChange();
            this._resizeColumnInPlace = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.resizeColumnInPlace;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }

    get sortOnDoubleClick() { return this._sortOnDoubleClick !== undefined ? this._sortOnDoubleClick : this.gridSettings.sortOnDoubleClick; }
    set sortOnDoubleClick(value: boolean) {
        if (value !== this._sortOnDoubleClick) {
            this.beginChange();
            this._sortOnDoubleClick = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.sortOnDoubleClick;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }

    get sortOnClick() { return this._sortOnClick !== undefined ? this._sortOnClick : this.gridSettings.sortOnClick; }
    set sortOnClick(value: boolean) {
        if (value !== this._sortOnClick) {
            this.beginChange();
            this._sortOnClick = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.sortOnClick;
            this.notifyChanged(invalidateType);
            this.endChange();
        }
    }

    load(settings: ColumnSettings) {
        this.beginChange();

        for (const key in settings) {
            // Use loop so that compiler will report error if any setting missing
            const columnSettingsKey = key as keyof ColumnSettings;
            switch (columnSettingsKey) {
                case 'backgroundColor':
                    this._backgroundColor = settings.backgroundColor;
                    break;
                case 'color':
                    this._color = settings.color;
                    break;
                case 'columnAutoSizingMax':
                    this._columnAutoSizingMax = settings.columnAutoSizingMax;
                    break;
                case 'columnClip':
                    this._columnClip = settings.columnClip;
                    break;
                case 'defaultColumnAutoSizing':
                    this._defaultColumnAutoSizing = settings.defaultColumnAutoSizing;
                    break;
                case 'defaultColumnWidth':
                    this._defaultColumnWidth = settings.defaultColumnWidth;
                    break;
                case 'editable':
                    this._editable = settings.editable;
                    break;
                case 'editOnClick':
                    this._editOnClick = settings.editOnClick;
                    break;
                case 'editOnDoubleClick':
                    this._editOnDoubleClick = settings.editOnDoubleClick;
                    break;
                case 'editOnFocusCell':
                    this._editOnFocusCell = settings.editOnFocusCell;
                    break;
                case 'editOnKeyDown':
                    this._editOnKeyDown = settings.editOnKeyDown;
                    break;
                case 'filterable':
                    this._filterable = settings.filterable;
                    break;
                case 'maximumColumnWidth':
                    this._maximumColumnWidth = settings.maximumColumnWidth;
                    break;
                case 'minimumColumnWidth':
                    this._minimumColumnWidth = settings.minimumColumnWidth;
                    break;
                case 'resizeColumnInPlace':
                    this._resizeColumnInPlace = settings.resizeColumnInPlace;
                    break;
                case 'sortOnDoubleClick':
                    this._sortOnDoubleClick = settings.sortOnDoubleClick;
                    break;
                case 'sortOnClick':
                    this._sortOnClick = settings.sortOnClick;
                    break;

                default: {
                    columnSettingsKey satisfies never;
                }
            }
        }

        this.notifyChanged(GridSettingChangeInvalidateTypeId.Resize);

        this.endChange();
    }

    clone() {
        const copy = new InMemoryBehavioredColumnSettings(this.gridSettings);
        copy.load(this);
        return copy;
    }
}
