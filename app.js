const startLocation = {
  name: "Hamburg Hauptbahnhof",
  lat: 53.5527,
  lng: 10.0069
};

let currentIndex = 0;
let likedPlaces = [];

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

const selectHamburgBtn = document.getElementById("select-hamburg-btn");
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

const resultSummary = document.getElementById("result-summary");
const routeList = document.getElementById("route-list");

selectHamburgBtn.addEventListener("click", startHamburg);
likeBtn.addEventListener("click", () => swipeCard("right"));
dislikeBtn.addEventListener("click", () => swipeCard("left"));
restartBtn.addEventListener("click", restartApp);

card.addEventListener("pointerdown", startDrag);
card.addEventListener("pointermove", dragCard);
card.addEventListener("pointerup", endDrag);
card.addEventListener("pointerleave", endDrag);

function startHamburg() {
  currentIndex = 0;
  likedPlaces = [];

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
  stopImageSlider();

  currentIndex = 0;
  likedPlaces = [];
  routeList.innerHTML = "";
  resultSummary.textContent = "";
  progressBar.style.width = "0%";

  resetCardPosition();
  showScreen(startScreen);
}