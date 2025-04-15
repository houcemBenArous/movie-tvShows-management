# Architecture de Microservices avec gRPC, REST, GraphQL et Kafka

Ce projet implémente une architecture de microservices pour gérer des données de films et de séries TV, en utilisant gRPC pour la communication inter-services, et en exposant des API REST et GraphQL via un API Gateway. Kafka est utilisé pour la communication asynchrone entre les services.

## Architecture

L'architecture se compose des éléments suivants :

1. **Microservice de Films** : Gère les données des films via gRPC
2. **Microservice de Séries TV** : Gère les données des séries TV via gRPC
3. **API Gateway** : Point d'entrée unique exposant :
   - API REST pour les films et séries TV
   - API GraphQL pour des requêtes plus flexibles
4. **Kafka** : Permet la communication événementielle entre les services

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

Ouvrez trois terminaux différents et exécutez chaque service dans l'ordre suivant :

### Terminal 1 - Microservice de Films

```bash
cd tp-microservices
node movieMicroservice.js
```

Vous devriez voir : "Microservice de films en cours d'exécution sur le port 50051"

### Terminal 2 - Microservice de Séries TV

```bash
cd tp-microservices
node tvShowMicroservice.js
```

Vous devriez voir : "Microservice de séries TV en cours d'exécution sur le port 50052"

### Terminal 3 - API Gateway

```bash
cd tp-microservices
node apiGateway.js
```

Vous devriez voir : "API Gateway en cours d'exécution sur le port 3000"

## Vérification du fonctionnement

Pour tester que tout fonctionne correctement, ouvrez votre navigateur ou utiliser curl :

- Pour les films via REST : http://localhost:3000/movies
- Pour les séries TV via REST : http://localhost:3000/tvshows
- Pour l'interface GraphQL : http://localhost:3000/graphql

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

## Intégration avec une base de données

Pour connecter ce projet à une base de données réelle :

1. Installez les dépendances appropriées pour votre base de données (ex: `mongoose` pour MongoDB)
2. Modifiez les microservices pour utiliser la base de données au lieu des tableaux en mémoire
3. Adaptez les modèles et requêtes selon votre schéma de base de données
