import { useCallback, useMemo, useRef, useState } from 'react'

const colors = {
  page: '#0f1117',
  panel: '#1a1d27',
  sidebar: '#111827',
  border: '#1e293b',
  borderSoft: '#374151',
  primary: '#f1f5f9',
  secondary: '#e2e8f0',
  muted: '#94a3b8',
  veryMuted: '#64748b',
  accent: '#3b82f6',
  accentLight: '#60a5fa',
  warning: '#f59e0b',
}

const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const acceptedExtensions = ['pdf', 'md', 'txt', 'markdown']

function noteId() {
  return `note-${Math.random().toString(36).slice(2, 10)}`
}

function fileType(file) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'txt'
  if (extension === 'markdown') return 'md'
  return extension
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function decodePdfString(value) {
  return value
    .replace(/\\([nrtbf()\\])/g, (_, char) => {
      const map = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\' }
      return map[char] || char
    })
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))
}

function decodePdfHex(value) {
  const compact = value.replace(/\s+/g, '')
  let output = ''
  for (let index = 0; index < compact.length; index += 2) {
    const code = parseInt(compact.slice(index, index + 2), 16)
    if (!Number.isNaN(code) && code > 0) output += String.fromCharCode(code)
  }
  return output
}

function extractPdfText(buffer) {
  const decoder = new TextDecoder('latin1')
  const raw = decoder.decode(buffer)
  const chunks = []
  const textBlocks = raw.match(/BT[\s\S]*?ET/g) || []

  textBlocks.forEach((block) => {
    const tokens = block.match(/\((?:\\.|[^\\()])*\)|<([0-9A-Fa-f\s]+)>/g) || []
    const words = tokens
      .map((token) => {
        if (token.startsWith('(')) return decodePdfString(token.slice(1, -1))
        if (token.startsWith('<') && !token.startsWith('<<')) return decodePdfHex(token.slice(1, -1))
        return ''
      })
      .filter(Boolean)
    if (words.length) chunks.push(words.join(' '))
  })

  return chunks
    .join('\n')
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0)
      return code < 32 && char !== '\n' && char !== '\r' && char !== '\t' ? ' ' : char
    })
    .join('')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function renderMarkdown(markdown) {
  const lines = escapeHtml(markdown).split(/\r?\n/)
  const html = []
  let listType = null

  const closeList = () => {
    if (!listType) return
    html.push(`</${listType}>`)
    listType = null
  }

  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) {
      closeList()
      html.push('<div style="height: 12px"></div>')
      return
    }

    const bullet = trimmed.match(/^- (.+)$/)
    const numbered = trimmed.match(/^\d+\. (.+)$/)
    if (bullet || numbered) {
      const nextType = bullet ? 'ul' : 'ol'
      if (listType !== nextType) {
        closeList()
        html.push(`<${nextType} style="margin: 8px 0 12px 22px; color: ${colors.secondary}; line-height: 1.75;">`)
        listType = nextType
      }
      html.push(`<li>${inlineMarkdown((bullet || numbered)[1])}</li>`)
      return
    }

    closeList()
    if (trimmed.startsWith('### ')) {
      html.push(`<h3 style="margin: 18px 0 8px; color: ${colors.accentLight}; font-size: 18px; font-weight: 800;">${inlineMarkdown(trimmed.slice(4))}</h3>`)
    } else if (trimmed.startsWith('## ')) {
      html.push(`<h2 style="margin: 22px 0 10px; color: ${colors.accentLight}; font-size: 22px; font-weight: 850;">${inlineMarkdown(trimmed.slice(3))}</h2>`)
    } else if (trimmed.startsWith('# ')) {
      html.push(`<h1 style="margin: 4px 0 14px; color: ${colors.accentLight}; font-size: 28px; font-weight: 900;">${inlineMarkdown(trimmed.slice(2))}</h1>`)
    } else {
      html.push(`<p style="margin: 0 0 12px; color: ${colors.secondary}; line-height: 1.8;">${inlineMarkdown(trimmed)}</p>`)
    }
  })

  closeList()
  return html.join('')
}

