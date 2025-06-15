import { RevSchemaField } from '../../../common';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../../settings/internal-api';
import { RevUiController } from './ui-controller';

/** @internal */
export class RevClipboardUiController<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevUiController<BGS, BCS, SF> {
    readonly typeName = RevClipboardUiController.typeName;

    override handleCopy(eventDetail: ClipboardEvent) {
        eventDetail.preventDefault();
        const clipboardData = eventDetail.clipboardData;
        if (clipboardData !== null) {
            const csvData = this._dataExtractBehavior.getSelectionAsTSV();
            clipboardData.setData('text/plain', csvData);
        }
    }
}

/** @internal */
export namespace RevClipboardUiController {
    export const typeName = 'clipboard';
}
