import { EventDetail } from '../../event/event-detail';
import { ScrollBehavior } from '../scroll-behaviour';
import { UiBehavior } from './ui-behavior';

const commands: KeyPagingUiBehavior.CommandMap = {
    PAGEDOWN: (scrollBehavior: ScrollBehavior) => { scrollBehavior.pageDown(); },
    PAGEDOWNSHIFT: (scrollBehavior: ScrollBehavior) => { scrollBehavior.pageDown(); },
    PAGEUP: (scrollBehavior: ScrollBehavior) => { scrollBehavior.pageUp(); },
    PAGEUPSHIFT: (scrollBehavior: ScrollBehavior) => { scrollBehavior.pageUp(); },
    PAGELEFT: (scrollBehavior: ScrollBehavior) => { scrollBehavior.pageLeft(); },
    PAGELEFTSHIFT: (scrollBehavior: ScrollBehavior) => { scrollBehavior.pageLeft(); },
    PAGERIGHT: (scrollBehavior: ScrollBehavior) => { scrollBehavior.pageRight(); },
    PAGERIGHTSHIFT: (scrollBehavior: ScrollBehavior) => { scrollBehavior.pageRight(); },
};

/**
 * @constructor
 */
export class KeyPagingUiBehavior extends UiBehavior {

    readonly typeName = KeyPagingUiBehavior.typeName;

    /**
     * @param event - the event details
     */
    override handleKeyDown(eventDetail: EventDetail.Keyboard) {
        const func = commands[eventDetail.primitiveEvent.key];
        if (func) {
            func(this.scrollBehavior);
        } else if (this.next) {
            this.next.handleKeyDown(eventDetail);
        }
    }

}

export namespace KeyPagingUiBehavior {
    export const typeName = 'keypaging';

    export type CommandFunction = (this: void, scrollBehavior: ScrollBehavior) => void;
    export interface CommandMap {
        [command: string]: CommandFunction;
        PAGEDOWN: CommandFunction;
        PAGEUP: CommandFunction;
        PAGELEFT: CommandFunction;
        PAGERIGHT: CommandFunction;
    }
}
