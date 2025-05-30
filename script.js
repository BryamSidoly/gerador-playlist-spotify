const CLIENT_ID = '9099b5f49bf54e6b8a55c63827d9f743';
const REDIRECT_URI = 'https://bryamsidoly.github.io/gerador-playlist-spotify/';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';

const generateBtn = document.getElementById("generate");
const playlistDiv = document.getElementById("playlist");

let accessToken = 'BQBe1FrWilhsQHQDHmysE1fegAdbCCocciqNBUvdGk2kQtP1RIdUviWm4WcV6J-dOLqQvdCJSDU3BDPGEF4pyhJTAk0n_jCIlodoZYaciYYU4tu50CrCUzRhOSpN4a3RJu3QN2HDpmY';

// Autenticação
window.onload = () => {
  /*
  const hash = window.location.hash;
  if (!accessToken && hash) {
    accessToken = new URLSearchParams(hash.substring(1)).get("access_token");
    console.log("Token recebido:", accessToken);
    window.history.replaceState(null, null, REDIRECT_URI);
  }
    */
  if (!accessToken) {
    window.location = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=user-read-private`;
  }
};

generateBtn.addEventListener("click", async () => {
  if (!accessToken) {
    alert("Você precisa estar autenticado no Spotify.");
    return;
  }

  const intensity = document.getElementById("intensity").value;
  const duration = parseInt(document.getElementById("duration").value);
  const energy = getEnergyFromIntensity(intensity);

  const seedGenres = "pop"; // gênero válido para o seed
  const limit = 10;

  const url = `https://api.spotify.com/v1/recommendations?seed_genres=${seedGenres}`;

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

      const error = await response.json();
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
