// js/script.js
// Supabase config (pakai yang sudah ada). Ganti jika perlu.
const SUPABASE_URL = 'https://pfllreeqtdmbrbvgnusg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmbGxyZWVxdGRtYnJidmdudXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIzNzUsImV4cCI6MjA3ODYyODM3NX0.LUtOubmLAyHavdONvozfTSHnXT1_hiCAXjY0RQIoGvw';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ADMIN CREDENTIALS (username / password)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'adminTPI';

// ---------- Helper Supabase fetch ----------
async function fetchSlides(){
  const { data, error } = await supabaseClient.from('carousel').select('*').order('id',{ascending:true});
  if(error){ console.error('fetchSlides', error); return []; }
  return data || [];
}
async function fetchNews(){
  const { data, error } = await supabaseClient.from('news').select('*').order('id',{ascending:false});
  if(error){ console.error('fetchNews', error); return []; }
  return data || [];
}

// ---------- Upload file to storage ----------
async function uploadImageFile(file){
  if(!file) return null;
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g,'-')}`;
  const { error } = await supabaseClient.storage.from('images').upload(fileName, file);
  if(error){
    alert('Gagal upload: ' + error.message);
    console.error(error);
    return null;
  }
  const { data } = supabaseClient.storage.from('images').getPublicUrl(fileName);
  return data.publicUrl;
}

// ---------- INDEX: display carousel & news ----------
async function renderIndex(){
  // carousel
  const track = document.getElementById('carousel-track');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const newsContainer = document.getElementById('news-container');

  if(track){
    const slides = await fetchSlides();
    track.innerHTML = '';
    slides.forEach(s => {
      const slide = document.createElement('div');
      slide.className = 'slide';
      slide.innerHTML = `
        <img src="${s.image || ''}" alt="${escapeHtml(s.title || '')}" />
        <div class="meta">
          <h3>${escapeHtml(s.title || '')}</h3>
          <p>${escapeHtml(s.description || '')}</p>
        </div>
      `;
      track.appendChild(slide);
    });

    // simple control
    let index = 0;
    function update(){ track.style.transform = `translateX(-${index*100}%)`; }
    if(prevBtn && nextBtn){
      prevBtn.onclick = ()=>{ index = index>0?index-1:Math.max(0,track.children.length-1); update(); }
      nextBtn.onclick = ()=>{ index = index < track.children.length-1 ? index+1 : 0; update(); }
    }
    // auto-rotate (optional)
    if(track.children.length > 1){
      setInterval(()=>{ index = (index+1) % Math.max(1, track.children.length); update(); }, 6000);
    }
  }

  if(newsContainer){
    const news = await fetchNews();
    newsContainer.innerHTML = '';
    news.forEach(n => {
      const card = document.createElement('div');
      card.className = 'news-card';
      card.innerHTML = `
        ${n.image?`<img src="${n.image}" alt="${escapeHtml(n.title)}">` : ''}
        <h4>${escapeHtml(n.title)}</h4>
        <p>${escapeHtml(n.summary || '')}</p>
      `;
      newsContainer.appendChild(card);
    });
  }
}

// ---------- ADMIN: login, load dashboard, CRUD ----------
function escapeHtml(str){
  return String(str||'').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[s]);
}

async function initAdmin(){
  // elements
  const loginPanel = document.getElementById('login-panel');
  const dashboard = document.getElementById('dashboard');
  const loginBtn = document.getElementById('login-btn');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  // slides admin controls
  const addSlideBtn = document.getElementById('add-slide-btn');
  const slideFileInput = document.getElementById('slide-file');
  const slideTitleInput = document.getElementById('slide-title');
  const slideDescInput = document.getElementById('slide-desc');
  const slidesList = document.getElementById('slides-list');
  const saveSlidesBtn = document.getElementById('save-slides');

  // news admin controls
  const newsTitle = document.getElementById('news-title');
  const newsSummary = document.getElementById('news-summary');
  const newsImageInput = document.getElementById('news-image');
  const newsFileInput = document.getElementById('news-file');
  const addNewsBtn = document.getElementById('add-news-btn');
  const newsList = document.getElementById('news-list');
  const saveNewsBtn = document.getElementById('save-news-btn');

  // login
  loginBtn.onclick = () => {
    const u = usernameInput.value.trim();
    const p = passwordInput.value;
    if(u === ADMIN_USERNAME && p === ADMIN_PASSWORD){
      loginPanel.style.display = 'none';
      dashboard.style.display = 'block';
      loadAdminData();
    } else {
      alert('Username atau password salah.');
    }
  };

  // load admin data
  async function loadAdminData(){
    // slides
    slidesList.innerHTML = '';
    const slides = await fetchSlides();
    slides.forEach(s => slidesList.appendChild(renderSlideItem(s)));
    // news
    newsList.innerHTML = '';
    const news = await fetchNews();
    news.forEach(n => newsList.appendChild(renderNewsItem(n)));
  }

  // render slide item (editable)
  function renderSlideItem(slide){
    const item = document.createElement('div'); item.className='item';
    item.dataset.id = slide.id;
    item.innerHTML = `
      <img src="${slide.image||''}" alt="">
      <div style="flex:1">
        <input class="input" data-field="title" value="${escapeHtml(slide.title||'')}" />
        <input class="input" data-field="description" value="${escapeHtml(slide.description||'')}" />
      </div>
      <div class="actions">
        <input type="file" accept="image/*" data-field="file" />
        <button class="btn secondary" data-action="delete">Hapus</button>
      </div>
    `;
    // delete handler
    item.querySelector('[data-action="delete"]').onclick = async ()=>{
      if(!confirm('Hapus slide ini?')) return;
      const id = item.dataset.id;
      await supabaseClient.from('carousel').delete().eq('id', id);
      item.remove();
    };
    return item;
  }

  // render news item
  function renderNewsItem(news){
    const item = document.createElement('div'); item.className='item';
    item.dataset.id = news.id;
    item.innerHTML = `
      ${news.image?`<img src="${news.image}" />`:`<div style="width:78px;height:56px;background:#f3f4f6;border-radius:8px"></div>`}
      <div style="flex:1">
        <input class="input" data-field="title" value="${escapeHtml(news.title||'')}" />
        <textarea class="input" data-field="summary">${escapeHtml(news.summary||'')}</textarea>
      </div>
      <div class="actions">
        <input type="file" accept="image/*" data-field="file" />
        <button class="btn secondary" data-action="delete">Hapus</button>
      </div>
    `;
    item.querySelector('[data-action="delete"]').onclick = async ()=>{
      if(!confirm('Hapus berita ini?')) return;
      await supabaseClient.from('news').delete().eq('id', news.id);
      item.remove();
    };
    return item;
  }

  // add slide (client-side create)
  addSlideBtn.onclick = async ()=>{
    // limit 5
    const existing = await fetchSlides();
    if(existing.length >= 5){
      alert('Maksimal 5 slide saja.');
      return;
    }

    const file = slideFileInput.files[0];
    let imageUrl = '';
    if(file){
      imageUrl = await uploadImageFile(file);
      if(!imageUrl) return;
    }
    // insert row
    const title = slideTitleInput.value.trim();
    const description = slideDescInput.value.trim();
    const { data, error } = await supabaseClient.from('carousel').insert([{ title, description, image: imageUrl }]).select().single();
    if(error){ alert('Gagal tambah slide'); console.error(error); return; }
    slidesList.prepend(renderSlideItem(data));
    // reset inputs
    slideTitleInput.value='';slideDescInput.value='';slideFileInput.value='';
    alert('Slide ditambahkan (jangan lupa tekan "Simpan Semua Perubahan" untuk memastikan).');
  };

  // save slides: iterate items & update
  saveSlidesBtn.onclick = async ()=>{
    const items = slidesList.querySelectorAll('.item');
    for(const it of items){
      const id = it.dataset.id;
      const title = it.querySelector('[data-field="title"]').value;
      const description = it.querySelector('[data-field="description"]').value;
      const fileInput = it.querySelector('[data-field="file"]');
      let image = it.querySelector('img') ? it.querySelector('img').src : null;

      if(fileInput && fileInput.files[0]){
        const url = await uploadImageFile(fileInput.files[0]);
        if(url) image = url;
      }

      await supabaseClient.from('carousel').update({ title, description, image }).eq('id', id);
    }
    alert('Perubahan slide disimpan.');
    loadAdminData();
  };

  // add news
  addNewsBtn.onclick = async ()=>{
    const title = newsTitle.value.trim();
    const summary = newsSummary.value.trim();
    if(!title){ alert('Judul wajib diisi.'); return; }
    let imageUrl = newsImageInput.value.trim() || '';
    if(newsFileInput.files[0]){
      const url = await uploadImageFile(newsFileInput.files[0]); if(url) imageUrl = url;
    }
    const { data, error } = await supabaseClient.from('news').insert([{ title, summary, image: imageUrl }]).select().single();
    if(error){ alert('Gagal tambah berita'); console.error(error); return; }
    newsList.prepend(renderNewsItem(data));
    newsTitle.value='';newsSummary.value='';newsImageInput.value='';newsFileInput.value='';
    alert('Berita ditambahkan.');
  };

  // save news: iterate & update
  saveNewsBtn.onclick = async ()=>{
    const items = newsList.querySelectorAll('.item');
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
