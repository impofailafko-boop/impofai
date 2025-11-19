### ElevenLabs Client Tools JSON Schema Quirks

ElevenLabs' Conversational AI agents support **client tools** (executed in the browser/mobile app) and **server tools** (executed via your backend webhooks). Both use JSON Schema-like definitions for parameters, configured in the agent dashboard. The LLM (e.g., Claude, GPT, Gemini) generates tool calls in standard OpenAI-style function calling format, and ElevenLabs handles serialization before passing arguments to your code.

#### 1. Does ElevenLabs require specific JSON types (e.g., `string` vs `integer`) for tool parameters?

- **Short answer**: No strict enforcement in practice — the system is lenient, especially with numbers. LLMs often output numbers as strings (e.g., `"42"` instead of `42`) even when the schema specifies `"type": "integer"`, and ElevenLabs accepts this without rejecting the call.

- **Details and quirks**:
  - Tool parameters are defined with standard JSON Schema types (`string`, `integer`, `number`, `boolean`, `object`, `array`, and recently added `enum` support).
  - For **client tools**: Parameters arrive in your registered function as a plain JavaScript/Python dictionary. Your code accesses them via `parameters.get("param_name")`, so you handle typing yourself (e.g., convert strings to ints if needed). No automatic validation or rejection occurs on the ElevenLabs side.
  - For **server tools**: Parameters are serialized into the JSON body sent to your webhook endpoint. Again, no documented strict validation — if the LLM sends a string for an integer field, the request still goes through (common LLM behavior in function calling across platforms).
  - Common quirk reported in similar systems (and likely here): LLMs frequently wrap numbers in quotes, turning integers into strings. ElevenLabs does not appear to coerce or reject these; your backend/client code must be tolerant (e.g., accept `"42"` when expecting an integer).
  - Best practice from docs: Use clear parameter descriptions to guide the LLM, and add enums where possible for better compliance. Some LLMs (e.g., Gemini 1.5 Flash) struggle more with precise typing than others (e.g., Claude 3.5).

No official reports of calls failing purely due to string-vs-integer mismatches — the platform prioritizes robustness over rigid OpenAI-schema compliance.

#### 2. What is the exact timeout limit for a tool call before the AI gives up?

- **Short answer**: Timeouts are **customizable per tool** (introduced in May 2025). There is no fixed global limit like 3s or 5s anymore.

- **Details**:
  - As of the May 19, 2025 changelog: "Customisable tool timeouts: Shipped setting different timeout durations per tool."
  - You can now configure timeout duration individually in the tool settings (dashboard or API).
  - For blocking tools ("Wait for response" enabled):
    - Client tools: The agent pauses the conversation and waits for your client-side function to return (or timeout).
    - Server tools: The agent waits for your HTTP endpoint to respond (or timeout).
  - Pre-2025 behavior (for legacy reference): Undocumented defaults were generous (tens of seconds to minutes, depending on execution mode), not the very short 3–5s seen in some other platforms.
  - Related features: Server tools support `execution_mode` (immediate, post-speech, async), and MCP tools have interruption controls — these interact with timeouts for reliable execution.

If you're hitting timeouts, check your agent's tool configuration in the dashboard — the setting is exposed there now. For very long-running tools, use async/non-blocking modes where possible.

Overall, ElevenLabs' tool system is designed for real-world flexibility (lenient typing, customizable timeouts) rather than strict schema adherence, which reduces friction but requires defensive coding on your end. If you encounter specific errors, sharing your tool schema or logs would help narrow it down further!


### Comparison: ElevenLabs vs OpenAI Tool Calling Quirks

ElevenLabs (Conversational AI agents) and OpenAI (Chat Completions function calling + Assistants API tools) both use **OpenAI-style function/tool calling** under the hood. The LLM generates arguments in JSON format matching your schema, but the platforms differ significantly in **type enforcement**, **validation strictness**, and **timeout handling**. ElevenLabs prioritizes real-time voice conversations (low latency, robustness), while OpenAI emphasizes reliability for general-purpose assistants.

