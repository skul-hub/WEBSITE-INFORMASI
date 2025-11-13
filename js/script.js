// Konfigurasi Supabase (ganti dengan URL dan key Anda)
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Misalnya: https://your-project.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'; // Anon public key dari Supabase

// Inisialisasi Supabase Client (pastikan script Supabase dimuat di HTML)
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Password admin (ubah ini untuk keamanan)
const ADMIN_PASSWORD = 'admin123'; // Ganti dengan password kuat

// Fungsi untuk fetch data carousel dari Supabase
async function fetchCarouselData() {
    const { data, error } = await supabaseClient.from('carousel').select('*');
    if (error) {
        console.error('Error fetching carousel:', error);
        return []; // Fallback ke array kosong
    }
    return data;
}

// Fungsi untuk fetch data news dari Supabase
async function fetchNewsData() {
    const { data, error } = await supabaseClient.from('news').select('*');
    if (error) {
        console.error('Error fetching news:', error);
        return []; // Fallback ke array kosong
    }
    return data;
}

// Fungsi untuk menampilkan carousel
async function displayCarousel() {
    const carouselData = await fetchCarouselData();
    const container = document.getElementById('carousel-container');
    container.innerHTML = ''; // Clear existing
    carouselData.forEach(slide => {
        const slideDiv = document.createElement('div');
        slideDiv.className = 'carousel-slide';
        slideDiv.innerHTML = `
            <img src="${slide.image}" alt="${slide.title}">
            <h3>${slide.title}</h3>
            <p>${slide.description}</p>
        `;
        container.appendChild(slideDiv);
    });
}

// Fungsi untuk menampilkan berita
async function displayNews() {
    const newsData = await fetchNewsData();
    const container = document.getElementById('news-container');
    container.innerHTML = ''; // Clear existing
    newsData.forEach((news, index) => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        newsItem.style.animationDelay = `${index * 0.2}s`;
        newsItem.innerHTML = `
            <img src="${news.image}" alt="${news.title}" width="100%">
            <h3>${news.title}</h3>
            <p>${news.summary}</p>
            <a href="#" class="btn">Baca Selengkapnya</a>
        `;
        container.appendChild(newsItem);
    });
}

// Fungsi untuk kontrol carousel
function controlCarousel() {
    const container = document.getElementById('carousel-container');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    let currentIndex = 0;

    function updateCarousel() {
        const slides = container.children;
        if (slides.length > 0) {
            container.style.transform = `translateX(-${currentIndex * 100}%)`;
        }
    }

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
});
