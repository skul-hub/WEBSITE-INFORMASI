// ==========================================
// CONFIG SUPABASE
// ==========================================

const SUPABASE_URL = "https://abzvqnbgihmocgphclxr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Escape helper
function escapeHtml(str){ return String(str||'').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[s]); }

// ==========================================
// DOM LOADED
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  if (location.pathname.includes("edit.html")) {
    initAdminPanel();
  }
  if (
    location.pathname.endsWith("index.html") ||
    location.pathname === "/" ||
    location.pathname.endsWith("/")
  ) {
    renderIndex();
  }
});

// ==========================================
// UPLOAD IMAGE
// ==========================================

async function uploadImageFile(file){
  if(!file) return null;

  const fileName = Date.now() + "-" + file.name.replace(/\s+/g, "-");

  const { error } = await supabaseClient
    .storage
    .from("images")
    .upload(fileName, file);

  if(error){
    alert("Upload gagal: " + error.message);
    return null;
  }

  const { data } = supabaseClient
    .storage
    .from("images")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// ==========================================
// FETCH FUNCTIONS
// ==========================================

async function fetchSlides(){
  const { data, error } = await supabaseClient
    .from("carousel")
    .select("*")
    .order("order_index", { ascending: true });

  if(error) return [];
  return data;
}

async function fetchNews(){
  const { data, error } = await supabaseClient
    .from("news")
    .select("*")
    .order("id", { ascending: false });

  if(error) return [];
  return data;
}

// ==========================================
// INDEX PAGE RENDER
// ==========================================

async function renderIndex(){
  const track = document.getElementById("carousel-track");
  const newsContainer = document.getElementById("news-container");

  // SLIDES
  const slides = await fetchSlides();
  if(track){
    track.innerHTML = "";
    slides.forEach(s => {
      const slide = document.createElement("div");
      slide.className = "slide";
      slide.innerHTML = `
        <img src="${s.image}" />
        <div class="meta">
          <h3>${escapeHtml(s.title || "")}</h3>
          <p>${escapeHtml(s.description || "")}</p>
        </div>
      `;
      track.appendChild(slide);
    });

    let index = 0;
    function update(){ track.style.transform = `translateX(-${index * 100}%)`; }

    setInterval(() => {
      if(track.children.length === 0) return;
      index = (index + 1) % track.children.length;
      update();
    }, 5000);
  }

  // NEWS
  const news = await fetchNews();
  if(newsContainer){
    newsContainer.innerHTML = "";
    news.forEach(n => {
      const div = document.createElement("div");
      div.className = "news-card";
      div.innerHTML = `
        ${n.image ? `<img src="${n.image}">` : ""}
        <h4>${escapeHtml(n.title)}</h4>
        <p>${escapeHtml(n.summary || "")}</p>
      `;
      newsContainer.appendChild(div);
    });
  }
}

// ==========================================
// ADMIN PANEL
// ==========================================

function initAdminPanel(){
  document.getElementById("add-slide").onclick = addSlide;
  document.getElementById("add-news").onclick = addNews;
  document.getElementById("save-slides").onclick = saveSlidesOrder;
  document.getElementById("save-news").onclick = saveAllNewsEdits;

  loadAdminSlides();
  loadAdminNews();
}

// LOAD SLIDES
async function loadAdminSlides(){
  const list = document.getElementById("slides-list");
  const slides = await fetchSlides();
  list.innerHTML = "";

  slides.forEach(s => list.appendChild(createSlideItem(s)));
}

function createSlideItem(slide){
  const div = document.createElement("div");
  div.className = "item";
  div.dataset.id = slide.id;

  div.innerHTML = `
    <img src="${slide.image}">
    <div style="flex:1;">
      <input class="input" data-field="title" value="${escapeHtml(slide.title || "")}">
      <input class="input" data-field="description" value="${escapeHtml(slide.description || "")}" style="margin-top:8px;">
    </div>
    <div class="actions">
      <input type="file" data-field="file" accept="image/*">
      <button class="btn secondary" data-action="delete">Hapus</button>
    </div>
  `;

  div.querySelector("[data-action='delete']").onclick = async () => {
    if(!confirm("Hapus slide?")) return;
    await supabaseClient.from("carousel").delete().eq("id", slide.id);
    div.remove();
  };

  return div;
}

// ADD SLIDE
async function addSlide(){
  const title = document.getElementById("slide-title").value.trim();
  const desc = document.getElementById("slide-desc").value.trim();
  const file = document.getElementById("slide-file").files[0];

  if(!file) return alert("Pilih gambar dulu!");

  const url = await uploadImageFile(file);

  const current = await fetchSlides();
  const order_index = current.length;

  await supabaseClient.from("carousel").insert({
    title,
    description: desc,
    image: url,
    order_index
  });

  alert("Slide ditambahkan!");
  loadAdminSlides();
}

// SAVE SLIDE ORDER/UPDATE
async function saveSlidesOrder(){
  const items = document.querySelectorAll("#slides-list .item");

  let index = 0;
  for(const item of items){
    const id = item.dataset.id;
    const title = item.querySelector('[data-field="title"]').value;
    const desc = item.querySelector('[data-field="description"]').value;
    const fileInput = item.querySelector('[data-field="file"]');

    let image = item.querySelector("img").src;

    if(fileInput.files.length > 0){
      image = await uploadImageFile(fileInput.files[0]);
    }

    await supabaseClient.from("carousel").update({
      title,
      description: desc,
      image,
      order_index: index++
    }).eq("id", id);
  }

  alert("Perubahan slide disimpan!");
  loadAdminSlides();
}

// LOAD NEWS
async function loadAdminNews(){
  const list = document.getElementById("news-list");
  const news = await fetchNews();
  list.innerHTML = "";

  news.forEach(n => list.appendChild(createNewsItem(n)));
}

function createNewsItem(n){
  const div = document.createElement("div");
  div.className = "item";
  div.dataset.id = n.id;

  div.innerHTML = `
    ${n.image ? `<img src="${n.image}">` : `<div style="width:80px;height:56px;background:#333;border-radius:6px"></div>`}
    <div style="flex:1;">
      <input class="input" data-field="title" value="${escapeHtml(n.title)}">
      <textarea class="input" data-field="summary">${escapeHtml(n.summary || "")}</textarea>
    </div>
    <div class="actions">
      <input type="file" data-field="file" accept="image/*">
      <button class="btn secondary" data-action="delete">Hapus</button>
    </div>
  `;

  div.querySelector("[data-action='delete']").onclick = async () => {
    if(!confirm("Hapus berita?")) return;
    await supabaseClient.from("news").delete().eq("id", n.id);
    div.remove();
  };

  return div;
}

// ADD NEWS
async function addNews(){
  const title = document.getElementById("news-title").value.trim();
  const summary = document.getElementById("news-summary").value.trim();
  const file = document.getElementById("news-file").files[0];

  if(!title) return alert("Judul wajib!");

  let image = null;
  if(file) image = await uploadImageFile(file);

  await supabaseClient.from("news").insert({ title, summary, image });

  alert("Berita ditambahkan!");
  loadAdminNews();
}

// SAVE NEWS
async function saveAllNewsEdits(){
  const items = document.querySelectorAll("#news-list .item");

  for(const item of items){
    const id = item.dataset.id;
    const title = item.querySelector('[data-field="title"]').value;
    const summary = item.querySelector('[data-field="summary"]').value;
    const fileInput = item.querySelector('[data-field="file"]');

    let image = item.querySelector("img") ? item.querySelector("img").src : null;

    if(fileInput.files.length > 0){
      image = await uploadImageFile(fileInput.files[0]);
    }

    await supabaseClient.from("news").update({
      title,
      summary,
      image
    }).eq("id", id);
  }

  alert("Perubahan berita disimpan!");
  loadAdminNews();
}''; document.getElementById('news-file').value='';
  loadAdminNews();
}

