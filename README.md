# Starlight Stray — 2D Pixel Platformer (Nuxt 4 + HTML5 Canvas)

Game web **2D Pixel Platformer** bertema petualangan malam ramah *motion sickness* dengan **8 Level melintasi 4 Biome**, **8 Karakter Hewan (Reguler & Misi Khusus)**, **Toko Aksesoris 3 Section (Syal, Topi, Jubah) + Live Try-On Preview**, **Kue Bulan Emas & 4 Item Eksklusif per Map**, **Suara Alam Dinamis (Web Audio API)**, **Buku Pencapaian**, dan **Ekspor/Impor Save Data JSON** — dibangun dengan **Nuxt 4**, **TypeScript**, dan **HTML5 `<canvas>`**.

## Fitur Utama

- **Dual Visual Style Switcher (`⚙️` → `🎨 Gaya Grafik` — Ganti Instan Tanpa Reload + Fade 0.2 detik)**
  - **Mode Modern (16-Bit Cozy Pixel-Art):** *Shading* kaya & *moonlight rim-lighting* pada semua 8 hewan & aksesoris, animasi jalan 5-frame + pose mendarat lembut, pendaran cahaya aditif (*additive glow*) yang menerangi permukaan atap/dahan, genteng tanah liat bertumpuk, pot tanaman, ranting sakura menjuntai, awan bervolume, dermaga bertali tambang & refleksi air tenang 1–2px.
  - **Mode Klasik (8-Bit):** Mempertahankan seluruh grafik, tekstur, dan sprite 8-bit original secara utuh.
- **Pratinjau Coba Pakai Langsung (*Live Try-On Preview*)**
  - Di **`🎩 Toko Aksesoris`**, klik kartu/gambar item mana saja (Syal, Topi, maupun Jubah yang belum dimiliki) untuk mencobanya langsung di kotak preview, lengkap dengan sorotan cyan, label `👁️ PRATINJAU (BELUM DIMILIKI)`, tombol **`↺ Reset`**, dan **`🔄 Balik Arah`**.
  - Di **`🐾 Karakter`**, klik kartu karakter mana saja (termasuk karakter misi spesial) untuk melihatnya di Panel Live Preview lengkap mengenakan Syal, Topi, dan Jubah aktif beserta animasi *idle* tenangnya.
- **Kue Bulan Emas & 4 Item Eksklusif per Map**
  - **🥮 Kue Bulan Emas (*Golden Mooncake* — Semua Map, 8 detik):** Membesarkan karakter beserta aksesorisnya `1.35x` secara tajam tanpa zoom kamera, kebal rintangan, dan memantulkan burung gagak (+50 poin).
  - **🧶 Bola Benang Bintang (*Atap Kota Malam*, 10 detik):** Membuka *Triple Jump* (lompat 3x) & kelincahan ekstra.
  - **🍡 Mochi Sakura (*Hutan Sakura Malam*, 8 detik):** Kelopak sakura berputar pelan, efek melayang lembut, dan skor Bintang **2x**.
  - **🍬 Permen Bintang Pelangi (*Negeri Awan Pastel*, 7 detik):** Menghapus *cooldown Dash* & membuka *Air-Dash* tanpa batas dengan jejak pelangi pastel.
  - **🦪 Mutiara Bulan (*Dermaga Lampion*, 10 detik):** Aman berjalan di atas genangan air & menarik Ikan Emas di sekitar.
