// ============ ГЛАВНАЯ СТРАНИЦА ============
if (window.location.pathname === '/') {
    let map;
    let pickupMarker = null;
    let dropoffMarker = null;
    let currentDropoff = null;
    const centerLat = 59.9343;
    const centerLon = 30.3351;
    
    map = L.map('map').setView([centerLat, centerLon], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    
    map.on('click', async function(e) {
        if (dropoffMarker) map.removeLayer(dropoffMarker);
        dropoffMarker = L.marker([e.latlng.lat, e.latlng.lng], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41]
            })
        }).addTo(map).bindPopup('Точка назначения').openPopup();
        currentDropoff = { lat: e.latlng.lat, lng: e.latlng.lng };
        const address = await getAddressFromCoords(e.latlng.lat, e.latlng.lng);
        document.getElementById('dropoffAddress').value = address;
    });
    
    async function getAddressFromCoords(lat, lng) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`);
            const data = await response.json();
            return data.display_name?.split(',')[0] || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        } catch (error) {
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
    }
    
    window.searchAddress = async function() {
        const query = document.getElementById('addressSearch').value;
        if (!query) return;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const data = await response.json();
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                map.setView([lat, lon], 15);
                if (dropoffMarker) map.removeLayer(dropoffMarker);
                dropoffMarker = L.marker([lat, lon], {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41]
                    })
                }).addTo(map).bindPopup('Точка назначения').openPopup();
                currentDropoff = { lat, lon };
                document.getElementById('dropoffAddress').value = query;
            } else {
                alert('Адрес не найден');
            }
        } catch (error) {
            console.error('Ошибка:', error);
        }
    };
    
    window.setCurrentLocation = function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                map.setView([lat, lng], 15);
                if (pickupMarker) map.removeLayer(pickupMarker);
                pickupMarker = L.marker([lat, lng], {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41]
                    })
                }).addTo(map).bindPopup('Вы здесь').openPopup();
                const address = await getAddressFromCoords(lat, lng);
                document.getElementById('pickupAddress').value = address;
            });
        }
    };
    
    window.orderTaxi = async function() {
        const pickup = document.getElementById('pickupAddress').value;
        const dropoff = document.getElementById('dropoffAddress').value;
        const tariffSelect = document.getElementById('tariffSelect');
        const tariff = tariffSelect.value;
        
        let tariffName = '';
        let pricePerKm = 0;
        if (tariff === 'econom') { tariffName = 'Эконом'; pricePerKm = 25; }
        if (tariff === 'comfort') { tariffName = 'Комфорт'; pricePerKm = 35; }
        if (tariff === 'business') { tariffName = 'Бизнес'; pricePerKm = 50; }
        
        if (!pickup || !dropoff) {
            alert('Укажите адрес отправления и назначения');
            return;
        }
        
        const estimatedPrice = pricePerKm * 10;
        const userId = localStorage.getItem('userId');
        
        const formData = new FormData();
        formData.append('pickup', pickup);
        formData.append('dropoff', dropoff);
        formData.append('tariff', tariffName);
        formData.append('price', estimatedPrice);
        
        if (userId) {
            formData.append('user_id', userId);
        } else {
            const guestName = document.getElementById('guestName').value;
            const guestPhone = document.getElementById('guestPhone').value;
            const guestEmail = document.getElementById('guestEmail').value;
            
            if (!guestName || !guestPhone || !guestEmail) {
                alert('Для гостевого заказа укажите имя, телефон и email');
                return;
            }
            
            formData.append('guest_name', guestName);
            formData.append('guest_phone', guestPhone);
            formData.append('guest_email', guestEmail);
        }
        
        await fetch('/save-order', { method: 'POST', body: formData });
        
        alert(`Заказ оформлен!\n\nТариф: ${tariffName}\nОткуда: ${pickup}\nКуда: ${dropoff}\nСтоимость: ${estimatedPrice} ₽\n\nОжидайте водителя`);
        
        document.getElementById('pickupAddress').value = '';
        document.getElementById('dropoffAddress').value = '';
        if (!userId) {
            document.getElementById('guestName').value = '';
            document.getElementById('guestPhone').value = '';
            document.getElementById('guestEmail').value = '';
        }
    };
    
    window.makePhoneCall = function() {
        window.location.href = 'tel:+78121234567';
    };
    
    window.openCommentModal = function() {
        document.getElementById('commentModal').style.display = 'flex';
    };
    
    window.closeCommentModal = function() {
        document.getElementById('commentModal').style.display = 'none';
    };
    
    window.sendComment = function() {
        const comment = document.getElementById('driverComment').value;
        if (comment) {
            alert(`Комментарий отправлен: "${comment}"`);
            document.getElementById('driverComment').value = '';
            closeCommentModal();
        }
    };
    
    document.getElementById('searchBtn').onclick = window.searchAddress;
    document.getElementById('myLocationBtn').onclick = window.setCurrentLocation;
    document.getElementById('orderBtn').onclick = window.orderTaxi;
    document.getElementById('phoneOrderBtn').onclick = window.makePhoneCall;
    document.getElementById('commentBtn').onclick = window.openCommentModal;
    document.getElementById('sendCommentBtn').onclick = window.sendComment;
    document.getElementById('closeCommentBtn').onclick = window.closeCommentModal;
    document.getElementById('driverLoginBtn').onclick = function() { window.location.href = '/login'; };
}

// ============ СТРАНИЦА ВОДИТЕЛЯ ============
if (window.location.pathname === '/driver-dashboard') {
    let isOnline = true;
    let earnings = 0;
    
    if (!localStorage.getItem('driverLoggedIn')) window.location.href = '/login';
    
    const statusBtn = document.getElementById('statusBtn');
    const earningsSpan = document.getElementById('earnings');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (statusBtn) {
        statusBtn.onclick = function() {
            isOnline = !isOnline;
            if (isOnline) {
                statusBtn.innerHTML = 'Онлайн';
                statusBtn.className = 'btn btn-success w-100';
            } else {
                statusBtn.innerHTML = 'Офлайн';
                statusBtn.className = 'btn btn-danger w-100';
            }
        };
    }
    
    if (logoutBtn) {
        logoutBtn.onclick = function() {
            localStorage.removeItem('driverLoggedIn');
        };
    }
    
    async function loadOrders() {
        const response = await fetch('/user-orders/all');
        if (response.ok) {
            const orders = await response.json();
            const container = document.getElementById('ordersList');
            if (orders.length === 0) {
                container.innerHTML = '<div class="alert alert-info">Нет новых заказов</div>';
                return;
            }
            let html = '';
            orders.forEach(order => {
                html += `
                    <div class="card mb-2">
                        <div class="card-body">
                            <div>Откуда: ${order.pickup} → Куда: ${order.dropoff}</div>
                            <div>Тариф: ${order.tariff} | Цена: ${order.price} ₽</div>
                            <button class="btn btn-sm btn-success mt-2" data-order-id="${order.id}">Принять заказ</button>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
            
            document.querySelectorAll('[data-order-id]').forEach(btn => {
                btn.onclick = function() {
                    earnings += 200;
                    earningsSpan.innerText = earnings + ' ₽';
                    alert('Заказ принят! Еду к пассажиру.');
                    loadOrders();
                };
            });
        }
    }
    
    loadOrders();
    setInterval(loadOrders, 5000);
}

