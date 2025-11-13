const $ = (sel) => document.querySelector(sel)

const API_LOCAL = "http://localhost:8000"
const API_PROD = "https://email-assistant-u9v0.onrender.com" 
const API_DEFAULT = window.location.hostname.includes("localhost")
  ? API_LOCAL
  : API_PROD

const toasts = $("#toasts")
function toast(msg, type = "ok", timeout = 2500) {
  const t = document.createElement("div")
  t.className = `toast ${type}`
  t.textContent = msg
  toasts.appendChild(t)
  setTimeout(() => t.remove(), timeout)
}

function setBadge(el, categoryRaw) {
  const norm = String(categoryRaw || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  el.className = "badge"

  if (/\bimprodutivo\b/.test(norm)) {
    el.classList.add("badge--improdutivo")
    el.textContent = "Improdutivo"
    return
  }
  if (/\bprodutivo\b/.test(norm)) {
    el.classList.add("badge--produtivo")
    el.textContent = "Produtivo"
    return
  }
  el.classList.add("badge--outro")
  el.textContent = categoryRaw || "—"
}

function setMethodBadge(el, data) {
  el.className = "badge badge--method"
  let label = "Desconhecido"
  let hint = "Origem não informada pelo backend."

  const src = (
    data?.source ||
    data?.origin ||
    data?.mode ||
    data?.strategy ||
    ""
  )
    .toString()
    .toLowerCase()
  const isHeur =
    data?.is_heuristic === true ||
    src.includes("heur") ||
    src.includes("rule") ||
    src.includes("regex")

  const isAI =
    !isHeur &&
    (src.includes("ai") ||
      src.includes("ml") ||
      src.includes("model") ||
      src.includes("llm") ||
      !!data?.model ||
      !!data?.provider)

  if (isHeur) {
    el.classList.add("badge--heur")
    label = "Heurística"
    hint = "Classificação baseada em regras."
  } else if (isAI) {
    el.classList.add("badge--ai")
    const prov = data?.provider ? ` ${data.provider}` : ""
    const mdl = data?.model ? ` (${data.model})` : ""
    label = `IA${prov}${mdl}`
    hint = "Classificação gerada por modelo de IA."
  } else {
    el.classList.add("badge--unknown")
  }

  if (typeof data?.confidence === "number") {
    label += ` • conf. ${Math.round(data.confidence * 100)}%`
  }

  el.textContent = label
  el.title = hint
}

function formatBytes(b) {
  if (!b && b !== 0) return ""
  const u = ["B", "KB", "MB", "GB"]
  let i = 0
  let n = b
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`
}

function getApiBase() {
  const stored = localStorage.getItem("apiBase")
  if (stored && stored.trim()) return stored.trim()
  return API_DEFAULT
}

function setApiBase(v) {
  if (v) localStorage.setItem("apiBase", v)
}

const apiToggle = $("#toggle-api")
const apiConfig = $("#api-config")
const apiInput = $("#apiBaseInput")
const saveApi = $("#saveApi")
const resetApi = $("#resetApi")

const form = $("#email-form")
const btn = $("#submit")
const text = $("#text")
const charCount = $("#charCount")
const dropzone = $("#dropzone")
const fileInput = $("#file")
const fileChip = $("#fileChip")
const fileName = $("#fileName")
const clearFile = $("#clearFile")

const result = $("#result")
const categoryBadge = $("#categoryBadge")
const methodBadge = $("#methodBadge")
const reply = $("#reply")
const preview = $("#preview")
const copyReply = $("#copyReply")
const copyPreview = $("#copyPreview")

const statline = $("#statline")
const elapsedEl = $("#elapsed")
const modelInfo = $("#modelInfo")

let currentFile = null
const MAX_SIZE = 10 * 1024 * 1024

const originalPlaceholder = text.placeholder || ""

function lockTextarea(lock) {
  text.readOnly = lock
  text.classList.toggle("input--locked", lock)
  text.placeholder = lock
    ? "Campo desativado porque um arquivo foi selecionado."
    : originalPlaceholder
}

apiInput.value = getApiBase()
apiToggle.addEventListener("click", () => {
  const isHidden = apiConfig.classList.toggle("hidden")
  apiToggle.setAttribute("aria-expanded", String(!isHidden))
  apiConfig.setAttribute("aria-hidden", String(isHidden))
})
saveApi.addEventListener("click", () => {
  const v = apiInput.value.trim() || API_DEFAULT
  setApiBase(v)
  toast("Endpoint salvo.")
})
resetApi.addEventListener("click", () => {
  apiInput.value = API_DEFAULT
  setApiBase(API_DEFAULT)
  toast("Endpoint restaurado.")
})

function showFileChip(file) {
  fileChip.classList.remove("hidden")
  fileName.textContent = `${file.name} • ${formatBytes(file.size)}`

  text.value = ""
  charCount.textContent = "0 caracteres"
  lockTextarea(true)
}

function clearSelectedFile() {
  currentFile = null
  fileInput.value = ""
  fileChip.classList.add("hidden")
  fileName.textContent = ""

  lockTextarea(false)
}

dropzone.addEventListener("click", () => fileInput.click())
dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault()
    fileInput.click()
  }
})
;["dragenter", "dragover"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault()
    e.stopPropagation()
    dropzone.classList.add("dragover")
  })
)
;["dragleave", "drop"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault()
    e.stopPropagation()
    dropzone.classList.remove("dragover")
  })
)

dropzone.addEventListener("drop", (e) => {
  const f = e.dataTransfer.files?.[0]
  if (!f) return
  if (!/(\.txt|\.pdf)$/i.test(f.name)) {
    toast("Tipo de arquivo inválido. Use .txt ou .pdf", "bad")
    return
  }
  if (f.size > MAX_SIZE) {
    toast("Arquivo maior que 10 MB.", "bad")
    return
  }
  currentFile = f
  showFileChip(f)
})

fileInput.addEventListener("change", (e) => {
  const f = e.target.files?.[0]
  if (!f) return
  if (!/(\.txt|\.pdf)$/i.test(f.name)) {
    toast("Tipo de arquivo inválido. Use .txt ou .pdf", "bad")
    fileInput.value = ""
    return
  }
  if (f.size > MAX_SIZE) {
    toast("Arquivo maior que 10 MB.", "bad")
    fileInput.value = ""
    return
  }
  currentFile = f
  showFileChip(f)
})

clearFile.addEventListener("click", clearSelectedFile)

text.addEventListener("input", () => {
  const len = text.value.length
  charCount.textContent = `${len} caracteres`
})

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") form.requestSubmit()
})

function setLoading(on) {
  btn.disabled = on
  btn.textContent = on ? "Processando..." : "Processar"
  ;[reply, preview].forEach((el) => {
    if (on) {
      el.textContent = ""
      el.classList.add("skeleton")
    } else {
      el.classList.remove("skeleton")
    }
  })
  if (on) {
    methodBadge.className = "badge badge--method"
    methodBadge.textContent = "Processando…"
    methodBadge.title = "Aguardando resposta do backend"
  }
}

copyReply.addEventListener("click", async () => {
  const txt = reply.textContent.trim()
  if (!txt) return
  await navigator.clipboard.writeText(txt)
  toast("Resposta copiada.")
})

copyPreview.addEventListener("click", async () => {
  const txt = preview.textContent.trim()
  if (!txt) return
  await navigator.clipboard.writeText(txt)
  toast("Prévia copiada.")
})

$("#clearAll").addEventListener("click", () => {
  text.value = ""
  charCount.textContent = "0 caracteres"
  clearSelectedFile()
  result.classList.add("hidden")
})

form.addEventListener("submit", async (e) => {
  e.preventDefault()

  const file = currentFile || fileInput.files?.[0] || null
  const txt = text.value.trim()
  if (!file && !txt) {
    toast("Informe um arquivo ou texto.", "bad")
    return
  }

  const fd = new FormData()
  if (file) {
    fd.append("file", file)
  } else if (txt.length) {
    fd.append("text", txt)
  }

  const API_BASE = getApiBase()

  setLoading(true)
  result.classList.remove("hidden")
  setBadge(categoryBadge, "Processando…")
  statline.classList.add("hidden")

  const t0 = performance.now()
  try {
    const res = await fetch(`${API_BASE.replace(/\/$/, "")}/process`, {
      method: "POST",
      body: fd,
    })
    const t1 = performance.now()
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()

    setBadge(categoryBadge, data.category || "Indefinido")
    setMethodBadge(methodBadge, data)

    reply.textContent = data.reply || ""
    preview.textContent = data.preview || (txt ? txt.slice(0, 2000) : "")

    const ms = Math.max(1, Math.round(t1 - t0))
    elapsedEl.textContent = `Tempo: ${ms} ms`
    const modelBits = [data?.provider, data?.model].filter(Boolean).join(" • ")
    modelInfo.textContent = modelBits ? `Origem: ${modelBits}` : ""
    statline.classList.remove("hidden")

    toast("Processado com sucesso.")
  } catch (err) {
    setBadge(categoryBadge, "Erro")
    methodBadge.className = "badge badge--method"
    methodBadge.textContent = "Desconhecido"
    methodBadge.title = "Falha na requisição"
    reply.textContent = ""
    preview.textContent = ""
    statline.classList.add("hidden")
    toast(
      `Falha ao processar. Verifique a API (${API_BASE}). ${err}`,
      "bad",
      3500
    )
  } finally {
    setLoading(false)
  }
})
