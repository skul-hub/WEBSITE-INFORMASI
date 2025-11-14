// js/script.js - FINAL (replace SUPABASE values)
const SUPABASE_URL = "https://abzvqnbgihmocgphclxr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFienZxbmJnaWhtb2NncGhjbHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwOTM5NzAsImV4cCI6MjA3ODY2OTk3MH0.FISEW24b5i9ut6FYnNkQW8k-QksxOfMWCGDkO45TemY";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// admin cred
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'adminTPI';

// small helper
function escapeHtml(str){ return String(str||'').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[s]); }

// ------------------ DOM READY ------------------
document.addEventListener('DOMContentLoaded', () => {
  // admin login
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const u = document.getElementById('username').value.trim();
      const p = document.getElementById('password').value.trim();
      if (u === ADMIN_USERNAME && p === ADMIN_PASSWORD) {
        alert('Login berhasil!');
        window.location.href = 'edit.html';
      } else {
        alert('Username atau password salah!');
      }
    });
  }

  // index
  if (location.pathname.endsWith('index.html') || location.pathname === '/' || location.pathname.endsWith('/')) {
    renderIndex();
  }

  // edit admin
  if (location.pathname.includes('edit.html')) {
    initAdminPanel();
  }

  // contact form
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Terima kasih! Pesan Anda telah dikirim.');
      contactForm.reset();
    });
  }
});

