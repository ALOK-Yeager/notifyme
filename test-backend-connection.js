// Quick test script to verify backend connectivity
const testBackend = async () => {
    try {
        console.log('🔍 Testing backend connectivity...');

        // Test basic connection
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'testuser123',
                email: 'test123@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            })
        });

        const data = await response.json();
        console.log('📱 Backend Response:', response.status, data);

        if (response.ok) {
            console.log('✅ Backend is working! Token received:', data.token ? 'Yes' : 'No');
        } else {
            console.log('⚠️ Backend responded with error:', data.message);
        }

    } catch (error) {
        console.log('❌ Backend connection failed:', error.message);
        console.log('💡 Make sure your backend server is running on port 3000');
    }
};

testBackend();
