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
const uploadBtn = document.getElementById('uploadBtn')

// --------------------
// LOGIN
// --------------------
loginBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim()
  const password = passwordInput.value.trim()

  if (!email || !password) {
    status.textContent = 'Enter both email and password.'
    return
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    status.textContent = 'Login failed: ' + error.message
    return
  }

  status.textContent = `Logged in as ${data.user.email}`
  logoutBtn.style.display = 'inline-block'
  fileSection.style.display = 'block'

  await loadUserFiles()
})

// --------------------
// LOGOUT
// --------------------
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut()
  location.reload()
})

// --------------------
// AUTO-LOAD SESSION ON PAGE LOAD
// --------------------
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    status.textContent = 'Not logged in.'
    fileSection.style.display = 'none'
    logoutBtn.style.display = 'none'
    return
  }

  status.textContent = `Logged in as ${session.user.email}`
  logoutBtn.style.display = 'inline-block'
  fileSection.style.display = 'block'

  await loadUserFiles()
})

// --------------------
// LOAD USER FILES
// --------------------
/*async function loadUserFiles() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  const userId = session.user.id

  const { data: files, error } = await supabase.storage
    .from('secure')
    .list(`user_${userId}`)

  if (error) {
    fileList.innerHTML = `<li>Error loading files: ${error.message}</li>`
    return
  }

  fileList.innerHTML = ''

  if (!files || files.length === 0) {
    fileList.innerHTML = '<li>No files uploaded yet.</li>'
    return
  }

  files.forEach(f => {
    const li = document.createElement('li')
    li.textContent = f.name
    li.style.cursor = 'pointer'

    li.addEventListener('click', () => {
      downloadFile(f.name, userId)
    })

    fileList.appendChild(li)
  })
}*/

async function listFiles() {
  const { data, error } = await supabase
    .storage
    .from('your-bucket-name')
    .list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    })

  if (error) {
    console.error('List error:', error)
    document.getElementById('fileList').innerHTML =
      `<li>Error: ${error.message}</li>`
    return
  }

  const fileList = document.getElementById('fileList')
  fileList.innerHTML = ''

  data.forEach(file => {
    const li = document.createElement('li')
    li.textContent = file.name
    fileList.appendChild(li)
  })
}

listFiles()

// --------------------
// UPLOAD FILE
// --------------------
uploadBtn.addEventListener('click', async () => {
  const file = fileInput.files[0]

  if (!file) {
    alert('Select a file first.')
    return
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    alert('Not logged in.')
    return
  }

  const userId = session.user.id
  const filePath = `user_${userId}/${file.name}`

  const { error } = await supabase.storage
    .from('secure')
    .upload(filePath, file, {
      upsert: true,
      metadata: {
        user_id: userId
      }
    })

  if (error) {
    alert('Upload failed: ' + error.message)
    return
  }

  alert('File uploaded successfully!')
  fileInput.value = ''
  await loadUserFiles()
})

// --------------------
// DOWNLOAD FILE
// --------------------
async function downloadFile(fileName, userId) {
  const { data, error } = await supabase.storage
    .from('secure')
    .download(`user_${userId}/${fileName}`)

  if (error) {
    alert('Download failed: ' + error.message)
    return
  }

  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
