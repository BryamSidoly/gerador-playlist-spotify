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
    scope: 'user-read-private playlist-modify-public streaming user-modify-playback-state user-read-playback-state'
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
      window.history.replaceState({}, document.title, REDIRECT_URI);
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

  try {
    const query = 'top';
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10&market=BR`;

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
    const tracks = data.tracks.items;

    if (!tracks || tracks.length === 0) {
      alert("Nenhuma música encontrada.");
      return;
    }

    showPlaylist(tracks);
    createAndPlayPlaylist(tracks);
  } catch (error) {
    console.error("Erro ao buscar músicas:", error);
    alert("Ocorreu um erro inesperado. Tente novamente.");
  }
});

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

async function createAndPlayPlaylist(tracks) {
  // Criar uma nova playlist no perfil do usuário
  const userProfileRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const userData = await userProfileRes.json();

  const createPlaylistRes = await fetch(`https://api.spotify.com/v1/users/${userData.id}/playlists`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Recomendações de Treino',
      description: 'Playlist gerada automaticamente',
      public: true
    })
  });

  const playlist = await createPlaylistRes.json();
  const uris = tracks.map(track => track.uri);

  await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ uris })
  });

  // Iniciar a reprodução da playlist no dispositivo ativo do usuário
  await fetch("https://api.spotify.com/v1/me/player/play", {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ context_uri: playlist.uri })
  });
}
