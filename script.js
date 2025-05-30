const CLIENT_ID = '9099b5f49bf54e6b8a55c63827d9f743';
const REDIRECT_URI = 'https://bryamsidoly.github.io/gerador-playlist-spotify/';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

const generateBtn = document.getElementById("generate");
const playlistDiv = document.getElementById("playlist");
let accessToken = null;

function generateRandomString(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function redirectToSpotifyAuth() {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  localStorage.setItem('code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    scope: 'user-read-private'
  });

  window.location = `${SPOTIFY_AUTH_URL}?${params}`;
}

async function fetchAccessToken(code) {
  const codeVerifier = localStorage.getItem('code_verifier');

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  const data = await response.json();
  accessToken = data.access_token;
  return accessToken;
}

window.onload = async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  if (!code) {
    await redirectToSpotifyAuth();
  } else {
    try {
      await fetchAccessToken(code);
      window.history.replaceState({}, document.title, REDIRECT_URI); // Clean the URL
    } catch (e) {
      alert("Erro ao obter token de acesso. Tente novamente.");
      console.error(e);
    }
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

  const seedGenres = "pop";
  const limit = 10;

  const url = `https://api.spotify.com/v1/recommendations?limit=${limit}&market=BR&seed_genres=${seedGenres}&min_energy=${energy}&min_tempo=${energy * 150}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
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
