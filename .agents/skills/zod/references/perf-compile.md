---
title: Compile Schemas in Hot Paths
impact: LOW-MEDIUM
impactDescription: Compiled parse is up to ~9x faster on the docs benchmark (measured 3-4x locally on small objects/tuples); gains apply to valid input only
tags: perf, compile, optimization, new-function, csp
---

## Compile Schemas in Hot Paths

`z.compile(schema)` returns a **clone** whose `_zod.run` first tries a generated fast path and falls back to the normal runtime parser if the fast path cannot accept the input. The original schema is never modified, and the clone is still an ordinary Zod schema: same methods (`.parse`, `.safeParse`, `.parseAsync`, `.extend`), same inferred types, same issues and messages.

The win comes from replacing the schema-walking interpreter with generated code, so it shows up where a schema is parsed over and over. Compile once at module level, not per request.

**Incorrect (re-walking the schema on every request):**

```typescript
import { z } from 'zod'

const CreateUser = z.object({
  username: z.string().min(3),
  bio: z.string().max(500),
  xp: z.number().int().nonnegative(),
})

// Hot path: 200k requests re-walk the same schema every time
app.post('/users', (req, res) => {
  const body = CreateUser.parse(req.body)
  // ...
})
```

**Correct (compile the final schema once at module level):**

```typescript
import { z } from 'zod'

const CreateUser = z.object({
  username: z.string().min(3),
  bio: z.string().max(500),
  xp: z.number().int().nonnegative(),
})

// One clone, generated once at module load; every request hits the fast path
const CompiledCreateUser = z.compile(CreateUser)

app.post('/users', (req, res) => {
  const body = CompiledCreateUser.parse(req.body)
  // ...
})
```

Keeping the uncompiled export alongside the compiled one costs nothing and keeps the schema usable as a building block:

```typescript
export const CreateUser = z.object({ username: z.string(), bio: z.string(), xp: z.number() })
export const CompiledCreateUser = z.compile(CreateUser)

// Same input type, same issues and messages as the original
type CreateUserInput = z.input<typeof CreateUser>
type CreateUserOutput = z.infer<typeof CompiledCreateUser> // identical to z.infer<typeof CreateUser>
```

### Measured effect

`z.compile` benchmarks are schema-dependent, not a guarantee. On Zod 4.6.5, 200k `parse()` calls of a 3-field object, min of 5 interleaved rounds:

| Case | Uncompiled | Compiled | Speedup |
|------|-----------|----------|---------|
| Object, valid input | 7 ms | 2 ms | **3.1x** |
| Tuple, valid input | 20 ms | 5 ms | **3.7x** |
| Object, invalid input | 135 ms | 133 ms | **1.02x** (no gain) |

Objects and tuples benefit most, and the acceleration is concentrated in **valid** input: when validation fails, the fast path bails out and the regular parser produces the error, so failures cost the same as before plus a wasted fast-path attempt. Do not expect compilation to make a slow failing endpoint fast.

### Compile the final schema

Methods that return a new schema discard the compiled fast path, so chain every modifier **before** compiling:

```typescript
// BAD: refine() clones the schema, so the fast path is gone
const Compiled = z.compile(CreateUser)
const WithRule = Compiled.refine((u) => u.xp > 0) // uncompiled

// GOOD: build the final schema, then compile once
const WithRule = z.compile(CreateUser.refine((u) => u.xp > 0))
```

`.refine()`, `.extend()`, `.optional()`, `.meta()`, `.transform()` and similar builders all return fresh, uncompiled schemas. If you must keep a compiled schema and also compose, compile again on the result.

**When NOT to use this pattern:**
- CSP-locked environments (see below)
- One-off or low-volume validation, where the added clone is noise (see `perf-cache-schemas`)
- Recursive schemas, `z.coerce.*`, `z.function()`, and async `.refine()`/`.transform()` — these cannot be compiled at all
- Any goal of speeding up the **failure** path

### Non-compilable schemas fall back silently

By default `z.compile()` never throws: an unsupported schema is returned uncompiled and keeps using the runtime parser, so behaviour is identical and only the speedup is missing. To make those refusals loud in tests or CI, pass `{ strict: true }`:

```typescript
import { z } from 'zod'

// Throws instead of silently returning an uncompiled schema
z.compile(z.object({ n: z.coerce.number() }), { strict: true })
// ZodCompileUnsupportedError: z.compile does not support coercion (z.coerce.number());
// this schema must use the runtime parser

z.compile(z.string().refine(async (v) => v.length > 2), { strict: true })
// ZodCompileAsyncError: z.compile: async .refine() predicates are not supported
```

Verified unsupported on 4.6.5: async `.refine()`, async `.transform()`, `z.coerce.*`, `z.function()`, and any schema whose subtree contains a reference cycle (recursive schemas). Sync `.refine()`, `.transform()`, `.superRefine()`, `preprocess`, `pipe`, `default`, `catch`, `z.lazy()`, unions, discriminated unions, intersections, `z.map()`, `z.set()`, `z.record()`, `z.date()` and `z.bigint()` **are** supported.

The fast path also only covers the forward direction: `encode()`, async parses, and `skipChecks` bypass it and use the runtime.

### Global opt-in with `zod/compile`

For an application that should not have to call `z.compile()` per schema, import the side-effect module once in the entry point, **before** any module that constructs schemas at top level:

```typescript
// src/index.ts — entry point, evaluated first
import 'zod/compile'
import { app } from './server'
import { UserSchema } from './schemas/user' // constructed after the shim is installed
```

Details that bite:

- **Evaluation order matters.** Schemas built in modules evaluated before this import are never compiled.
- **It is deferred.** Compilation happens on a schema's first parse, not at construction, so schemas that are never parsed cost nothing.
- **Refusals are permanent per schema.** If the compiler rejects a schema, the shim restores the runtime `_zod.run` for it and the schema keeps working unchanged.
- **Apps only, not libraries.** Importing it in a published library silently changes the behaviour of every downstream consumer, including those under a restrictive CSP.
- The import is listed in Zod's `sideEffects`, so bundlers drop the compiler for apps that never import it.

### CSP and bundle cost

Compilation generates code with `new Function()`, so it is unavailable where CSP blocks it (hardened `script-src` without `unsafe-eval`). `import 'zod/compile'` does not help — it uses the same mechanism. The escape hatch is `z.withParser(schema, parser)`, which installs an already-generated parser instead of compiling at runtime; it is intended for a build-time or native compiler that produces the parser ahead of the request path.

The compiler adds roughly **7 KB gzipped** when `z.compile()` or `zod/compile` is actually used. It is tree-shakeable, so the cost is zero when unused — but if you import it once for a single cold schema, you have paid full price for one fast path.

Reference: [z.compile](https://zod.dev/compile)
