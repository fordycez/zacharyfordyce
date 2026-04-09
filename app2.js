
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://bxvaiaxgdhmqewrgltmo.supabase.co'
const supabaseAnonKey = 'sb_publishable_Qt55GDu7leyPXVGRl6S4Ng_NweDMbl4'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// DOM elements
const emailInput = document.getElementById('emailInput')
const passwordInput = document.getElementById('passwordInput')
const loginBtn = document.getElementById('loginBtn')
const logoutBtn = document.getElementById('logoutBtn')
const status = document.getElementById('status')
const fileSection = document.getElementById('fileSection')
const fileInput = document.getElementById('fileInput')
const fileList = document.getElementById('fileList')

// Login with email + password
loginBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim()
  const password = passwordInput.value

  if (!email || !password) {
    status.textContent = 'Enter both email and password.'
    return
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    status.textContent = 'Login failed: ' + error.message
  } else {
    status.textContent = `Logged in as ${data.user.email}`
    logoutBtn.style.display = 'inline-block'
    fileSection.style.display = 'block'
    loadUserFiles()
  }
})

// Logout
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut()
  location.reload()
})

// Load user files
async function loadUserFiles() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  const { data: files, error } = await supabase.storage
    .from('secure') // <-- bucket name replaced
    .list(`user_${session.user.id}`)

  if (error) {
    fileList.innerHTML = 'Error loading files: ' + error.message
    return
  }

  fileList.innerHTML = ''
  data.forEach(file => {
    const li = document.createElement('li')
    li.textContent = file.name
    fileList.appendChild(li)
  })
}

// Upload file
document.getElementById('uploadBtn').addEventListener('click', async () => {
  const file = fileInput.files[0]
  if (!file) return alert('Select a file first.')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return alert('Not logged in.')

  const filePath = `user_${session.user.id}/${file.name}`
  const { error } = await supabase.storage
    .from('secure') // <-- bucket name replaced
    .upload(filePath, file, { metadata: { user_id: session.user.id } })

  if (error) alert('Upload failed: ' + error.message)
  else {
    alert('File uploaded!')
    loadUserFiles()
  }
})

// Download file
async function downloadFile(fileName, userId) {
  const { data, error } = await supabase.storage
    .from('secure') // <-- bucket name replaced
    .download(`user_${userId}/${fileName}`)

  if (error) return alert('Download failed: ' + error.message)

  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
