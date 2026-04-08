import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://bxvaiaxgdhmqewrgltmo.supabase.co'
const supabaseAnonKey = 'sb_publishable_Qt55GDu7leyPXVGRl6S4Ng_NweDMbl4'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// DOM elements
const emailInput = document.getElementById('emailInput')
const loginBtn = document.getElementById('loginBtn')
const logoutBtn = document.getElementById('logoutBtn')
const status = document.getElementById('status')
const fileSection = document.getElementById('fileSection')
const fileInput = document.getElementById('fileInput')
const fileList = document.getElementById('fileList')

const file = fileInput.files[0]; // the local file the user selected
const filePath = `user_${session.user.id}/${file.name}`;

// 1️⃣ Login via magic link
loginBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim()
  if (!email) return (status.textContent = 'Enter your email first.')

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.href }
  })

  if (error) status.textContent = 'Login failed: ' + error.message
  else status.textContent = 'Check your email for the login link.'
})

// 2️⃣ Logout
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut()
  location.reload()
})

// 3️⃣ Load user session and files
async function loadUserFiles() {
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

  // List files for this user
  const { data: files, error } = await supabase.storage
    .from('secure')
    .list(`user_${session.user.id}`) // folder must match upload path

  //user_${session.user.id}/${fileName} - Something about this makes me wonder

  if (error) return (fileList.innerHTML = 'Error loading files: ' + error.message)

  fileList.innerHTML = ''
  data.forEach(f => {
    const li = document.createElement('li')
    li.textContent = f.name
    li.style.cursor = 'pointer'
    li.addEventListener('click', () => downloadFile(f.name, session.user.id))
    fileList.appendChild(li)
  })
}

// 4️⃣ Upload file
document.getElementById('uploadBtn').addEventListener('click', async () => {
  const file = fileInput.files[0]
  if (!file) return alert('Select a file first.')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return alert('Not logged in.')

  const { error } = await supabase.storage
    .from('secure')
    .upload(`user_${session.user.id}/${file.name}`, file, {
      metadata: { user_id: session.user.id }
    })

  if (error) alert('Upload failed: ' + error.message)
  else {
    alert('File uploaded!')
    loadUserFiles()
  }
})

// 5️⃣ Download file
async function downloadFile(fileName) {
  const { data, error } = await supabase.storage
    .from('secure')
    .download(`user_${session.user.id}/${fileName}`)

  if (error) return alert(error.message)
  const text = await data.text()
  console.log('File content:', text)

  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// 6️⃣ Auto-load files on page load
loadUserFiles()
