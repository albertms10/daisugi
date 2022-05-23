import assert from 'node:assert';
import { describe, it } from 'mocha';

import { Code, CustomError } from '@daisugi/kintsugi';

import { Kado, Container } from '../kado.js';

describe(
  '#Kado()',
  () => {
    it(
      'should have proper api',
      () => {
        assert.strictEqual(typeof Kado, 'function');
        assert.strictEqual(typeof Kado.value, 'function');
        assert.strictEqual(typeof Kado.map, 'function');
        assert.strictEqual(typeof Kado.flatMap, 'function');

        const { container } = new Kado();

        assert.strictEqual(
          typeof container.resolve,
          'function',
        );
        assert.strictEqual(
          typeof container.register,
          'function',
        );
        assert.strictEqual(
          typeof container.list,
          'function',
        );
      },
    );

    it(
      'useClass',
      () => {
        const { container } = new Kado();

        class B {
          foo = 'foo';
        }

        class A {
          constructor(public b: B) {}
        }

        container.register([
          { token: 'A', useClass: A, params: ['B'] },
          { token: 'B', useClass: B },
        ]);

        const a = container.resolve<A>('A');
        const anotherA = container.resolve<A>('A');

        assert.strictEqual(a.b.foo, 'foo');
        assert.strictEqual(a, anotherA);
      },
    );

    it(
      'useValue',
      () => {
        const { container } = new Kado();

        const b = Symbol('B');

        class A {
          constructor(public a: symbol) {}
        }

        container.register([
          { token: 'A', useClass: A, params: [b] },
          { token: b, useValue: 'foo' },
        ]);

        const a = container.resolve<A>('A');

        assert.strictEqual(a.a, 'foo');
      },
    );

    it(
      'useValue false',
      () => {
        const { container } = new Kado();

        const b = Symbol('B');

        class A {
          constructor(public a: symbol) {}
        }

        container.register([
          { token: 'A', useClass: A, params: [b] },
          { token: b, useValue: false },
        ]);

        const a = container.resolve<A>('A');

        assert.strictEqual(a.a, false);
      },
    );

    it(
      'useClass Transient',
      () => {
        const { container } = new Kado();

        class A {
          constructor() {}
        }

        container.register([
          { token: 'A', useClass: A, scope: 'Transient' },
        ]);

        const a = container.resolve<A>('A');
        const anotherA = container.resolve<A>('A');

        assert.notStrictEqual(a, anotherA);
      },
    );

    it(
      'nested scope Transient',
      () => {
        const { container } = new Kado();

        class B {}

        class A {
          constructor(public b: B) {}
        }

        container.register([
          { token: 'A', useClass: A, params: ['B'] },
          { token: 'B', useClass: B, scope: 'Transient' },
        ]);

        const a = container.resolve<A>('A');
        const anotherA = container.resolve<A>('A');

        assert.strictEqual(a.b, anotherA.b);
      },
    );

    it(
      'useFactoryByContainer',
      () => {
        const { container } = new Kado();

        function useFactoryByContainer(container: Container) {
          if (container.resolve('B') === 'foo') {
            return Math.random();
          }

          return null;
        }

        container.register([
          { token: 'B', useValue: 'foo' },
          { token: 'A', useFactoryByContainer },
        ]);

        const a = container.resolve<number>('A');
        const anotherA = container.resolve<number>('A');

        assert.strictEqual(typeof a, 'number');
        assert.strictEqual(a, anotherA);
      },
    );

    it(
      'useFactory',
      () => {
        const { container } = new Kado();

        function useFactory(b: string) {
          if (b === 'foo') {
            return Math.random();
          }

          return null;
        }

        container.register([
          { token: 'B', useValue: 'foo' },
          { token: 'A', useFactory, params: ['B'] },
        ]);

        const a = container.resolve<number>('A');
        const anotherA = container.resolve<number>('A');

        assert.strictEqual(typeof a, 'number');
        assert.strictEqual(a, anotherA);
      },
    );

    it(
      'useFactory Transient',
      () => {
        const { container } = new Kado();

        function useFactory(b: string) {
          if (b === 'foo') {
            return Math.random();
          }

          return null;
        }

        container.register([
          { token: 'B', useValue: 'foo' },
          {
            token: 'A',
            useFactory,
            params: ['B'],
            scope: 'Transient',
          },
        ]);

        const a = container.resolve<number>('A');
        const anotherA = container.resolve<number>('A');

        assert.strictEqual(typeof a, 'number');
        assert.notStrictEqual(a, anotherA);
      },
    );

    it(
      'useFactoryByContainer Transient',
      () => {
        const { container } = new Kado();

        function useFactoryByContainer() {
          return Math.random();
        }

        container.register([
          {
            token: 'A',
            useFactoryByContainer,
            scope: 'Transient',
          },
        ]);

        const a = container.resolve<number>('A');
        const anotherA = container.resolve<number>('A');

        assert.notStrictEqual(a, anotherA);
      },
    );

    it(
      '#list()',
      () => {
        const { container } = new Kado();

        container.register([
          { token: 'a', useValue: 'text' },
        ]);

        const list = container.list();

        assert.deepStrictEqual(
          list,
          [{ token: 'a', useValue: 'text' }],
        );
      },
    );

    describe(
      'when you try to resolve unregistered token',
      () => {
        it(
          'should throw an error',
          () => {
            const { container } = new Kado();

            try {
              container.resolve('a');
            } catch (error) {
              assert.strictEqual(
                (error as CustomError).message,
                'Attempted to resolve unregistered dependency token: "a".',
              );
              assert.strictEqual(
                (error as CustomError).code,
                Code.NotFound,
              );
              assert.strictEqual(
                (error as CustomError).name,
                Code.NotFound,
              );
            }
          },
        );
      },
    );

    describe(
      'when you try to resolve deep unregistered token',
      () => {
        it(
          'should throw an error',
          () => {
            const { container } = new Kado();

            container.register([
              { token: 'a', useFactory() {}, params: ['b'] },
            ]);

            try {
              container.resolve('a');
            } catch (error) {
              assert.strictEqual(
                (error as CustomError).message,
                'Attempted to resolve unregistered dependency token: "b".',
              );
              assert.strictEqual(
                (error as CustomError).code,
                Code.NotFound,
              );
              assert.strictEqual(
                (error as CustomError).name,
                Code.NotFound,
              );
            }
          },
        );
      },
    );

    describe(
      'when you try to make a circular injection',
      () => {
        it(
          'should throw an error',
          () => {
            const { container } = new Kado();

            class C {
              constructor(public a: A) {}
            }

            class B {
              constructor(public c: C) {}
            }

            class A {
              constructor(public b: B) {}
            }

            container.register([
              { token: 'a', useClass: A, params: ['b'] },
              { token: 'b', useClass: B, params: ['c'] },
              { token: 'c', useClass: C, params: ['a'] },
            ]);

            try {
              container.resolve('a');
            } catch (error) {
              assert.strictEqual(
                (error as CustomError).message,
                'Attempted to resolve circular dependency: "a" ➡️ "b" ➡️ "c" 🔄 "a".',
              );
              assert.strictEqual(
                (error as CustomError).code,
                Code.CircularDependencyDetected,
              );
              assert.strictEqual(
                (error as CustomError).name,
                Code.CircularDependencyDetected,
              );
            }
          },
        );
      },
    );

    describe(
      'when no circular injection detected',
      () => {
        it(
          'should not throw an error',
          () => {
            const { container } = new Kado();

            class C {
              constructor(public b: B) {}
            }

            class B {
              constructor() {}
            }

            class A {
              constructor(
                public b: B,
                public b2: B,
                public c: C,
              ) {}
            }

            container.register([
              {
                token: 'a',
                useClass: A,
                params: ['b', 'b', 'c'],
              },
              { token: 'b', useClass: B },
              { token: 'c', useClass: C, params: ['b'] },
            ]);

            const a = container.resolve('a');

            assert(a instanceof A);
          },
        );
      },
    );
  },
);
