// ==========================================
//  SUPABASE CLIENT
// ==========================================
const supabaseClient = supabase.createClient(
  "https://abzvqnbgihmocgphclxr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
);

// Helper untuk text clean
const clean = (v) => (v ? v.toString() : "");

// ==========================================
//  DOCUMENT READY
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  // Halaman edit admin
  if (path.includes("edit.html")) {
    initAdmin();
  }

  // Halaman index
  if (path.includes("index.html") || path === "/" || path.endsWith("/")) {
    initIndex();
  }
});

// ==========================================
//  UPLOAD IMAGE
// ==========================================
async function uploadImage(file) {
  if (!file) return null;

  const name = Date.now() + "_" + file.name.replace(/\s+/g, "-");
  const { error } = await supabaseClient.storage
    .from("images")
    .upload(name, file);

  if (error) {
    alert("Upload gagal!");
    console.log(error);
    return null;
  }

  const { data } = supabaseClient.storage
    .from("images")
    .getPublicUrl(name);

  return data.publicUrl;
}

// ==========================================
//  FETCH DATA
// ==========================================
async function getSlides() {
  const { data } = await supabaseClient
    .from("carousel")
    .select("*")
    .order("order_index", { ascending: true });

  return data || [];
}

async function getNews() {
  const { data } = await supabaseClient
    .from("news")
    .select("*")
    .order("id", { ascending: false });

  return data || [];
}

// ==========================================
//  INDEX PAGE (SLIDER + NEWS)
// ==========================================
async function initIndex() {
  const track = document.getElementById("carousel-track");
  const newsBox = document.getElementById("news-container");

  // SLIDE
  const slides = await getSlides();
  if (track) {
    track.innerHTML = "";

    slides.forEach((s) => {
      const div = document.createElement("div");
      div.className = "slide";
      div.innerHTML = `
        <img src="${clean(s.image)}">
        <div class="meta">
          <h3>${clean(s.title)}</h3>
          <p>${clean(s.description)}</p>
        </div>
      `;
      track.appendChild(div);
    });

    // AUTO SLIDE
    let index = 0;
    setInterval(() => {
      if (track.children.length === 0) return;
      index = (index + 1) % track.children.length;
      track.style.transform = `translateX(-${index * 100}%)`;
    }, 5000);
  }

  // NEWS
  const news = await getNews();
  if (newsBox) {
    newsBox.innerHTML = "";
    news.forEach((n) => {
      const div = document.createElement("div");
      div.className = "news-card";
      div.innerHTML = `
        ${n.image ? `<img src="${n.image}">` : ""}
        <h4>${clean(n.title)}</h4>
        <p>${clean(n.summary)}</p>
      `;
      newsBox.appendChild(div);
    });
  }
}

// ==========================================
//  ADMIN PAGE (CRUD SLIDE + NEWS)
// ==========================================
function initAdmin() {
  // tombol
  document.getElementById("add-slide").onclick = addSlide;
  document.getElementById("add-news").onclick = addNews;

  // load awal
  loadSlidesAdmin();
  loadNewsAdmin();
}

// ========== SLIDE ADMIN ================
async function loadSlidesAdmin() {
  const list = document.getElementById("slides-list");
  const slides = await getSlides();

  list.innerHTML = "";
  slides.forEach((s) => {
    const div = document.createElement("div");
    div.className = "item";
    div.dataset.id = s.id;

    div.innerHTML = `
      <img src="${s.image}">
      <div style="flex:1;">
        <input class="input" data-title value="${clean(s.title)}">
        <input class="input" data-desc value="${clean(s.description)}" style="margin-top:8px;">
      </div>
      <div class="actions">
        <input type="file" data-file accept="image/*">
        <button class="btn secondary" data-del>Hapus</button>
      </div>
    `;

    div.querySelector("[data-del]").onclick = async () => {
      await supabaseClient.from("carousel").delete().eq("id", s.id);
      loadSlidesAdmin();
    };

    list.appendChild(div);
  });
}

async function addSlide() {
  const title = document.getElementById("slide-title").value;
  const desc = document.getElementById("slide-desc").value;
  const file = document.getElementById("slide-file").files[0];

  if (!file) return alert("Pilih gambar!");

  const url = await uploadImage(file);

  const slides = await getSlides();
  const order_index = slides.length;

  await supabaseClient.from("carousel").insert({
    title,
    description: desc,
    image: url,
    order_index,
  });

  alert("Slide ditambahkan!");
  loadSlidesAdmin();
}

// ========== NEWS ADMIN ================
async function loadNewsAdmin() {
  const list = document.getElementById("news-list");
  const news = await getNews();

  list.innerHTML = "";
  news.forEach((n) => {
    const div = document.createElement("div");
    div.className = "item";
    div.dataset.id = n.id;

    div.innerHTML = `
      ${n.image ? `<img src="${n.image}">` : `<div style="width:80px;height:56px;background:#333;border-radius:6px"></div>`}
      <div style="flex:1;">
        <input class="input" data-title value="${clean(n.title)}">
        <textarea class="input" data-summary>${clean(n.summary)}</textarea>
      </div>
      <div class="actions">
        <input type="file" data-file accept="image/*">
        <button class="btn secondary" data-del>Hapus</button>
      </div>
    `;

    div.querySelector("[data-del]").onclick = async () => {
      await supabaseClient.from("news").delete().eq("id", n.id);
      loadNewsAdmin();
    };

    list.appendChild(div);
  });
}

async function addNews() {
  const title = document.getElementById("news-title").value;
  const summary = document.getElementById("news-summary").value;
  const file = document.getElementById("news-file").files[0];

  if (!title) return alert("Judul wajib!");

  let url = null;
  if (file) url = await uploadImage(file);

  await supabaseClient.from("news").insert({
    title,
    summary,
    image: url,
  });

  alert("Berita ditambahkan!");
  loadNewsAdmin();
}
