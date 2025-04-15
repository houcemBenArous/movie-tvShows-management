const { Level } = require('level');
const path = require('path');

// Créer une instance de LevelDB pour les films
const dbPath = path.join(__dirname, '../data/movies');
const db = new Level(dbPath, { valueEncoding: 'json' });

// Initialiser la base de données avec des données de démonstration
async function initializeDb() {
    try {
        // Vérifier si la base de données est vide
        let isEmpty = true;
        
        try {
            // Si cette opération ne génère pas d'erreur, la base de données n'est pas vide
            for await (const _ of db.keys({ limit: 1 })) {
                isEmpty = false;
                break;
            }
        } catch (err) {
            // Ignorer l'erreur si la base de données est vide
        }
        
        // Si la base de données est vide, l'initialiser avec des données de démonstration
        if (isEmpty) {
            console.log('Initialisation de la base de données films avec des données de démonstration');
            const initialMovies = [
                {
                    id: '1',
                    title: 'Exemple de film 1',
                    description: 'Ceci est le premier exemple de film.',
                },
                {
                    id: '2',
                    title: 'Exemple de film 2',
                    description: 'Ceci est le deuxième exemple de film.',
                },
            ];
            
            // Ajouter les films initiaux
            const batch = db.batch();
            for (const movie of initialMovies) {
                batch.put(movie.id, movie);
            }
            await batch.write();
        }
        
        console.log('Base de données films initialisée avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la base de données films:', error);
    }
}

// Méthodes CRUD pour les films
const movieDb = {
    // Récupérer un film par ID
    async getMovie(id) {
        try {
            return await db.get(id);
        } catch (error) {
            // Si le film n'existe pas, retourner null
            if (error.code === 'LEVEL_NOT_FOUND') {
                return null;
            }
            throw error;
        }
    },
    
    // Récupérer tous les films
    async getAllMovies() {
        const movies = [];
        for await (const [key, value] of db.iterator()) {
            movies.push(value);
        }
        return movies;
    },
    
    // Rechercher des films par requête
    async searchMovies(query) {
        if (!query) {
            return this.getAllMovies();
        }
        
        const movies = [];
        const lowerQuery = query.toLowerCase();
        
        for await (const [key, movie] of db.iterator()) {
            if (
                movie.title.toLowerCase().includes(lowerQuery) ||
                movie.description.toLowerCase().includes(lowerQuery)
            ) {
                movies.push(movie);
            }
        }
        
        return movies;
    },
    
    // Créer un nouveau film
    async createMovie(movie) {
        // Vérifier si le film existe déjà
        try {
            const existingMovie = await db.get(movie.id);
            if (existingMovie) {
                throw new Error('Un film avec cet ID existe déjà');
            }
        } catch (error) {
            // Si l'erreur est LEVEL_NOT_FOUND, le film n'existe pas encore, ce qui est bon
            if (error.code !== 'LEVEL_NOT_FOUND') {
                throw error;
            }
        }
        
        // Ajouter le film à la base de données
        await db.put(movie.id, movie);
        return movie;
    },
    
    // Mettre à jour un film existant
    async updateMovie(id, movieData) {
        // Vérifier si le film existe
        try {
            const existingMovie = await db.get(id);
            
            // Mettre à jour les propriétés du film
            const updatedMovie = { ...existingMovie, ...movieData, id };
            
            // Sauvegarder les modifications
            await db.put(id, updatedMovie);
            
            return updatedMovie;
        } catch (error) {
            if (error.code === 'LEVEL_NOT_FOUND') {
                throw new Error('Film non trouvé');
            }
            throw error;
        }
    },
    
    // Supprimer un film
    async deleteMovie(id) {
        // Vérifier si le film existe
        try {
            await db.get(id);
            
            // Supprimer le film
            await db.del(id);
            
            return true;
        } catch (error) {
            if (error.code === 'LEVEL_NOT_FOUND') {
                throw new Error('Film non trouvé');
            }
            throw error;
        }
    }
};

// Initialiser la base de données au démarrage
initializeDb();

module.exports = movieDb; 