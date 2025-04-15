# Architecture de Microservices avec gRPC, REST, GraphQL et Kafka

Ce projet implémente une architecture de microservices pour gérer des données de films et de séries TV, en utilisant gRPC pour la communication inter-services, et en exposant des API REST et GraphQL via un API Gateway. Kafka est utilisé pour la communication asynchrone entre les services. Les données sont stockées de manière persistante avec LevelDB.

## Architecture

L'architecture se compose des éléments suivants :

1. **Microservice de Films** : Gère les données des films via gRPC et utilise LevelDB pour le stockage
2. **Microservice de Séries TV** : Gère les données des séries TV via gRPC et utilise LevelDB pour le stockage
3. **API Gateway** : Point d'entrée unique exposant :
   - API REST pour les films et séries TV
   - API GraphQL pour des requêtes plus flexibles
4. **Kafka** : Permet la communication événementielle entre les services
5. **Interface Utilisateur** : Une interface web interactive pour interagir avec les services
6. **LevelDB** : Base de données clé-valeur légère pour le stockage persistant des données

## Prérequis

- Node.js (v14+)
- Kafka & Zookeeper

## Installation

1. Clonez ce dépôt
2. Accédez au répertoire du projet et installez les dépendances :
   ```bash
   cd tp-microservices
   npm install
   ```
3. Assurez-vous que Kafka et Zookeeper sont en cours d'exécution
4. Créez les topics Kafka nécessaires :
   ```bash
   kafka-topics --create --partitions 1 --replication-factor 1 --topic movies_topic --bootstrap-server localhost:9092
   kafka-topics --create --partitions 1 --replication-factor 1 --topic tvshows_topic --bootstrap-server localhost:9092
   ```

## Démarrage des services

Vous pouvez démarrer tous les services en une seule commande avec :

```bash
npm run start:all
```

Ou démarrer chaque service individuellement dans différents terminaux :

### Terminal 1 - Microservice de Films

```bash
cd tp-microservices
npm run start:movie
```

Vous devriez voir : "Microservice de films en cours d'exécution sur le port 50051"

### Terminal 2 - Microservice de Séries TV

```bash
cd tp-microservices
npm run start:tvshow
```

Vous devriez voir : "Microservice de séries TV en cours d'exécution sur le port 50052"

### Terminal 3 - API Gateway

```bash
cd tp-microservices
npm run start:api
```

Vous devriez voir : "API Gateway en cours d'exécution sur le port 3000"

## Accès à l'application

Une fois tous les services démarrés, vous pouvez accéder à :

- **Interface utilisateur** : http://localhost:3000
- **API REST** : http://localhost:3000/movies et http://localhost:3000/tvshows
- **API GraphQL** : http://localhost:3000/graphql

## Stockage des données

Les données sont stockées de manière persistante à l'aide de LevelDB, ce qui offre plusieurs avantages :

- **Persistance** : Les données sont conservées même après un redémarrage des services
- **Performance** : LevelDB est une base de données clé-valeur légère et rapide
- **Simplicité** : Pas besoin d'installer un serveur de base de données séparé

Chaque microservice dispose de sa propre base de données LevelDB située dans le dossier `data/` :

- Films : `data/movies/`
- Séries TV : `data/tvshows/`

## Interface Utilisateur

L'interface utilisateur web offre les fonctionnalités suivantes :

- Visualisation des films et séries TV
- Ajout de nouveaux films et séries TV
- Choix entre l'API REST et GraphQL pour chaque opération
- Journal d'événements pour suivre les activités

Cette interface permet de démontrer visuellement comment les différentes parties de l'architecture communiquent entre elles.

## Utilisation des API

### API REST

#### Films

- **Obtenir tous les films** :

  ```
  GET http://localhost:3000/movies
  ```

- **Obtenir un film par ID** :

  ```
  GET http://localhost:3000/movies/{id}
  ```

- **Créer un film** :

  ```
  POST http://localhost:3000/movies
  Content-Type: application/json

  {
    "id": "3",
    "title": "Nouveau Film",
    "description": "Description du nouveau film"
  }
  ```

#### Séries TV

- **Obtenir toutes les séries TV** :

  ```
  GET http://localhost:3000/tvshows
  ```

- **Obtenir une série TV par ID** :

  ```
  GET http://localhost:3000/tvshows/{id}
  ```

- **Créer une série TV** :

  ```
  POST http://localhost:3000/tvshows
  Content-Type: application/json

  {
    "id": "3",
    "title": "Nouvelle Série TV",
    "description": "Description de la nouvelle série TV"
  }
  ```

### API GraphQL

L'API GraphQL est accessible à l'adresse : `http://localhost:3000/graphql`

#### Exemples de requêtes

- **Obtenir tous les films** :

  ```graphql
  query {
    movies {
      id
      title
      description
    }
  }
  ```

- **Obtenir un film par ID** :

  ```graphql
  query {
    movie(id: "1") {
      id
      title
      description
    }
  }
  ```

- **Créer un film** :

  ```graphql
  mutation {
    createMovie(
      input: {
        id: "4"
        title: "Film via GraphQL"
        description: "Film créé via GraphQL"
      }
    ) {
      id
      title
      description
    }
  }
  ```

- **Obtenir toutes les séries TV** :

  ```graphql
  query {
    tvShows {
      id
      title
      description
    }
  }
  ```

- **Obtenir une série TV par ID** :

  ```graphql
  query {
    tvShow(id: "1") {
      id
      title
      description
    }
  }
  ```

- **Créer une série TV** :
  ```graphql
  mutation {
    createTVShow(
      input: {
        id: "4"
        title: "Série TV via GraphQL"
        description: "Série TV créée via GraphQL"
      }
    ) {
      id
      title
      description
    }
  }
  ```

## Extension du projet

Pour étendre ce projet avec d'autres fonctionnalités ou bases de données :

1. **Utiliser une autre base de données** : Remplacez LevelDB par MongoDB, PostgreSQL ou toute autre base de données en modifiant les modules dans `db/`
2. **Ajouter d'autres microservices** : Créez de nouveaux services en suivant la même structure
3. **Améliorer l'interface utilisateur** : Enrichissez l'interface web avec plus de fonctionnalités interactives
