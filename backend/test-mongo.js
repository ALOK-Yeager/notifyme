const mongoose = require('mongoose');

async function testMongoConnection() {
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/notification-system-test', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Successfully connected to MongoDB');

        // Test a simple operation
        const testCollection = mongoose.connection.db.collection('test');
        await testCollection.insertOne({ test: 'connection', timestamp: new Date() });
        console.log('✅ Successfully performed write operation');

        await mongoose.connection.close();
        console.log('✅ Connection closed successfully');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.error('Full error:', error);
    }
}

testMongoConnection();
