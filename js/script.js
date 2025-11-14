// Konfigurasi Supabase
const SUPABASE_URL = 'https://pfllreeqtdmbrbvgnusg.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmbGxyZWVxdGRtYnJidmdudXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIzNzUsImV4cCI6MjA3ODYyODM3NX0.LUtOubmLAyHavdONvozfTSHnXT1_hiCAXjY0RQIoGvw';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Password admin
const ADMIN_PASSWORD = "ADMIN";

// ---------------------- FETCH DATA ---------------------------- //

async function fetchCarouselData() {
    const { data, error } = await supabaseClient.from("carousel").select("*");
    return error ? [] : data;
}

async function fetchNewsData() {
    const { data, error } = await supabaseClient.from("news").select("*");
    return error ? [] : data;
}

// ---------------------- UPLOAD GAMBAR ------------------------- //

async function uploadImage(file) {
    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabaseClient.storage
        .from("images")
        .upload(fileName, file);

    if (error) {
        alert("Error upload gambar: " + error.message);
        return null;
    }

    const { data: publicUrl } = supabaseClient.storage
        .from("images")
        .getPublicUrl(fileName);

    return publicUrl.publicUrl;
}

// ---------------------- DISPLAY DI USER ----------------------- //

async function displayCarousel() {
    const data = await fetchCarouselData();
    const container = document.getElementById("carousel-container");

    if (!container) return;

    container.innerHTML = "";

    data.forEach((slide) => {
        const div = document.createElement("div");
        div.className = "carousel-slide";
        div.innerHTML = `
            <img src="${slide.image}" />
            <h3>${slide.title}</h3>
            <p>${slide.description}</p>
        `;
        container.appendChild(div);
    });
}

async function displayNews() {
    const data = await fetchNewsData();
    const container = document.getElementById("news-container");

    if (!container) return;

    container.innerHTML = "";

    data.forEach((news, i) => {
        const div = document.createElement("div");
        div.className = "news-item";
        div.style.animationDelay = `${i * 0.2}s`;
        div.innerHTML = `
            <img src="${news.image}">
            <h3>${news.title}</h3>
            <p>${news.summary}</p>
            <a class="btn">Baca Selengkapnya</a>
        `;
        container.appendChild(div);
    });
}

// ---------------------- CAROUSEL CONTROL ----------------------- //

function controlCarousel() {
    const container = document.getElementById("carousel-container");
    const prev = document.getElementById("prev-btn");
    const next = document.getElementById("next-btn");

    if (!container || !prev || !next) return;

    let index = 0;

    function update() {
        container.style.transform = `translateX(-${index * 100}%)`;
    }

    prev.onclick = () => {
        index = index > 0 ? index - 1 : container.children.length - 1;
        update();
    };

    next.onclick = () => {
        index = index < container.children.length - 1 ? index + 1 : 0;
        update();
    };
}

// ---------------------- ADMIN LOGIN ---------------------------- //

function adminLogin() {
    const pass = prompt("Masukkan password admin:");
    if (pass === ADMIN_PASSWORD) return true;

    alert("Password salah!");
    return false;
}

// ---------------------- ADMIN EDITOR --------------------------- //

async function loadCarouselEditor() {
    const data = await fetchCarouselData();
    const editor = document.getElementById("carousel-editor");

    editor.innerHTML = "";

    data.forEach((slide) => {
        const form = document.createElement("div");
        form.className = "admin-form";

        form.innerHTML = `
            <input type="text" value="${slide.title}" data-id="${slide.id}" data-field="title">
            <textarea data-id="${slide.id}" data-field="description">${slide.description}</textarea>
            <input type="file" accept="image/*" data-id="${slide.id}" data-field="image-file">
            <input type="text" value="${slide.image}" data-id="${slide.id}" data-field="image">
            <button class="btn" onclick="deleteCarousel(${slide.id})">Hapus</button>
        `;

        editor.appendChild(form);
    });
}

