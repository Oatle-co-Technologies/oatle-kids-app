const panel = document.querySelector('#kids-ai')
const question = document.querySelector('#ai-question')
const form = document.querySelector('#ai-form')
const send = form.querySelector('button[type="submit"]')
const log = panel.querySelector('.ai-conversation')
const error = document.querySelector('#ai-error')
let trigger
let busy = false
for (const button of document.querySelectorAll('.ai-open')) button.addEventListener('click', () => { trigger = button; panel.showModal(); question.focus() })
document.querySelector('#ai-close').addEventListener('click', () => panel.close())
panel.addEventListener('close', () => trigger?.focus())
for (const button of panel.querySelectorAll('.ai-suggestions button')) button.addEventListener('click', () => { if (!busy) { question.value = button.textContent; question.focus() } })
function message(text, user = false) {
  const element = document.createElement('p')
  element.className = `ai-message${user ? ' ai-user' : ''}`
  element.textContent = text
  log.append(element)
  log.scrollTop = log.scrollHeight
}
form.addEventListener('submit', async event => {
  event.preventDefault()
  const text = question.value.trim()
  if (busy || !text) return
  busy = true; send.disabled = true; question.readOnly = true; error.hidden = true
  form.setAttribute('aria-busy', 'true'); send.textContent = 'Thinking…'
  try {
    const response = await fetch('/api/chat', {method:'POST', headers:{'Content-Type':'application/json'}, credentials:'omit', body:JSON.stringify({message:text}), signal:AbortSignal.timeout(30000)})
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Chat is unavailable. Please try again.')
    if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('No answer received. Please try again.')
    message(text, true); message(data.reply); question.value = ''
  } catch (failure) {
    error.textContent = failure.name === 'TimeoutError' || failure.name === 'TypeError' ? 'We could not connect. Please try again or email the team below.' : failure.message
    error.hidden = false
  } finally { busy = false; send.disabled = false; question.readOnly = false; send.textContent = 'Send'; form.setAttribute('aria-busy','false'); if (panel.open) question.focus() }
})
