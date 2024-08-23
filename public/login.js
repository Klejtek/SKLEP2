document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    console.log('Przycisk logowania kliknięty'); // Log diagnostyczny

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    console.log('Dane logowania:', { username, password }); // Log diagnostyczny

    if (username && password) {
        try {
            const response = await fetch('https://sklep2.onrender.com/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            console.log('Odpowiedź serwera:', response); // Logowanie odpowiedzi serwera

            const result = await response.json();
            console.log('Treść odpowiedzi serwera:', result); // Logowanie odpowiedzi w JSON

            if (response.ok && result.token) {
                console.log('Token otrzymany:', result.token); // Logowanie tokena
                localStorage.setItem('token', result.token);
                localStorage.setItem('username', username);
                alert('Zalogowano pomyślnie!');
                window.location.href = username === 'MKL' ? 'admin.html' : 'index.html';
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
