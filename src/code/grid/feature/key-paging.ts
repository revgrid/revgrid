import { ScrollBehavior } from '../behavior/scroll-behaviour';
import { EventDetail } from '../event/event-detail';
import { Feature } from '../feature/feature';

const commands: KeyPaging.CommandMap = {
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
export class KeyPaging extends Feature {

    readonly typeName = KeyPaging.typeName;

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

export namespace KeyPaging {
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
