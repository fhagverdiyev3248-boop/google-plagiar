const API_KEY = "54163086-3cc1881c031b03fb808547c72";
let currentPage = 1;
let currentQuery = "";
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

// Theme and Language
let currentTheme = localStorage.getItem("theme") || "light";
let currentLanguage = localStorage.getItem("language") || "en";

// Translations
const translations = {
    en: {
        title: "Image Search",
        favorites: "★ Favorites",
        searchPlaceholder: "Search images...",
        search: "Search",
        page: "Page",
        author: "Author:",
        tags: "Tags:",
        downloads: "Downloads:",
        likes: "Likes:"
    },
    ru: {
        title: "Поиск изображений",
        favorites: "★ Избранное",
        searchPlaceholder: "Поиск изображений...",
        search: "Поиск",
        page: "Страница",
        author: "Автор:",
        tags: "Теги:",
        downloads: "Загрузки:",
        likes: "Лайки:"
    }
};

const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const gallery = document.getElementById("gallery");
const spinner = document.getElementById("spinner");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const pageInfo = document.getElementById("page-info");
const favoritesBtn = document.getElementById("favorites-btn");

const modal = document.getElementById("modal");
const modalImage = document.getElementById("modal-image");
const modalInfo = document.getElementById("modal-info");
const closeModal = document.getElementById("close-modal");

// spinner functions
function showSpinner() {
  spinner.classList.remove("hidden");
}

function hideSpinner() {
  spinner.classList.add("hidden");
}

// Fetch images
async function fetchImages(query, page = 1) {
  showSpinner(); // show spinner when search starts
  try {
    const response = await fetch(`https://pixabay.com/api/?key=${API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=12&page=${page}`);
    const data = await response.json();

    // wait for images to finish loading before hiding spinner
    await displayImages(data.hits); // displayImages resolves when all images load/error
    pageInfo.textContent = `Page ${page} of ${Math.ceil(data.totalHits / 12)}`;
    document.getElementById("pagination").classList.remove("hidden");
    document.getElementById("pagination").classList.remove("hidden");
  } catch (error) {
    console.error(error);
    alert("Error fetching images!");
    hideSpinner();
  }
}

// Display images
// Returns a Promise that resolves once all image elements have either loaded or errored
function displayImages(images) {
  gallery.innerHTML = "";

  if (!images || images.length === 0) {
    hideSpinner();
    return Promise.resolve();
  }

  const loadPromises = images.map(img => {
    return new Promise(resolve => {
      const div = document.createElement("div");
      div.className = "gallery-item";

      const imageEl = document.createElement("img");
      imageEl.alt = img.tags || "";
      imageEl.src = img.webformatURL;

      // resolve when image loads or errors
      imageEl.addEventListener("load", () => resolve());
      imageEl.addEventListener("error", () => resolve());

      imageEl.addEventListener("click", () => openModal(img));

      const favBtn = document.createElement("button");
      favBtn.className = "favorite-btn";
      favBtn.innerHTML = favorites.some(f => f.id === img.id) ? "★" : "☆";
      favBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorite(img, favBtn);
      });

      div.appendChild(imageEl);
      div.appendChild(favBtn);
      gallery.appendChild(div);
    });
  });

  // Wait until all images have fired load/error, then hide spinner
  return Promise.all(loadPromises).then(() => {
    hideSpinner();
  });
}

// Toggle favorite
function toggleFavorite(img, btn) {
  if (favorites.some(f => f.id === img.id)) {
    favorites = favorites.filter(f => f.id !== img.id);
    btn.innerHTML = "☆";
  } else {
    favorites.push(img);
    btn.innerHTML = "★";
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

// Show favorites
favoritesBtn.addEventListener("click", () => {
  displayImages(favorites);
  pageInfo.textContent = `Favorites (${favorites.length})`;
  document.getElementById("pagination").classList.add("hidden");
});

// Modal
function openModal(img) {
  modalImage.src = img.largeImageURL;
  modalInfo.innerHTML = `
    <p><strong>Author:</strong> ${img.user}</p>
    <p><strong>Tags:</strong> ${img.tags}</p>
    <p><strong>Downloads:</strong> ${img.downloads}</p>
    <p><strong>Likes:</strong> ${img.likes}</p>
  `;
  modal.classList.add("show");
}
function closeModalFunc() { modal.classList.remove("show"); }
closeModal.addEventListener("click", closeModalFunc);
modal.addEventListener("click", e => { if(e.target===modal) closeModalFunc(); });
document.addEventListener("keydown", e => { if(e.key==="Escape") closeModalFunc(); });

// Form submit
form.addEventListener("submit", e => {
  e.preventDefault();
  currentQuery = input.value;
  currentPage = 1;
  fetchImages(currentQuery, currentPage);
});

// Pagination
prevBtn.addEventListener("click", () => { if(currentPage>1){ currentPage--; fetchImages(currentQuery, currentPage); }});
nextBtn.addEventListener("click", () => { currentPage++; fetchImages(currentQuery, currentPage); });

// Theme Toggle
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", () => {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  applyTheme();
  localStorage.setItem("theme", currentTheme);
});

// Language Select
const languageSelect = document.getElementById("language-select");
languageSelect.addEventListener("change", (e) => {
  currentLanguage = e.target.value;
  applyLanguage();
  localStorage.setItem("language", currentLanguage);
});

// Apply Theme
function applyTheme() {
  document.body.classList.toggle("dark", currentTheme === "dark");
  themeToggle.textContent = currentTheme === "light" ? "☀️" : "🌙";
}

// Apply Language
function applyLanguage() {
  const t = translations[currentLanguage];
  document.querySelector('[data-key="title"]').textContent = t.title;
  document.querySelector('[data-key="favorites"]').textContent = t.favorites;
  input.placeholder = t.searchPlaceholder;
  document.querySelector('button[type="submit"]').textContent = t.search;
  // Update page info if needed
  if (pageInfo.textContent.includes("Page")) {
    const pageMatch = pageInfo.textContent.match(/Page (\d+) of (\d+)/);
    if (pageMatch) {
      pageInfo.textContent = `${t.page} ${pageMatch[1]} of ${pageMatch[2]}`;
    }
  }
  // Update modal labels
  if (modal.classList.contains("show")) {
    const img = modalImage.src ? { user: modalInfo.querySelector("p:nth-child(1)").textContent.split(": ")[1],
                                   tags: modalInfo.querySelector("p:nth-child(2)").textContent.split(": ")[1],
                                   downloads: modalInfo.querySelector("p:nth-child(3)").textContent.split(": ")[1],
                                   likes: modalInfo.querySelector("p:nth-child(4)").textContent.split(": ")[1] } : {};
    modalInfo.innerHTML = `
      <p><strong>${t.author}</strong> ${img.user}</p>
      <p><strong>${t.tags}</strong> ${img.tags}</p>
      <p><strong>${t.downloads}</strong> ${img.downloads}</p>
      <p><strong>${t.likes}</strong> ${img.likes}</p>
    `;
  }
}

// Initialize
applyTheme();
applyLanguage();
