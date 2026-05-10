let map;
let dropoffMarker = null;

const centerLat = 59.9343;
const centerLon = 30.3351;

document.addEventListener('DOMContentLoaded', function() {
    map = L.map('map').setView([centerLat, centerLon], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'OpenStreetMap contributors'
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
        
        const address = await getAddressFromCoords(e.latlng.lat, e.latlng.lng);
        const dropoffInput = document.getElementById('orderDropoff');
        if (dropoffInput) dropoffInput.value = address;
    });
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

function searchAddress() {
    const query = document.getElementById('addressSearch').value;
    if (!query) return;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
        .then(response => response.json())
        .then(data => {
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
                document.getElementById('orderDropoff').value = query;
            } else {
                alert('Адрес не найден');
            }
        });
}

function makePhoneCall() {
    window.location.href = 'tel:+78121234567';
}

function openOrderForm() {
    document.getElementById('orderModal').style.display = 'flex';
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
}

function submitOrder() {
    const name = document.getElementById('orderName').value;
    const phone = document.getElementById('orderPhone').value;
    const pickup = document.getElementById('orderPickup').value;
    const dropoff = document.getElementById('orderDropoff').value;
    const tariff = document.getElementById('orderTariff').value;
    
    if (!name || !phone || !pickup || !dropoff) {
        alert('Заполните все поля');
        return;
    }
    
    let price = 250;
    if (tariff.includes('Эконом')) price = 250;
    if (tariff.includes('Комфорт')) price = 350;
    if (tariff.includes('Бизнес')) price = 500;
    
    const userId = localStorage.getItem('userId');
    const formData = new FormData();
    formData.append('pickup', pickup);
    formData.append('dropoff', dropoff);
    formData.append('tariff', tariff);
    formData.append('price', price);
    
    if (userId) {
        formData.append('user_id', userId);
    } else {
        formData.append('guest_name', name);
        formData.append('guest_phone', phone);
        formData.append('guest_email', '');
    }
    
    fetch('/save-order', { method: 'POST', body: formData });
    
    alert('ЗАКАЗ ОФОРМЛЕН');
    closeOrderModal();
    
    document.getElementById('orderName').value = '';
    document.getElementById('orderPhone').value = '';
    document.getElementById('orderPickup').value = '';
    document.getElementById('orderDropoff').value = '';
}

function openCommentModal() {
    document.getElementById('commentModal').style.display = 'flex';
}

function closeCommentModal() {
    document.getElementById('commentModal').style.display = 'none';
}

function sendComment() {
    const comment = document.getElementById('driverComment').value;
    if (comment) {
        alert('Комментарий отправлен');
        document.getElementById('driverComment').value = '';
        closeCommentModal();
    } else {
        alert('Введите комментарий');
    }
}

const userId = localStorage.getItem('userId');
const userName = localStorage.getItem('userName');
if (userId && userName) {
    document.getElementById('userNameHeader').innerHTML = userName + ' | <a href="/user-profile">Профиль</a> | <a href="/" onclick="localStorage.clear()">Выйти</a>';
}