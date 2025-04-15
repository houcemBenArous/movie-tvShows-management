// tvShowMicroservice.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { sendMessage, createConsumer } = require('./kafka-config');
const tvShowDb = require('./db/tvshow-db');
const fs = require('fs');
const path = require('path');

// Créer les répertoires nécessaires pour les bases de données
const dataDir = path.join(__dirname, 'data');
const tvShowsDir = path.join(dataDir, 'tvshows');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
    console.log('Répertoire data créé');
}

if (!fs.existsSync(tvShowsDir)) {
    fs.mkdirSync(tvShowsDir);
    console.log('Répertoire data/tvshows créé');
}

// Charger le fichier tvShow.proto
const tvShowProtoPath = 'tvShow.proto';
const tvShowProtoDefinition = protoLoader.loadSync(tvShowProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const tvShowProto = grpc.loadPackageDefinition(tvShowProtoDefinition).tvShow;

// Topic Kafka pour les séries TV
const TVSHOW_TOPIC = 'tvshows_topic';

// Implémenter le service de séries TV
const tvShowService = {
    getTvshow: async (call, callback) => {
        try {
            const { tv_show_id } = call.request;
            // Récupérer les détails de la série TV à partir de la base de données
            const tvShow = await tvShowDb.getTVShow(tv_show_id);
            
            if (tvShow) {
                callback(null, { tv_show: tvShow });
            } else {
                // Si la série TV n'est pas trouvée, retourner un objet avec des valeurs par défaut
                callback(null, { 
                    tv_show: {
                        id: tv_show_id,
                        title: 'Série TV non trouvée',
                        description: 'Aucune série TV avec cet ID n\'a été trouvée.',
                    }
                });
            }
        } catch (error) {
            console.error('Erreur lors de la récupération de la série TV:', error);
            callback({
                code: grpc.status.INTERNAL,
                message: `Erreur serveur: ${error.message}`
            });
        }
    },
    
    searchTvshows: async (call, callback) => {
        try {
            const { query } = call.request;
            
            // Rechercher les séries TV en fonction de la requête
            const tvShows = await tvShowDb.searchTVShows(query);
            
            callback(null, { tv_shows: tvShows });
        } catch (error) {
            console.error('Erreur lors de la recherche de séries TV:', error);
            callback({
                code: grpc.status.INTERNAL,
                message: `Erreur serveur: ${error.message}`
            });
        }
    },
    
    // Ajouter une méthode pour créer une série TV
    createTvshow: async (call, callback) => {
        try {
            const newTVShow = call.request.tv_show;
            
            // Créer la nouvelle série TV dans la base de données
            const createdTVShow = await tvShowDb.createTVShow(newTVShow);
            
            // Envoyer un message Kafka pour informer les autres services
            sendMessage(TVSHOW_TOPIC, {
                type: 'TVSHOW_CREATED',
                data: createdTVShow
            });
            
            callback(null, { tv_show: createdTVShow });
        } catch (error) {
            console.error('Erreur lors de la création de la série TV:', error);
            
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
server.addService(tvShowProto.TVShowService.service, tvShowService);
const port = 50052;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(),
    (err, port) => {
        if (err) {
            console.error('Échec de la liaison du serveur:', err);
            return;
        }
        console.log(`Le serveur s'exécute sur le port ${port}`);
        server.start();
    });
console.log(`Microservice de séries TV en cours d'exécution sur le port ${port}`);

// Configurer le consommateur Kafka pour recevoir les messages des autres services
const startKafkaConsumer = async () => {
    try {
        const consumer = await createConsumer('tvshow-service-group', TVSHOW_TOPIC, async (message) => {
            console.log('Traitement du message Kafka:', message);
            
            // Traiter les différents types de messages
            switch (message.type) {
                case 'TVSHOW_UPDATE_REQUEST':
                    try {
                        // Logique pour mettre à jour une série TV
                        const { id, ...tvShowData } = message.data;
                        const updatedTVShow = await tvShowDb.updateTVShow(id, tvShowData);
                        console.log('Série TV mise à jour:', updatedTVShow);
                    } catch (error) {
                        console.error('Erreur lors de la mise à jour de la série TV:', error);
                    }
                    break;
                    
                case 'TVSHOW_DELETE_REQUEST':
                    try {
                        // Logique pour supprimer une série TV
                        const { id } = message.data;
                        await tvShowDb.deleteTVShow(id);
                        console.log('Série TV supprimée avec succès:', id);
                    } catch (error) {
                        console.error('Erreur lors de la suppression de la série TV:', error);
                    }
                    break;
                    
                default:
                    console.log('Type de message non pris en charge:', message.type);
            }
        });
        
        console.log('Consommateur Kafka démarré pour le microservice de séries TV');
    } catch (error) {
        console.error('Erreur lors du démarrage du consommateur Kafka:', error);
    }
};

// Démarrer le consommateur Kafka
startKafkaConsumer().catch(error => {
    console.error('Erreur lors de l\'initialisation du consommateur Kafka:', error);
}); 