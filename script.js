const URL = "http://localhost:3001/markers";

var map = L.map("map").setView([-19.9208, -43.9378], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const customMapMarkerSvg = `
  <svg class="icon-svg-list" width="40" height="41" viewBox="0 0 40 41" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 0.5C9 0.5 0 9.5 0 20.5C0 31.5 9 40.5 20 40.5C31 40.5 40 31.5 40 20.5C40 9.5 31 0.5 20 0.5ZM15.2 30.9C14.76 30.9 14.16 30.74 13.6 30.5L12.46 33.3L10.18 32.5L10.5 31.72C12.9 25.68 15.66 18.8 26 16.5C26 16.5 14 16.5 10.1 27.6C10.1 27.6 8 25.5 8 23.1C8 20.7 10.4 15.6 16.4 14.4C18.1 14.06 20 13.8 21.88 13.5C26.6 12.86 31.14 12.22 32 10.5C32 10.5 28.4 30.9 15.2 30.9Z"/>
  </svg>
`;

var customIcon = L.divIcon({
  html: customMapMarkerSvg,
  className: "custom-div-icon",
  iconSize: [40, 41],
  iconAnchor: [20, 41],
  popupAnchor: [0, -41]
});

let markers = [];

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
}

function addMarkers(points) {
  points.forEach(function (point) {
    var marker = L.marker([point.lat, point.lng], { icon: customIcon }).addTo(map);
    marker.bindPopup(`<b>${point.name}</b><br>${point.info}<br>Distância: ${point.distance || "Calculando..."}`);
  });
}

function updatePointsList(points) {
  var pointsList = document.getElementById("points");
  pointsList.innerHTML = "";

  points.forEach(function (point) {
    var listItem = document.createElement("li");
    listItem.className = `point-item ${point.styleClass || ""}`;
    listItem.innerHTML = `${customMapMarkerSvg}<strong>${point.name}</strong> - ${point.info} - Distância: ${point.distance || "Calculando..."}`;
    pointsList.appendChild(listItem);
  });
}

function fetchAndDisplayMarkers() {
  fetch(URL)
    .then(response => response.json())
    .then(data => {
      markers = data;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function (position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            markers.forEach(function (point) {
              point.distance = haversineDistance(userLat, userLng, point.lat, point.lng) + " km";
            });

            updatePointsList(markers);
            addMarkers(markers);
          },
          function () {
            console.warn("Geolocalização falhou ou foi negada.");
            markers.forEach(point => point.distance = "Indisponível");
            updatePointsList(markers);
            addMarkers(markers);
          }
        );
      } else {
        console.warn("Geolocalização não suportada pelo navegador.");
        markers.forEach(point => point.distance = "Indisponível");
        updatePointsList(markers);
        addMarkers(markers);
      }
    })
    .catch(error => {
      console.error("Erro ao buscar os dados dos marcadores:", error);
    });
}

document.getElementById("search").addEventListener("input", function (event) {
  var query = event.target.value.toLowerCase();
  var filteredPoints = markers.filter(point => point.name.toLowerCase().includes(query));
  updatePointsList(filteredPoints);
});

document.getElementById("sort").addEventListener("change", function (event) {
  var sortBy = event.target.value;
  var sortedPoints = [...markers];

  if (sortBy === "distance") {
    sortedPoints.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
  } else if (sortBy === "hours") {
    sortedPoints.sort((a, b) => a.info.localeCompare(b.info));
  }

  updatePointsList(sortedPoints);
});

fetchAndDisplayMarkers();