import { MergableColumnSettings } from '../../interfaces/settings/mergable-column-settings';
import { MergableGridSettings } from '../../interfaces/settings/mergable-grid-settings';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class ClipboardUiBehavior<MGS extends MergableGridSettings, MCS extends MergableColumnSettings> extends UiBehavior<MGS, MCS> {
    readonly typeName = ClipboardUiBehavior.typeName;

    override handleCopy(eventDetail: ClipboardEvent) {
        eventDetail.preventDefault();
        const clipboardData = eventDetail.clipboardData;
        if (clipboardData !== null) {
            const csvData = this.dataExtractBehavior.getSelectionAsTSV();
            clipboardData.setData('text/plain', csvData);
        }
    }
}

/** @internal */
export namespace ClipboardUiBehavior {
    export const typeName = 'clipboard';
}
