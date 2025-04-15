// Constantes
const API_URL = 'http://localhost:3000';
const GRAPHQL_URL = `${API_URL}/graphql`;

// DOM Elements
const moviesList = document.getElementById('moviesList');
const tvShowsList = document.getElementById('tvShowsList');
const eventLog = document.getElementById('eventLog');

// Boutons pour récupérer les données
const fetchMoviesRESTBtn = document.getElementById('fetchMoviesREST');
const fetchMoviesGraphQLBtn = document.getElementById('fetchMoviesGraphQL');
const fetchTVShowsRESTBtn = document.getElementById('fetchTVShowsREST');
const fetchTVShowsGraphQLBtn = document.getElementById('fetchTVShowsGraphQL');

// Boutons pour créer des éléments
const createMovieRESTBtn = document.getElementById('createMovieREST');
const createMovieGraphQLBtn = document.getElementById('createMovieGraphQL');
const createTVShowRESTBtn = document.getElementById('createTVShowREST');
const createTVShowGraphQLBtn = document.getElementById('createTVShowGraphQL');

// Modals Bootstrap
const movieModal = new bootstrap.Modal(document.getElementById('createMovieModal'));
const tvShowModal = new bootstrap.Modal(document.getElementById('createTVShowModal'));
const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));

// Fonction pour ajouter un événement au journal
function logEvent(message, type = 'info') {
    const eventItem = document.createElement('div');
    eventItem.className = `event-item event-${type} fadeIn`;
    
    const timestamp = new Date().toLocaleTimeString();
    eventItem.innerHTML = `<span class="text-muted">${timestamp}</span> - ${message}`;
    
    // Ajouter l'événement au début du journal
    eventLog.insertBefore(eventItem, eventLog.firstChild);
    
    // Supprimer les événements anciens si le journal devient trop long
    if (eventLog.children.length > 50) {
        eventLog.removeChild(eventLog.lastChild);
    }
}

// Fonction pour créer un élément de liste
function createListItem(item, type) {
    const listItem = document.createElement('a');
    listItem.href = '#';
    listItem.className = 'list-group-item list-group-item-action fadeIn';
    listItem.innerHTML = `
        <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">${item.title}</h5>
            <small class="text-muted">ID: ${item.id}</small>
        </div>
        <p class="mb-1">${item.description}</p>
    `;
    
    // Ajouter un gestionnaire d'événements pour afficher les détails
    listItem.addEventListener('click', (e) => {
        e.preventDefault();
        showDetails(item, type);
    });
    
    return listItem;
}

// Fonction pour afficher les détails d'un élément
function showDetails(item, type) {
    const detailsContent = document.getElementById('detailsContent');
    const title = type === 'movie' ? 'Film' : 'Série TV';
    
    detailsContent.innerHTML = `
        <h4>${item.title}</h4>
        <p class="text-muted">ID: ${item.id}</p>
        <p>${item.description}</p>
        <div class="mt-3 text-muted">
            <small>Type: ${title}</small>
        </div>
    `;
    
    // Mettre à jour le titre du modal
    document.getElementById('detailsModalLabel').textContent = `Détails du ${title}`;
    
    // Afficher le modal
    detailsModal.show();
}

// Fonction pour récupérer les films via REST
async function fetchMoviesREST() {
    try {
        logEvent('Récupération des films via REST...', 'rest');
        const response = await fetch(`${API_URL}/movies`);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const movies = await response.json();
        displayMovies(movies);
        logEvent(`${movies.length} films récupérés avec succès via REST`, 'rest');
    } catch (error) {
        logEvent(`Erreur lors de la récupération des films: ${error.message}`, 'error');
        console.error('Erreur:', error);
    }
}