async function loadNewsEditor() {
    const data = await fetchNewsData();
    const editor = document.getElementById("news-editor");

    editor.innerHTML = "";

    data.forEach((news) => {
        const form = document.createElement("div");
        form.className = "admin-form";

        form.innerHTML = `
            <input type="text" value="${news.title}" data-id="${news.id}" data-field="title">
            <textarea data-id="${news.id}" data-field="summary">${news.summary}</textarea>
            <input type="text" value="${news.image}" data-id="${news.id}" data-field="image">
            <button class="btn" onclick="deleteNews(${news.id})">Hapus</button>
        `;

        editor.appendChild(form);
    });
}

// ---------------------- SAVE DATA ------------------------------ //

async function saveCarousel() {
    const forms = document.querySelectorAll('#carousel-editor .admin-form');

    for (let form of forms) {
        const id = form.querySelector('[data-field="title"]').dataset.id;
        const title = form.querySelector('[data-field="title"]').value;
        const description = form.querySelector('[data-field="description"]').value;

        const file = form.querySelector('[data-field="image-file"]').files[0];
        let image = form.querySelector('[data-field="image"]').value;

        if (file) {
            const url = await uploadImage(file);
            if (url) image = url;
        }

        await supabaseClient.from("carousel").update({
            title, description, image
        }).eq("id", id);
    }

    alert("Carousel disimpan!");
    loadCarouselEditor();
}

async function saveNews() {
    const forms = document.querySelectorAll('#news-editor .admin-form');

    for (let form of forms) {
        const id = form.querySelector('[data-field="title"]').dataset.id;
        const title = form.querySelector('[data-field="title"]').value;
        const summary = form.querySelector('[data-field="summary"]').value;
        const image = form.querySelector('[data-field="image"]').value;

        await supabaseClient.from("news").update({
            title, summary, image
        }).eq("id", id);
    }

    alert("Berita disimpan!");
    loadNewsEditor();
}

// ---------------------- ADD DATA ------------------------------ //

async function addCarouselSlide() {
    await supabaseClient.from("carousel").insert({
        title: "Judul Baru",
        description: "Deskripsi Baru",
        image: "images/default.jpg"
    });
    loadCarouselEditor();
}

async function addNewsItem() {
    await supabaseClient.from("news").insert({
        title: "Judul Baru",
        summary: "Summary Baru",
        image: "images/default.jpg"
    });
    loadNewsEditor();
}

// ---------------------- DELETE ------------------------------- //

async function deleteCarousel(id) {
    await supabaseClient.from("carousel").delete().eq("id", id);
    loadCarouselEditor();
}

async function deleteNews(id) {
    await supabaseClient.from("news").delete().eq("id", id);
    loadNewsEditor();
}

// ---------------------- PAGE LOAD ----------------------------- //

document.addEventListener("DOMContentLoaded", async () => {
    if (location.pathname.includes("admin.html")) {
        if (!adminLogin()) return;

        loadCarouselEditor();
        loadNewsEditor();

        document.getElementById("add-carousel-slide").onclick = addCarouselSlide;
        document.getElementById("save-carousel").onclick = saveCarousel;

        document.getElementById("add-news-item").onclick = addNewsItem;
        document.getElementById("save-news").onclick = saveNews;

    } else {
        await displayCarousel();
        await displayNews();
        controlCarousel();
    }
}); id);
        if (error) throw error;
        alert('Berita dihapus!');
        loadNewsEditor();
    } catch (error) {
        alert('Error menghapus: ' + error.message);
    }
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

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : container.children.length - 1;
        updateCarousel();
    });

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex < container.children.length - 1) ? currentIndex + 1 : 0;
        updateCarousel();
    });
}

// Fungsi untuk form kontak
function handleContactForm() {
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Terima kasih! Pesan Anda telah dikirim.');
            form.reset();
        });
    }
}

// Fungsi untuk modal selamat datang
function showWelcomeModal() {
    const modal = document.getElementById('welcome-modal');
    const closeBtn = document.querySelector('.close-btn');
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
