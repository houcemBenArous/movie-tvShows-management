const { Level } = require('level');
const path = require('path');

// Créer une instance de LevelDB pour les séries TV
const dbPath = path.join(__dirname, '../data/tvshows');
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
            console.log('Initialisation de la base de données séries TV avec des données de démonstration');
            const initialTVShows = [
                {
                    id: '1',
                    title: 'Exemple de série TV 1',
                    description: 'Ceci est le premier exemple de série TV.',
                },
                {
                    id: '2',
                    title: 'Exemple de série TV 2',
                    description: 'Ceci est le deuxième exemple de série TV.',
                },
            ];
            
            // Ajouter les séries TV initiales
            const batch = db.batch();
            for (const tvShow of initialTVShows) {
                batch.put(tvShow.id, tvShow);
            }
            await batch.write();
        }
        
        console.log('Base de données séries TV initialisée avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la base de données séries TV:', error);
    }
}

// Méthodes CRUD pour les séries TV
const tvShowDb = {
    // Récupérer une série TV par ID
    async getTVShow(id) {
        try {
            return await db.get(id);
        } catch (error) {
            // Si la série TV n'existe pas, retourner null
            if (error.code === 'LEVEL_NOT_FOUND') {
                return null;
            }
            throw error;
        }
    },
    
    // Récupérer toutes les séries TV
    async getAllTVShows() {
        const tvShows = [];
        for await (const [key, value] of db.iterator()) {
            tvShows.push(value);
        }
        return tvShows;
    },
    
    // Rechercher des séries TV par requête
    async searchTVShows(query) {
        if (!query) {
            return this.getAllTVShows();
        }
        
        const tvShows = [];
        const lowerQuery = query.toLowerCase();
        
        for await (const [key, tvShow] of db.iterator()) {
            if (
                tvShow.title.toLowerCase().includes(lowerQuery) ||
                tvShow.description.toLowerCase().includes(lowerQuery)
            ) {
                tvShows.push(tvShow);
            }
        }
        
        return tvShows;
    },
    
    // Créer une nouvelle série TV
    async createTVShow(tvShow) {
        // Vérifier si la série TV existe déjà
        try {
            const existingTVShow = await db.get(tvShow.id);
            if (existingTVShow) {
                throw new Error('Une série TV avec cet ID existe déjà');
            }
        } catch (error) {
            // Si l'erreur est LEVEL_NOT_FOUND, la série TV n'existe pas encore, ce qui est bon
            if (error.code !== 'LEVEL_NOT_FOUND') {
                throw error;
            }
        }
        
        // Ajouter la série TV à la base de données
        await db.put(tvShow.id, tvShow);
        return tvShow;
    },
    
    // Mettre à jour une série TV existante
    async updateTVShow(id, tvShowData) {
        // Vérifier si la série TV existe
        try {
            const existingTVShow = await db.get(id);
            
            // Mettre à jour les propriétés de la série TV
            const updatedTVShow = { ...existingTVShow, ...tvShowData, id };
            
            // Sauvegarder les modifications
            await db.put(id, updatedTVShow);
            
            return updatedTVShow;
        } catch (error) {
            if (error.code === 'LEVEL_NOT_FOUND') {
                throw new Error('Série TV non trouvée');
            }
            throw error;
        }
    },
    
    // Supprimer une série TV
    async deleteTVShow(id) {
        // Vérifier si la série TV existe
        try {
            await db.get(id);
            
            // Supprimer la série TV
            await db.del(id);
            
            return true;
        } catch (error) {
            if (error.code === 'LEVEL_NOT_FOUND') {
                throw new Error('Série TV non trouvée');
            }
            throw error;
        }
    }
};

// Initialiser la base de données au démarrage
initializeDb();

module.exports = tvShowDb; 