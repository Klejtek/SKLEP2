document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    console.log('Przycisk logowania kliknięty'); // Log diagnostyczny

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    console.log('Dane logowania:', { username, password }); // Log diagnostyczny

    if (username && password) {
        try {
            const response = await fetch('https://sklep2.onrender.com/login', {  // Upewnij się, że domena jest poprawna
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }) // Zamień dane na JSON
            });

            console.log('Odpowiedź serwera:', response); // Logowanie odpowiedzi serwera

            if (!response.ok) {
                const errorMessage = await response.text();
                console.error('Błąd odpowiedzi serwera:', errorMessage); // Log błędu, jeśli odpowiedź nie jest poprawna
                alert('Błąd: ' + errorMessage);
                return;
            }

            const result = await response.json(); // Parsowanie odpowiedzi jako JSON
            console.log('Treść odpowiedzi serwera:', result); // Logowanie odpowiedzi w JSON

            if (result.token) {
                console.log('Token otrzymany:', result.token); // Logowanie tokena
                localStorage.setItem('token', result.token); // Zapisanie tokena
                localStorage.setItem('username', username); // Zapisanie nazwy użytkownika
                alert('Zalogowano pomyślnie!');
                window.location.href = username === 'MKL' ? 'admin.html' : 'index.html'; // Przekierowanie
            } else {
                alert(result.message || 'Nieprawidłowy login lub hasło!');
            }
        } catch (error) {
            console.error('Błąd podczas logowania:', error);
            alert('Wystąpił błąd podczas logowania.');
        }
    } else {
        alert('Proszę wprowadzić nazwę użytkownika i hasło.');
    }
});