async function saveAllNewsEdits(){
  const list = document.getElementById('news-list');
  if(!list) return;
  const items = [...list.querySelectorAll('.item')];
  for(const it of items){
    const id = it.dataset.id;
    const title = it.querySelector('[data-field="title"]').value;
    const summary = it.querySelector('[data-field="summary"]').value;
    const fileInput = it.querySelector('[data-field="file"]');
    let image = it.querySelector('img') ? it.querySelector('img').src : null;
    if(fileInput && fileInput.files && fileInput.files[0]){
      const url = await uploadImageFile(fileInput.files[0]);
      if(url) image = url;
    }
    await supabaseClient.from('news').update({ title, summary, image }).eq('id', id);
  }
  alert('Perubahan berita disimpan.');
  loadAdminNews();
}uerySelectorAll('.item');
    for(const it of items){
      const id = it.dataset.id;
      const title = it.querySelector('[data-field="title"]').value;
      const summary = it.querySelector('[data-field="summary"]').value;
      const fileInput = it.querySelector('[data-field="file"]');
      let image = it.querySelector('img') ? it.querySelector('img').src : null;

      if(fileInput && fileInput.files[0]){
        const url = await uploadImageFile(fileInput.files[0]);
        if(url) image = url;
      }

      await supabaseClient.from('news').update({ title, summary, image }).eq('id', id);
    }
    alert('Perubahan berita disimpan.');
    loadAdminData();
  };
}