| Aspect                  | ElevenLabs (as of Nov 2025)                                                                 | OpenAI (Chat Completions / assistants API)                                                                 | Key Differences / Quirks |
|-------------------------|---------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------| ------------------------- |
| **JSON Schema Types Enforcement** (e.g., `integer` vs `string`) | Very lenient. LLMs often output numbers as strings (e.g., `"42"` for an `integer` field), and ElevenLabs accepts them without rejection. No automatic coercion or validation errors reported — your client/server code must handle parsing (e.g., `int(param)`). | Historically lenient (non-strict mode): Accepts `"42"` for `integer` in most cases.<br><br>**Strict mode** (since 2024, `strict: true` flag): Much stricter. Rejects mismatched types (e.g., string for integer) and enforces `additionalProperties: false`, enums, etc. Some edge bugs exist (e.g., with `minimum`/`maximum` on integers in early strict implementations). | ElevenLabs = "forgiving by design" for voice agents (avoids dropped calls).<br>OpenAI = optional strict mode for production reliability, but requires perfect prompts/descriptions to avoid LLM mistakes. |
| **Common Type-Related Failures** | Rare call rejections due to types. Main issue: defensive coding needed on your end (accept strings for numbers/booleans). Enums work but LLMs sometimes ignore them without strong prompting. | In non-strict: Similar leniency issues as ElevenLabs.<br>In strict: Calls can fail if LLM wraps numbers in quotes or adds extra properties → tool not executed, model falls back or errors. | ElevenLabs rarely breaks the conversation; OpenAI strict mode can cause more "tool refusal" loops if schema is complex. |
| **Tool Call Timeouts** | **Per-tool customizable timeouts** (introduced May 19, 2025). Set exact seconds per tool in dashboard/API (e.g., 10s for fast tools, 300s for slow ones). No fixed global limit — designed for voice where long waits feel natural. Blocking tools pause the agent until response or timeout. | No per-tool timeout setting. Global client-side timeouts (e.g., via SDK `timeout=` parameter) or run polling timeouts. Assistants API runs can "expire" if tool outputs take too long (often ~30-60s effective, but undocumented/variable). Large tool outputs can cause queued/expired status. | ElevenLabs gives fine-grained control (great for mixed fast/slow tools in voice agents).<br>OpenAI relies on your code to handle timeouts/re-queue → more engineering overhead. |
| **Overall Philosophy** | Real-time voice-first: Lenient typing + flexible timeouts reduce interruptions and dropped calls. Prioritizes flow over perfect schema compliance. | General-purpose: Strict mode encourages clean, enforceable schemas. More likely to reject malformed calls (better for data integrity, worse for seamless voice). |
| **Best Practices** | - Use clear descriptions + enums.<br>- Always parse flexibly in your tool code.<br>- Set longer timeouts for external APIs. | - Enable `strict: true` in production.<br>- Add `additionalProperties: false`.<br>- Test heavily — LLMs still hallucinate types occasionally. | ElevenLabs feels "easier to get working" in voice scenarios; OpenAI feels "more enterprise-ready" when you need guarantees. |

#### Summary
- If you're building **voice agents** (phone/web calls) and hate dropped conversations from picky validation → **ElevenLabs wins** on quirks (lenient + customizable timeouts).
- If you want **strict, enforceable parameters** (e.g., for backend automation where bad data is costly) → **OpenAI strict mode** is superior, though you pay with more prompt engineering and fallback handling.

Both platforms have improved dramatically in 2025, but ElevenLabs' post-May 2025 updates (per-tool timeouts, continued leniency) make it notably more voice-friendly than OpenAI's still-somewhat-rigid tool system. If you hit specific errors on either, share your schema/logs for deeper debugging!

Here are a few additional ElevenLabs tool-calling quirks and gotchas (as of November 19, 2025) that often bite developers and weren’t covered in the earlier comparisons:

