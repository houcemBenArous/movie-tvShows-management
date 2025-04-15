// movieMicroservice.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { sendMessage, createConsumer } = require('./kafka-config');

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

// Données de démonstration pour les films
const moviesDB = [
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

// Topic Kafka pour les films
const MOVIE_TOPIC = 'movies_topic';

// Implémenter le service movie
const movieService = {
    getMovie: (call, callback) => {
        const { movie_id } = call.request;
        // Récupérer les détails du film à partir de la base de données
        const movie = moviesDB.find(m => m.id === movie_id) || {
            id: movie_id,
            title: 'Film non trouvé',
            description: 'Aucun film avec cet ID n\'a été trouvé.',
        };
        
        callback(null, { movie });
    },
    searchMovies: (call, callback) => {
        const { query } = call.request;
        
        // Si une requête est fournie, filtrer les films en fonction de celle-ci
        let movies = moviesDB;
        if (query) {
            movies = moviesDB.filter(m => 
                m.title.toLowerCase().includes(query.toLowerCase()) || 
                m.description.toLowerCase().includes(query.toLowerCase())
            );
        }
        
        callback(null, { movies });
    },
    // Ajouter une méthode pour créer un film
    createMovie: (call, callback) => {
        const newMovie = call.request.movie;
        
        // Vérifier si l'ID existe déjà
        const existingMovie = moviesDB.find(m => m.id === newMovie.id);
        if (existingMovie) {
            callback(new Error('Un film avec cet ID existe déjà'), null);
            return;
        }
        
        // Ajouter le nouveau film à la base de données
        moviesDB.push(newMovie);
        
        // Envoyer un message Kafka pour informer les autres services
        sendMessage(MOVIE_TOPIC, {
            type: 'MOVIE_CREATED',
            data: newMovie
        });
        
        callback(null, { movie: newMovie });
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
        const consumer = await createConsumer('movie-service-group', MOVIE_TOPIC, (message) => {
            console.log('Traitement du message Kafka:', message);
            
            // Traiter les différents types de messages
            switch (message.type) {
                case 'MOVIE_UPDATE_REQUEST':
                    // Logique pour mettre à jour un film
                    console.log('Demande de mise à jour de film reçue:', message.data);
                    break;
                case 'MOVIE_DELETE_REQUEST':
                    // Logique pour supprimer un film
                    console.log('Demande de suppression de film reçue:', message.data);
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