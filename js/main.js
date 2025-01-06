import { personIcon } from "./constants.js";
import { ui } from "./ui.js";
import { getIcon, getStatus } from "./helpers.js";
/* kullanıcının konum bilgisine eriş */

//global değişkenler
var map;
let clickedCords;
let layer;
// ! Localstorage'dan gelen verileri javascript nesnesine çevir ama eğer localstorage boşsa boş bir dizi render et
let notes = JSON.parse(localStorage.getItem("notes")) || [];

window.navigator.geolocation.getCurrentPosition(
  (e) => {
    loadMap([e.coords.latitude, e.coords.longitude], "mevcut konum");
  },
  (e) => {
    loadMap([40.9874145, 29.0355598], "varsayılan konum");
  }
);
function loadMap(currentPosition, msg) {
  map = L.map("map", { zoomControl: false }).setView(currentPosition, 10); //harita kurulumu

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  // Ekrana basılacak işaretlerin listelebeceği bir katman oluştur
  layer = L.layerGroup().addTo(map);

  //Zoom butonlarını ekranın sağ altına taşı
  L.control
    .zoom({
      position: "bottomright",
    })
    .addTo(map);
  //imleç ekle
  L.marker(currentPosition, { icon: personIcon }).addTo(map).bindPopup(msg);
  // haritaya tıklanma olayı gerçekleşince
  map.on("click", onMapClick);
  // Haritaya notları render et
  renderMakers();
  renderNotes();
}

// ! Harita tıklanma olayını izle ve tıklanılan noktanın koordinatlarına eriş
function onMapClick(e) {
  //tıklanma olayı
  clickedCords = [e.latlng.lat, e.latlng.lng];

  ui.aside.classList.add("add");
}

//iptal butonuna tıklanıldığında aside ı eski haline çeviren fonksiyon

ui.cancelBtn.addEventListener("click", () => {
  ui.aside.classList.remove("add"); // aside a eklenen "add" clasını kaldır
});
// ! Formun gönderilme olayını izle ve  bir fonksiyon tetikle
ui.form.addEventListener("submit", (e) => {
  // sayfa yenilemeyi engelle
  e.preventDefault();
  //formun içerisindeki verilere eriş
  const title = e.target[0].value;
  const date = e.target[1].value;
  const status = e.target[2].value;

  // not objesi oluşturmak
  const newNote = {
    id: new Date().getTime(),
    title,
    date,
    status,
    coords: clickedCords,
  };

  // notlar dizisine yeni not ekle
  notes.unshift(newNote);
  // localstorage'a notları kaydet
  localStorage.setItem("notes", JSON.stringify(notes));

  // aside ı eski haline getir
  ui.aside.classList.remove("add");
  // formu temizle
  e.target.reset();
  //notları render et
  renderNotes();
  renderMakers();
});
function renderMakers() {
  layer.clearLayers();
  notes.map((note) => {
    const icon = getIcon(note.status);
    L.marker(note.coords, { icon }).addTo(layer).bindPopup(note.title);
  });
}

// ! Notları render eden fonksiyon
function renderNotes() {
  const noteCards = notes
    .map((note) => {
      const date = new Date(note.date).toLocaleDateString("tr", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const status = getStatus(note.status);
      return ` <li>
                <div>
                    <p>${note.title}</p>
                    <p>${date}</p>
                    <p>${status}</p>
                </div>
                <div class="icons">
                    <i data-id= "${note.id}"class="bi bi-airplane-fill" id="fly"></i>
                    <i data-id ="${note.id}"class="bi bi-trash-fill" id="delete"></i>
                </div>
            </li>`;
    })
    .join("");
  ui.ul.innerHTML = noteCards;
  // Delete Iconlarına tıklanınca silme işlemini gerçekleştir
  document.querySelectorAll("li #delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;

      deleteNote(id);
    });
  });

  // Fly iconlarına tıklayınca o nota focusla
  document.querySelectorAll("li #fly").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      flyToLocation(id);
    });
  });
}
// ! Not silme fonksiyonu
function deleteNote(id) {
  // Kullanıcıdan silme işlemi için onay al
  const res = confirm("Not silme işlemini onaylıyor musunuz ?");
  if (res) {
    // `id`'si bilinen elemanı notes dizisinden kaldır
    notes = notes.filter((note) => note.id !== parseInt(id));

    // LocalStorage'ı güncelle
    localStorage.setItem("notes", JSON.stringify(notes));

    // Notları render et
    renderNotes();

    // Markerları render et
    renderMakers();
  }
}
// ! Haritadaki ilgili nota hareket etmeyi sağlayan fonksiyon

function flyToLocation(id) {
  // id'si bilinen elemanı notes dizisi içerisinden bul
  const note = notes.find((note) => note.id === parseInt(id));

  console.log(note);

  // Bulunan notun kordinatlarına uç
  map.flyTo(note.coords, 12);
}

// ! arrow iconuna tıklanınca çalışacak fonksiyon

ui.arrow.addEventListener("click", () => {
  ui.aside.classList.toggle("hide");
});
