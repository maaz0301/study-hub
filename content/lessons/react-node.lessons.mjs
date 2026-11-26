// W3Schools-style tutorial for JavaScript, React and Node.js. JavaScript and React snippets run in the browser.
const mk = (kind, lang) => (n, title, sub, big, steps, mistakes, extra = {}) => ({ n, title, sub, big, steps: steps.map(([c, t]) => [c, t, lang, kind]), mistakes, lang, ...extra });
const JS = mk('js', 'javascript');
const RX = mk('react', 'javascript');
const NODE = (n, title, sub, big, steps, mistakes, file, program, run) => ({ n, title, sub, big, steps: steps.map(([c, t, l]) => [c, t, l || 'javascript']), mistakes, file, program, run, lang: 'javascript', fileLabel: 'server' });

export const groups = [
  { id: 'javascript-tutorial', title: 'JavaScript tutorial (lessons 1–10)', from: 1, to: 10 },
  { id: 'react-tutorial', title: 'React tutorial (lessons 11–18)', from: 11, to: 18 },
  { id: 'nodejs-tutorial', title: 'Node.js tutorial (lessons 19–24)', from: 19, to: 24 },
];

export const lessons = [
  // ------------------------------------------------ JavaScript
  JS(1, 'JavaScript variables and types', 'let, const and the basic value types.',
    'A **variable** is a named box for a value. Use `const` by default (the name cannot be reassigned) and `let` when it must change. Avoid `var`. Values are numbers, strings, booleans, `null`, `undefined`, objects (including arrays) and functions. Press **Try it Yourself** and edit the code.',
    [
      ['const language = "JavaScript";\nlet year = 2025;\nyear = year + 1;\nconsole.log(language, year);', '`const` for fixed names, `let` for values that change. `console.log` prints to the result panel.'],
      ['console.log(typeof 42, typeof "hi", typeof true, typeof undefined, typeof null, typeof {}, typeof []);', '`typeof` shows the type. Notice `null` and arrays both say `object`, a famous quirk.'],
      ['const name = "Ayesha";\nconsole.log(`Hello ${name}, 2 + 3 = ${2 + 3}`);', 'Template literals use backticks. `${ }` embeds any expression.'],
    ],
    ['Using `var`: it ignores block scope and is hoisted.', 'Reassigning a `const` throws a TypeError. (Its object can still be changed.)']),

  JS(2, 'Equality, truthy and falsy', '== vs ===, and what counts as false.',
    'Always compare with `===` (strict equality). `==` converts types first and gives odd results. Six values are **falsy**: `false`, `0`, `""`, `null`, `undefined`, `NaN`. Everything else is truthy.',
    [
      ['console.log(5 == "5", 5 === "5", 0 == false, 0 === false, null == undefined, null === undefined);', '`==` says yes to 5 and "5". `===` says no. Use `===`.'],
      ['for (const v of [0, "", null, undefined, NaN, [], {}, "0"]) console.log(JSON.stringify(v) ?? String(v), "->", Boolean(v));', 'Empty array and empty object are **truthy**. The string "0" is truthy too.'],
      ['const user = { name: "Sara" };\nconsole.log(user.age ?? "unknown", user.age || "unknown", user?.address?.city);', '`??` only replaces null/undefined, `||` replaces any falsy value. `?.` safely reads deep properties.'],
    ],
    ['`if (arr)` is true for an empty array. Check `arr.length`.', 'Using `||` for defaults when 0 is a valid value: use `??`.']),

  JS(3, 'Functions and arrow functions', 'Reusable blocks of code.',
    'A function takes inputs (parameters) and returns an output. Arrow functions `=>` are a short form that is common in modern code and callbacks.',
    [
      ['function add(a, b) {\n  return a + b;\n}\nconsole.log(add(2, 3));', 'A regular function declaration.'],
      ['const square = (x) => x * x;\nconst greet = (name = "friend") => `Hi ${name}`;\nconsole.log(square(7), greet(), greet("Omar"));', 'Arrow functions. A single expression returns automatically. `name = "friend"` is a default value.'],
      ['const sum = (...nums) => nums.reduce((a, b) => a + b, 0);\nconsole.log(sum(1, 2, 3, 4));', '`...nums` collects all arguments into an array (rest parameters).'],
    ],
    ['Forgetting `return` in a function with braces: it returns `undefined`.', 'Returning an object literal from an arrow needs brackets: `() => ({ a: 1 })`.']),

  JS(4, 'Objects and destructuring', 'Group data with key/value pairs.',
    'Objects hold related values under names. **Destructuring** pulls values out, and the **spread** operator `...` copies or merges objects.',
    [
      ['const person = { name: "Bilal", age: 35, city: "Karachi" };\nconsole.log(person.name, person["age"]);\nperson.age = 36;\nconsole.log(person);', 'Read with dot or bracket notation. Objects are mutable even when `const`.'],
      ['const { name, city = "Lahore", ...rest } = { name: "Hina", age: 31 };\nconsole.log(name, city, rest);', 'Destructuring with a default and a rest object.'],
      ['const base = { a: 1, b: 2 };\nconst copy = { ...base, b: 20, c: 3 };\nconsole.log(base, copy);', 'Spread copies properties. Later keys win. `base` is untouched.'],
      ['console.log(Object.keys(base), Object.values(base), Object.entries(base));', 'Helpers to turn an object into arrays.'],
    ],
    ['`const b = a` does not copy an object, both names point to the same one.', 'Spread is a *shallow* copy: nested objects are still shared.']),

  JS(5, 'Arrays: map, filter, reduce', 'Transform lists without loops.',
    'These three methods cover most array work. They return **new** arrays and do not change the original.',
    [
      ['const nums = [1, 2, 3, 4, 5, 6];\nconsole.log(nums.map((n) => n * 2));\nconsole.log(nums.filter((n) => n % 2 === 0));\nconsole.log(nums.reduce((sum, n) => sum + n, 0));', '`map` transforms each item, `filter` keeps some, `reduce` folds everything to one value.'],
      ['const people = [{ name: "A", age: 20 }, { name: "B", age: 35 }, { name: "C", age: 41 }];\nconsole.log(people.filter((p) => p.age > 30).map((p) => p.name));', 'Chain them: adults over 30, then just their names.'],
      ['const words = ["pear", "apple", "fig"];\nconsole.log(words.find((w) => w.length === 3), words.some((w) => w.startsWith("a")), words.every((w) => w.length > 2), [...words].sort());', '`find`, `some`, `every`. `sort` changes the array, so copy it first with `[...words]`.'],
    ],
    ['`forEach` returns nothing: use `map` when you need a new array.', '`sort()` without a comparer sorts numbers as text: `[10, 9, 1].sort()` gives `[1, 10, 9]`.']),

  JS(6, 'Scope and closures', 'Which variables can a function see?',
    'A function can read variables from where it was **defined**. When it is returned and used later, it still remembers them: that is a **closure**. Closures give you private state.',
    [
      ['function makeCounter() {\n  let count = 0;\n  return () => ++count;\n}\nconst a = makeCounter();\nconst b = makeCounter();\nconsole.log(a(), a(), a(), b());', 'Each counter has its own hidden `count`. Nothing outside can touch it.'],
      ['for (var i = 0; i < 3; i++) setTimeout(() => console.log("var", i), 0);\nfor (let j = 0; j < 3; j++) setTimeout(() => console.log("let", j), 0);', 'The classic trap: `var` shares one `i` (prints 3,3,3). `let` makes a new `j` per loop.'],
    ],
    ['Using `var` in loops with callbacks.', 'Closures keep variables alive: large objects captured by a long-lived callback can leak memory.']),

  JS(7, 'Promises and async/await', 'Work with things that take time.',
    'A **Promise** is a value that will arrive later (a network call, a timer). `async` functions use `await` to wait for one without blocking the page. Use `try/catch` for errors.',
    [
      ['const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));\nwait(300).then(() => console.log("done after 300ms"));\nconsole.log("this prints first");', '`.then` runs later. The line after it runs immediately.'],
      ['const wait = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));\nasync function main() {\n  const a = await wait(200, "A");\n  const b = await wait(200, "B");\n  console.log(a + b);\n}\nmain();', '`await` pauses *this function* only. Reads like normal top-to-bottom code.'],
      ['const wait = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));\nconst t = Date.now();\nconst [x, y] = await Promise.all([wait(300, "x"), wait(300, "y")]);\nconsole.log(x, y, Date.now() - t, "ms (about 300, not 600)");', '`Promise.all` runs them at the same time. Total time is the slowest one.'],
      ['async function risky() { throw new Error("boom"); }\ntry { await risky(); } catch (e) { console.log("caught:", e.message); }', 'Errors in `await` are caught with `try/catch`.'],
    ],
    ['Forgetting `await`: you get a Promise object instead of the value.', 'Awaiting in a loop one by one when the calls are independent: use `Promise.all`.']),

  JS(8, 'The event loop', 'Why setTimeout(0) runs last.',
    'JavaScript runs one thing at a time on a **call stack**. Timers and network replies wait in queues. When the stack is empty, the loop first runs **microtasks** (promises), then one **task** (timers). That is why promise callbacks run before `setTimeout`.',
    [
      ['console.log("1 sync");\nsetTimeout(() => console.log("4 timeout"), 0);\nPromise.resolve().then(() => console.log("3 promise"));\nqueueMicrotask(() => console.log("3b microtask"));\nconsole.log("2 sync");', 'Predict the order first! Sync code, then microtasks, then timers.'],
      ['const start = Date.now();\nsetTimeout(() => console.log("timer fired after", Date.now() - start, "ms"), 10);\nwhile (Date.now() - start < 200) {}\nconsole.log("blocking loop finished");', 'A long synchronous loop blocks everything, even a 10 ms timer waits.'],
    ],
    ['Heavy CPU work on the main thread freezes the page.', 'Assuming `setTimeout(fn, 0)` runs immediately.']),

  JS(9, 'Classes and `this`', 'Blueprints for objects.',
    'A **class** describes the data and methods of a kind of object. `this` points at the object a method is called on. Subclasses reuse code with `extends`.',
    [
      ['class Account {\n  #balance = 0;\n  constructor(owner) { this.owner = owner; }\n  deposit(n) { this.#balance += n; return this; }\n  get balance() { return this.#balance; }\n}\nconst acc = new Account("Zara").deposit(50).deposit(25);\nconsole.log(acc.owner, acc.balance);', '`#balance` is truly private. `get` makes a read-only property. Returning `this` allows chaining.'],
      ['class Animal { speak() { return `${this.name} makes a sound`; } constructor(n) { this.name = n; } }\nclass Dog extends Animal { speak() { return super.speak() + ": woof"; } }\nconsole.log(new Dog("Rex").speak());', '`extends` inherits, `super` calls the parent version.'],
      ['const obj = { name: "obj", regular() { return this.name; }, arrow: () => typeof this };\nconst fn = obj.regular;\nconsole.log(obj.regular(), obj.arrow());\ntry { console.log(fn()); } catch (e) { console.log("lost this:", e.message); }', 'Detach a method and `this` is lost. Arrow functions do not have their own `this`.'],
    ],
    ['Passing `obj.method` as a callback loses `this`. Use an arrow wrapper or `.bind`.', 'Forgetting `new` when creating an instance.']),

  JS(10, 'Modules, JSON and errors', 'Final touches every program needs.',
    'Split code into files with `import`/`export`. Exchange data with JSON. Handle failures with `try/catch` and custom errors.',
    [
      ['const data = { id: 1, tags: ["a", "b"], nested: { ok: true } };\nconst text = JSON.stringify(data);\nconsole.log(text);\nconsole.log(JSON.parse(text).nested.ok);', '`JSON.stringify` turns an object into text, `JSON.parse` turns it back.'],
      ['try {\n  JSON.parse("{ not json }");\n} catch (err) {\n  console.log(err.name + ": " + err.message);\n} finally {\n  console.log("always runs");\n}', '`finally` runs whether or not there was an error.'],
      ['class ValidationError extends Error {\n  constructor(field) { super(`${field} is required`); this.name = "ValidationError"; this.field = field; }\n}\ntry { throw new ValidationError("email"); } catch (e) { console.log(e instanceof ValidationError, e.message, e.field); }', 'Custom errors carry extra information and can be told apart with `instanceof`.'],
    ],
    ['`JSON.stringify` drops functions and `undefined`, and fails on circular objects.', 'Swallowing errors with an empty `catch`.']),

  // ------------------------------------------------ React
  RX(11, 'React: your first component', 'A component is a function that returns UI.',
    'React builds screens from **components**: functions whose names start with a capital letter and that return JSX (HTML-like syntax). Every example here defines a component named `App` and shows it live. Press **Try it Yourself** and change the text.',
    [
      ['function App() {\n  return <h2>Hello, React! 👋</h2>;\n}', 'The simplest component. JSX looks like HTML but it is JavaScript.'],
      ['function Badge({ label, color }) {\n  return <span style={{ background: color, color: "white", padding: "2px 10px", borderRadius: 99 }}>{label}</span>;\n}\nfunction App() {\n  return <p><Badge label="new" color="#16a34a" /> <Badge label="sale" color="#e11d48" /></p>;\n}', 'Components take **props** (inputs) and can be reused many times. `{ }` puts JavaScript into JSX.'],
    ],
    ['Lowercase component names: `<badge />` is treated as an HTML tag.', 'Returning two sibling elements without a wrapper: wrap them in `<>...</>`.']),

  RX(12, 'State with useState', 'Make the screen react to the user.',
    'Props come from the parent, **state** is memory owned by the component. When you call the setter, React re-runs the component and updates the screen.',
    [
      ['function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <div>\n      <p>You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)}>+1</button>{" "}\n      <button onClick={() => setCount(0)}>Reset</button>\n    </div>\n  );\n}', 'Click the buttons in the result panel. `useState(0)` returns the value and a setter.'],
      ['function App() {\n  const [name, setName] = useState("");\n  return (\n    <div>\n      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />\n      <p>{name ? `Hello, ${name}!` : "Type something"}</p>\n    </div>\n  );\n}', 'A **controlled input**: React state is the single source of truth for the text.'],
    ],
    ['Changing state directly (`count++`): always use the setter.', 'Using the old value in quick succession: `setCount(c => c + 1)` is safer.']),

  RX(13, 'Lists, keys and conditions', 'Render arrays and show things only sometimes.',
    'Use `.map()` to turn an array into elements. Each item needs a stable `key`. Use `&&` or a ternary to show or hide parts.',
    [
      ['function App() {\n  const items = [{ id: 1, text: "Learn JS" }, { id: 2, text: "Learn React" }, { id: 3, text: "Build an app" }];\n  return <ul>{items.map((i) => <li key={i.id}>{i.text}</li>)}</ul>;\n}', '`key` lets React track items when the list changes. Use a real id, not the index, if the list can be reordered.'],
      ['function App() {\n  const [logged, setLogged] = useState(false);\n  return (\n    <div>\n      {logged ? <p>Welcome back! 🎉</p> : <p>Please sign in.</p>}\n      {logged && <small>You can sign out any time.</small>}<br />\n      <button onClick={() => setLogged(!logged)}>{logged ? "Sign out" : "Sign in"}</button>\n    </div>\n  );\n}', 'A ternary chooses between two views; `&&` shows something or nothing.'],
    ],
    ['Missing `key` warning, or using the array index when items move.', '`{count && <p/>}` renders a `0` when count is 0. Use `count > 0 &&`.']),

  RX(14, 'A to-do list', 'Combine state, lists and events.',
    'Real apps keep an **array in state** and always replace it with a new array (never push into it). This is the pattern behind nearly every React screen.',
    [
      ['function App() {\n  const [todos, setTodos] = useState([{ id: 1, text: "Try React", done: true }]);\n  const [text, setText] = useState("");\n  const add = () => {\n    if (!text.trim()) return;\n    setTodos([...todos, { id: Date.now(), text, done: false }]);\n    setText("");\n  };\n  const toggle = (id) => setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));\n  const remove = (id) => setTodos(todos.filter((t) => t.id !== id));\n  return (\n    <div>\n      <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="New task" />{" "}\n      <button onClick={add}>Add</button>\n      <ul>\n        {todos.map((t) => (\n          <li key={t.id}>\n            <label style={{ textDecoration: t.done ? "line-through" : "none" }}>\n              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} /> {t.text}\n            </label>{" "}\n            <button onClick={() => remove(t.id)}>✕</button>\n          </li>\n        ))}\n      </ul>\n      <small>{todos.filter((t) => !t.done).length} left</small>\n    </div>\n  );\n}', 'Add: spread into a new array. Toggle: `map` and copy one item. Remove: `filter`. Try it!'],
    ],
    ['`todos.push(x); setTodos(todos)`: same array, React sees no change.', 'Using `Date.now()` ids is fine for demos; use UUIDs or server ids in real apps.']),

  RX(15, 'useEffect: side effects', 'Run code after the screen updates.',
    '`useEffect` runs code **after** rendering: timers, fetching, subscriptions. The dependency array decides when it runs again. Return a function to clean up.',
    [
      ['function App() {\n  const [seconds, setSeconds] = useState(0);\n  useEffect(() => {\n    const id = setInterval(() => setSeconds((s) => s + 1), 1000);\n    return () => clearInterval(id);\n  }, []);\n  return <h3>⏱ {seconds}s since this component appeared</h3>;\n}', '`[]` = run once. The returned function stops the timer when the component goes away.'],
      ['function App() {\n  const [n, setN] = useState(1);\n  useEffect(() => { document.title = "Count " + n; }, [n]);\n  return <button onClick={() => setN(n + 1)}>n = {n} (title changes)</button>;\n}', '`[n]` = run again whenever `n` changes.'],
    ],
    ['Missing cleanup: intervals and listeners pile up.', 'Leaving out the dependency array makes the effect run after every render.']),

  RX(16, 'Fetching data', 'Load data from an API.',
    'The usual pattern: state for `data`, `loading` and `error`, and an effect that calls `fetch`. This example uses a free public API.',
    [
      ['function App() {\n  const [post, setPost] = useState(null);\n  const [state, setState] = useState("loading");\n  useEffect(() => {\n    fetch("https://jsonplaceholder.typicode.com/posts/1")\n      .then((r) => r.json())\n      .then((d) => { setPost(d); setState("ready"); })\n      .catch(() => setState("error"));\n  }, []);\n  if (state === "loading") return <p>Loading…</p>;\n  if (state === "error") return <p>Something went wrong.</p>;\n  return <div><h3>{post.title}</h3><p>{post.body}</p></div>;\n}', 'Three states, three views. Real apps often use a library like TanStack Query for this.'],
    ],
    ['Not handling loading and error states: users see a blank screen.', 'Calling `async` directly as the effect function: wrap it in an inner function.']),

  RX(17, 'Sharing state: lifting up and context', 'Two components need the same data.',
    'When siblings need the same state, move it to their common parent and pass it down (**lifting state up**). For data needed everywhere (theme, user), use **context** so you do not pass props through every level.',
    [
      ['function Counter({ value, onInc }) { return <button onClick={onInc}>Count: {value}</button>; }\nfunction Total({ value }) { return <p>Total from parent: {value}</p>; }\nfunction App() {\n  const [n, setN] = useState(0);\n  return <div><Counter value={n} onInc={() => setN(n + 1)} /><Total value={n} /></div>;\n}', 'The parent owns `n`. The child tells the parent when to change it.'],
      ['const ThemeContext = createContext("light");\nfunction Button() {\n  const theme = useContext(ThemeContext);\n  return <button style={{ background: theme === "dark" ? "#111" : "#eee", color: theme === "dark" ? "#fff" : "#111" }}>I use the {theme} theme</button>;\n}\nfunction App() {\n  const [theme, setTheme] = useState("light");\n  return (\n    <ThemeContext.Provider value={theme}>\n      <Button /><br /><br />\n      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>Toggle theme</button>\n    </ThemeContext.Provider>\n  );\n}', 'Any component inside the `Provider` can read the value with `useContext`.'],
    ],
    ['Putting everything in context: every consumer re-renders when it changes.', 'Duplicating state in two places so they drift apart.']),

  RX(18, 'useRef, useMemo and custom hooks', 'The rest of the everyday hooks.',
    '`useRef` holds a value that survives renders without triggering one (and gives access to DOM nodes). `useMemo` caches a calculation. A **custom hook** is just a function starting with `use` that reuses hook logic.',
    [
      ['function App() {\n  const input = useRef(null);\n  return <div><input ref={input} placeholder="click the button" />{" "}<button onClick={() => input.current.focus()}>Focus the input</button></div>;\n}', '`ref` gives direct access to the DOM element.'],
      ['function useToggle(initial = false) {\n  const [on, setOn] = useState(initial);\n  return [on, () => setOn((v) => !v)];\n}\nfunction App() {\n  const [open, toggle] = useToggle();\n  return <div><button onClick={toggle}>{open ? "Hide" : "Show"} details</button>{open && <p>Here are the details 📦</p>}</div>;\n}', 'A custom hook packages state logic so many components can use it.'],
    ],
    ['Reading `ref.current` during render for values that should update the screen: use state.', 'Wrapping everything in `useMemo`: measure first, it costs memory too.']),

  // ------------------------------------------------ Node.js
  NODE(19, 'Node.js: what it is and your first script', 'JavaScript outside the browser.',
    'Node.js runs JavaScript on your computer using Chrome\'s V8 engine. It has no `window` or `document`, but it has files, networking and processes. Install from nodejs.org, then run files with `node file.js`.',
    [
      ['node --version\nnpm --version', 'Check the install.', 'bash'],
      ['mkdir hello-node\ncd hello-node\nnpm init -y\nnpm pkg set type=module', 'A project folder with a `package.json`. `type=module` enables `import`.', 'bash'],
      ['console.log("Hello from Node", process.version);\nconsole.log("Arguments:", process.argv.slice(2));\nconsole.log("Home folder:", process.env.HOME ?? process.env.USERPROFILE);', '`process` describes the running program: version, arguments, environment variables.'],
    ],
    ['Using `window` or `document` in Node: they do not exist.', 'Mixing `require` (CommonJS) and `import` (ES modules) in one file.'],
    'hello.mjs', 'console.log("Hello from Node", process.version);\nconsole.log("Arguments:", process.argv.slice(2));', 'node hello.mjs one two'),

  NODE(20, 'Read and write files', 'The fs module.',
    'Node ships with built-in modules. `fs/promises` reads and writes files with `async/await`. Never use the `...Sync` versions inside a server: they block everyone.',
    [
      ['import { readFile, writeFile } from "node:fs/promises";\n\nawait writeFile("notes.txt", "first line\\n");\nconst text = await readFile("notes.txt", "utf8");\nconsole.log(text);', 'Write a file, then read it back as text.'],
      ['import { readdir, stat } from "node:fs/promises";\n\nfor (const name of await readdir(".")) {\n  const s = await stat(name);\n  console.log(name.padEnd(20), s.isDirectory() ? "folder" : s.size + " bytes");\n}', 'List a folder and show each item\'s size.'],
    ],
    ['Using `readFileSync` in a web server: it blocks all requests.', 'Relative paths depend on where you start `node`, not where the file is. Use `import.meta.url` / `path` to be safe.'],
    'files.mjs', 'import { readFile, writeFile } from "node:fs/promises";\nawait writeFile("notes.txt", "first line\\n");\nconsole.log(await readFile("notes.txt", "utf8"));', 'node files.mjs'),

  NODE(21, 'Your first HTTP server', 'Answer requests with the http module.',
    'A server listens on a **port** and runs your function for every request. This is what Express and other frameworks build on.',
    [
      ['import http from "node:http";\n\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { "Content-Type": "application/json" });\n  res.end(JSON.stringify({ hello: "world", url: req.url }));\n});\n\nserver.listen(3000, () => console.log("http://localhost:3000"));', '`createServer` gets the request and a response. `listen(3000)` starts it.'],
      ['curl http://localhost:3000/anything', 'In another terminal. You get the JSON back.', 'bash'],
    ],
    ['Forgetting `res.end()`: the browser waits forever.', 'Port already in use (`EADDRINUSE`): stop the other program or change the port.'],
    'server.mjs', 'import http from "node:http";\nhttp.createServer((req, res) => {\n  res.writeHead(200, { "Content-Type": "application/json" });\n  res.end(JSON.stringify({ hello: "world", url: req.url }));\n}).listen(3000, () => console.log("http://localhost:3000"));', 'node server.mjs'),

  NODE(22, 'Express: routes and middleware', 'A friendlier way to write APIs.',
    'Express adds **routing** (`GET /users/:id`) and **middleware** (functions that run before your route: logging, JSON parsing, auth). Install it with `npm install express`.',
    [
      ['npm install express', 'Adds the library to `package.json`.', 'bash'],
      ['import express from "express";\nconst app = express();\napp.use(express.json());\napp.use((req, _res, next) => { console.log(req.method, req.url); next(); });', '`express.json()` parses JSON bodies. The logger calls `next()` to continue to the route.'],
      ['const users = [{ id: 1, name: "Ayesha" }, { id: 2, name: "Bilal" }];\n\napp.get("/users", (_req, res) => res.json(users));\napp.get("/users/:id", (req, res) => {\n  const user = users.find((u) => u.id === Number(req.params.id));\n  if (!user) return res.status(404).json({ error: "not found" });\n  res.json(user);\n});\napp.post("/users", (req, res) => {\n  const user = { id: users.length + 1, name: req.body.name };\n  users.push(user);\n  res.status(201).json(user);\n});', 'Read lists, read one by id, create. Use proper status codes: 200, 201, 404.'],
      ['app.listen(3000, () => console.log("API on :3000"));', 'Start listening.'],
    ],
    ['Registering `express.json()` after the routes: `req.body` is undefined.', 'Not calling `next()` in middleware: the request hangs.'],
    'app.mjs', 'import express from "express";\nconst app = express();\napp.use(express.json());\nconst users = [{ id: 1, name: "Ayesha" }];\napp.get("/users", (_req, res) => res.json(users));\napp.listen(3000, () => console.log("API on :3000"));', 'node app.mjs'),

  NODE(23, 'Async code, errors and environment', 'Production habits.',
    'In Express, wrap async routes so rejected promises reach one **error handler**. Keep secrets in **environment variables**, never in code.',
    [
      ['app.get("/slow", async (req, res, next) => {\n  try {\n    const data = await fetchSomething();\n    res.json(data);\n  } catch (err) {\n    next(err);\n  }\n});', 'Pass errors to `next(err)`. (Express 5 does this automatically for rejected promises.)'],
      ['app.use((err, _req, res, _next) => {\n  console.error(err);\n  res.status(500).json({ error: "Something went wrong" });\n});', 'An error handler has **four** parameters. Register it last.'],
      ['const port = Number(process.env.PORT ?? 3000);\nconst dbUrl = process.env.DATABASE_URL;\nif (!dbUrl) throw new Error("DATABASE_URL is required");', 'Read config from the environment and fail fast when it is missing. Run with `node --env-file=.env app.mjs`.'],
    ],
    ['Sending error stack traces to users.', 'Committing `.env` to git: add it to `.gitignore`.'],
    'config.mjs', 'const port = Number(process.env.PORT ?? 3000);\nconsole.log("port", port);', 'PORT=4000 node config.mjs'),

  NODE(24, 'Connect a database and test the API', 'Persist data and check it works.',
    'Plug the API into PostgreSQL with `pg` (or MongoDB with `mongodb`) and test endpoints with Node\'s built-in test runner.',
    [
      ['npm install pg', 'The PostgreSQL client.', 'bash'],
      ['import pg from "pg";\nconst pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });\n\napp.get("/customers", async (_req, res) => {\n  const { rows } = await pool.query("SELECT id, name FROM customers WHERE city = $1", ["Lahore"]);\n  res.json(rows);\n});', 'Always pass values as parameters (`$1`), never glue them into the SQL: that stops SQL injection.'],
      ['import test from "node:test";\nimport assert from "node:assert/strict";\n\ntest("adds numbers", () => {\n  assert.equal(1 + 2, 3);\n});', 'Node has a built-in test runner. Run it with `node --test`.'],
    ],
    ['Building SQL with string concatenation: SQL injection.', 'Creating a new connection per request: use one shared pool.'],
    'db.mjs', 'import pg from "pg";\nconst pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });\nconst { rows } = await pool.query("SELECT now()");\nconsole.log(rows[0]);\nawait pool.end();', 'node --env-file=.env db.mjs'),
];