// ---------- Initialize depending on page ----------
document.addEventListener('DOMContentLoaded', async ()=>{
  // if index page
  if(location.pathname.endsWith('index.html') || location.pathname === '/' || location.pathname.endsWith('/')){
    await renderIndex();
  }

  // if admin page
  if(location.pathname.includes('admin.html')){
    initAdmin();
  }
});-btn');
    const closeModalBtn = document.getElementById('close-modal');

    if (modal) {
        modal.style.display = 'block';

        closeBtn.onclick = () => modal.style.display = 'none';
        closeModalBtn.onclick = () => modal.style.display = 'none';

        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
}

// Fungsi login admin (untuk admin.html)
function adminLogin() {
    const password = prompt('Masukkan password admin:');
    if (password === ADMIN_PASSWORD) {
        alert('Login berhasil!');
        return true;
    } else {
        alert('Password salah!');
        return false;
    }
}

// Fungsi untuk load editor carousel di admin
async function loadCarouselEditor() {
    const carouselData = await fetchCarouselData();
    const editor = document.getElementById('carousel-editor');
    editor.innerHTML = '';
    carouselData.forEach((slide, index) => {
        const form = document.createElement('div');
        form.className = 'admin-form';
        form.innerHTML = `
            <input type="text" value="${slide.title}" placeholder="Judul" data-index="${index}" data-field="title">
            <textarea placeholder="Deskripsi" data-index="${index}" data-field="description">${slide.description}</textarea>
            <input type="text" value="${slide.image}" placeholder="URL Gambar" data-index="${index}" data-field="image">
            <button onclick="deleteCarousel(${slide.id})">Hapus</button>
        `;
        editor.appendChild(form);
    });
}

// Fungsi untuk load editor news di admin
async function loadNewsEditor() {
    const newsData = await fetchNewsData();
    const editor = document.getElementById('news-editor');
    editor.innerHTML = '';
    newsData.forEach((news, index) => {
        const form = document.createElement('div');
        form.className = 'admin-form';
        form.innerHTML = `
            <input type="text" value="${news.title}" placeholder="Judul" data-index="${index}" data-field="title">
            <textarea placeholder="Summary" data-index="${index}" data-field="summary">${news.summary}</textarea>
            <input type="text" value="${news.image}" placeholder="URL Gambar" data-index="${index}" data-field="image">
            <button onclick="deleteNews(${news.id})">Hapus</button>
        `;
        editor.appendChild(form);
    });
}

