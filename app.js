const startLocation = {
  name: "Hamburg Hauptbahnhof",
  lat: 53.5527,
  lng: 10.0069
};

let currentIndex = 0;
let likedPlaces = [];

const startScreen = document.getElementById("start-screen");
const swipeScreen = document.getElementById("swipe-screen");
const resultScreen = document.getElementById("result-screen");

const selectHamburgBtn = document.getElementById("select-hamburg-btn");
const likeBtn = document.getElementById("like-btn");
const dislikeBtn = document.getElementById("dislike-btn");
const restartBtn = document.getElementById("restart-btn");

const progressText = document.getElementById("progress-text");
const progressBar = document.getElementById("progress-bar");

const placeImage = document.getElementById("place-image");
const placeName = document.getElementById("place-name");
const placeDescription = document.getElementById("place-description");
const placeCategory = document.getElementById("place-category");

const resultSummary = document.getElementById("result-summary");
const routeList = document.getElementById("route-list");

selectHamburgBtn.addEventListener("click", startHamburg);
likeBtn.addEventListener("click", likeCurrentPlace);
dislikeBtn.addEventListener("click", dislikeCurrentPlace);
restartBtn.addEventListener("click", restartApp);

function startHamburg() {
  currentIndex = 0;
  likedPlaces = [];

  showScreen(swipeScreen);
  renderCurrentPlace();
}

function renderCurrentPlace() {
  const currentPlace = places[currentIndex];

  progressText.textContent = `${currentIndex + 1} von ${places.length} bewertet`;

  const progressPercent = ((currentIndex + 1) / places.length) * 100;
  progressBar.style.width = `${progressPercent}%`;

  placeImage.src = currentPlace.image;
  placeImage.alt = currentPlace.name;
  placeName.textContent = currentPlace.name;
  placeDescription.textContent = currentPlace.description;
  placeCategory.textContent = currentPlace.category;
}

function likeCurrentPlace() {
  likedPlaces.push(places[currentIndex]);
  goToNextPlace();
}

function dislikeCurrentPlace() {
  goToNextPlace();
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
  showScreen(resultScreen);
  routeList.innerHTML = "";

  if (likedPlaces.length === 0) {
    resultSummary.textContent =
      "Du hast keine Sehenswürdigkeit ausgewählt. Starte erneut und swipe mindestens eine Sehenswürdigkeit nach rechts.";
    return;
  }

  const optimizedRoute = optimizeRoute(startLocation, likedPlaces);

  resultSummary.textContent =
    `Du hast ${likedPlaces.length} Sehenswürdigkeit(en) ausgewählt. Startpunkt ist ${startLocation.name}.`;

  optimizedRoute.forEach((place) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${place.name} – ${place.category}`;
    routeList.appendChild(listItem);
  });
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

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function showScreen(screenToShow) {
  startScreen.classList.remove("active");
  swipeScreen.classList.remove("active");
  resultScreen.classList.remove("active");

  screenToShow.classList.add("active");
}

function restartApp() {
  currentIndex = 0;
  likedPlaces = [];
  routeList.innerHTML = "";
  resultSummary.textContent = "";

  showScreen(startScreen);
}