// Fonction pour récupérer les films via GraphQL
async function fetchMoviesGraphQL() {
    try {
        logEvent('Récupération des films via GraphQL...', 'graphql');
        const query = `
            query {
                movies {
                    id
                    title
                    description
                }
            }
        `;
        
        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.errors) {
            throw new Error(result.errors[0].message);
        }
        
        const movies = result.data.movies;
        displayMovies(movies);
        logEvent(`${movies.length} films récupérés avec succès via GraphQL`, 'graphql');
    } catch (error) {
        logEvent(`Erreur lors de la récupération des films: ${error.message}`, 'error');
        console.error('Erreur:', error);
    }
}

// Fonction pour récupérer les séries TV via REST
async function fetchTVShowsREST() {
    try {
        logEvent('Récupération des séries TV via REST...', 'rest');
        const response = await fetch(`${API_URL}/tvshows`);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const tvShows = await response.json();
        displayTVShows(tvShows);
        logEvent(`${tvShows.length} séries TV récupérées avec succès via REST`, 'rest');
    } catch (error) {
        logEvent(`Erreur lors de la récupération des séries TV: ${error.message}`, 'error');
        console.error('Erreur:', error);
    }
}

// Fonction pour récupérer les séries TV via GraphQL
async function fetchTVShowsGraphQL() {
    try {
        logEvent('Récupération des séries TV via GraphQL...', 'graphql');
        const query = `
            query {
                tvShows {
                    id
                    title
                    description
                }
            }
        `;
        
        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.errors) {
            throw new Error(result.errors[0].message);
        }
        
        const tvShows = result.data.tvShows;
        displayTVShows(tvShows);
        logEvent(`${tvShows.length} séries TV récupérées avec succès via GraphQL`, 'graphql');
    } catch (error) {
        logEvent(`Erreur lors de la récupération des séries TV: ${error.message}`, 'error');
        console.error('Erreur:', error);
    }
}

// Fonction pour afficher les films
function displayMovies(movies) {
    moviesList.innerHTML = '';
    
    if (movies.length === 0) {
        moviesList.innerHTML = '<div class="text-center py-3 text-muted">Aucun film trouvé</div>';
        return;
    }
    
    movies.forEach(movie => {
        moviesList.appendChild(createListItem(movie, 'movie'));
    });
}

// Fonction pour afficher les séries TV
function displayTVShows(tvShows) {
    tvShowsList.innerHTML = '';
    
    if (tvShows.length === 0) {
        tvShowsList.innerHTML = '<div class="text-center py-3 text-muted">Aucune série TV trouvée</div>';
        return;
    }
    
    tvShows.forEach(tvShow => {
        tvShowsList.appendChild(createListItem(tvShow, 'tvshow'));
    });
}

// Fonction pour créer un film via REST
async function createMovieREST() {
    try {
        const id = document.getElementById('movieId').value;
        const title = document.getElementById('movieTitle').value;
        const description = document.getElementById('movieDescription').value;
        
        if (!id || !title || !description) {
            throw new Error('Tous les champs sont obligatoires');
        }
        
        const movieData = { id, title, description };
        
        logEvent(`Création d'un film via REST: "${title}"`, 'rest');
        
        const response = await fetch(`${API_URL}/movies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(movieData),
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        logEvent(`Film "${title}" créé avec succès via REST`, 'rest');
        movieModal.hide();
        clearMovieForm();
        
        // Récupérer la liste mise à jour des films
        fetchMoviesREST();
    } catch (error) {
        logEvent(`Erreur lors de la création du film: ${error.message}`, 'error');
        console.error('Erreur:', error);
    }
}

// Fonction pour créer un film via GraphQL
async function createMovieGraphQL() {
    try {
        const id = document.getElementById('movieId').value;
        const title = document.getElementById('movieTitle').value;
        const description = document.getElementById('movieDescription').value;
        
        if (!id || !title || !description) {
            throw new Error('Tous les champs sont obligatoires');
        }
        
        logEvent(`Création d'un film via GraphQL: "${title}"`, 'graphql');
        
        const mutation = `
            mutation {
                createMovie(input: {
                    id: "${id}",
                    title: "${title}",
                    description: "${description}"
                }) {
                    id
                    title
                    description
                }
            }
        `;
        
        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: mutation }),
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.errors) {
            throw new Error(result.errors[0].message);
        }
        
        logEvent(`Film "${title}" créé avec succès via GraphQL`, 'graphql');
        movieModal.hide();
        clearMovieForm();
        
        // Récupérer la liste mise à jour des films
        fetchMoviesGraphQL();
    } catch (error) {
        logEvent(`Erreur lors de la création du film: ${error.message}`, 'error');
        console.error('Erreur:', error);
    }
}

