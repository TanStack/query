import { Injector, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  createInjectionToken,
  createNoopInjectionToken,
} from './create-injection-token';

describe(createInjectionToken.name, () => {
  describe('given root injection token', () => {
    const [injectFn, , TOKEN] = createInjectionToken(() => 1);
    it('when use injectFn then return provided root value', () => {
      TestBed.runInInjectionContext(() => {
        const value = injectFn();
        expect(value).toEqual(1);
      });
    });
    it('when use TOKEN then return provided root value', () => {
      TestBed.runInInjectionContext(() => {
        const value = inject(TOKEN);
        expect(value).toEqual(1);
      });
    });
  });

  describe('given non root injection token', () => {
    const [injectFn, provideFn, TOKEN] = createInjectionToken(() => 1, {
      isRoot: false,
    });
    describe('when provide with no value', () => {
      it('then return initially provided value using injectFn', () => {
        TestBed.configureTestingModule({
          providers: [provideFn()],
        }).runInInjectionContext(() => {
          const value = injectFn();
          expect(value).toEqual(1);
        });
      });

      it('then return initially provided value using TOKEN', () => {
        TestBed.configureTestingModule({
          providers: [provideFn()],
        }).runInInjectionContext(() => {
          const value = inject(TOKEN);
          expect(value).toEqual(1);
        });
      });
    });

    describe('when provide with different value', () => {
      it('then return provided value using injectFn', () => {
        TestBed.configureTestingModule({
          providers: [provideFn(2)],
        }).runInInjectionContext(() => {
          const value = injectFn();
          expect(value).toEqual(2);
        });
      });

      it('then return provided value using TOKEN', () => {
        TestBed.configureTestingModule({
          providers: [provideFn(2)],
        }).runInInjectionContext(() => {
          const value = inject(TOKEN);
          expect(value).toEqual(2);
        });
      });
    });

    describe('when not provided', () => {
      it('then throw No Provider error', () => {
        TestBed.runInInjectionContext(() => {
          expect(() => injectFn()).toThrowError(/no provider/i);
        });
      });
    });
  });

  describe('given injection token with deps', () => {
    const [, , DEP] = createInjectionToken(() => 1);
    const [injectFn] = createInjectionToken((dep: number) => dep + 1, {
      deps: [DEP],
    });

    it('then return correct value with dep', () => {
      TestBed.runInInjectionContext(() => {
        const value = injectFn();
        expect(value).toEqual(2);
      });
    });
  });

  describe('given injection token', () => {
    const [injectFn, provideFn] = createInjectionToken(() => 1);
    it(`then throw no provider when invoked with an injector without providing`, () => {
      const injector = Injector.create({ providers: [] });
      expect(injectFn.bind(injectFn, { injector })).toThrowError(
        /no provider/i,
      );
    });

    it(`then return correct value when invoked with an injector`, () => {
      const injector = Injector.create({ providers: [provideFn()] });
      const value = injectFn({ injector });
      expect(value).toEqual(1);
    });
  });

  describe('given multi injection token', () => {
    const [injectFn, provideFn] = createInjectionToken(() => 1, {
      multi: true,
    });
    it('then return value as array', () => {
      TestBed.configureTestingModule({
        providers: [provideFn(), provideFn(2)],
      }).runInInjectionContext(() => {
        const values = injectFn();
        expect(Array.isArray(values)).toEqual(true);
        expect(values).toEqual([1, 2]);
      });
    });

    it('when pass a factory to provide then return correct value with injected dep', () => {
      const [injectDepFn, provideDepFn] = createInjectionToken(() => 5);
      TestBed.configureTestingModule({
        providers: [
          provideDepFn(),
          provideFn(),
          provideFn(() => injectDepFn()),
        ],
      }).runInInjectionContext(() => {
        const values = injectFn();
        expect(values).toEqual([1, 5]);
      });
    });
  });

  describe('given injection token with function as value', () => {
    const [injectDepFn, provideDepFn] = createInjectionToken(() => 5);
    const [injectFn, provideFn] = createInjectionToken(
      () => () => 1 as number,
      { multi: true },
    );

    it('then provide correct value when pass in a fn', () => {
      TestBed.configureTestingModule({
        providers: [
          provideDepFn(),
          provideFn(),
          // NOTE: this is providing the function value as-is
          provideFn(() => 2, true),
          // NOTE: this is providing the function as a factory
          provideFn(() => () => injectDepFn(), false),
        ],
      }).runInInjectionContext(() => {
        const fns = injectFn();
        const values = fns.map((fn) => fn());
        expect(values).toEqual([
          1, // initial fn returning 1
          2, // the function value as-is returning 2
          5, // the function via factory returning the dep value 5
        ]);
      });
    });
  });
});

describe(createNoopInjectionToken.name, () => {
  describe('given an injection token', () => {
    const [injectFn, provideFn] = createNoopInjectionToken<number, true>(
      'noop',
      { multi: true },
    );
    it('then work properly', () => {
      TestBed.configureTestingModule({
        providers: [provideFn(1), provideFn(() => 2)],
      }).runInInjectionContext(() => {
        const values = injectFn();
        expect(values).toEqual([1, 2]);
      });
    });
  });
});
