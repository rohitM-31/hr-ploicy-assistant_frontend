// All calls to the FastAPI backend
export async function getHealth() {
  const res = await fetch("/api/health");
  if (!res.ok) throw new Error("Backend not reachable");
  return res.json();
}

export async function askQuestion(question) {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Something went wrong");
  return data;
}
