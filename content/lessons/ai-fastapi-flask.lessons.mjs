// W3Schools-style FastAPI tutorial (Python). Run each program on your computer; the output block shows what you should see.
const L = (n, title, sub, big, steps, output, mistakes, file, program, run) => ({
  n, title, sub, big, steps: steps.map(([c, t, l]) => [c, t, l || 'python']), output, mistakes, file, program, run, lang: 'python', fileLabel: 'app',
});

export const groups = [
  { id: 'fastapi-tutorial-1-basics', title: 'FastAPI tutorial 1: Your first API (lessons 1–5)', from: 1, to: 5 },
  { id: 'fastapi-tutorial-2-real-apps', title: 'FastAPI tutorial 2: Build a real API (lessons 6–10)', from: 6, to: 10 },
];

export const lessons = [
  L(1, 'Install FastAPI and say hello', 'Create a virtual environment and a one-route API.',
    'FastAPI is a Python framework for building APIs. You write normal functions, add a **decorator** that says which URL calls them, and FastAPI handles the web part. It also creates interactive documentation for free.',
    [
      ['python -m venv .venv\n.venv\\Scripts\\activate        # macOS/Linux: source .venv/bin/activate\npip install "fastapi[standard]"', 'A virtual environment keeps this project\'s packages separate. `fastapi[standard]` also installs the `fastapi` command and the Uvicorn server.', 'bash'],
      ['from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/")\ndef home():\n    return {"message": "Hello, FastAPI"}', '`@app.get("/")` means: when someone sends a GET request to `/`, run this function. A returned dict becomes JSON.'],
      ['fastapi dev main.py', 'Starts the server with auto-reload. Open http://127.0.0.1:8000 and then http://127.0.0.1:8000/docs for the automatic Swagger UI.', 'bash'],
    ],
    'INFO:     Uvicorn running on http://127.0.0.1:8000\n\nGET /  ->  {"message":"Hello, FastAPI"}',
    ['Naming the file `fastapi.py`: it shadows the library. Call it `main.py`.', 'Forgetting to activate the virtual environment: `ModuleNotFoundError`.', 'Using `fastapi run` while developing: use `fastapi dev` for auto-reload.'],
    'main.py', 'from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/")\ndef home():\n    return {"message": "Hello, FastAPI"}', 'fastapi dev main.py'),

  L(2, 'Path and query parameters', 'Read values from the URL.',
    'Values inside the path (`/items/7`) are **path parameters**. Values after `?` (`?limit=5`) are **query parameters**. FastAPI reads them from your function\'s arguments and converts them using the **type hints**.',
    [
      ['@app.get("/items/{item_id}")\ndef get_item(item_id: int):\n    return {"item_id": item_id}', '`{item_id}` in the path matches the argument name. `int` means `/items/abc` is rejected automatically with a clear 422 error.'],
      ['@app.get("/items")\ndef list_items(limit: int = 10, q: str | None = None):\n    return {"limit": limit, "q": q}', 'Arguments that are **not** in the path are query parameters. A default makes them optional.'],
      ['from enum import Enum\n\nclass Category(str, Enum):\n    office = "office"\n    tech = "tech"\n\n@app.get("/category/{name}")\ndef by_category(name: Category):\n    return {"category": name}', 'An `Enum` limits the allowed values and shows them in the docs dropdown.'],
    ],
    'GET /items/7        -> {"item_id":7}\nGET /items?limit=3  -> {"limit":3,"q":null}\nGET /items/abc      -> 422 "Input should be a valid integer"',
    ['Declaring the wrong type: `item_id: str` accepts anything.', 'Route order matters: put `/items/me` before `/items/{item_id}`.'],
    'main.py', 'from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/items/{item_id}")\ndef get_item(item_id: int):\n    return {"item_id": item_id}\n\n@app.get("/items")\ndef list_items(limit: int = 10, q: str | None = None):\n    return {"limit": limit, "q": q}', 'fastapi dev main.py'),

  L(3, 'Request bodies with Pydantic', 'Validate JSON sent by the client.',
    'For POST/PUT you receive JSON. Describe its shape with a **Pydantic model**: a class with typed fields. FastAPI parses, validates and documents the body for you.',
    [
      ['from pydantic import BaseModel, Field\n\nclass Item(BaseModel):\n    name: str = Field(min_length=2)\n    price: float = Field(gt=0)\n    in_stock: bool = True', 'Each field has a type and optional rules. `in_stock` has a default, so it is optional.'],
      ['@app.post("/items", status_code=201)\ndef create_item(item: Item):\n    return {"created": item.name, "total_with_tax": round(item.price * 1.18, 2)}', 'A parameter whose type is a Pydantic model is read from the **request body**. `status_code=201` means "Created".'],
      ['curl -X POST http://127.0.0.1:8000/items -H "Content-Type: application/json" -d "{\\"name\\": \\"Pen\\", \\"price\\": 2.5}"', 'Send a request from the terminal. Or press **Try it out** in `/docs`.', 'bash'],
    ],
    '201 -> {"created":"Pen","total_with_tax":2.95}\n\nBad body {"name":"P","price":-1} -> 422 with a list of exactly which fields failed',
    ['Using a plain `dict` as the body: you lose validation and docs.', 'Mutating the input model and returning it: return a separate response model.'],
    'main.py', 'from fastapi import FastAPI\nfrom pydantic import BaseModel, Field\n\napp = FastAPI()\n\nclass Item(BaseModel):\n    name: str = Field(min_length=2)\n    price: float = Field(gt=0)\n    in_stock: bool = True\n\n@app.post("/items", status_code=201)\ndef create_item(item: Item):\n    return {"created": item.name, "total_with_tax": round(item.price * 1.18, 2)}', 'fastapi dev main.py'),

  L(4, 'Response models and errors', 'Control what you send back.',
    'A `response_model` filters the output (never leak a password hash!) and documents it. Raise `HTTPException` to return an error with the right status code.',
    [
      ['class UserIn(BaseModel):\n    name: str\n    email: str\n    password: str\n\nclass UserOut(BaseModel):\n    id: int\n    name: str\n    email: str', 'Two models: what the client sends and what we return. The output has **no** password.'],
      ['USERS: dict[int, dict] = {}\n\n@app.post("/users", response_model=UserOut, status_code=201)\ndef create_user(user: UserIn):\n    new_id = len(USERS) + 1\n    USERS[new_id] = {"id": new_id, **user.model_dump()}\n    return USERS[new_id]', 'Even though the stored dict contains the password, `response_model` strips it from the response.'],
      ['from fastapi import HTTPException\n\n@app.get("/users/{user_id}", response_model=UserOut)\ndef get_user(user_id: int):\n    if user_id not in USERS:\n        raise HTTPException(status_code=404, detail="User not found")\n    return USERS[user_id]', 'Raise an `HTTPException` for expected errors.'],
    ],
    'POST /users {"name":"Ayesha","email":"a@x.com","password":"secret"}\n -> 201 {"id":1,"name":"Ayesha","email":"a@x.com"}\nGET /users/99 -> 404 {"detail":"User not found"}',
    ['Returning the same model you received (with passwords).', 'Returning 200 with `{"error": ...}` instead of a real error status.'],
    'main.py', 'from fastapi import FastAPI, HTTPException\nfrom pydantic import BaseModel\n\napp = FastAPI()\nUSERS: dict[int, dict] = {}\n\nclass UserIn(BaseModel):\n    name: str\n    email: str\n    password: str\n\nclass UserOut(BaseModel):\n    id: int\n    name: str\n    email: str\n\n@app.post("/users", response_model=UserOut, status_code=201)\ndef create_user(user: UserIn):\n    new_id = len(USERS) + 1\n    USERS[new_id] = {"id": new_id, **user.model_dump()}\n    return USERS[new_id]\n\n@app.get("/users/{user_id}", response_model=UserOut)\ndef get_user(user_id: int):\n    if user_id not in USERS:\n        raise HTTPException(status_code=404, detail="User not found")\n    return USERS[user_id]', 'fastapi dev main.py'),

  L(5, 'async def or def?', 'When to use async in FastAPI.',
    'FastAPI runs a plain `def` endpoint in a **thread pool** and an `async def` endpoint on the **event loop**. Use `async def` only when everything inside uses `await` (async database drivers, `httpx.AsyncClient`). A blocking call inside `async def` freezes **every** request.',
    [
      ['import asyncio\n\n@app.get("/fast")\nasync def fast():\n    await asyncio.sleep(1)      # yields control while waiting\n    return {"ok": True}', 'While this waits, the server can handle other requests on the same thread.'],
      ['import time\n\n@app.get("/blocking")\ndef blocking():\n    time.sleep(1)               # fine in a normal def: runs in a thread\n    return {"ok": True}', 'A plain `def` may block, FastAPI moves it to a worker thread.'],
      ['import httpx\n\n@app.get("/proxy")\nasync def proxy():\n    async with httpx.AsyncClient() as client:\n        r = await client.get("https://api.github.com")\n    return {"status": r.status_code}', 'Async HTTP client for outgoing calls.'],
    ],
    '/fast and /blocking both take about 1 second, but 100 simultaneous /fast requests finish in about 1 second total.',
    ['`time.sleep()` or `requests.get()` inside `async def`: blocks the whole server.', 'Making everything async "for speed" without async libraries.'],
    'main.py', 'import asyncio\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/fast")\nasync def fast():\n    await asyncio.sleep(1)\n    return {"ok": True}', 'fastapi dev main.py'),

  L(6, 'Dependency injection', 'Share logic with Depends.',
    'A **dependency** is a function FastAPI runs before your endpoint and whose result it passes in. Use them for database sessions, the current user, pagination and settings. They can depend on other dependencies.',
    [
      ['from fastapi import Depends\n\ndef pagination(skip: int = 0, limit: int = 10):\n    return {"skip": skip, "limit": limit}\n\n@app.get("/things")\ndef things(page: dict = Depends(pagination)):\n    return page', 'The same `skip`/`limit` query parameters can be reused by many routes.'],
      ['def get_db():\n    db = SessionLocal()\n    try:\n        yield db           # the endpoint runs here\n    finally:\n        db.close()         # always cleans up', 'A dependency with `yield` opens a resource and closes it after the response.'],
      ['@app.get("/users")\ndef users(db = Depends(get_db)):\n    return db.query(User).all()', 'Declare it in the arguments and use it. Tests can replace it with `app.dependency_overrides`.'],
    ],
    'GET /things?skip=20&limit=5 -> {"skip":20,"limit":5}',
    ['Creating a database connection at import time instead of per request.', 'Forgetting `Depends(...)`: FastAPI treats the argument as a query parameter.'],
    'deps.py', 'from fastapi import Depends, FastAPI\n\napp = FastAPI()\n\ndef pagination(skip: int = 0, limit: int = 10):\n    return {"skip": skip, "limit": limit}\n\n@app.get("/things")\ndef things(page: dict = Depends(pagination)):\n    return page', 'fastapi dev deps.py'),

  L(7, 'A database with SQLAlchemy', 'Save data in PostgreSQL (or SQLite to start).',
    'SQLAlchemy maps Python classes to tables. The pattern: an **engine** (connection), a **session** per request, and a **model** per table. Start with SQLite (no install), switch to PostgreSQL by changing one URL.',
    [
      ['pip install sqlalchemy', 'Add the ORM. For PostgreSQL also `pip install psycopg[binary]`.', 'bash'],
      ['from sqlalchemy import create_engine, String\nfrom sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker\n\nengine = create_engine("sqlite:///app.db")   # postgresql+psycopg://user:pass@localhost/shop\nSessionLocal = sessionmaker(bind=engine)\n\nclass Base(DeclarativeBase): pass\n\nclass Todo(Base):\n    __tablename__ = "todos"\n    id: Mapped[int] = mapped_column(primary_key=True)\n    title: Mapped[str] = mapped_column(String(100))\n    done: Mapped[bool] = mapped_column(default=False)\n\nBase.metadata.create_all(engine)', 'One class = one table. `create_all` creates missing tables (use Alembic migrations in real projects).'],
      ['@app.post("/todos", status_code=201)\ndef add(title: str, db=Depends(get_db)):\n    todo = Todo(title=title)\n    db.add(todo)\n    db.commit()\n    db.refresh(todo)\n    return {"id": todo.id, "title": todo.title, "done": todo.done}', '`add` stages the row, `commit` saves it, `refresh` loads generated values such as `id`.'],
      ['@app.get("/todos")\ndef all_todos(db=Depends(get_db)):\n    return [{"id": t.id, "title": t.title, "done": t.done} for t in db.query(Todo).all()]', 'Read everything back.'],
    ],
    'POST /todos?title=Learn%20FastAPI -> 201 {"id":1,"title":"Learn FastAPI","done":false}\nGET /todos -> [{"id":1,"title":"Learn FastAPI","done":false}]',
    ['Forgetting `db.commit()`: nothing is saved.', 'Sharing one session between requests.', 'SQLite-only code that breaks on PostgreSQL: test on the real database.'],
    'db_app.py', 'from fastapi import Depends, FastAPI\nfrom sqlalchemy import create_engine, String\nfrom sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker\n\nengine = create_engine("sqlite:///app.db")\nSessionLocal = sessionmaker(bind=engine)\n\nclass Base(DeclarativeBase): pass\n\nclass Todo(Base):\n    __tablename__ = "todos"\n    id: Mapped[int] = mapped_column(primary_key=True)\n    title: Mapped[str] = mapped_column(String(100))\n    done: Mapped[bool] = mapped_column(default=False)\n\nBase.metadata.create_all(engine)\napp = FastAPI()\n\ndef get_db():\n    db = SessionLocal()\n    try:\n        yield db\n    finally:\n        db.close()\n\n@app.post("/todos", status_code=201)\ndef add(title: str, db=Depends(get_db)):\n    todo = Todo(title=title)\n    db.add(todo)\n    db.commit()\n    db.refresh(todo)\n    return {"id": todo.id, "title": todo.title, "done": todo.done}\n\n@app.get("/todos")\ndef all_todos(db=Depends(get_db)):\n    return [{"id": t.id, "title": t.title, "done": t.done} for t in db.query(Todo).all()]', 'fastapi dev db_app.py'),

  L(8, 'Authentication with JWT', 'Protect routes with a token.',
    'The client logs in once and gets a **JWT** (a signed token). It sends it in the `Authorization: Bearer <token>` header on later requests. A dependency checks it and returns the current user.',
    [
      ['pip install pyjwt "pwdlib[argon2]"', 'A JWT library and a strong password hasher. **Never** store plain passwords.', 'bash'],
      ['import jwt, datetime as dt\nSECRET = "change-me-and-load-from-env"\n\ndef make_token(username: str) -> str:\n    exp = dt.datetime.now(dt.timezone.utc) + dt.timedelta(minutes=30)\n    return jwt.encode({"sub": username, "exp": exp}, SECRET, algorithm="HS256")', 'A token with a subject and an expiry, signed with a secret only the server knows.'],
      ['from fastapi.security import OAuth2PasswordBearer\noauth = OAuth2PasswordBearer(tokenUrl="login")\n\ndef current_user(token: str = Depends(oauth)):\n    try:\n        return jwt.decode(token, SECRET, algorithms=["HS256"])["sub"]\n    except jwt.PyJWTError:\n        raise HTTPException(status_code=401, detail="Invalid or expired token")\n\n@app.get("/me")\ndef me(user: str = Depends(current_user)):\n    return {"user": user}', 'Any route that depends on `current_user` is protected. The docs page even gets an **Authorize** button.'],
    ],
    'GET /me (no token)     -> 401 Not authenticated\nGET /me (valid token)  -> {"user":"ayesha"}',
    ['Hard-coding the secret in git: read it from an environment variable.', 'Long-lived tokens without refresh or revocation.', 'Using MD5/SHA for passwords: use Argon2 or bcrypt.'],
    'auth.py', 'import datetime as dt\nimport jwt\nfrom fastapi import Depends, FastAPI, HTTPException\nfrom fastapi.security import OAuth2PasswordBearer\n\nSECRET = "change-me-and-load-from-env"\napp = FastAPI()\noauth = OAuth2PasswordBearer(tokenUrl="login")\n\ndef make_token(username: str) -> str:\n    exp = dt.datetime.now(dt.timezone.utc) + dt.timedelta(minutes=30)\n    return jwt.encode({"sub": username, "exp": exp}, SECRET, algorithm="HS256")\n\ndef current_user(token: str = Depends(oauth)):\n    try:\n        return jwt.decode(token, SECRET, algorithms=["HS256"])["sub"]\n    except jwt.PyJWTError:\n        raise HTTPException(status_code=401, detail="Invalid or expired token")\n\n@app.get("/me")\ndef me(user: str = Depends(current_user)):\n    return {"user": user}', 'fastapi dev auth.py'),

  L(9, 'Background tasks, CORS and routers', 'Features every real API uses.',
    '`BackgroundTasks` run work after the response is sent (send an email). **CORS** lets a browser app on another origin call your API. `APIRouter` splits a big app into files.',
    [
      ['from fastapi import BackgroundTasks\n\ndef send_welcome(email: str):\n    print("sending welcome mail to", email)\n\n@app.post("/signup")\ndef signup(email: str, tasks: BackgroundTasks):\n    tasks.add_task(send_welcome, email)\n    return {"status": "welcome mail queued"}', 'The client gets the answer immediately; the task runs afterwards.'],
      ['from fastapi.middleware.cors import CORSMiddleware\n\napp.add_middleware(\n    CORSMiddleware,\n    allow_origins=["http://localhost:3000"],\n    allow_methods=["*"],\n    allow_headers=["*"],\n)', 'Allow your React app on port 3000 to call this API from the browser. Never use `"*"` with credentials.'],
      ['# routers/users.py\nfrom fastapi import APIRouter\nrouter = APIRouter(prefix="/users", tags=["users"])\n\n@router.get("/")\ndef list_users():\n    return []\n\n# main.py\napp.include_router(router)', 'One router per feature keeps files small. `tags` groups them in the docs.'],
    ],
    'POST /signup?email=a@x.com -> {"status":"welcome mail queued"}   (and later, in the console: sending welcome mail to a@x.com)',
    ['Using background tasks for heavy or must-not-fail jobs: use a queue like Celery or ARQ.', 'CORS errors are browser-only: curl will work while the browser fails.'],
    'features.py', 'from fastapi import BackgroundTasks, FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\n\napp = FastAPI()\napp.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["*"], allow_headers=["*"])\n\ndef send_welcome(email: str):\n    print("sending welcome mail to", email)\n\n@app.post("/signup")\ndef signup(email: str, tasks: BackgroundTasks):\n    tasks.add_task(send_welcome, email)\n    return {"status": "welcome mail queued"}', 'fastapi dev features.py'),

  L(10, 'Test and deploy', 'Check it works, then ship it.',
    '`TestClient` calls your app in-process with no server. Deploy by running **Uvicorn** (or `fastapi run`) behind a proxy, usually in a Docker container.',
    [
      ['pip install pytest httpx', 'Test dependencies.', 'bash'],
      ['from fastapi.testclient import TestClient\nfrom main import app\n\nclient = TestClient(app)\n\ndef test_home():\n    r = client.get("/")\n    assert r.status_code == 200\n    assert r.json() == {"message": "Hello, FastAPI"}\n\ndef test_validation():\n    r = client.get("/items/abc")\n    assert r.status_code == 422', 'Plain pytest functions. Run them with `pytest`.'],
      ['FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 8000\nCMD ["fastapi", "run", "main.py", "--port", "8000"]', 'A minimal Dockerfile. Build with `docker build -t my-api .` and run with `docker run -p 8000:8000 my-api`.', 'dockerfile'],
    ],
    '$ pytest\n2 passed in 0.31s',
    ['Running with `--reload` in production.', 'Not pinning versions in `requirements.txt`.', 'Listening on 127.0.0.1 inside Docker: use host 0.0.0.0 (`fastapi run` does this).'],
    'test_main.py', 'from fastapi.testclient import TestClient\nfrom main import app\n\nclient = TestClient(app)\n\ndef test_home():\n    r = client.get("/")\n    assert r.status_code == 200\n    assert r.json() == {"message": "Hello, FastAPI"}', 'pytest'),
];
