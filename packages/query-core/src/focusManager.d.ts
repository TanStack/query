import { Subscribable } from './subscribable';
type Listener = (focused: boolean) => void;
type SetupFn = (setFocused: (focused?: boolean) => void) => (() => void) | undefined;
export declare class FocusManager extends Subscribable<Listener> {
    #private;
    constructor();
    protected onSubscribe(): void;
    protected onUnsubscribe(): void;
    setEventListener(setup: SetupFn): void;
    setFocused(focused?: boolean): void;
    onFocus(): void;
    isFocused(): boolean;
}
export declare const focusManager: FocusManager;
export {};
//# sourceMappingURL=focusManager.d.ts.map