- **4 Item Power-Up Umum:** **🥛 Botol Susu Hangat**, **🪶 Bulu Bintang**, **🔔 Lonceng Magnet**, dan **🫧 Gelembung Bulan**.
- **Rasa Kontrol Platformer Presisi (*Coyote Time* & *Jump Buffering*):** Dukungan *Coyote Time* (`100ms`) di tepi platform dan *Jump Buffering* (`100ms`) sesaat sebelum mendarat maupun akhir *Dash*, dengan kontrol horizontal tanpa selip dan ramah *motion sickness*.
- **Kontrol Layar Sentuh & Skala Kanvas Responsif:** Kanvas `16:9` tajam (`image-rendering: pixelated`) dengan tombol kaca piksel transparan (`◀` `▶` kiri bawah, `⚡` Dash & `▲` Lompat kanan bawah) yang muncul otomatis di layar sentuh atau dapat diatur (`Otomatis` / `Selalu Aktif` / `Nonaktif`) di menu `⚙️`.
- **Adegan Epilog Tamat Setelah Level 8:** Setelah kartu *Stage Clear* Level 8, pemain menyaksikan adegan penutup hangat di tepi dermaga malam saat karakter aktif dan para sahabat hewan duduk memandang bulan purnama diiringi melodi kotak musik penutup.
- **Buku Panduan (`📜 Buku Panduan` — Grid 3×2 Simetris di Title Screen):** Ensiklopedia lengkap 9 item & power-up lengkap dengan ikon pikselnya, panduan misi 3 karakter spesial, serta informasi pijakan & musuh tiap dunia.
- **8 Level Luas (+60%, 3 Babak), 2 Pos Lentera, & Area Rahasia:** Setiap level memiliki 2 Pos Lentera Checkpoint (bisa lanjut langsung dari Pos Lentera saat Game Over) dan 2 Area Rahasia tersembunyi berisi Ikan Emas atau Bintang Besar (+100 poin).
- **Variasi Musuh Bertingkat, Pijakan Unik & Kombo Bintang Berantai:** Gagak Patroli, Cerobong Uap, Kabel Listrik Membal (Atap Kota); Landak Duri, Pusaran Angin Kelopak, Dahan Rapuh (Hutan Sakura); Awan Petir Kecil, Gagak Peluncur, Awan Bergerak (Negeri Awan); Kepiting Dermaga Gesit, Api Lentera Sinus, Perahu Kayu Mengapung (Dermaga) — seluruh musuh dapat ditabrak hancur dengan **Kue Bulan Emas**, dilengkapi **Kombo Bintang (`x2`–`x5`, < 2.5 detik)** dengan nada denting audio naik bertahap.
- **Tipografi Piksel Tajam (7×9 Bitmap) & Papan Petunjuk Kontras Tinggi:** Huruf piksel kotak tajam tanpa buram dengan bayangan 1px keras `#1a0f1d` pada papan kayu Level 1 (`[A / D] JALAN`, `[SPASI X2] LOMPAT GANDA`, `[SHIFT / X] DASH`).
- **Interaksi Lingkungan (*Cozy Interactive Props*):** Lampion berayun halus (±2–3px) dengan percikan emas saat dilewati/di-*dash*, serta burung malam & kupu-kupu cahaya yang terbang lembut saat karakter mendekat.
- **Misi Harian (`📜 Misi Hari Ini`):** Reset otomatis setiap tanggal lokal perangkat dengan hadiah **`🎁 Klaim +2 Ikan Emas`**.
- **Mode Tantangan Waktu (`⏱️ Tantangan Waktu`):** Penghitung waktu `00:00.0` di HUD dengan target **Medali Perunggu, Perak, dan Emas** untuk setiap level yang sudah ditamatkan.
- **Studio Foto Kartu Pos 4x HD (`📸 Studio Foto`):** Kustomisasi 4 latar biome, 4 pose (*Duduk Manis*, *Melompat Ceria*, *Tidur Melingkar*, *Melambai*), gaya 8-Bit/16-Bit, bingkai emas piksel, dan ekspor `.PNG` tajam **4x HD (`960×600`)**.
- **Ekonomi Ikan Emas & Replay Bonus 3 Bintang:** 32 Ikan Emas tersebar di 8 level + bonus **+1 Ikan Emas** (satu kali per level) saat meraih peringkat sempurna **3 Bintang (⭐⭐⭐)**.
- **Kemampuan Pasif Unik Spesies Hewan (*Signature Animal Perks*):** Kucing (semua varian) lebih lincah di udara (+12%) & belok cepat, Kelinci Putih memiliki lompatan dasar +10% lebih tinggi, serta Anjing Shiba Inu & Anjing Putih memiliki jarak *Dash* +18% lebih jauh dan kebal dorongan pusaran angin kelopak.
- **Tantangan Lonceng Bintang & Peristiwa Langit Malam Langka:** Setiap level memiliki 1 Lonceng Bintang (kumpulkan 8 bintang melingkar dalam 6 detik untuk hadiah **+1 Ikan Emas**), ditambah peluang 25% peristiwa langit malam langka saat masuk level (**Hujan Bintang Jatuh** selama 15 detik atau **Bulan Purnama Merah Muda** dengan bonus skor bintang **+25%**).
- **Audio Adaptif Web Audio API (BGM per Biome & SFX Detail):** 4 tema musik unik per biome (kotak musik misterius Atap Kota, pentatonis lembut Hutan Sakura, melodi mengambang Negeri Awan, irama hangat Dermaga) dengan transisi dinamis saat Tantangan/Time Trial, Kue Bulan Emas, nyawa kritis (1 hati), dan lapisan harmoni klimaks dekat Portal Bulan, dilengkapi SFX langkah sesuai permukaan, loncat ganda, *dash*, lonceng checkpoint, kepakan gagak, desis uap, dan percikan awan petir.
- **Auto-Save Otomatis Real-Time (`localStorage` Terpusat `'starlight_stray_save_v1'`):** Setiap perolehan Ikan Emas, skor tertinggi, bintang level, progres level/medali Time Trial, Misi Harian, karakter/aksesoris, pencapaian, serta preferensi pengaturan tersimpan otomatis di latar belakang lengkap dengan perlindungan data rusak (*fallback merge*), *flush* otomatis saat menutup tab, dan indikator halus **`Tersimpan`** di pojok layar.
- **Suara Alam Dinamis per Biome, Buku Pencapaian (`📖`) & Cadangan Data (`⚙️`):** Sintesis 100% Web Audio API dengan pembersihan otomatis saat kembali ke Title Screen + tombol ringkas **`💾 Unduh Cadangan (.JSON)`** dan **`📂 Muat Cadangan (.JSON)`**.

