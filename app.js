const apiKey = '7a4ff594cd6f39f048b21fe49e5b1c17'; 

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherDiv = document.getElementById('weather');
const favoritesDiv = document.getElementById('favButtons');
const favoritesListContainer = document.getElementById('favoritesList');

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentCity = '';


function fetchWeather(city) {
  currentCity = city;
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`)
    .then(response => {
      if (!response.ok) throw new Error('City not found');
      return response.json();
    })
    .then(data => {
      displayWeather(data);
      setBackgroundAndBox(data.weather[0].main.toLowerCase());
      saveCityToHistory(city);

    })
    .catch(err => {
      alert(err.message);
    });
}

function saveCityToHistory(city) {
  let cityHistory = JSON.parse(localStorage.getItem('cityHistory')) || [];

  // Delete the doubles
  cityHistory = cityHistory.filter(c => c.toLowerCase() !== city.toLowerCase());

  // Put it on the top
  cityHistory.unshift(city);

  // Max 5
  if (cityHistory.length > 5) cityHistory.pop();

  localStorage.setItem('cityHistory', JSON.stringify(cityHistory));
}

function displayWeather(data) {
  const icon = data.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  const condition = data.weather[0].main.toLowerCase();
    
  //Time zone
  const sunriseUTC = data.sys.sunrise;
  const sunsetUTC = data.sys.sunset;
  const timezoneOffset = data.timezone;
  // We calculate local time by adding the zone difference
  const sunriseLocal = new Date((sunriseUTC + timezoneOffset) * 1000);
  const sunsetLocal = new Date((sunsetUTC + timezoneOffset) * 1000);
  // Time format with  digital hours and minutes
  const sunrise = sunriseLocal.toISOString().substr(11, 5);
  const sunset = sunsetLocal.toISOString().substr(11, 5);

  weatherDiv.className = `weather-box box-${condition}` || 'weather-box box-default';

  weatherDiv.innerHTML = `
  <div class="weather-header">
    <div class="temperature">${Math.round(data.main.temp)}°C</div>
    <img src="${iconUrl}" alt="${data.weather[0].description}" />
    <div class="city-name">${data.name}, ${data.sys.country}</div>
  </div>
  <p>Weather: ${data.weather[0].description}</p>
  <p>Humidity: ${data.main.humidity}%</p>
  <p>Wind: ${data.wind.speed} m/s</p>
  <p>Sunrise: ${sunrise}</p>
  <p>Sunset: ${sunset}</p>

  <button id="saveFavoriteBtn">Save as Favorite</button>
  <div id="forecast" class="forecast-container"></div> 
`;


  document.getElementById('saveFavoriteBtn').addEventListener('click', () => {
    addFavorite(data.name);
  });

  fetchForecast(data.name); // 5 day forecast

}

async function fetchForecast(city) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`);
    const data = await res.json();
    displayForecast(data);
  } catch (err) {
    console.error('Forecast error:', err);
  }
}

function displayForecast(data, city) {
  const forecastDiv = document.getElementById('forecast');
  forecastDiv.innerHTML = `<h3>5-Day Forecast</h3>`;

  const daily = {};

  data.list.forEach(entry => {
    const [date, time] = entry.dt_txt.split(' ');
    if (time === '12:00:00' && !daily[date]) {
      daily[date] = entry;
    }
  });

  Object.values(daily).forEach(entry => {
    const date = entry.dt_txt.split(' ')[0]; // YYYY-MM-DD
    const displayDate = new Date(entry.dt * 1000).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });

    const icon = entry.weather[0].icon;
    const temp = Math.round(entry.main.temp);
    const desc = entry.weather[0].main;

    const div = document.createElement('div');
    div.className = 'forecast-day';
    div.dataset.date = date;


  div.innerHTML = `
      <div>${displayDate}</div>
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}" />
      <div>${temp}°C</div>
      <div>${desc}</div>
  `;

div.addEventListener('click', () => {
  // If this div already has a panel open close it
  const existing = div.querySelector('.details-panel');
  if (existing) {
    existing.remove();
    return; // Dont reload
  }

  // Or close any other panel
  const openPanel = forecastDiv.querySelector('.details-panel');
  if (openPanel) openPanel.remove();

  // Create and build new panel
  const panel = document.createElement('div');
  panel.className = 'details-panel';
  panel.innerHTML = '<p>Loading...</p>';
  div.appendChild(panel);

  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(currentCity)}&appid=${apiKey}&units=metric`)
    .then(res => res.json())
    .then(data => {
      const dayEntries = data.list.filter(entry => entry.dt_txt.startsWith(date));
      panel.innerHTML = `<h4>Details for ${new Date(date).toDateString()}</h4>`;

      dayEntries.forEach(item => {
        const time = item.dt_txt.split(' ')[1].substring(0, 5);
        const icon = item.weather[0].icon;
        const temp = Math.round(item.main.temp);
        const desc = item.weather[0].description;

        panel.innerHTML += `
          <div class="detail-row">
            <strong>${time}</strong> 
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}" />
            ${temp}°C, ${desc}
          </div>
        `;
      });
    })
    .catch(err => {
      panel.innerHTML = `<p style="color:red;">Failed to load details</p>`;
      console.error(err);
    });
});



    forecastDiv.appendChild(div);
  });
}

function displayDayDetails(date, city) {
  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`)

    .then(res => res.json())
    .then(data => {
      const dayEntries = data.list.filter(entry => entry.dt_txt.startsWith(date));
      const container = document.getElementById('dayDetails');
      container.innerHTML = `<h3>Details for ${new Date(date).toDateString()}</h3>`;

      dayEntries.forEach(item => {
        const time = item.dt_txt.split(' ')[1].substring(0, 5); // HH:MM
        const icon = item.weather[0].icon;
        const temp = Math.round(item.main.temp);
        const desc = item.weather[0].description;

        container.innerHTML += `
          <div class="detail-row">
            <strong>${time}</strong> - 
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${desc}" />
            ${temp}°C, ${desc}
          </div>
        `;
      });
    });
}