// Fungsi untuk simpan carousel
async function saveCarousel() {
    const forms = document.querySelectorAll('#carousel-editor .admin-form');
    for (let i = 0; i < forms.length; i++) {
        const title = forms[i].querySelector('[data-field="title"]').value;
        const description = forms[i].querySelector('[data-field="description"]').value;
        const image = forms[i].querySelector('[data-field="image"]').value;
        const carouselData = await fetchCarouselData();
        const id = carouselData[i].id;
        await supabaseClient.from('carousel').update({ title, description, image }).eq('id', id);
    }
    alert('Carousel disimpan!');
    loadCarouselEditor();
}

// Fungsi untuk simpan news
async function saveNews() {
    const forms = document.querySelectorAll('#news-editor .admin-form');
    for (let i = 0; i < forms.length; i++) {
        const title = forms[i].querySelector('[data-field="title"]').value;
        const summary = forms[i].querySelector('[data-field="summary"]').value;
        const image = forms[i].querySelector('[data-field="image"]').value;
        const newsData = await fetchNewsData();
        const id = newsData[i].id;
        await supabaseClient.from('news').update({ title, summary, image }).eq('id', id);
    }
    alert('Berita disimpan!');
    loadNewsEditor();
}

// Fungsi untuk tambah slide carousel
async function addCarouselSlide() {
    await supabaseClient.from('carousel').insert([{ title: 'Judul Baru', description: 'Deskripsi Baru', image: 'images/default.jpg' }]);
    loadCarouselEditor();
}

// Fungsi untuk tambah berita
async function addNewsItem() {
    await supabaseClient.from('news').insert([{ title: 'Judul Baru', summary: 'Summary Baru', image: 'images/default.jpg' }]);
    loadNewsEditor();
}

// Fungsi untuk hapus carousel
async function deleteCarousel(id) {
    await supabaseClient.from('carousel').delete().eq('id', id);
    loadCarouselEditor();
}

// Fungsi untuk hapus news
async function deleteNews(id) {
    await supabaseClient.from('news').delete().eq('id', id);
    loadNewsEditor();
}

// Jalankan fungsi saat halaman load
document.addEventListener('DOMContentLoaded', async () => {
    if (window.location.pathname.includes('admin.html')) {
        if (adminLogin()) {
            loadCarouselEditor();
            loadNewsEditor();
            document.getElementById('add-carousel-slide').addEventListener('click', addCarouselSlide);
            document.getElementById('save-carousel').addEventListener('click', saveCarousel);
            document.getElementById('add-news-item').addEventListener('click', addNewsItem);
            document.getElementById('save-news').addEventListener('click', saveNews);
        }
    } else {
        await displayCarousel();
        await displayNews();
        controlCarousel();
        handleContactForm();
        showWelcomeModal();
    }
}); loadCarouselEditor();
}

// Fungsi untuk hapus news
async function deleteNews(id) {
    await supabaseClient.from('news').delete().eq('id', id);
    loadNewsEditor();
}

// Jalankan fungsi saat halaman load
document.addEventListener('DOMContentLoaded', async () => {
    if (window.location.pathname.includes('admin.html')) {
        if (adminLogin()) {
            loadCarouselEditor();
            loadNewsEditor();
            document.getElementById('add-carousel-slide').addEventListener('click', addCarouselSlide);
            document.getElementById('save-carousel').addEventListener('click', saveCarousel);
            document.getElementById('add-news-item').addEventListener('click', addNewsItem);
            document.getElementById('save-news').addEventListener('click', saveNews);
        }
    } else {
        await displayCarousel();
        await displayNews();
        controlCarousel();
        handleContactForm();
        showWelcomeModal();
    }
});
```

### Penjelasan Singkat
- **Ganti Placeholder**: Ubah `YOUR_SUPABASE_URL` dan `YOUR_ANON_KEY` dengan data dari Supabase Anda.
- **Deploy**: Push ke GitHub, import ke Vercel. Akses admin via `yoursite.com/admin.html` dengan password "ADMIN".
- Jika ada error atau perlu perubahan, beri tahu saya! Kode ini lengkap dan siap pakai.