function inlineMarkdown(value) {
  return value
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color: #f8fafc; font-weight: 800;">$1</strong>')
    .replace(/`([^`]+)`/g, `<code style="background: #020617; border: 1px solid ${colors.borderSoft}; color: #bfdbfe; padding: 2px 6px; border-radius: 6px; font-size: 0.92em;">$1</code>`)
}

function highlightHtml(html, query) {
  if (query.trim().length < 2) return html
  const pattern = new RegExp(`(${escapeRegExp(escapeHtml(query.trim()))})`, 'gi')
  return html
    .split(/(<[^>]+>)/g)
    .map((part) => (part.startsWith('<') ? part : part.replace(pattern, '<mark style="background: #fde047; color: #111827; border-radius: 3px; padding: 0 2px;">$1</mark>')))
    .join('')
}

function countMatches(note, query) {
  if (query.trim().length < 2) return 0
  const regex = new RegExp(escapeRegExp(query.trim()), 'gi')
  return (note.content.match(regex) || []).length + (note.name.match(regex) || []).length
}

function DropZone({ compact = false, onFiles, children }) {
  const [dragging, setDragging] = useState(false)

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        onFiles(event.dataTransfer.files)
      }}
      style={{
        border: `1px dashed ${dragging ? colors.accentLight : colors.borderSoft}`,
        background: dragging ? 'rgba(59, 130, 246, 0.16)' : compact ? '#0f172a' : colors.panel,
        borderRadius: 8,
        padding: compact ? 14 : 36,
        textAlign: 'center',
        color: colors.secondary,
        transition: '150ms ease',
      }}
    >
      {children}
    </div>
  )
}

export default function ReferenceNotesModule({ onBack, notes: controlledNotes, onNotesChange, currentUser, onSignOut }) {
  const [localNotes, setLocalNotes] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState('split')
  const [message, setMessage] = useState('')
  const fileInputRef = useRef(null)
  const notes = controlledNotes || localNotes
  const setNotes = useCallback((updater) => {
    const next = typeof updater === 'function' ? updater(notes) : updater
    if (onNotesChange) onNotesChange(next)
    else setLocalNotes(next)
  }, [notes, onNotesChange])

  const activeNote = notes.find((note) => note.id === activeId) || notes[0] || null
  const activeMatchCount = activeNote ? countMatches(activeNote, query) : 0

  const filteredNotes = useMemo(() => {
    if (query.trim().length < 2) return notes
    const lower = query.trim().toLowerCase()
    return notes.filter((note) => note.name.toLowerCase().includes(lower) || note.content.toLowerCase().includes(lower))
  }, [notes, query])

  const totalMatches = useMemo(() => notes.reduce((sum, note) => sum + countMatches(note, query), 0), [notes, query])

  const addFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList || [])
    if (!files.length) return

    const nextNotes = []
    const warnings = []

    for (const file of files) {
      const type = fileType(file)
      if (!acceptedExtensions.includes(type)) {
        warnings.push(`${file.name} was skipped because only PDF, Markdown, and text files are supported.`)
        continue
      }

      let content = ''
      let warning = ''
      if (type === 'pdf') {
        const buffer = await file.arrayBuffer()
        content = extractPdfText(buffer)
        if (content.length < 80) {
          warning = 'This PDF may be image-based. Upload a text-selectable PDF, Markdown, or TXT file for better extraction.'
          warnings.push(`${file.name}: ${warning}`)
        }
      } else {
        content = await file.text()
      }

      nextNotes.push({
        id: noteId(),
        name: file.name,
        type,
        size: file.size,
        content: content || '[No readable text extracted]',
        uploadedAt: new Date().toISOString(),
        warning,
      })
    }

    setNotes((current) => {
      const updated = [...nextNotes, ...current]
      if (!activeId && updated.length) setActiveId(updated[0].id)
      return updated
    })
    if (warnings.length) setMessage(warnings.join(' '))
    else setMessage(nextNotes.length ? `${nextNotes.length} note${nextNotes.length === 1 ? '' : 's'} uploaded.` : '')
  }, [activeId, setNotes])

  const removeNote = (noteIdToRemove) => {
    setNotes((current) => {
      const updated = current.filter((note) => note.id !== noteIdToRemove)
      if (activeId === noteIdToRemove) setActiveId(updated[0]?.id || null)
      return updated
    })
  }

  const previewHtml = activeNote?.type === 'md'
    ? highlightHtml(renderMarkdown(activeNote.content), query)
    : highlightHtml(`<pre style="white-space: pre-wrap; word-wrap: break-word; margin: 0; color: ${colors.secondary}; line-height: 1.7; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 14px;">${escapeHtml(activeNote?.content || '')}</pre>`, query)

  const showSidebar = viewMode === 'split' || viewMode === 'list'
  const showPreview = viewMode === 'split' || viewMode === 'preview'

  const buttonStyle = (active = false) => ({
    minHeight: 38,
    border: `1px solid ${active ? colors.accent : colors.borderSoft}`,
    background: active ? colors.accent : '#0f172a',
    color: active ? '#ffffff' : colors.secondary,
    borderRadius: 8,
    padding: '8px 12px',
    fontWeight: 750,
    cursor: 'pointer',
  })

  const NoteCard = ({ note }) => {
    const active = activeNote?.id === note.id
    return (
      <button
        type="button"
        onClick={() => setActiveId(note.id)}
        style={{
          width: '100%',
          border: `1px solid ${active ? colors.accent : colors.border}`,
          borderLeft: `4px solid ${active ? colors.accent : 'transparent'}`,
          background: active ? 'rgba(59, 130, 246, 0.14)' : colors.panel,
          color: colors.primary,
          borderRadius: 8,
          padding: 12,
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 22 }}>{note.type === 'pdf' ? '📕' : '📝'}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 800 }}>{note.name}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <span style={{ border: `1px solid ${colors.borderSoft}`, borderRadius: 999, padding: '2px 7px', color: colors.accentLight, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>{note.type}</span>
              <span style={{ color: colors.muted, fontSize: 12 }}>{Math.max(1, Math.round(note.size / 1024))} KB</span>
            </div>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.page, color: colors.primary, fontFamily: font, display: 'flex', flexDirection: 'column' }}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.md,.txt,.markdown"
        onChange={(event) => {
          addFiles(event.target.files)
          event.target.value = ''
        }}
        style={{ display: 'none' }}
      />

      <header style={{ borderBottom: `1px solid ${colors.border}`, background: '#10131b', padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={onBack} style={buttonStyle(false)}>← Back</button>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.2 }}>📚 Reference Notes</h1>
              <div style={{ color: colors.muted, marginTop: 4, fontSize: 14 }}>{notes.length} uploaded note{notes.length === 1 ? '' : 's'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search across all notes..."
                style={{
                  width: 280,
                  maxWidth: '78vw',
                  border: `1px solid ${colors.borderSoft}`,
                  background: '#0f172a',
                  color: colors.primary,
                  borderRadius: 8,
                  padding: totalMatches ? '9px 78px 9px 12px' : '9px 12px',
                  outline: 'none',
                }}
              />
              {query.trim().length >= 2 ? (
                <span style={{ position: 'absolute', right: 8, top: 7, borderRadius: 999, background: 'rgba(245, 158, 11, 0.16)', color: '#fde68a', border: '1px solid rgba(245, 158, 11, 0.35)', padding: '3px 8px', fontSize: 12, fontWeight: 800 }}>
                  {totalMatches}
                </span>
              ) : null}
            </div>

            <div style={{ display: 'flex', gap: 4, border: `1px solid ${colors.borderSoft}`, borderRadius: 10, padding: 4, background: '#0f172a' }}>
              <button type="button" style={buttonStyle(viewMode === 'split')} onClick={() => setViewMode('split')}>⊞ Split</button>
              <button type="button" style={buttonStyle(viewMode === 'preview')} onClick={() => setViewMode('preview')}>📄 Preview</button>
              <button type="button" style={buttonStyle(viewMode === 'list')} onClick={() => setViewMode('list')}>≡ List</button>
            </div>

            <button type="button" onClick={() => fileInputRef.current?.click()} style={{ ...buttonStyle(true), background: colors.accent, borderColor: colors.accent }}>+ Upload Notes</button>
            {currentUser ? (
              <>
                <span style={{ width: 1, height: 30, background: colors.borderSoft }} />
                <span style={{ border: `1px solid ${colors.borderSoft}`, background: '#0f172a', color: colors.secondary, borderRadius: 8, padding: '8px 10px', fontSize: 14, fontWeight: 700 }}>👤 {currentUser.displayName}</span>
                <button type="button" onClick={onSignOut} style={buttonStyle(false)}>Sign Out</button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {message ? (
        <div style={{ margin: '12px 16px 0', border: `1px solid ${message.includes('image-based') || message.includes('skipped') ? colors.warning : colors.borderSoft}`, background: message.includes('image-based') || message.includes('skipped') ? 'rgba(245, 158, 11, 0.12)' : colors.panel, color: message.includes('image-based') || message.includes('skipped') ? '#fde68a' : colors.secondary, borderRadius: 8, padding: 12 }}>
          {message}
        </div>
      ) : null}

      {!notes.length ? (
        <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 24 }}>
          <div style={{ width: 'min(680px, 100%)' }}>
            <DropZone onFiles={addFiles}>
              <div style={{ fontSize: 46, marginBottom: 12 }}>📚</div>
              <h2 style={{ margin: '0 0 8px', color: colors.primary }}>Upload PDF or Markdown cheatsheets</h2>
              <p style={{ margin: '0 0 18px', color: colors.muted }}>Drag files here, or use the upload button. Supports .pdf, .md, .markdown, and .txt.</p>
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{ ...buttonStyle(true), background: colors.accent, borderColor: colors.accent }}>Upload Notes</button>
            </DropZone>
          </div>
        </main>
      ) : (
        <main style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
          {showSidebar ? (
            <aside style={{ width: viewMode === 'list' ? '100%' : 260, maxWidth: '100%', background: colors.sidebar, borderRight: viewMode === 'list' ? 'none' : `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ padding: 14, color: colors.muted, fontSize: 13, borderBottom: `1px solid ${colors.border}` }}>
                Showing {filteredNotes.length} of {notes.length}
              </div>
              <div style={{ minHeight: 0, overflowY: 'auto', padding: 12, display: 'grid', gap: 10, alignContent: 'start' }}>
                {filteredNotes.map((note) => <NoteCard key={note.id} note={note} />)}
                {!filteredNotes.length ? <div style={{ color: colors.muted, textAlign: 'center', padding: 24 }}>No notes match your search.</div> : null}
              </div>
              <div style={{ padding: 12, borderTop: `1px solid ${colors.border}` }}>
                <DropZone compact onFiles={addFiles}>
                  <div style={{ color: colors.muted, fontSize: 13 }}>+ drop more files here</div>
                </DropZone>
              </div>
            </aside>
          ) : null}

          {showPreview ? (
            <section style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: colors.page }}>
              {activeNote ? (
                <>
                  <div style={{ borderBottom: `1px solid ${colors.border}`, background: colors.panel, padding: 16, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 26 }}>{activeNote.type === 'pdf' ? '📕' : '📝'}</span>
                        <h2 style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors.primary }}>{activeNote.name}</h2>
                        {query.trim().length >= 2 ? <span style={{ border: '1px solid rgba(245, 158, 11, 0.35)', background: 'rgba(245, 158, 11, 0.16)', color: '#fde68a', borderRadius: 999, padding: '3px 8px', fontSize: 12, fontWeight: 800 }}>{activeMatchCount} matches</span> : null}
                      </div>
                      <div style={{ marginTop: 6, color: colors.muted, fontSize: 13 }}>
                        {activeNote.name} • {Math.max(1, Math.round(activeNote.size / 1024))} KB • Uploaded {new Date(activeNote.uploadedAt).toLocaleDateString()}
                      </div>
                      {activeNote.warning ? <div style={{ marginTop: 8, color: '#fde68a', fontSize: 13 }}>{activeNote.warning}</div> : null}
                    </div>
                    <button type="button" onClick={() => removeNote(activeNote.id)} style={{ ...buttonStyle(false), color: '#fecaca', borderColor: '#7f1d1d' }}>✕ Remove</button>
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 24 }}>
                    <div style={{ maxWidth: 980 }} dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  </div>
                </>
              ) : (
                <div style={{ padding: 40, color: colors.muted }}>Select a note to preview it.</div>
              )}
            </section>
          ) : null}
        </main>
      )}
    </div>
  )
}
