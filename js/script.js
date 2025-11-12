// Data berita dummy (fokus pada update store)
const newsData = [
    {
        title: "Produk Baru: Smartphone Terbaru",
        summary: "Update: Kami telah meluncurkan smartphone terbaru dengan fitur canggih. Kunjungi store sekarang!",
        image: "images/product1.jpg"
    },
    {
        title: "Event Belanja Akhir Pekan",
        summary: "Informasi: Diskon spesial untuk semua pembelian di akhir pekan ini. Jangan lewatkan!",
        image: "images/event.jpg"
    },
    {
        title: "Testimoni Pelanggan",
        summary: "Update: Baca apa yang dikatakan pelanggan kami tentang pengalaman belanja di store kami.",
        image: "images/testimonial.jpg"
    }
];

// Data carousel (untuk slide bergerak)
const carouselData = [
    {
        title: "Promosi Besar: Diskon 50% Elektronik!",
        description: "Kunjungi store kami untuk diskon spesial pada smartphone dan laptop. Terbatas waktu!",
        image: "images/store-logo.jpg"
    },
    {
        title: "Produk Baru: Koleksi Pakaian Musim Panas",
        description: "Update terbaru: Koleksi pakaian baru telah tiba. Lihat sekarang!",
        image: "images/product2.jpg"
    },
    {
        title: "Event Spesial: Hari Pelanggan",
        description: "Informasi: Diskon tambahan untuk pelanggan setia. Datanglah ke store!",
        image: "images/event.jpg"
    }
];

// Fungsi untuk menampilkan berita di halaman utama
function displayNews() {
    const container = document.getElementById('news-container');
    newsData.forEach((news, index) => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        newsItem.style.animationDelay = `${index * 0.2}s`; // Delay animasi untuk efek bertahap
        newsItem.innerHTML = `
            <img src="${news.image}" alt="${news.title}" width="100%">
            <h3>${news.title}</h3>
            <p>${news.summary}</p>
            <a href="#" class="btn">Baca Selengkapnya</a>
        `;
        container.appendChild(newsItem);
    });
}

// Fungsi untuk menampilkan carousel
function displayCarousel() {
    const container = document.getElementById('carousel-container');
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

// Fungsi untuk kontrol carousel
function controlCarousel() {
    const container = document.getElementById('carousel-container');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    let currentIndex = 0;

    function updateCarousel() {
        const