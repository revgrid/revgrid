import { UiBehavior } from './ui-behavior';

export class ClipboardUiBehavior extends UiBehavior {
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

export namespace ClipboardUiBehavior {
    export const typeName = 'clipboard';
}
