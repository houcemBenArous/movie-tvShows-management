// schema.js
// Définir le schéma GraphQL
const typeDefs = `#graphql
type Movie {
    id: String!
    title: String!
    description: String!
}

type TVShow {
    id: String!
    title: String!
    description: String!
}

input MovieInput {
    id: String!
    title: String!
    description: String!
}

input TVShowInput {
    id: String!
    title: String!
    description: String!
}

type Query {
    movie(id: String!): Movie
    movies: [Movie]
    tvShow(id: String!): TVShow
    tvShows: [TVShow]
}

type Mutation {
    createMovie(input: MovieInput!): Movie
    createTVShow(input: TVShowInput!): TVShow
}
`;

module.exports = typeDefs; 