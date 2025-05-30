const CLIENT_ID = '9099b5f49bf54e6b8a55c63827d9f743';
const REDIRECT_URI = 'http://localhost:8000/'; 
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';

const generateBtn = document.getElementById("generate");
const playlistDiv = document.getElementById("playlist");

let accessToken = null;

// 1. Autenticar com Spotify
window.onload = () => {
  const hash = window.location.hash;
  if (!accessToken && hash) {
    accessToken = new URLSearchParams(hash.substring(1)).get("access_token");
    window.history.pushState("", "", REDIRECT_URI);
  } else if (!accessToken) {
    window.location = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=user-read-private`;
  }
};

generateBtn.addEventListener("click", async () => {
  const intensity = document.getElementById("intensity").value;
  const duration = parseInt(document.getElementById("duration").value);
  const energy = getEnergyFromIntensity(intensity);

  const seedGenres = "workout,dance,edm,hip-hop,pop"; // gêneros possíveis
  const limit = 10;

  const url = `https://api.spotify.com/v1/recommendations?limit=${limit}&market=BR&seed_genres=${seedGenres}&min_energy=${energy}&min_tempo=${energy * 100}&target_duration_ms=${(duration * 60 * 1000) / limit}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json();
  showPlaylist(data.tracks);
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
      <audio controls src="${track.preview_url}"></audio>
      <a href="${track.external_urls.spotify}" target="_blank">Ouvir no Spotify</a>
      <hr/>
    `;
    playlistDiv.appendChild(item);
  });
}
