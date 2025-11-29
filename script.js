let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

document.getElementById("searchBtn").addEventListener("click", () => {
	const city = document.getElementById("searchInput").value.trim();
	if (city) getCoordinates(city);
});

document.getElementById("unitSelect").addEventListener("change", () => {
	const city = document.getElementById("locationName").textContent;
	if (city !== "—") getCoordinates(city);
});

async function getCoordinates(city) {
	try {
		const geoRes = await fetch(
			`https://geocoding-api.open-meteo.com/v1/search?name=${city}`
		);
		const geoData = await geoRes.json();
		
		if (!geoData.results) {
			alert("Location not found");
			return;
		}

		const { latitude, longitude, name, country } = geoData.results[0];

		getWeather(latitude, longitude, `${name}, ${country}`);

	} catch (err) {
		console.log(err);
	}
}

async function getWeather(lat, lon, locationName) {
	const unit = document.getElementById("unitSelect").value;
	const tempUnit = unit === "c" ? "celsius" : "fahrenheit";

	const url =
		`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
		`&current_weather=true` +
		`&hourly=temperature_2m,precipitation,relative_humidity_2m,wind_speed_10m` +
		`&daily=weathercode,temperature_2m_max,temperature_2m_min` +
		`&temperature_unit=${tempUnit}` +
		`&wind_speed_unit=kmh` +
		`&precipitation_unit=mm`;

	const weatherRes = await fetch(url);
	const data = await weatherRes.json();

	updateCurrent(data, locationName);
	updateWeekly(data);
	updateHourly(data);
}

function updateCurrent(data, locationName) {
	const current = data.current_weather;

	document.getElementById("locationName").textContent = locationName;

document.getElementById("locationName").innerHTML = 
	`${locationName} <button id="favBtn">★</button>`;
	document.getElementById("temperature").textContent = current.temperature + "°";
	document.getElementById("description").textContent = weatherCodeToText(current.weathercode);
	document.getElementById("weatherIcon").src = getWeatherIcon(current.weathercode);
	document.getElementById("feelsLike").textContent = current.temperature + "°";
	document.getElementById("humidity").textContent = data.hourly.relative_humidity_2m[0] + "%";
	document.getElementById("windSpeed").textContent = current.windspeed + " km/h";
	document.getElementById("precip").textContent = data.hourly.precipitation[0] + " mm";

document.getElementById("favBtn").addEventListener("click", () => {
	addToFavorites(locationName, data.latitude, data.longitude);
});
}

function updateWeekly(data) {
	const container = document.getElementById("weeklyForecast");
	container.innerHTML = "";

	data.daily.time.forEach((day, i) => {
		container.innerHTML += `
			<div class="forecast-item">
				<h4>${day}</h4>
				<img src="${getWeatherIcon(data.daily.weathercode[i])}">
				<p>${data.daily.temperature_2m_max[i]}° / ${data.daily.temperature_2m_min[i]}°</p>
			</div>
		`;
	});
}

function updateHourly(data) {
	const container = document.getElementById("hourlyForecast");
	container.innerHTML = "";

	for (let i = 0; i < 24; i++) {
		container.innerHTML += `
			<div class="hour-item">
				<p>${data.hourly.time[i].slice(11)}</p>
				<img src="${getWeatherIcon(data.hourly.weathercode ? data.hourly.weathercode[i] : 0)}">
				<p>${data.hourly.temperature_2m[i]}°</p>
			</div>
		`;
	}
}

/* Weather Code Descriptions */
function weatherCodeToText(code) {
	const map = {
		0: "Clear sky",
		1: "Mainly clear",
		2: "Partly cloudy",
		3: "Overcast",
		51: "Drizzle",
		61: "Rain",
		71: "Snow",
		95: "Thunderstorm"
	};
	return map[code] || "Unknown";
}

/* Weather Icons */
function getWeatherIcon(code) {
	if (code === 0) return "https://openweathermap.org/img/wn/01d.png";
	if (code <= 3) return "https://openweathermap.org/img/wn/02d.png";
	if (code >= 51 && code <= 67) return "https://openweathermap.org/img/wn/09d.png";
	if (code >= 80) return "https://openweathermap.org/img/wn/10d.png";
	if (code >= 95) return "https://openweathermap.org/img/wn/11d.png";
	return "https://openweathermap.org/img/wn/50d.png";
}

/* --- GEOLOCATION FEATURE --- */

function getUserLocation() {
	if ("geolocation" in navigator) {
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const lat = position.coords.latitude;
				const lon = position.coords.longitude;

				getWeather(lat, lon, "Your Location");
			},
			(error) => {
				console.log("Geolocation error:", error);
				alert("Unable to detect location. Please search manually.");
			}
		);
	} else {
		alert("Geolocation not supported on this device.");
	}
}

/* Auto-load on first visit */
window.onload = () => {
	getUserLocation();
};


function addToFavorites(locationName, lat, lon) {
	// Prevent duplicates
	if (favorites.some(fav => fav.name === locationName)) {
		alert("Location is already in favorites!");
		return;
	}

	favorites.push({ name: locationName, lat, lon });
	localStorage.setItem("favorites", JSON.stringify(favorites));
	displayFavorites();
}

function displayFavorites() {
	const list = document.getElementById("favoritesList");
	list.innerHTML = "";

	favorites.forEach(fav => {
		const item = document.createElement("div");
		item.classList.add("favorite-item");
		item.textContent = fav.name;

		// When tapped → load weather
		item.addEventListener("click", () => {
			getWeather(fav.lat, fav.lon, fav.name);
		});

		list.appendChild(item);
	});
}

window.onload = () => {
	displayFavorites();
	getUserLocation();  // Your geolocation function
};
