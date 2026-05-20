// ===== МИНИМАЛЬНАЯ ВЕРСИЯ ДЛЯ ТЕСТА ВХОДА ВОДИТЕЛЯ =====

// Страница входа водителя
if (window.location.pathname === '/login') {
    const form = document.getElementById('driverLoginForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Форма отправлена');
            
            // Любой логин и пароль подходят для теста
            localStorage.setItem('driverLoggedIn', 'true');
            window.location.href = '/driver-dashboard';
        });
    }
}

// Кабинет водителя
if (window.location.pathname === '/driver-dashboard') {
    console.log('Кабинет открыт');
    if (!localStorage.getItem('driverLoggedIn')) {
        window.location.href = '/login';
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = function() {
            localStorage.removeItem('driverLoggedIn');
        };
    }
    
    // Просто показываем, что кабинет работает
    const container = document.getElementById('ordersList');
    if (container) {
        container.innerHTML = '<div class="driver-no-orders">Тестовый кабинет работает</div>';
    }
}