/** @public */
export abstract class HypegridError extends Error {
    constructor(public readonly code: string, message: string | undefined, baseMessage: string) {
        super(`Hypegrid Error: ${code}: ${message === undefined ? baseMessage : `${baseMessage}: ${message}`}`);
    }
}

/** @public */
export class AssertError extends HypegridError {
    constructor(code: string, message?: string) {
        super(code, message, 'Assert');
    }
}

/** @public */
export class UnreachableCaseError extends HypegridError {
    constructor(code: string, value: never) {
        super(code, `"${value}"`, 'Unreachable case');
    }
}