// ============ ВХОД ПОЛЬЗОВАТЕЛЯ ============
if (window.location.pathname === '/login-user') {
    const form = document.getElementById('loginUserForm');
    if (form) {
        form.onsubmit = async function(e) {
            e.preventDefault();
            const formData = new FormData();
            formData.append('email', document.getElementById('email').value);
            formData.append('password', document.getElementById('password').value);
            
            const response = await fetch('/login-user', { method: 'POST', body: formData });
            const result = await response.json();
            
            if (result.success) {
                localStorage.setItem('userId', result.user_id);
                localStorage.setItem('userName', result.fullname);
                localStorage.setItem('userPhone', result.phone);
                localStorage.setItem('userEmail', result.email);
                localStorage.setItem('userLoggedIn', 'true');
                alert('Добро пожаловать, ' + result.fullname + '!');
                window.location.href = '/user-profile';
            } else {
                alert(result.error);
            }
        };
    }
}

// ============ РЕГИСТРАЦИЯ ============
if (window.location.pathname === '/register') {
    const form = document.getElementById('registerForm');
    if (form) {
        form.onsubmit = async function(e) {
            e.preventDefault();
            const formData = new FormData();
            formData.append('fullname', document.getElementById('fullname').value);
            formData.append('phone', document.getElementById('phone').value);
            formData.append('email', document.getElementById('email').value);
            formData.append('password', document.getElementById('password').value);
            
            const response = await fetch('/register', { method: 'POST', body: formData });
            if (response.redirected) {
                alert('Регистрация успешна! Войдите в аккаунт.');
                window.location.href = '/login-user';
            } else {
                alert('Пользователь с таким email уже существует');
            }
        };
    }
}

