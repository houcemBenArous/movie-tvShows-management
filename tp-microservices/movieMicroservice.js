// movieMicroservice.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { sendMessage, createConsumer } = require('./kafka-config');
const movieDb = require('./db/movie-db');
const fs = require('fs');
const path = require('path');

// Créer les répertoires nécessaires pour les bases de données
const dataDir = path.join(__dirname, 'data');
const moviesDir = path.join(dataDir, 'movies');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
    console.log('Répertoire data créé');
}

if (!fs.existsSync(moviesDir)) {
    fs.mkdirSync(moviesDir);
    console.log('Répertoire data/movies créé');
}

// Charger le fichier movie.proto
const movieProtoPath = 'movie.proto';
const movieProtoDefinition = protoLoader.loadSync(movieProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const movieProto = grpc.loadPackageDefinition(movieProtoDefinition).movie;

// Topic Kafka pour les films
const MOVIE_TOPIC = 'movies_topic';

// Implémenter le service movie
const movieService = {
    getMovie: async (call, callback) => {
        try {
            const { movie_id } = call.request;
            // Récupérer les détails du film à partir de la base de données
            const movie = await movieDb.getMovie(movie_id);
            
            if (movie) {
                callback(null, { movie });
            } else {
                // Si le film n'est pas trouvé, retourner un objet avec des valeurs par défaut
                callback(null, { 
                    movie: {
                        id: movie_id,
                        title: 'Film non trouvé',
                        description: 'Aucun film avec cet ID n\'a été trouvé.',
                    }
                });
            }
        } catch (error) {
            console.error('Erreur lors de la récupération du film:', error);
            callback({
                code: grpc.status.INTERNAL,
                message: `Erreur serveur: ${error.message}`
            });
        }
    },
    
    searchMovies: async (call, callback) => {
        try {
            const { query } = call.request;
            
            // Rechercher les films en fonction de la requête
            const movies = await movieDb.searchMovies(query);
            
            callback(null, { movies });
        } catch (error) {
            console.error('Erreur lors de la recherche de films:', error);
            callback({
                code: grpc.status.INTERNAL,
                message: `Erreur serveur: ${error.message}`
            });
        }
    },
    
    // Ajouter une méthode pour créer un film
    createMovie: async (call, callback) => {
        try {
            const newMovie = call.request.movie;
            
            // Créer le nouveau film dans la base de données
            const createdMovie = await movieDb.createMovie(newMovie);
            
            // Envoyer un message Kafka pour informer les autres services
            sendMessage(MOVIE_TOPIC, {
                type: 'MOVIE_CREATED',
                data: createdMovie
            });
            
            callback(null, { movie: createdMovie });
        } catch (error) {
            console.error('Erreur lors de la création du film:', error);
            
            if (error.message.includes('existe déjà')) {
                callback({
                    code: grpc.status.ALREADY_EXISTS,
                    message: error.message
                });
            } else {
                callback({
                    code: grpc.status.INTERNAL,
                    message: `Erreur serveur: ${error.message}`
                });
            }
        }
    }
};

// Créer et démarrer le serveur gRPC
const server = new grpc.Server();
server.addService(movieProto.MovieService.service, movieService);
const port = 50051;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(),
    (err, port) => {
        if (err) {
            console.error('Échec de la liaison du serveur:', err);
            return;
        }
        console.log(`Le serveur s'exécute sur le port ${port}`);
        server.start();
    });
console.log(`Microservice de films en cours d'exécution sur le port ${port}`);

// Configurer le consommateur Kafka pour recevoir les messages des autres services
const startKafkaConsumer = async () => {
    try {
        const consumer = await createConsumer('movie-service-group', MOVIE_TOPIC, async (message) => {
            console.log('Traitement du message Kafka:', message);
            
            // Traiter les différents types de messages
            switch (message.type) {
                case 'MOVIE_UPDATE_REQUEST':
                    try {
                        // Logique pour mettre à jour un film
                        const { id, ...movieData } = message.data;
                        const updatedMovie = await movieDb.updateMovie(id, movieData);
                        console.log('Film mis à jour:', updatedMovie);
                    } catch (error) {
                        console.error('Erreur lors de la mise à jour du film:', error);
                    }
                    break;
                    
                case 'MOVIE_DELETE_REQUEST':
                    try {
                        // Logique pour supprimer un film
                        const { id } = message.data;
                        await movieDb.deleteMovie(id);
                        console.log('Film supprimé avec succès:', id);
                    } catch (error) {
                        console.error('Erreur lors de la suppression du film:', error);
                    }
                    break;
                    
                default:
                    console.log('Type de message non pris en charge:', message.type);
            }
        });
        
        console.log('Consommateur Kafka démarré pour le microservice de films');
    } catch (error) {
        console.error('Erreur lors du démarrage du consommateur Kafka:', error);
    }
};

// Démarrer le consommateur Kafka
startKafkaConsumer().catch(error => {
    console.error('Erreur lors de l\'initialisation du consommateur Kafka:', error);
}); 