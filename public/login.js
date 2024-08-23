document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username && password) {
        try {
            // Poprawiono błąd: brakujący otwierający apostrof w URL
            const response = await fetch('https://kuciapki.onrender.com/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }) // JSON.stringify wymaga poprawnego nawiasu zamykającego
            });

            const result = await response.json();
            if (response.ok && result.token) {
                localStorage.setItem('token', result.token);
                alert('Zalogowano jako ' + username);
                // Przekierowanie na stronę admina lub użytkownika
                window.location.href = username === 'MKL' ? 'admin.html' : 'index.html';
            } else {
                alert(result.message || 'Nieprawidłowy login lub hasło!');
            }
        } catch (error) {
            // Błąd obsługi błędów
            console.error('Błąd podczas logowania:', error);
            alert('Wystąpił błąd podczas logowania.');
        }
    } else {
        // Weryfikacja czy wszystkie pola zostały uzupełnione
        alert('Proszę wprowadzić zarówno nazwę użytkownika, jak i hasło.');
    }
});
