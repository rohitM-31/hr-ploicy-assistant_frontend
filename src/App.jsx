import { useEffect, useRef, useState } from "react";
import { askQuestion, getHealth } from "./api";

const SAMPLES = [
  "How many days of annual leave can I carry forward?",
  "Can I work from home while on probation?",
  "What is the hotel limit in a metro city?",
  "How much can I spend on food during a trip?",
  "Can I claim a monitor for home?",
  "Does the company pay for gym membership?",
];

function Sources({ sources }) {
  const [open, setOpen] = useState(false);
  if (!sources?.length) return null;
  return (
    <div className="sources">
      <button className="link" onClick={() => setOpen(!open)}>
        {open ? "▾" : "▸"} Policy sections used ({sources.length})
      </button>
      {open &&
        sources.map((s) => (
          <div key={s.source} className="source">
            <div className="source-head">
              <strong>{s.source}</strong>
              <span className="score">match {s.score}</span>
            </div>
            <p>{s.text}</p>
          </div>
        ))}
    </div>
  );
}

function Message({ msg }) {
  if (msg.role === "user") return <div className="bubble user">{msg.text}</div>;
  if (msg.role === "error") return <div className="bubble error">⚠️ {msg.text}</div>;
  return (
    <div className={`bubble bot ${msg.found ? "" : "not-found"}`}>
      <div className="answer">{msg.text}</div>
      {!msg.found && <div className="tag">Escalated to HR</div>}
      <Sources sources={msg.sources} />
    </div>
  );
}

export default function App() {
  const [health, setHealth] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: "down" }));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(question) {
    const q = question.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const r = await askQuestion(q);
      setMessages((m) => [
        ...m,
        { role: "bot", text: r.answer, found: r.found, sources: r.sources },
      ]);
    } catch (e) {
      setMessages((m) => [...m, { role: "error", text: e.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>📘 HR Policy Assistant</h2>
        <div className={`status ${health?.status === "ok" ? "ok" : "down"}`}>
          {health === null
            ? "Connecting..."
            : health.status === "ok"
            ? `Online · ${health.mode === "gemini" ? "Gemini RAG" : "Offline mode"}`
            : "Backend not running"}
        </div>

        {health?.policies && (
          <>
            <h4>Policies loaded</h4>
            <ul>
              {health.policies.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </>
        )}

        <h4>Try a question</h4>
        {SAMPLES.map((s) => (
          <button key={s} className="sample" onClick={() => send(s)} disabled={loading}>
            {s}
          </button>
        ))}

        <button className="clear" onClick={() => setMessages([])}>
          Clear chat
        </button>
      </aside>

      <main className="chat">
        <div className="messages">
          {messages.length === 0 && (
            <div className="empty">
              <h1>Ask about company policy</h1>
              <p>Leave · Remote work · Expenses · IT equipment</p>
              <p className="muted">Answers come only from policy documents, with the source shown.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <Message key={i} msg={m} />
          ))}
          {loading && <div className="bubble bot typing">Searching policies…</div>}
          <div ref={bottomRef} />
        </div>

        <form
          className="input-row"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Ask
          </button>
        </form>
      </main>
    </div>
  );
}