// ------------------ Storage upload ------------------
async function uploadImageFile(file){
  if(!file) return null;
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g,'-')}`;
  const { error } = await supabaseClient.storage.from('images').upload(fileName, file);
  if (error) {
    console.error('Upload error', error);
    alert('Gagal upload gambar: ' + (error.message || error));
    return null;
  }
  const { data } = supabaseClient.storage.from('images').getPublicUrl(fileName);
  return data.publicUrl;
}

// ------------------ INDEX: fetch & render ------------------
async function fetchSlides(){ const { data, error } = await supabaseClient.from('carousel').select('*').order('order_index',{ascending:true}); if(error){console.error(error); return []} return data||[]; }
async function fetchNews(){ const { data, error } = await supabaseClient.from('news').select('*').order('id',{ascending:false}); if(error){console.error(error); return []} return data||[]; }

async function renderIndex(){
  const track = document.getElementById('carousel-track');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const newsContainer = document.getElementById('news-container');

  const slides = await fetchSlides();

  if(track){
    track.innerHTML = '';
    slides.forEach(s => {
      const slide = document.createElement('div'); slide.className='slide';
      slide.innerHTML = `
        <img src="${s.image||''}" alt="${escapeHtml(s.title||'')}">
        <div class="meta">
          <h3>${escapeHtml(s.title||'')}</h3>
          <p>${escapeHtml(s.description||'')}</p>
        </div>
      `;
      track.appendChild(slide);
    });

    let idx = 0;
    function update(){ track.style.transform = `translateX(-${idx*100}%)`; }
    if(prevBtn && nextBtn){
      prevBtn.onclick = ()=>{ idx = idx>0?idx-1:track.children.length-1; update(); }
      nextBtn.onclick = ()=>{ idx = idx < track.children.length-1 ? idx+1 : 0; update(); }
    }
    if(track.children.length > 1){
      setInterval(()=>{ idx = (idx+1) % Math.max(1, track.children.length); update(); }, 6000);
    }
  }

  if(newsContainer){
    const news = await fetchNews();
    newsContainer.innerHTML = '';
    news.forEach(n => {
      const c = document.createElement('div'); c.className='news-card';
      c.innerHTML = `${n.image?`<img src="${n.image}" alt="${escapeHtml(n.title)}">` : ''}<h4>${escapeHtml(n.title)}</h4><p>${escapeHtml(n.summary||'')}</p>`;
      newsContainer.appendChild(c);
    });
  }
}

// ------------------ ADMIN PANEL (edit.html) ------------------
function initAdminPanel(){
  const addSlideBtn = document.getElementById('add-slide');
  const addNewsBtn = document.getElementById('add-news');
  const saveSlidesBtn = document.getElementById('save-slides');
  const saveNewsBtn = document.getElementById('save-news');

  loadAdminSlides();
  loadAdminNews();

  if(addSlideBtn) addSlideBtn.addEventListener('click', adminAddSlide);
  if(addNewsBtn) addNewsBtn.addEventListener('click', adminAddNews);
  if(saveSlidesBtn) saveSlidesBtn.addEventListener('click', saveSlidesOrder);
  if(saveNewsBtn) saveNewsBtn.addEventListener('click', saveAllNewsEdits);
}

async function loadAdminSlides(){
  const list = document.getElementById('slides-list');
  if(!list) return;
  list.innerHTML = 'Loading...';
  const slides = await fetchSlides();
  list.innerHTML = '';
  slides.forEach(s => list.appendChild(renderAdminSlideItem(s)));
}

function renderAdminSlideItem(slide){
  const item = document.createElement('div'); item.className='item';
  item.dataset.id = slide.id;
  item.innerHTML = `
    <img src="${slide.image||''}" alt="">
    <div style="flex:1">
      <input class="input" data-field="title" value="${escapeHtml(slide.title||'')}" />
      <input class="input" data-field="description" value="${escapeHtml(slide.description||'')}" style="margin-top:8px;" />
    </div>
    <div class="actions">
      <input type="file" data-field="file" accept="image/*" />
      <button class="btn secondary" data-action="delete">Hapus</button>
    </div>
  `;
  item.querySelector('[data-action="delete"]').addEventListener('click', async ()=>{
    if(!confirm('Hapus slide ini?')) return;
    const id = item.dataset.id;
    await supabaseClient.from('carousel').delete().eq('id', id);
    item.remove();
  });
  return item;
}

async function adminAddSlide(){
  const title = document.getElementById('slide-title').value.trim();
  const desc = document.getElementById('slide-desc').value.trim();
  const file = document.getElementById('slide-file').files[0];
  const current = await fetchSlides();
  if(current.length >= 5){ alert('Maksimal 5 slide. Hapus beberapa dulu jika ingin menambah.'); return; }
  if(!file){ alert('Pilih gambar dulu'); return; }

  const url = await uploadImageFile(file);
  if(!url) return;
  const order_index = (current.length>0)?Math.max(...current.map(s=>s.order_index||0))+1:0;

  const { error } = await supabaseClient.from('carousel').insert([{ title, description:desc, image:url, order_index }]);
  if(error){ console.error(error); alert('Gagal menambah slide'); return; }
  alert('Slide ditambahkan');
  document.getElementById('slide-title').value=''; document.getElementById('slide-desc').value=''; document.getElementById('slide-file').value='';
  loadAdminSlides();
}

async function saveSlidesOrder(){
  const list = document.getElementById('slides-list');
  if(!list) return;
  const items = [...list.querySelectorAll('.item')];
  for(let i=0;i<items.length;i++){
    const it = items[i];
    const id = it.dataset.id;
    const title = it.querySelector('[data-field="title"]').value;
    const description = it.querySelector('[data-field="description"]').value;
    const fileInput = it.querySelector('[data-field="file"]');
    let image = it.querySelector('img') ? it.querySelector('img').src : null;
    if(fileInput && fileInput.files && fileInput.files[0]){
      const url = await uploadImageFile(fileInput.files[0]);
      if(url) image = url;
    }
    await supabaseClient.from('carousel').update({ title, description, image, order_index: i }).eq('id', id);
  }
  alert('Perubahan slide disimpan.');
  loadAdminSlides();
}

// ------------------ NEWS ADMIN ------------------
async function loadAdminNews(){
  const list = document.getElementById('news-list');
  if(!list) return;
  list.innerHTML = 'Loading...';
  const news = await fetchNews();
  list.innerHTML = '';
  news.forEach(n => list.appendChild(renderAdminNewsItem(n)));
}

function renderAdminNewsItem(n){
  const item = document.createElement('div'); item.className='item';
  item.dataset.id = n.id;
  item.innerHTML = `
    ${n.image?`<img src="${n.image}" />`:`<div style="width:80px;height:56px;background:#0b0b0b;border-radius:8px"></div>`}
    <div style="flex:1">
      <input class="input" data-field="title" value="${escapeHtml(n.title||'')}" />
      <textarea class="input" data-field="summary" style="margin-top:8px">${escapeHtml(n.summary||'')}</textarea>
    </div>
    <div class="actions">
      <input type="file" data-field="file" accept="image/*" />
      <button class="btn secondary" data-action="delete">Hapus</button>
    </div>
  `;
  item.querySelector('[data-action="delete"]').addEventListener('click', async ()=>{
    if(!confirm('Hapus berita ini?')) return;
    const id = item.dataset.id;
    await supabaseClient.from('news').delete().eq('id', id);
    item.remove();
  });
  return item;
}

async function adminAddNews(){
  const title = document.getElementById('news-title').value.trim();
  const summary = document.getElementById('news-summary').value.trim();
  const file = document.getElementById('news-file').files[0];
  if(!title){ alert('Judul wajib diisi'); return; }
  let image = null;
  if(file){ image = await uploadImageFile(file); if(!image) return; }
  const { error } = await supabaseClient.from('news').insert([{ title, summary, image }]);
  if(error){ console.error(error); alert('Gagal menambah berita'); return; }
  alert('Berita ditambahkan');
  document.getElementById('news-title').value=''; document.getElementById('news-summary').value=''; document.getElementById('news-file').value='';
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
