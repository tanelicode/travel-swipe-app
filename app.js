const startLocation = {
  name: "Hamburg Hauptbahnhof",
  lat: 53.5527,
  lng: 10.0069
};

let currentCity = null;
let places = [];
let currentIndex = 0;
let likedPlaces = [];

let routeMap = null;
let routeLayerGroup = null;
let routeTileLayer = null;

let currentImageIndex = 0;
let imageSliderInterval = null;

let isDragging = false;
let startX = 0;
let currentX = 0;
let moveX = 0;

const swipeThreshold = 120;

const startScreen = document.getElementById("start-screen");
const swipeScreen = document.getElementById("swipe-screen");
const resultScreen = document.getElementById("result-screen");

const cityList = document.getElementById("city-list");
const useLocationBtn = document.getElementById("use-location-btn");
const locationStatus = document.getElementById("location-status");

const likeBtn = document.getElementById("like-btn");
const dislikeBtn = document.getElementById("dislike-btn");
const restartBtn = document.getElementById("restart-btn");

const progressText = document.getElementById("progress-text");
const progressBar = document.getElementById("progress-bar");

const card = document.getElementById("card");
const placeImage = document.getElementById("place-image");
const imageDots = document.getElementById("image-dots");

const placeName = document.getElementById("place-name");
const placeDescription = document.getElementById("place-description");
const placeCategory = document.getElementById("place-category");

const routeList = document.getElementById("route-list");
const selectedCount = document.getElementById("selected-count");
const startPoint = document.getElementById("start-point");
const totalRouteInfo = document.getElementById("total-route-info");
const routeItemTemplate = document.getElementById("route-item-template");

likeBtn.addEventListener("click", () => swipeCard("right"));
dislikeBtn.addEventListener("click", () => swipeCard("left"));
restartBtn.addEventListener("click", restartApp);
useLocationBtn.addEventListener("click", () => {
  console.log("Standort-Button wurde geklickt");
  useCurrentLocation()
});

card.addEventListener("pointerdown", startDrag);
card.addEventListener("pointermove", dragCard);
card.addEventListener("pointerup", endDrag);
card.addEventListener("pointerleave", endDrag);

renderCityButtons();

function renderCityButtons() {
  cityList.innerHTML = "";

  cities.forEach((city) => {
    const button = document.createElement("button");
    button.classList.add("city-button");
    button.textContent = `${city.name}, ${city.country}`;

    button.addEventListener("click", () => {
      startCity(city.id);
    });

    cityList.appendChild(button);
  });
}

