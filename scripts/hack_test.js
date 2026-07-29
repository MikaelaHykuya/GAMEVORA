import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env', 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=')
  if (key && val) env[key.trim()] = val.join('=').trim()
})

const supabaseUrl = env['VITE_SUPABASE_URL']
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Error: Tidak dapat menemukan VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY di .env")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runHackerTest() {
  console.log("🕵️‍♂️ [SIMULASI HACKER] Memulai serangan ke database...\n")

  // --- TEST 1: Mencoba menambah game baru (Seharusnya HANYA ADMIN yang bisa) ---
  console.log("🛠️ TEST 1: Mencoba inject data ke tabel 'games' sebagai publik...")
  const { data: gameData, error: gameError } = await supabase
    .from('games')
    .insert([{ title: 'Hacked Game', price: 0, description: 'You have been hacked' }])
    .select()

  if (gameError || !gameData || gameData.length === 0) {
    console.log("✅ AMAN: Hacker GAGAL menambahkan game. RLS memblokir aksi ini.")
    if (gameError) console.log("   Alasan DB:", gameError.message)
  } else {
    console.log("❌ BAHAYA: Hacker berhasil menambahkan game!", gameData)
  }
  console.log("--------------------------------------------------")

  // --- TEST 2: Mencoba melihat isi keranjang (cart) semua orang ---
  console.log("🛒 TEST 2: Mencoba mencuri data keranjang belanja (cart) pengguna lain...")
  const { data: cartData, error: cartError } = await supabase
    .from('cart')
    .select('*')

  if (cartError) {
    console.log("✅ AMAN: RLS Error memblokir pembacaan tabel cart.")
  } else if (!cartData || cartData.length === 0) {
    console.log("✅ AMAN: Hacker GAGAL membaca keranjang orang lain. Data yang kembali kosong (0).")
  } else {
    console.log(`❌ BAHAYA: Hacker berhasil membaca ${cartData.length} data cart orang lain!`)
  }
  console.log("--------------------------------------------------")

  // --- TEST 3: Mencoba menghapus profil orang (destructive) ---
  // Hati-hati, kita gunakan query acak, tapi RLS harus memblokirnya.
  console.log("💀 TEST 3: Mencoba menghapus (DELETE) profil acak...")
  const { data: delData, error: delError } = await supabase
    .from('profiles')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Hapus id apa saja
    .select()

  if (delError || !delData || delData.length === 0) {
    console.log("✅ AMAN: Hacker GAGAL menghapus profil. RLS memblokir aksi DELETE.")
  } else {
    console.log("❌ BAHAYA: Hacker BERHASIL menghapus profil!", delData)
  }

  // --- TEST 4: Mencoba membaca email orang lain ---
  console.log("\n📧 TEST 4: Mencoba mencuri data email dari tabel profiles...")
  const { data: emailData, error: emailError } = await supabase
    .from('profiles')
    .select('email')
    .limit(1)

  if (emailError) {
    console.log("✅ AMAN: Hacker GAGAL. Pesan error:", emailError.message)
  } else if (!emailData || emailData.length === 0 || !emailData[0].email) {
    console.log("✅ AMAN: Kolom email sudah tidak ada atau tidak bisa diakses!")
  } else {
    console.log("❌ BAHAYA: Hacker berhasil membaca email!", emailData)
  }

  console.log("\n🏁 SIMULASI SELESAI")
}

runHackerTest()
