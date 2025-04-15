// kafka-config.js
const { Kafka } = require('kafkajs');

// Configuration Kafka
const kafka = new Kafka({
    clientId: 'streaming-api',
    brokers: ['localhost:9092']
});

// Créer un producteur Kafka
const producer = kafka.producer();

// Fonction pour envoyer un message à un topic
const sendMessage = async (topic, message) => {
    try {
        await producer.connect();
        await producer.send({
            topic,
            messages: [{ value: JSON.stringify(message) }],
        });
        console.log(`Message envoyé au topic ${topic}`);
    } catch (error) {
        console.error(`Erreur lors de l'envoi du message au topic ${topic}:`, error);
    } finally {
        await producer.disconnect();
    }
};

// Créer un consommateur Kafka
const createConsumer = async (groupId, topic, callback) => {
    const consumer = kafka.consumer({ groupId });
    
    try {
        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: true });
        
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const value = JSON.parse(message.value.toString());
                console.log(`Message reçu du topic ${topic}:`, value);
                if (callback) {
                    callback(value);
                }
            },
        });
        
        console.log(`Consommateur connecté au topic ${topic}`);
        return consumer;
    } catch (error) {
        console.error(`Erreur lors de la connexion au topic ${topic}:`, error);
        throw error;
    }
};

module.exports = {
    kafka,
    producer,
    sendMessage,
    createConsumer
}; 