function useCurrentLocation() {
  console.log("useCurrentLocation wurde gestartet");

  if (!navigator.geolocation) {
    locationStatus.textContent = "Dein Browser unterstützt keine Standortfreigabe.";
    console.error("Geolocation wird nicht unterstützt.");
    return;
  }

  locationStatus.textContent = "Standort wird ermittelt...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log("Standort erhalten:", position.coords.latitude, position.coords.longitude);

      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      const nearestCity = findNearestCity(userLocation);

      console.log("Nächste Stadt:", nearestCity);

      if (!nearestCity) {
        locationStatus.textContent = "Es konnte keine passende Stadt gefunden werden.";
        return;
      }

      locationStatus.textContent = `Nächste Stadt erkannt: ${nearestCity.name}`;

      startCity(nearestCity.id);
    },
    (error) => {
      console.error("Standortfehler:", error);

      if (error.code === 1) {
        locationStatus.textContent = "Standortfreigabe wurde blockiert oder abgelehnt.";
      } else if (error.code === 2) {
        locationStatus.textContent = "Standort konnte nicht ermittelt werden.";
      } else if (error.code === 3) {
        locationStatus.textContent = "Standortermittlung hat zu lange gedauert.";
      } else {
        locationStatus.textContent = "Unbekannter Fehler bei der Standortermittlung.";
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

function findNearestCity(userLocation) {
  if (!cities || cities.length === 0) {
    console.error("Keine Städte verfügbar in cities.js gefunden.");
    return null;
  }

  let nearestCity = cities[0];
  let nearestDistance = calculateDistanceInKm(userLocation, cities[0]);

  for (let i = 1; i < cities.length; i++) {
    const distance = calculateDistanceInKm(userLocation, cities[i]);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestCity = cities[i];
    }
  }

  console.log("Entfernung zum nächsten Stadtzentrum:", nearestDistance.toFixed(2), "km");

  return nearestCity;
}

function startCity(cityId) {
  currentCity = cities.find((city) => city.id === cityId);
  places = placesByCity[cityId] || [];

  if (!currentCity) {
    alert("Die ausgewählte Stadt wurde nicht gefunden.");
    return;
  }

  if (places.length === 0) {
    alert(`Für ${currentCity.name} sind noch keine Sehenswürdigkeiten hinterlegt.`);
    return;
  }

  currentIndex = 0;
  likedPlaces = [];

  startLocation.name = `${currentCity.name} Zentrum`;
  startLocation.lat = currentCity.lat;
  startLocation.lng = currentCity.lng;

  selectedCount.textContent = "";
  startPoint.textContent = "";
  totalRouteInfo.textContent = "";
  routeList.innerHTML = "";
  progressBar.style.width = "0%";

  clearRouteMap();
  resetCardPosition();

  showScreen(swipeScreen);
  renderCurrentPlace();
}

function renderCurrentPlace() {
  const currentPlace = places[currentIndex];

  resetCardPosition();

  progressText.textContent = `${currentIndex + 1} von ${places.length} bewertet`;

  const progressPercent = ((currentIndex + 1) / places.length) * 100;
  progressBar.style.width = `${progressPercent}%`;

  placeName.textContent = currentPlace.name;
  placeDescription.textContent = currentPlace.description;
  placeCategory.textContent = currentPlace.category;

  startImageSlider(currentPlace);
}

function startImageSlider(place) {
  stopImageSlider();

  currentImageIndex = 0;
  renderCurrentImage(place);

  if (!place.images || place.images.length <= 1) {
    return;
  }

  imageSliderInterval = setInterval(() => {
    currentImageIndex++;

    if (currentImageIndex >= place.images.length) {
      currentImageIndex = 0;
    }

    renderCurrentImage(place);
  }, 2500);
}

function stopImageSlider() {
  if (imageSliderInterval !== null) {
    clearInterval(imageSliderInterval);
    imageSliderInterval = null;
  }
}

function renderCurrentImage(place) {
  if (!place.images || place.images.length === 0) {
    placeImage.src = "";
    placeImage.alt = place.name;
    imageDots.innerHTML = "";
    return;
  }

  placeImage.src = place.images[currentImageIndex];
  placeImage.alt = `${place.name} Bild ${currentImageIndex + 1}`;

  renderImageDots(place.images.length);
}

function renderImageDots(imageCount) {
  imageDots.innerHTML = "";

  for (let i = 0; i < imageCount; i++) {
    const dot = document.createElement("button");
    dot.classList.add("image-dot");

    if (i === currentImageIndex) {
      dot.classList.add("active");
    }

    dot.setAttribute("aria-label", `Bild ${i + 1} anzeigen`);

    dot.addEventListener("click", (event) => {
      event.stopPropagation();

      const currentPlace = places[currentIndex];
      currentImageIndex = i;
      renderCurrentImage(currentPlace);
    });

    imageDots.appendChild(dot);
  }
}

function startDrag(event) {
  isDragging = true;
  startX = event.clientX;
  currentX = event.clientX;

  card.classList.add("dragging");
  card.setPointerCapture(event.pointerId);
}

function dragCard(event) {
  if (!isDragging) {
    return;
  }

  currentX = event.clientX;
  moveX = currentX - startX;

  const rotate = moveX / 18;

  card.style.transform = `translateX(${moveX}px) rotate(${rotate}deg)`;

  updateSwipeFeedback(moveX);
}

function endDrag() {
  if (!isDragging) {
    return;
  }

  isDragging = false;
  card.classList.remove("dragging");

  if (moveX > swipeThreshold) {
    swipeCard("right");
    return;
  }

  if (moveX < -swipeThreshold) {
    swipeCard("left");
    return;
  }

  resetCardPosition();
}

function updateSwipeFeedback(distance) {
  card.classList.remove("swipe-like", "swipe-dislike");

  if (distance > 60) {
    card.classList.add("swipe-like");
  }

  if (distance < -60) {
    card.classList.add("swipe-dislike");
  }
}

function swipeCard(direction) {
  stopImageSlider();

  card.classList.remove("swipe-like", "swipe-dislike");

  if (direction === "right") {
    likedPlaces.push(places[currentIndex]);
    card.classList.add("swipe-out-right");
  }

  if (direction === "left") {
    card.classList.add("swipe-out-left");
  }

  setTimeout(() => {
    goToNextPlace();
  }, 280);
}

function resetCardPosition() {
  moveX = 0;
  currentX = 0;
  startX = 0;
  isDragging = false;

  card.classList.remove(
    "dragging",
    "swipe-like",
    "swipe-dislike",
    "swipe-out-left",
    "swipe-out-right"
  );

  card.style.transform = "translateX(0) rotate(0deg)";
}

function goToNextPlace() {
  currentIndex++;

  if (currentIndex >= places.length) {
    createRoute();
    return;
  }

  renderCurrentPlace();
}

function createRoute() {
  stopImageSlider();

  showScreen(resultScreen);
  routeList.innerHTML = "";

  if (likedPlaces.length === 0) {
    selectedCount.textContent = "Keine Sehenswürdigkeit ausgewählt";
    startPoint.textContent = "Starte erneut und swipe mindestens eine Sehenswürdigkeit nach rechts.";
    totalRouteInfo.textContent = "";

    clearRouteMap();
    return;
  }

  const optimizedRoute = optimizeRoute(startLocation, likedPlaces);
  const routeStats = calculateRouteStats(startLocation, optimizedRoute);

  selectedCount.textContent = `${likedPlaces.length} Sehenswürdigkeit(en) ausgewählt`;
  startPoint.textContent = `Startpunkt: ${startLocation.name}`;
  totalRouteInfo.textContent =
    `Gesamtstrecke: ${routeStats.totalDistanceKm.toFixed(1)} km · ca. ${routeStats.totalWalkingMinutes} Min. zu Fuß`;

  routeStats.segments.forEach((segment, index) => {
    const routeItem = createRouteListItem(segment, index);
    routeList.appendChild(routeItem);
  });

  renderRouteMap(optimizedRoute);
}

function createRouteListItem(segment, index) {
  const templateContent = routeItemTemplate.content.cloneNode(true);

  const stepNumber = templateContent.querySelector(".route-step-number");
  const placeNameElement = templateContent.querySelector(".route-place-name");
  const placeCategoryElement = templateContent.querySelector(".route-place-category");
  const placeDistanceElement = templateContent.querySelector(".route-place-distance");

  stepNumber.textContent = index + 1;
  placeNameElement.textContent = segment.to.name;
  placeCategoryElement.textContent = segment.to.category;
  placeDistanceElement.textContent =
    `von ${segment.from.name}: ${segment.distanceKm.toFixed(1)} km · ca. ${segment.walkingMinutes} Min.`;

  return templateContent;
}

function optimizeRoute(start, selectedPlaces) {
  const remainingPlaces = [...selectedPlaces];
  const route = [];
  let currentPosition = start;

  while (remainingPlaces.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = calculateDistanceInKm(currentPosition, remainingPlaces[0]);

    for (let i = 1; i < remainingPlaces.length; i++) {
      const distance = calculateDistanceInKm(currentPosition, remainingPlaces[i]);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    const nextPlace = remainingPlaces.splice(nearestIndex, 1)[0];
    route.push(nextPlace);
    currentPosition = nextPlace;
  }

  return route;
}

function calculateDistanceInKm(pointA, pointB) {
  const earthRadiusKm = 6371;

  const latDistance = toRadians(pointB.lat - pointA.lat);
  const lngDistance = toRadians(pointB.lng - pointA.lng);

  const a =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(toRadians(pointA.lat)) *
      Math.cos(toRadians(pointB.lat)) *
      Math.sin(lngDistance / 2) *
      Math.sin(lngDistance / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function calculateRouteStats(start, routePlaces) {
  const walkingSpeedKmH = 4.8;
  const segments = [];

  let totalDistanceKm = 0;
  let currentPoint = start;

  routePlaces.forEach((place) => {
    const distanceKm = calculateDistanceInKm(currentPoint, place);
    const walkingMinutes = Math.round((distanceKm / walkingSpeedKmH) * 60);

    totalDistanceKm += distanceKm;

    segments.push({
      from: currentPoint,
      to: place,
      distanceKm: distanceKm,
      walkingMinutes: walkingMinutes
    });

    currentPoint = place;
  });

  const totalWalkingMinutes = Math.round((totalDistanceKm / walkingSpeedKmH) * 60);

  return {
    segments: segments,
    totalDistanceKm: totalDistanceKm,
    totalWalkingMinutes: totalWalkingMinutes
  };
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function renderRouteMap(routePlaces) {
  const mapElement = document.getElementById("route-map");

  if (!mapElement) {
    console.error("Das Element #route-map wurde nicht gefunden.");
    return;
  }

  if (!routeMap) {
    routeMap = L.map("route-map");
  }

  if (!routeTileLayer) {
    routeTileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    }).addTo(routeMap);
  }

  if (routeLayerGroup) {
    routeLayerGroup.clearLayers();
  } else {
    routeLayerGroup = L.layerGroup().addTo(routeMap);
  }

  const routePoints = [startLocation, ...routePlaces];
  const latLngs = routePoints.map((point) => [point.lat, point.lng]);

  routePoints.forEach((point, index) => {
    const markerLabel =
      index === 0 ? `Start: ${point.name}` : `${index}. ${point.name}`;

    L.marker([point.lat, point.lng])
      .addTo(routeLayerGroup)
      .bindPopup(markerLabel);
  });

  L.polyline(latLngs, {
    weight: 5,
    opacity: 0.85
  }).addTo(routeLayerGroup);

  routeMap.fitBounds(latLngs, {
    padding: [30, 30]
  });

  setTimeout(() => {
    routeMap.invalidateSize();
  }, 150);
}

function clearRouteMap() {
  if (routeLayerGroup) {
    routeLayerGroup.clearLayers();
  }

  if (routeMap) {
    routeMap.setView([startLocation.lat, startLocation.lng], 13);
  }
}

function showScreen(screenToShow) {
  startScreen.classList.remove("active");
  swipeScreen.classList.remove("active");
  resultScreen.classList.remove("active");

  screenToShow.classList.add("active");
}

function restartApp() {
  stopImageSlider();

  currentCity = null;
  places = [];
  currentIndex = 0;
  likedPlaces = [];
  routeList.innerHTML = "";

  selectedCount.textContent = "";
  startPoint.textContent = "";
  totalRouteInfo.textContent = "";

  progressBar.style.width = "0%";

  clearRouteMap();
  resetCardPosition();
  showScreen(startScreen);
}