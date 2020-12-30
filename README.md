# RedXS

> RedXS is a super lightweight redux implementation, inspired by NGXS that can run anywhere! Asynchronous state management is a first class concept.
> - Very simple composition
> - Very little boilerplate
> - Very easy to use and grasp
> &nbsp;

## BETA
- Be advised - this package is still in beta.

## Concepts

- RedXS is basically just an async event bus. Actions are dispatched, which trigger any number of handlers. Handlers are attached via your store definition according to the Action `Type` they are attached to (No more large switch statements in reducers!!). Handlers given 2 parameters when executed: 
    1) Context to interact with the store's current state, which you can use to set/patch state or dispatch further actions.
        - Available methods:
            - `getState()`
                - returns the store's slice of state at the time it's called.
            - `getRootState()`
                - returns the root store's state at the time it's called.
            - `setState(obj: any)` 
                - overwrites the store's slice of state
                - sends new values through any `state$` and `rootState$` subscriptions
            - `patchState(obj: Partial<any>)`
                - overwrites only the properties on `obj` on the store's slice of state
                - sends new values through any `state$` and `rootState$` subscriptions
            - `dispatch(action: any)`
                - dispatches actions (will trigger any/all handlers listening for the action).
    2) The action that triggered the handler.
        - should define a globally unique `type` or `Type` property.
        - may also have add'l properties attached.

## Some Demo/Example Apps