## Cara Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Cloud Database CRUD (TiDB Cloud Serverless)

Game ini menyimpan seluruh proses **CRUD (Create, Read, Update, Delete)** ke database dedicated **`starlight_stray`** (bukan `sys`) di **TiDB Cloud Serverless**, dengan `localStorage` (`'starlight_stray_save_v1'`) sebagai cache *offline-first*:

### Skema 5 Tabel Baru di Database `starlight_stray`
1. `players` — profil pemain, karakter/aksesoris aktif, skor tertinggi, koin ikan, pengaturan, dan snapshot save.
2. `player_level_progress` — progres per level (1–8), 3 *Starlight Shards*, waktu terbaik *speedrun*, rank (`S/A/B/C`), dan medali *Time Trial*.
3. `player_inventory` — seluruh karakter yang terbuka dan kosmetik (*scarf, hat, cape*) yang dimiliki/dipakai.
4. `player_achievements` — stempel pencapaian (*Pixel Stamp Book*) yang terbuka.
5. `crud_activity_logs` — riwayat audit setiap operasi `CREATE`, `UPDATE`, dan `DELETE`.

### Endpoint REST API CRUD
- `GET /api/health-db` — cek koneksi TiDB & jumlah baris semua 5 tabel.
- `GET /api/players` / `POST /api/players` — daftar semua profil (**READ**) & buat profil baru (**CREATE**).
- `GET /api/players/:playerId` / `PUT /api/players/:playerId` / `DELETE /api/players/:playerId` — baca detail relasional, ubah nama/progres (**UPDATE**), dan hapus profil permanen (**DELETE**).
- `GET /api/save` / `POST /api/save` / `DELETE /api/save` — auto-sync penuh lintas 5 tabel dalam satu transaksi SQL.
- `GET /api/logs` — baca log aktivitas CRUD terbaru.

### Menjalankan dengan TiDB
1. Salin `.env.example` menjadi `.env` lalu isi kredensial TiDB Cloud (`TIDB_HOST`, `TIDB_PORT`, `TIDB_USER`, `TIDB_PASSWORD`, `TIDB_DATABASE=starlight_stray`).
2. Jalankan `npm run dev` — database `starlight_stray` dan 5 tabel baru otomatis dibuat saat koneksi pertama.
3. Buka **`⚙️ Pengaturan & Data`** di dalam game untuk mengelola profil (**CREATE / READ / UPDATE / DELETE**) dan melihat log CRUD secara langsung.

Untuk build produksi dengan Nitro Server (agar API TiDB aktif):

```bash
npm run build
node .output/server/index.mjs
```