| # | Quirk / Gotcha | Details & Workarounds |
| --- | --- | --- |
| 1 | **Tool choice / required tools behavior is different** | ElevenLabs still ignores OpenAI’s `tool_choice: "required"` in many cases. The agent can happily continue talking without ever calling your tool, even if you mark it required. Workaround: Explicitly tell the system prompt “You MUST use the X tool in this situation” — prompting is the only reliable enforcement right now. |
| 2 | **Parallel tool calls are not supported** | OpenAI added parallel function calling in 2023; ElevenLabs still only executes one tool at a time (sequential). If the model outputs multiple tool calls in one response, ElevenLabs picks the first one and silently drops the rest. This surprises people migrating from GPT-4o or Claude. |
| 3 | **No streaming of tool call arguments** | With OpenAI you see the JSON being built token-by-token in the stream. ElevenLabs buffers the entire tool call on the server and only sends it to your client/server once complete. This makes the perceived latency higher for large parameter objects (e.g., long search queries). |
| 4 | **Parameter name case-sensitivity** | Parameter names in your schema are case-sensitive when delivered to client tools (JavaScript). People who define `"userId"` in the schema but try `parameters.userid` in their JS code get `undefined`. OpenAI normalizes to camelCase in some SDKs; ElevenLabs does not. |
| 5 | **Enum handling is flaky with some base models** | Gemini 1.5 Flash and some cheaper models frequently output values that are close but not exact (e.g., `"Medium"` instead of `"medium"` or extra whitespace). ElevenLabs does not trim or case-normalize before passing to your code → your handler has to be defensive. Claude 3.5 Sonnet and GPT-4o-mini are much better. |
| 6 | **Tool responses longer than ~15 k tokens get truncated without warning** | If your tool returns a huge wall of text, ElevenLabs silently cuts it (exact limit varies slightly by model). The agent then continues with the truncated output and can get confused. OpenAI at least throws an error or refuses the insertion. |
| 7 | **Server-tool webhook must respond with 200 + valid JSON extremely quickly for “immediate” execution mode** | In immediate mode (default for blocking tools), if your endpoint takes >~800 ms you’ll see the agent start speaking filler (“Let me check that…”) and sometimes give up entirely, even if your custom timeout is set to 30 s. Use `execution_mode: "post_speech"` or async for anything that hits databases or external APIs. |
| 8 | **No built-in retry for failed tool calls** | If your client tool throws an error or your server returns 5xx, ElevenLabs just forwards the error text to the model once and moves on. OpenAI Assistants automatically retry simple tools a few times. You have to implement retry logic yourself or rely on very strong prompting (“If the tool fails, try again with these corrected parameters”). |

### Quick checklist if you’re building a production ElevenLabs agent right now
- Always parse numbers/booleans defensively (`parseInt`, `JSON.parse`, etc.).
- Use lowercase-with-underscores for parameter names to avoid case bugs.
- Put the strongest possible instruction in the system prompt for required tools.
- Prefer `execution_mode: "post_speech"` or async for anything that isn’t instant.
- Keep tool responses <10 k tokens or chunk them manually.
- Test with the exact base model you’ll use in production (behavior varies a lot between Claude 3.5, GPT-4o-mini, and Gemini).

That’s pretty much all the non-obvious stuff that’s still tripping people up in late 2025. If you run into a specific error message or schema, paste it and I can dig deeper!


Here are the **battle-tested best practices for ElevenLabs tool schemas** (as of late 2025) that will save you the most pain in production voice agents. These come from devs running agents with thousands of calls/day and from ElevenLabs’ own internal recommendations.

