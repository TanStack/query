import { Subscribable } from './subscribable';
type Listener = (online: boolean) => void;
type SetupFn = (setOnline: Listener) => (() => void) | undefined;
export declare class OnlineManager extends Subscribable<Listener> {
    #private;
    constructor();
    protected onSubscribe(): void;
    protected onUnsubscribe(): void;
    setEventListener(setup: SetupFn): void;
    setOnline(online: boolean): void;
    isOnline(): boolean;
}
export declare const onlineManager: OnlineManager;
export {};
//# sourceMappingURL=onlineManager.d.ts.map