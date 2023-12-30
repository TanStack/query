/**
 * The code in this file is adapted from NG Extension Platform at https://ngxtension.netlify.app.
 *
 * Original Author: Chau Tran
 *
 * NG Extension Platform is an open-source project licensed under the MIT license.
 *
 * For more information about the original code, see
 * https://github.com/nartc/ngxtension-platform
 */

import { TestBed } from '@angular/core/testing';
import {
  createNoopInjectionToken,
} from './create-injection-token';

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
