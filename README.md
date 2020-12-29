# RedXS

> RedXS is a super lightweight redux implementation, inspired by NGXS that can run in React, Angular, Express, or anywhere!
> - Very simple composition
> - Very little boilerplate
> - Very easy to use and grasp
> &nbsp;

## BETA
- Be advised - this package is still in beta.

## Concepts

- `Action`
    - Any dispatched class with a `type` and other optional properties
- `RootStore`
    - Establishes root state
    - Provides an easy logical handle to stores
- `Store` 
    - Attaches handlers to Actions
    - Dispatches Actions
    - Sets/patches state

## Example Apps

- [React Todo Example](https://stackblitz.com/edit/react-redxs-todo-example)

- [Angular Todo Example](https://stackblitz.com/edit/angular-redxs-todo-example)

## Getting Started 

1. Run `npm install --save @animus-bi/redxs` to install the redxs library.

2. Define an Action
    - An action can be any object.
        - The action should define a unique property `type` or `Type`
            - instance or static/constructor property will both work the same
            - in the absence of a `type` property, the constructor name is used
        - All other properties on the object are passed to the handler as the action
    ```ts
    // store/todo/actions.ts

    export const Intent = 'todo';

    export class CreateTodo {
        static Type = `[${Intent}] Create A TODO`;
        constructor(public task: string) { }
    }
    ```
3. Define a default state
    ```ts
    // store/todo/state.ts

    export class TodoState {
        list: any[] = [];
        hash: any = {};
    }
    ```
4. Define a store that extends `Store<T>`
    ```ts
    // store/todo/store.ts
    export class TodoStore extends Store<TodoState> {
        /*...*/
    }
    ```
    - Extending `Store<T>` requires you to implement a custom getter that returns an instance of a `StoreConfig`
        1. An example of a `StoreConfig` using an object literal
            ```ts
            // store/todo/store.ts
            import * as TodosActions from './actions';
            import { TodoState } from './state';

            export class TodoStore extends Store<TodoState> {
                get config() {
                    return {
                        name: TodosActions.Intent,
                        initialState: new TodoState(),
                        handlers: { }
                    }
                }
            }
            ```
        2. An example of a `StoreConfig` using the static `StoreConfig.create` method
            ```ts
            // store/todo/store.ts

            import { Store, StoreConfig } from '@animus-bi/redxs';
            import * as TodosActions from './actions';
            import { TodoState } from './state';

            export class TodoStore extends Store<TodoState> {
                get config() {
                    return StoreConfig.create(
                        TodosActions.Intent,
                        new TodoState(),
                        { }
                    );
                }
            }
            ```
    Some noteworthy points thus far:
    1. By establishing an `Intent` for our actions, we can prefix all of our action types with it, making our actions more idempotent.
    2. We can use the imported `Intent` as our state slice name. (Spoiler alert: we're going to do the same thing with our Action types when we wire up some handlers next).

5. Wire up some handlers in our store so that we can do things when Actions are dispatched.
    - Add a `createTodo` handler.
    - Handlers are not called directly; they are invoked when an Action is dispatched.
    - Each handler is passed 2 arguments:
        1. A `StateContext<T>`, which is the context of the current store state.
        2. The dispatched Action that triggered it.
        ```ts
        // store/todo/store.ts
        
        import { Store, StateContext, StoreConfig } from '@animus-bi/redxs';
        import * as TodosActions from './actions';
        import { TodoState } from './state';

        export class TodoStore extends Store<TodoState> {
            /*...*/

            createTodo(
                ctx: StateContext<TodoState>,
                action: TodosActions.CreateTodo
            ) {
                const { list, hash } = ctx.getState();
                list.push(action.payload);
                hash[action.payload.task] = action.payload;
                return ctx.patchState({
                    list,
                    hash,
                });
            }
        }
        ```
    - In order that the `createTodo` function is called when the Action is dispatched, we must add it to our store's StateConfig so that our Action `type` is the key name for the handler.
    *** Note: you are not calling the handler in the config, but rather, you're passing a reference to the handler.
    ```ts
    // store/todo/store.ts

    import { Store, StateContext, StoreConfig } from '@animus-bi/redxs';
    import * as TodosActions from './actions';
    import { TodoState } from './state';

    export class TodoStore extends Store<TodoState> {
        get config() { 
            return StoreConfig.create(
                TodosActions.Intent,
                new TodoState(),
                { 
                    [TodosActions.CreateTodo.Type]: this.createTodo.bind(this)
                }
            );
        }
        /*...*/
    }

    ```

6. Create a selector in your store so that you can access state/slice properties in components and services later on.
    - Add a `todosList$` selector to your store by using the helper method `createSelector(predicate: (state: TodoState) => any)` on your store's parent.
        - `createSelector()` will return an rxjs observable
    ```ts
    // store/todo/store.ts

    import { Store, StateContext, StoreConfig } from '@animus-bi/redxs';
    import * as TodosActions from './actions';
    import { TodoState } from './state';

    export class TodoStore extends Store<TodoState> {
        /*...*/

        todosList$ = this.createSelector((state: TodoState) => state.list);

        /*...*/
    }
    ```

7. Define a root store that extends `RootStore`
    ```js
    // store/app-root-store.ts

    import { RootStore } from '@animus-bi/redxs';
    import { TodoStore } from './todo';

    export class AppRootStore extends RootStore {
        todos = new TodoStore();
    }
    ```

8. Initialize your root `AppRootStore` wherever you feel is appropriate
    - Do this by calling `init(enableLogging: boolean)`
    ```js
    const rootStore = new AppRootStore();
    rootStore.init();
    ```
    - `init()` returns an instance of the root store, so you may call it fluently
    ```js
    const rootStore = new AppRootStore().init();
    ```
    - You may also export a single root store as a const or default
    ```js
    // store/app-root-store.ts

    import { RootStore } from '@animus-bi/redxs';
    import { TodoStore } from './todo';

    export class AppRootStore extends RootStore {
        todos = new TodoStore();
    }

    export const store = new AppRootStore().init();
    export default store;
    ```

9. Dispatch Actions from anywhere
    ```jsx
    import { store } from '/store/app-root-store';
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

10. Subscribe to your Store selectors from anywhere
    ```jsx
    import { store } from '/store/app-root-store';
    import * as TodosActions from './store/todo/actions';

    export class SomeComponent {
        
        constructor() {
            this.todoList$ = store.todos.todoList$;
            this.subscription = new Subscription();
            this.subscription.add(
                this.todoList$.subscribe((todosList) => {
                    this.todos = todosList;
                })
            );
        }

        addTodo(_e) {
            const text = document.getElementById('todo-input').value
            store.dispatch(new TodosActions.CreateTodo(text));
        }
        render() {
            return <div>
                <input type="text" id="todo-input" value="" />
                <button onClick={this.addTodo}>add todo</button>
                {this.todos.map((todo, i) => {   
                    return (<div>{todo.name}</div>) 
                })}
            </div>
        }
    }
    ```