// ============ ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ ============
if (window.location.pathname === '/user-profile') {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    if (!userId) window.location.href = '/login-user';
    
    const fullnameSpan = document.getElementById('userFullname');
    const displaySpan = document.getElementById('userNameDisplay');
    const logoutBtn = document.getElementById('logoutUserBtn');
    
    if (fullnameSpan) fullnameSpan.innerText = userName;
    if (displaySpan) displaySpan.innerText = userName;
    
    if (logoutBtn) {
        logoutBtn.onclick = function() {
            localStorage.clear();
        };
    }
    
    async function loadOrders() {
        const response = await fetch('/user-orders/' + userId);
        const orders = await response.json();
        const container = document.getElementById('ordersHistory');
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="alert alert-info">У вас пока нет заказов</div>';
            return;
        }
        
        let html = '';
        orders.forEach(order => {
            html += `
                <div class="card mb-2">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6">
                                <small class="text-muted">${order.date}</small>
                                <div>Откуда: ${order.pickup}</div>
                                <div>Куда: ${order.dropoff}</div>
                            </div>
                            <div class="col-3">
                                <span class="badge bg-info">${order.tariff}</span>
                                <div>${order.price} ₽</div>
                            </div>
                            <div class="col-3">
                                <span class="badge bg-${order.status === 'Новый' ? 'warning' : 'success'}">${order.status}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
    
    loadOrders();
}

// ============ ВХОД ВОДИТЕЛЯ ============
if (window.location.pathname === '/login') {
    const form = document.getElementById('driverLoginForm');
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            const login = document.getElementById('driverLogin').value;
            const password = document.getElementById('driverPassword').value;
            
            if (login === 'driver' && password === '12345') {
                localStorage.setItem('driverLoggedIn', 'true');
                window.location.href = '/driver-dashboard';
            } else {
                alert('Неверный логин или пароль');
            }
        };
    }
}

// ============ АНКЕТА ============
if (window.location.pathname === '/application') {
    const form = document.getElementById('applicationForm');
    if (form) {
        form.onsubmit = async function(e) {
            e.preventDefault();
            const formData = new FormData();
            formData.append('fullname', document.getElementById('appFullname').value);
            formData.append('phone', document.getElementById('appPhone').value);
            formData.append('email', document.getElementById('appEmail').value);
            formData.append('role', document.getElementById('appRole').value);
            
            await fetch('/save-application', { method: 'POST', body: formData });
            alert('Спасибо! Мы свяжемся с вами.');
            window.location.href = '/login';
        };
    }
}