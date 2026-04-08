import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://bxvaiaxgdhmqewrgltmo.supabase.co'
const supabaseAnonKey = 'sb_publishable_Qt55GDu7leyPXVGRl6S4Ng_NweDMbl4'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const emailInput = document.getElementById('emailInput')
const loginBtn = document.getElementById('loginBtn')
const logoutBtn = document.getElementById('logoutBtn')
const status = document.getElementById('status')
const fileSection = document.getElementById('fileSection')
const fileContent = document.getElementById('fileContent')

loginBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim()

  if (!email) {
    status.textContent = 'Enter your email first.'
    return
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      //emailRedirectTo: window.location.origin + window.location.pathname\
      emailRedirectTo: 'https://zacharyfordyce.com'
    }
  })

  if (error) {
    status.textContent = 'Login failed: ' + error.message
  } else {
    status.textContent = 'Check your email for the login link.'
  }
})

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut()
  location.reload()
})

async function loadUserAndFile() {
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

  const { data, error } = await supabase.storage
    .from('secure')
    .download('vi/object/private-files/job.txt')

  if (error) {
    fileContent.textContent = 'Could not load file: ' + error.message
    return
  }

  const text = await data.text()
  fileContent.textContent = text
}

loadUserAndFile()