// Fonction pour créer une série TV via REST
async function createTVShowREST() {
    try {
        const id = document.getElementById('tvShowId').value;
        const title = document.getElementById('tvShowTitle').value;
        const description = document.getElementById('tvShowDescription').value;
        
        if (!id || !title || !description) {
            throw new Error('Tous les champs sont obligatoires');
        }
        
        const tvShowData = { id, title, description };
        
        logEvent(`Création d'une série TV via REST: "${title}"`, 'rest');
        
        const response = await fetch(`${API_URL}/tvshows`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tvShowData),
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        logEvent(`Série TV "${title}" créée avec succès via REST`, 'rest');
        tvShowModal.hide();
        clearTVShowForm();
        
        // Récupérer la liste mise à jour des séries TV
        fetchTVShowsREST();
    } catch (error) {
        logEvent(`Erreur lors de la création de la série TV: ${error.message}`, 'error');
        console.error('Erreur:', error);
    }
}

// Fonction pour créer une série TV via GraphQL
async function createTVShowGraphQL() {
    try {
        const id = document.getElementById('tvShowId').value;
        const title = document.getElementById('tvShowTitle').value;
        const description = document.getElementById('tvShowDescription').value;
        
        if (!id || !title || !description) {
            throw new Error('Tous les champs sont obligatoires');
        }
        
        logEvent(`Création d'une série TV via GraphQL: "${title}"`, 'graphql');
        
        const mutation = `
            mutation {
                createTVShow(input: {
                    id: "${id}",
                    title: "${title}",
                    description: "${description}"
                }) {
                    id
                    title
                    description
                }
            }
        `;
        
        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: mutation }),
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.errors) {
            throw new Error(result.errors[0].message);
        }
        
        logEvent(`Série TV "${title}" créée avec succès via GraphQL`, 'graphql');
        tvShowModal.hide();
        clearTVShowForm();
        
        // Récupérer la liste mise à jour des séries TV
        fetchTVShowsGraphQL();
    } catch (error) {
        logEvent(`Erreur lors de la création de la série TV: ${error.message}`, 'error');
        console.error('Erreur:', error);
    }
}

// Fonction pour effacer le formulaire de film
function clearMovieForm() {
    document.getElementById('movieId').value = '';
    document.getElementById('movieTitle').value = '';
    document.getElementById('movieDescription').value = '';
}

// Fonction pour effacer le formulaire de série TV
function clearTVShowForm() {
    document.getElementById('tvShowId').value = '';
    document.getElementById('tvShowTitle').value = '';
    document.getElementById('tvShowDescription').value = '';
}

// Ajouter les gestionnaires d'événements
fetchMoviesRESTBtn.addEventListener('click', fetchMoviesREST);
fetchMoviesGraphQLBtn.addEventListener('click', fetchMoviesGraphQL);
fetchTVShowsRESTBtn.addEventListener('click', fetchTVShowsREST);
fetchTVShowsGraphQLBtn.addEventListener('click', fetchTVShowsGraphQL);

createMovieRESTBtn.addEventListener('click', createMovieREST);
createMovieGraphQLBtn.addEventListener('click', createMovieGraphQL);
createTVShowRESTBtn.addEventListener('click', createTVShowREST);
createTVShowGraphQLBtn.addEventListener('click', createTVShowGraphQL);

// Message de bienvenue dans le journal
logEvent('Application démarrée. Bienvenue!', 'info'); 