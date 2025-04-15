// resolvers.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { sendMessage } = require('./kafka-config');

// Charger les fichiers proto pour les films et les séries TV
const movieProtoPath = 'movie.proto';
const tvShowProtoPath = 'tvShow.proto';
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

// Topics Kafka
const MOVIE_TOPIC = 'movies_topic';
const TVSHOW_TOPIC = 'tvshows_topic';

// Définir les résolveurs pour les requêtes GraphQL
const resolvers = {
    Query: {
        movie: (_, { id }) => {
            // Effectuer un appel gRPC au microservice de films
            const client = new movieProto.MovieService('localhost:50051',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.getMovie({ movie_id: id }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.movie);
                    }
                });
            });
        },
        movies: () => {
            // Effectuer un appel gRPC au microservice de films
            const client = new movieProto.MovieService('localhost:50051',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.searchMovies({}, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.movies);
                    }
                });
            });
        },
        tvShow: (_, { id }) => {
            // Effectuer un appel gRPC au microservice de séries TV
            const client = new tvShowProto.TVShowService('localhost:50052',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.getTvshow({ tv_show_id: id }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.tv_show);
                    }
                });
            });
        },
        tvShows: () => {
            // Effectuer un appel gRPC au microservice de séries TV
            const client = new tvShowProto.TVShowService('localhost:50052',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.searchTvshows({}, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.tv_shows);
                    }
                });
            });
        },
    },
    Mutation: {
        createMovie: (_, { input }) => {
            // Effectuer un appel gRPC au microservice de films pour créer un film
            const client = new movieProto.MovieService('localhost:50051',
                grpc.credentials.createInsecure());
            
            return new Promise((resolve, reject) => {
                client.createMovie({ movie: input }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        // Publier un événement Kafka sur la création d'un film
                        sendMessage(MOVIE_TOPIC, {
                            type: 'MOVIE_CREATED_VIA_GRAPHQL',
                            data: response.movie
                        }).catch(error => {
                            console.error('Erreur lors de l\'envoi du message Kafka:', error);
                        });
                        
                        resolve(response.movie);
                    }
                });
            });
        },
        createTVShow: (_, { input }) => {
            // Effectuer un appel gRPC au microservice de séries TV pour créer une série TV
            const client = new tvShowProto.TVShowService('localhost:50052',
                grpc.credentials.createInsecure());
            
            return new Promise((resolve, reject) => {
                client.createTvshow({ tv_show: input }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        // Publier un événement Kafka sur la création d'une série TV
                        sendMessage(TVSHOW_TOPIC, {
                            type: 'TVSHOW_CREATED_VIA_GRAPHQL',
                            data: response.tv_show
                        }).catch(error => {
                            console.error('Erreur lors de l\'envoi du message Kafka:', error);
                        });
                        
                        resolve(response.tv_show);
                    }
                });
            });
        },
    },
};

module.exports = resolvers; 