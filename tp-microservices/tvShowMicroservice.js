// tvShowMicroservice.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { sendMessage, createConsumer } = require('./kafka-config');

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

// Données de démonstration pour les séries TV
const tvShowsDB = [
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

// Topic Kafka pour les séries TV
const TVSHOW_TOPIC = 'tvshows_topic';

// Implémenter le service de séries TV
const tvShowService = {
    getTvshow: (call, callback) => {
        const { tv_show_id } = call.request;
        // Récupérer les détails de la série TV à partir de la base de données
        const tv_show = tvShowsDB.find(t => t.id === tv_show_id) || {
            id: tv_show_id,
            title: 'Série TV non trouvée',
            description: 'Aucune série TV avec cet ID n\'a été trouvée.',
        };
        
        callback(null, { tv_show });
    },
    searchTvshows: (call, callback) => {
        const { query } = call.request;
        
        // Si une requête est fournie, filtrer les séries TV en fonction de celle-ci
        let tv_shows = tvShowsDB;
        if (query) {
            tv_shows = tvShowsDB.filter(t => 
                t.title.toLowerCase().includes(query.toLowerCase()) || 
                t.description.toLowerCase().includes(query.toLowerCase())
            );
        }
        
        callback(null, { tv_shows });
    },
    // Ajouter une méthode pour créer une série TV
    createTvshow: (call, callback) => {
        const newTVShow = call.request.tv_show;
        
        // Vérifier si l'ID existe déjà
        const existingTVShow = tvShowsDB.find(t => t.id === newTVShow.id);
        if (existingTVShow) {
            callback(new Error('Une série TV avec cet ID existe déjà'), null);
            return;
        }
        
        // Ajouter la nouvelle série TV à la base de données
        tvShowsDB.push(newTVShow);
        
        // Envoyer un message Kafka pour informer les autres services
        sendMessage(TVSHOW_TOPIC, {
            type: 'TVSHOW_CREATED',
            data: newTVShow
        });
        
        callback(null, { tv_show: newTVShow });
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
        const consumer = await createConsumer('tvshow-service-group', TVSHOW_TOPIC, (message) => {
            console.log('Traitement du message Kafka:', message);
            
            // Traiter les différents types de messages
            switch (message.type) {
                case 'TVSHOW_UPDATE_REQUEST':
                    // Logique pour mettre à jour une série TV
                    console.log('Demande de mise à jour de série TV reçue:', message.data);
                    break;
                case 'TVSHOW_DELETE_REQUEST':
                    // Logique pour supprimer une série TV
                    console.log('Demande de suppression de série TV reçue:', message.data);
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