- [React Todo Example](https://stackblitz.com/edit/react-redxs-todo-example-001-b27e03364)

- [Angular Todo Example](https://stackblitz.com/edit/angular-redxs-todo-example-001-b27e03364)

## Getting Started 

1. Run `npm install --save @animus-bi/redxs` to install the redxs library.

2. Define an Action
    - An action can be any object.
        - It should define a unique property `type` or `Type`
            - whether it's an instance property or a static/constructor property does not matter.
            - in the absence of a `type` property, the constructor name is used
    - Here is an example action as a class:
        ```ts
        // store/todo/actions.ts

        export const Intent = 'todo';

        export class CreateTodo {
            static Type = `[${Intent}] Create A TODO`;
            constructor(public task: string) { }
        }
        ```
    - Here is an example action as a function:
        ```ts
        // store/todo/actions.ts

        export const Intent = 'todo';
        
        export const CreateTodo = (task) => ({
            type: `[${Intent}] Create A TODO`,
            task
        })
        ```
    - You may have noticed the file name is just `actions.ts`
        - All actions for this intent will be exported from here.
            - This allows them to be imported more easily as a contained set of actions
    - You may have also noticed we're exporting an `Intent` for our actions.
        - This allows each handlers to execute in a more idempotent manner.

3. Define a default state for your store
    ```ts
    // store/todo/state.ts

    export class TodoState {
        list: any[] = [];
        hash: any = {};
    }
    ```
4. Define a `Store` with a `StoreConfig`
    ```ts
    // store/todo/store.ts

    export TodoStore = Store.Create<TodoState>(
        /* StoreConfig */
    )
    ```
    - `StoreConfig` is what drives the `Store` implementation.
        - It establishes the state slice name in root state. 
        - It provides an initial state
        - It allows you to attach handlers to specific actions that are dispatched.
    - An example of a `StoreConfig` using an object literal
        ```ts
        // store/todo/store.ts

        import * as TodosActions from './todos.actions'

        export TodoStore = Store.Create<TodoState>({
            name: TodosActions.Intent,
            initialState: new TodoState(),
            handlers: { }
        });
        ```
    - An example of a `StoreConfig` using the static `StoreConfig.create` method
        ```ts
        // store/todo/store.ts

        import { Store, StoreConfig } from '@animus-bi/redxs';
        import * as TodosActions from './actions';
        import { TodoState } from './state';
        const storeConfig = StoreConfig.create(
            TodosActions.Intent,
            new TodoState(),
            { }
        );
        export TodoStore = Store.Create<TodoState>(storeConfig);
        ```
    You may have noticed, the `Intent` for a set of actions has become the name of our store, tying together our set of actions with our slice of application state.
    - A `Store` instance has the following methods/properties:
        - `state$: Observable<any>`
            - returns an observable of the current store's slice of state.
            - new values are piped through any time `setState()` or `patchState()` are called
        - `rootState$: Observable<any>`
            - returns an observable of the root store's state.
            - new values are piped through any time `setState()` or `patchState()` are called
        - `currentState(): any`
            - returns an instance of the store's state slice at a given point in time (when called)
        - `currentRootState(): any`
            - returns an instance of the root store's state at a given point in time (when called).
        - `dispatch(action: any|{type: string}): Observable<void>`
            - returns an observable of type void
            - triggers any action handlers registered in any other stores, matching the dispatched actions's `Type` or `type`.

5. Now we can wire up some handlers in our store so that we can do things when Actions are dispatched.
    - Handlers are not called directly by your code; instead, they are invoked when an Action of a matching `Type` is dispatched.
    - Each handler is passed 2 arguments:
        1. A `StateContext<T>`, which provides some operations to interact with state at the time the handler is executed.
        2. The dispatched Action that triggered it.
        ```ts
        // store/todo/store.ts
        
        import { Store, StateContext, StoreConfig } from '@animus-bi/redxs';
        import * as TodosActions from './actions';
        import { TodoState } from './state';

        const createTodo = (ctx: StateContext<TodoState>, action: TodosActions.CreateTodo)  => {
            const { list, hash } = ctx.getState();
            list.push(action.payload);
            hash[action.payload.task] = action.payload;
            return ctx.patchState({ list, hash });
        }

        export TodoStore = Store.Create<TodoState>({
            /* ... */
        });
        ```
    - In order that the `createTodo` function is called when the Action is dispatched, we must add it to our store's StateConfig so that our Action `type` is the key name for the handler.
    &nbsp;
        
    - Note: you are not calling the handler in the config, but rather, you're passing a reference to the handler. To avoid any lexical problems, use `.bind(this)` 
        ```ts
        // store/todo.ts

        import { Store, StateContext, StoreConfig } from '@animus-bi/redxs';
        import * as TodosActions from './actions';
        import { TodoState } from './state';

        const createTodo = (ctx: StateContext<TodoState>, action: TodosActions.CreateTodo) => {
            const { list, hash } = ctx.getState();
            list.push(action.payload);
            hash[action.payload.task] = action.payload;
            return ctx.patchState({ list, hash });
        }

        export TodoStore = Store.Create<TodoState>({
            name: TodosActions.Intent,
            initialState: new TodoState(),
            handlers: {
                [TodosActions.CreateTodo.Type]: createTodo.bind(this)
            }
        });

        ```
    - You may also attach multiple handlers to a single dispatched action: 
        ```ts
        // store/todo.ts

        import { Store, StateContext, StoreConfig } from '@animus-bi/redxs';
        import * as TodosActions from './actions';
        import { TodoState } from './state';

        const preCreateTodo = (ctx: StateContext<TodoState>, action: TodosActions.CreateTodo) => {
            console.log('intend to create a todo');
        }

        const createTodo = (ctx: StateContext<TodoState>, action: TodosActions.CreateTodo) => {
            const { list, hash } = ctx.getState();
            list.push(action.payload);
            hash[action.payload.task] = action.payload;
            return ctx.patchState({ list, hash });
        }

        export TodoStore = Store.Create<TodoState>({
            name: TodosActions.Intent,
            initialState: new TodoState(),
            handlers: {
                //
                // Good/Ok
                //
                [TodosActions.CreateTodo.Type]: [
                    preCreateTodo.bind(this) 
                    createTodo.bind(this)
                ]
            }
        });

        ```
    - You should NOT list the same key twice in a store's action handler config (this is standard js stuff). 
        - You could do this, but the last one will probably win, and the other may not fire at all. Just use the one key with an array of handlers
        ```ts
        // store/todo.ts

        import { Store, StateContext, StoreConfig } from '@animus-bi/redxs';
        import * as TodosActions from './actions';
        import { TodoState } from './state';

        const preCreateTodo = (ctx: StateContext<TodoState>, action: TodosActions.CreateTodo) => {
            console.log('intend to create a todo');
        }

        const createTodo = (ctx: StateContext<TodoState>, action: TodosActions.CreateTodo) => {
            const { list, hash } = ctx.getState();
            list.push(action.payload);
            hash[action.payload.task] = action.payload;
            return ctx.patchState({ list, hash });
        }

        export TodoStore = Store.Create<TodoState>({
            name: TodosActions.Intent,
            initialState: new TodoState(),
            handlers: {
                //
                // !!!!!!BAD!!!!!!!!!!!!!!
                //
                [TodosActions.CreateTodo.Type]: preCreateTodo.bind(this),
                [TodosActions.CreateTodo.Type]: createTodo.bind(this)
            }
        });

        ```

6. To access state in anything, simply subscribe to your store's `state$` property wherever you want to receive state updates.
    ```ts

    import { TodoStore } from '../store/todo';

    export class SomeComponent {

        constructor() {
            this.subscription = TodoStore.state$.subscribe((todoState) => {
                this.todoState = todoState;
            })
        }
    }
    ```
    - It is often useful to set a default state value in your component.
        - To do that, call your store's `currentState()` method, which will return the current state of your slice (NOT NECESSARILY INITIAL STATE). 
            - This ensures resilience through re-render, initial loading, and late/lazy loading alike.
        - JavaScript
        ```js
        import { TodoStore } from '../store/todo';

        export class SomeComponent {

            constructor() {
                this.todoState = TodoStore.currentState();
                this.subscription = TodoStore.state$.subscribe((todoState) => {
                    this.todoState = todoState;
                })
            }
        }
        ```
        - TypeScript
        ```ts
        import { TodoStore } from '../store/todo';

        export class SomeComponent {
            todoState = TodoStore.currentState();
            constructor() {
                this.subscription = TodoStore.state$.subscribe((todoState) => {
                    this.todoState = todoState;
                });
            }
        }
        ```

9. Dispatch Actions from anywhere
    - React example
    ```jsx
    import { TodoStore } from '../store/todo';
    import * as TodosActions from './store/todo/actions';

    export class SomeComponent {
        addTodo(_e) {
            const text = document.getElementById('todo-input').value
            store.dispatch(new TodosActions.CreateTodo(text));
        }
        render() {
            return <div>
                <input type="text" id="todo-input" value="" />
                <button onClick={this.addTodo}>add todo</button>
            </div>
        }
    }
    ```
    - Angular example
    ```ts
    import { Component } from '@angular/core';
    import { TodoStore } from '../store/todo';
    import * as TodosActions from './store/todo/actions';

    @Component({
        selector: "some-component",
        template: `
        <div>
            <input type="text" id="todo-input" value="" />
            <button (click)="addTodo()">add todo</button>
        </div>
    `})
    export class SomeComponent {
        addTodo() {
            const text = document.getElementById('todo-input').value
            store.dispatch(new TodosActions.CreateTodo(text));
        }
    }
    ```

10. Combine dispatching and subscribing as needed for an overall async pub/sub model. See examples above for more info.



