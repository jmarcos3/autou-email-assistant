const API_BASE = localStorage.getItem("apiBase") || "http://localhost:8000"

document.getElementById("email-form").addEventListener("submit", async (e) => {
  e.preventDefault()
  const btn = document.getElementById("submit")
  btn.disabled = true
  btn.textContent = "Processando..."

  const file = document.getElementById("file").files[0]
  const text = document.getElementById("text").value

  const fd = new FormData()
  if (file) fd.append("file", file)
  if (text && text.trim().length) fd.append("text", text)

  try {
    const res = await fetch(`${API_BASE}/process`, { method: "POST", body: fd })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()

    document.getElementById("category").textContent = data.category
    document.getElementById("reply").textContent = data.reply
    document.getElementById("preview").textContent = data.preview
    document.getElementById("result").classList.remove("hidden")
  } catch (err) {
    alert(
      "Falha ao processar. Verifique se a API está rodando em " +
        API_BASE +
        " .\n" +
        err
    )
  } finally {
    btn.disabled = false
    btn.textContent = "Processar"
  }
})