function addFavorite(city) {
  if (!favorites.includes(city)) {
    favorites.push(city);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
  }
}

function removeFavorite(city) {
  favorites = favorites.filter(c => c !== city);
  localStorage.setItem('favorites', JSON.stringify(favorites));
  renderFavorites();
}

function renderFavorites() {
  favoritesDiv.innerHTML = '';
  if (favorites.length === 0) {
    favoritesDiv.innerHTML = '<p>No favorites added.</p>';
    favoritesListContainer.className = 'weather-box box-default';
    return;
  }
  favoritesListContainer.className = weatherDiv.className; // Sync favorite box color with current weather box

  favorites.forEach(city => {
    const btn = document.createElement('button');
    btn.className = 'fav-city-btn';
    btn.textContent = city;

    // Create remove 'x' button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'fav-remove-btn';
    removeBtn.textContent = '×';

    // Remove favorite on click of X
    removeBtn.addEventListener('click', e => {
      e.stopPropagation(); // prevent parent button click
      removeFavorite(city);
    });

    btn.appendChild(removeBtn);

    // Load weather on click of city button
    btn.addEventListener('click', () => {
      fetchWeather(city);
    });

    favoritesDiv.appendChild(btn);
  });
}

// Set background & box class based on weather condition
function setBackgroundAndBox(condition) {
  const body = document.body;
  switch(condition) {
    case 'clear':
      body.style.background = 'linear-gradient(135deg, #ffd3a0 0%, #ACB6E5 100%)';
      weatherDiv.className = 'weather-box box-clear';
      favoritesListContainer.className = 'weather-box box-clear';
      break;
    case 'rain':
      body.style.background = 'linear-gradient(to right, #00c6fb, #005bea)';
      weatherDiv.className = 'weather-box box-rain';
      favoritesListContainer.className = 'weather-box box-rain';
      break;
    case 'clouds':
      body.style.background = 'linear-gradient(to right, #bdc3c7, #2c3e50)';
      weatherDiv.className = 'weather-box box-clouds';
      favoritesListContainer.className = 'weather-box box-clouds';
      break;
    case 'snow':
      body.style.background = 'linear-gradient(to right, #83a4d4, #b6fbff)';
      weatherDiv.className = 'weather-box box-snow';
      favoritesListContainer.className = 'weather-box box-snow';
      break;
    case 'thunderstorm':
      body.style.background = 'linear-gradient(to right, #434343, #000000)';
      weatherDiv.className = 'weather-box box-thunderstorm';
      favoritesListContainer.className = 'weather-box box-thunderstorm';
      break;
    default:
      body.style.background = 'linear-gradient(135deg, #ffd3a0 0%, #ACB6E5 100%)';
      weatherDiv.className = 'weather-box box-default';
      favoritesListContainer.className = 'weather-box box-default';
  }

}

searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) {
    fetchWeather(city);
  }
});

cityInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    searchBtn.click();
  }
});

// On load, render favorites and optionally load first favorite's weather
renderFavorites();
if(favorites.length > 0) {
  fetchWeather(favorites[0]);
}

document.getElementById('geoBtn').addEventListener('click', () => {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        fetchWeatherByCoords(latitude, longitude);
      },
      error => {
        alert('Geolocation failed or denied.');
        console.error(error.message);
      }
    );
  } else {
    alert('Geolocation not supported by your browser.');
  }
});

const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Load from localStorage
if (localStorage.getItem('theme') === 'dark') {
  body.classList.add('dark-mode');
  themeToggle.textContent = '☀️ Light Mode';
}

themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  const isDark = body.classList.contains('dark-mode');

  themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}) 

const dropdown = document.getElementById('historyDropdown');

// Show dropdown on input focus
cityInput.addEventListener('focus', showCityHistory);

// Show dropdown when typing
cityInput.addEventListener('input', showCityHistory);

// Click outside to hide
document.addEventListener('click', (e) => {
  if (!cityInput.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.style.display = 'none';
  }
});

function showCityHistory() {
  const cityHistory = JSON.parse(localStorage.getItem('cityHistory')) || [];
  dropdown.innerHTML = '';

  if (cityHistory.length === 0) {
    dropdown.style.display = 'none';
    return;
  }

  cityHistory.forEach(city => {
    const item = document.createElement('div');
    const text = document.createElement('span');
    text.textContent = city;

    const removeBtn = document.createElement('span');
    removeBtn.textContent = '×';
    removeBtn.className = 'remove';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation(); 
      removeCityFromHistory(city);
      showCityHistory(); // Refresh the list
    });

    item.appendChild(text);
    item.appendChild(removeBtn);

    item.addEventListener('click', () => {
      cityInput.value = city;
      fetchWeather(city);
      dropdown.style.display = 'none'; // It closes after you select it
    });

    dropdown.appendChild(item);
  });

  dropdown.style.display = 'block';
}

function removeCityFromHistory(city) {
  let cityHistory = JSON.parse(localStorage.getItem('cityHistory')) || [];
  cityHistory = cityHistory.filter(c => c.toLowerCase() !== city.toLowerCase());
  localStorage.setItem('cityHistory', JSON.stringify(cityHistory));
}
