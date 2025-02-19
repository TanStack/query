export declare class Subscribable<TListener extends Function> {
    protected listeners: Set<TListener>;
    constructor();
    subscribe(listener: TListener): () => void;
    hasListeners(): boolean;
    protected onSubscribe(): void;
    protected onUnsubscribe(): void;
}
//# sourceMappingURL=subscribable.d.ts.map