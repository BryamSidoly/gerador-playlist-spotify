const CLIENT_ID = '9099b5f49bf54e6b8a55c63827d9f743';
const REDIRECT_URI = 'https://bryamsidoly.github.io/gerador-playlist-spotify/';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';

const generateBtn = document.getElementById("generate");
const playlistDiv = document.getElementById("playlist");
const genresContainer = document.getElementById("genres"); // div onde vamos criar os checkboxes

let accessToken = 'BQBe1FrWilhsQHQDHmysE1fegAdbCCocciqNBUvdGk2kQtP1RIdUviWm4WcV6J-dOLqQvdCJSDU3BDPGEF4pyhJTAk0n_jCIlodoZYaciYYU4tu50CrCUzRhOSpN4a3RJu3QN2HDpmY';

// 1. Autenticar com Spotify
window.onload = async () => {
  /*
  const hash = window.location.hash;
  if (!accessToken && hash.includes("access_token")) {
    accessToken = new URLSearchParams(hash.substring(1)).get("access_token");
    console.log("Token recebido:", accessToken);
    window.history.replaceState(null, null, REDIRECT_URI);
  }
*/
  if (!accessToken) {
    console.log("Redirecionando para login...");
    window.location = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=user-read-private`;
    return;
  }

  // Buscar gêneros disponíveis para seleção
  //await fetchAvailableGenres();
};

async function fetchAvailableGenres() {
  try {
    const res = await fetch("https://api.spotify.com/v1/recommendations/available-genre-seeds", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Erro ao buscar gêneros: ${res.status}`);
    }
    const data = await res.json();

    renderGenreCheckboxes(data.genres);
  } catch (error) {
    console.error("Erro ao buscar gêneros:", error);
    alert("Erro ao carregar gêneros. Tente recarregar a página.");
  }
}

function renderGenreCheckboxes(genres) {
  genresContainer.innerHTML = "<h3>Selecione gêneros para a playlist:</h3>";
  genres.forEach((genre) => {
    const checkbox = document.createElement("input");
    const id = `genre-${genre}`;
    checkbox.type = "checkbox";
    checkbox.name = "genre";
    checkbox.value = genre;
    checkbox.id = id;

    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.textContent = genre;

    genresContainer.appendChild(checkbox);
    genresContainer.appendChild(label);
  });
}


generateBtn.addEventListener("click", async () => {
  if (!accessToken) {
    alert("Você precisa estar autenticado no Spotify.");
    return;
  }

  const selectedGenres = Array.from(document.querySelectorAll('input[name="genre"]:checked')).map(el => el.value);
/*
  if (selectedGenres.length === 0) {
    alert("Selecione pelo menos um gênero.");
    return;
  }
*/
  const intensity = document.getElementById("intensity").value;
  const duration = parseInt(document.getElementById("duration").value);
  const energy = getEnergyFromIntensity(intensity);
  const limit = 10;
  const seeds = selectedGenres.slice(0, 5).join(',');
  const url = `https://api.spotify.com/v1/recommendations?limit=${limit}&market=BR&seed_genres=${seeds}&min_energy=${energy}&min_tempo=${energy * 100}&target_duration_ms=${Math.floor((duration * 60 * 1000) / limit)}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        alert("Sua sessão expirou. Vamos fazer login novamente.");
        window.location = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=user-read-private`;
        return;
      }

      let error = {};
      try {
        error = await response.json();
      } catch (e) {
        console.error('Erro ao interpretar JSON do erro:', e);
      }
      console.error("Erro da API Spotify:", error);
      alert("Erro ao buscar músicas. Verifique seu token ou tente novamente.");
      return;
    }

    const data = await response.json();

    if (!data.tracks || data.tracks.length === 0) {
      alert("Nenhuma música encontrada.");
      return;
    }

    showPlaylist(data.tracks);
  } catch (error) {
    console.error("Erro ao buscar músicas:", error);
    alert("Ocorreu um erro inesperado. Tente novamente.");
  }
});

function getEnergyFromIntensity(intensity) {
  switch (intensity) {
    case "baixa": return 0.3;
    case "media": return 0.6;
    case "alta": return 0.8;
    default: return 0.5;
  }
}

function showPlaylist(tracks) {
  playlistDiv.innerHTML = "<h2>Sua Playlist:</h2>";
  tracks.forEach(track => {
    const item = document.createElement("div");
    item.innerHTML = `
      <p><strong>${track.name}</strong> - ${track.artists[0].name}</p>
      ${track.preview_url ? `<audio controls src="${track.preview_url}"></audio>` : "<p>Prévia não disponível</p>"}
      <a href="${track.external_urls.spotify}" target="_blank">Ouvir no Spotify</a>
      <hr/>
    `;
    playlistDiv.appendChild(item);
  });
}
