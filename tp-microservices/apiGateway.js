// apiGateway.js
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { sendMessage } = require('./kafka-config');

// Charger les fichiers proto pour les films et les séries TV
const movieProtoPath = 'movie.proto';
const tvShowProtoPath = 'tvShow.proto';
const resolvers = require('./resolvers');
const typeDefs = require('./schema');

// Topics Kafka
const MOVIE_TOPIC = 'movies_topic';
const TVSHOW_TOPIC = 'tvshows_topic';

// Créer une nouvelle application Express
const app = express();

// Middleware pour parser le corps des requêtes
app.use(bodyParser.json());
app.use(cors());

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

const movieProtoDefinition = protoLoader.loadSync(movieProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const tvShowProtoDefinition = protoLoader.loadSync(tvShowProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const movieProto = grpc.loadPackageDefinition(movieProtoDefinition).movie;
const tvShowProto = grpc.loadPackageDefinition(tvShowProtoDefinition).tvShow;

// Créer une instance ApolloServer avec le schéma et les résolveurs importés
const server = new ApolloServer({ typeDefs, resolvers });

// Appliquer le middleware ApolloServer à l'application Express
server.start().then(() => {
    app.use(
        '/graphql',
        cors(),
        bodyParser.json(),
        expressMiddleware(server),
    );
});

// Endpoints REST pour les films
app.get('/movies', (req, res) => {
    const client = new movieProto.MovieService('localhost:50051',
        grpc.credentials.createInsecure());
    client.searchMovies({}, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(response.movies);
        }
    });
});

app.get('/movies/:id', (req, res) => {
    const client = new movieProto.MovieService('localhost:50051',
        grpc.credentials.createInsecure());
    const id = req.params.id;
    client.getMovie({ movie_id: id }, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(response.movie);
        }
    });
});

app.post('/movies', async (req, res) => {
    const movieData = req.body;
    const client = new movieProto.MovieService('localhost:50051',
        grpc.credentials.createInsecure());
    
    try {
        // Appeler le microservice de films via gRPC
        client.createMovie({ movie: movieData }, async (err, response) => {
            if (err) {
                console.error('Erreur lors de la création du film:', err);
                res.status(500).send({ error: err.message });
            } else {
                // Envoyer un message Kafka
                try {
                    await sendMessage(MOVIE_TOPIC, {
                        type: 'MOVIE_CREATED_VIA_REST',
                        data: movieData
                    });
                    console.log('Message Kafka envoyé pour la création du film');
                } catch (kafkaError) {
                    console.error('Erreur lors de l\'envoi du message Kafka:', kafkaError);
                    // Ne pas échouer la requête si l'envoi du message Kafka échoue
                }
                
                res.status(201).json({ 
                    message: 'Film créé avec succès', 
                    data: response.movie 
                });
            }
        });
    } catch (error) {
        console.error('Erreur non gérée:', error);
        res.status(500).send({ error: 'Erreur interne du serveur' });
    }
});

// Endpoints REST pour les séries TV
app.get('/tvshows', (req, res) => {
    const client = new tvShowProto.TVShowService('localhost:50052',
        grpc.credentials.createInsecure());
    client.searchTvshows({}, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(response.tv_shows);
        }
    });
});

app.get('/tvshows/:id', (req, res) => {
    const client = new tvShowProto.TVShowService('localhost:50052',
        grpc.credentials.createInsecure());
    const id = req.params.id;
    client.getTvshow({ tv_show_id: id }, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(response.tv_show);
        }
    });
});

app.post('/tvshows', async (req, res) => {
    const tvShowData = req.body;
    const client = new tvShowProto.TVShowService('localhost:50052',
        grpc.credentials.createInsecure());
    
    try {
        // Appeler le microservice de séries TV via gRPC
        client.createTvshow({ tv_show: tvShowData }, async (err, response) => {
            if (err) {
                console.error('Erreur lors de la création de la série TV:', err);
                res.status(500).send({ error: err.message });
            } else {
                // Envoyer un message Kafka
                try {
                    await sendMessage(TVSHOW_TOPIC, {
                        type: 'TVSHOW_CREATED_VIA_REST',
                        data: tvShowData
                    });
                    console.log('Message Kafka envoyé pour la création de la série TV');
                } catch (kafkaError) {
                    console.error('Erreur lors de l\'envoi du message Kafka:', kafkaError);
                    // Ne pas échouer la requête si l'envoi du message Kafka échoue
                }
                
                res.status(201).json({ 
                    message: 'Série TV créée avec succès', 
                    data: response.tv_show 
                });
            }
        });
    } catch (error) {
        console.error('Erreur non gérée:', error);
        res.status(500).send({ error: 'Erreur interne du serveur' });
    }
});

// Route racine pour servir l'interface utilisateur
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer l'application Express
const port = 3000;
app.listen(port, () => {
    console.log(`API Gateway en cours d'exécution sur le port ${port}`);
    console.log(`Interface utilisateur accessible à l'adresse http://localhost:${port}`);
    console.log(`API GraphQL accessible à l'adresse http://localhost:${port}/graphql`);
}); 