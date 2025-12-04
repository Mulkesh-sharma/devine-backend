// Using global fetch available in Node.js 18+

async function testChat() {
    try {
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Hello, how are you?',
                history: []
            }),
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data);

        if (data.success) {
            console.log('Test PASSED');
        } else {
            console.log('Test FAILED');
        }

    } catch (error) {
        console.error('Test Error:', error);
    }
}

testChat();