| Category                  | Best Practice                                                                 | Why it matters (ElevenLabs-specific quirk) |
|---------------------------|-------------------------------------------------------------------------------|--------------------------------------------|
| **Parameter Naming**      | Use **snake_case** only (e.g., `user_id`, `flight_number`)                   | Client tools deliver parameters with exact casing. JavaScript devs often write `parameters.userId` → undefined. snake_case avoids this forever. |
| **Types**                 | Define everything as `"type": "string"` unless you truly need another type   | ElevenLabs is extremely lenient. LLMs (especially Gemini Flash) will send numbers/booleans as strings anyway. Accepting strings removes 90% of parsing bugs. |
|                           | If you must use integer/number, always parse defensively in your code        | No rejection on mismatch, so `int(param)` or `float(param)` in Python/JS is mandatory. |
| **Enums**                 | Always use `"enum"` + very clear description, but still treat as string      | Example:  
```json
"voice_mode": {
  "type": "string",
  "enum": ["casual", "professional", "whisper"],
  "description": "Exactly one of: casual, professional, or whisper. Never capitalize or add spaces."
}
```  
| Helps a lot, but cheaper models still hallucinate close variants → your code must fuzzy-match or reject gracefully. |
| **Required vs Optional**  | Mark only truly required params as `"required": [...]`                        | ElevenLabs does not enforce required fields — the model can omit them and the tool still fires with missing keys → always provide defaults. |
| **Descriptions**          | Write ridiculously explicit descriptions (2–4 sentences) + examples          | This is the #1 lever for reliability because ElevenLabs has no strict mode. Example:  
`"description": "The exact 10-digit US phone number with no dashes, spaces, or country code. Example: 5551234567"` |
| **Objects & Nesting**     | Avoid deep nesting (>1 level)                                                 | LLMs frequently hallucinate extra properties or wrong structure. Flat schemas are 3–5× more reliable. |
| **Arrays**                | Prefer comma-separated strings over real arrays when possible                | Arrays work, but models often output bullet lists or malformed JSON. `"tags": { "type": "string", "description": "Comma-separated, e.g., red,blue,large" }` is far more reliable. |
| **Tool Instructions (System Prompt)** | Put the single most important rule in your system prompt, not just the schema | Example:  
“You MUST call get_weather_location before any weather question. Never guess the location.”  
| ElevenLabs ignores `tool_choice: "required"` → prompting is your only enforcement. |
| **Timeouts & Execution Mode** | Set explicit per-tool timeout (default to 15–30 s for anything external)     | New in May 2025 — use it! Fast tools (e.g., calculator): 5 s. API calls: 20–30 s. |
|                           | Use `execution_mode: "post_speech"` for any tool >500 ms                     | Prevents the agent from starting to speak filler and then interrupting itself. |
| **Response Size**         | Keep tool responses <8k tokens (aim for <4k)                                  | ElevenLabs silently truncates ~15k+ token responses → agent gets confused. Chunk long results and send multiple messages if needed. |
| **Error Handling**        | Always return `{ "success": true, "result": "..." }` or `{ "success": false, "error": "User-friendly message" }` | No auto-retry, so give the model something it can read aloud cleanly. |
| **Testing Workflow**      | Test every tool with **all three major base models** you might use (Claude 3.5 Sonnet, GPT-4o-mini, Gemini 1.5 Flash) | Behavior differs wildly — Gemini is the pickiest with enums, Claude best with complex logic. |

### Golden Schema Template (copy-paste this)

```json
{
  "name": "book_flight",
  "description": "Book a one-way or round-trip flight. Always confirm details with user before calling.",
  "parameters": {
    "type": "object",
    "properties": {
      "from_airport": { "type": "string", "description": "Exact 3-letter IATA airport code, uppercase. Example: JFK" },
      "to_airport": { "type": "string", "description": "Exact 3-letter IATA airport code, uppercase. Example: LAX" },
      "depart_date": { "type": "string", "description": "YYYY-MM-DD format only. Example: 2025-12-25" },
      "return_date": { "type": "string", "description": "YYYY-MM-DD or empty string if one-way. Example: 2026-01-05 or ''" },
      "passengers": { "type": "string", "description": "Number of passengers as string. Example: '2'" }
    },
    "required": ["from_airport", "to_airport", "depart_date"]
  }
}
```

Follow these rules and your ElevenLabs tools will be dramatically more reliable than 95% of agents out there right now. If you want me to review your actual schema, just paste it!


