// VoyageX - Smart Travel App JavaScript

// ==================== CONFIG & STATE ====================
const CONFIG = {
    WEATHER_API_KEY: 'demo', // Using open-meteo.com (no key needed)
    UNSPLASH_API_KEY: 'demo', // For demo purposes
    defaultLocation: {
        lat: 13.0827,
        lng: 80.2707,
        name: 'Chennai, Tamil Nadu, IN'
    }
};

const STATE = {
    currentUser: null,
    currentPage: 'home',
    theme: localStorage.getItem('theme') || 'dark',
    userLocation: null,
    map: null,
    attractions: [],
    itineraries: [],
    bookings: [],
    rewards: {
        points: 0,
        badges: [],
        rank: 0
    }
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Check authentication
    const savedUser = localStorage.getItem('voyagex_user');
    if (savedUser) {
        STATE.currentUser = JSON.parse(savedUser);
        showApp();
        await loadUserData();
        await loadDashboardData();
    } else {
        showAuth();
    }
    
    // Apply theme
    if (STATE.theme === 'light') {
        document.body.classList.add('light-theme');
        document.getElementById('theme-icon').className = 'fas fa-sun';
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Get user location
    getUserLocation();
}

function setupEventListeners() {
    // Auth forms
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
    document.getElementById('forgot-form')?.addEventListener('submit', handleForgotPassword);
    
    // Global search
    document.getElementById('global-search')?.addEventListener('input', debounce(handleGlobalSearch, 300));
    
    // Map controls
    document.querySelectorAll('.map-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handleMapFilter(e.target.dataset.type));
    });
    
    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', (e) => handleFilterChange(e.target.dataset.category));
    });
    
    // Route modes
    document.querySelectorAll('.route-mode').forEach(mode => {
        mode.addEventListener('click', (e) => handleRouteModeChange(e.target.dataset.mode));
    });
}

// ==================== AUTHENTICATION ====================
function showAuth() {
    document.getElementById('auth-container').classList.add('active');
    document.getElementById('app-container').classList.remove('active');
}

function showApp() {
    document.getElementById('auth-container').classList.remove('active');
    document.getElementById('app-container').classList.add('active');
    
    if (STATE.currentUser) {
        document.getElementById('user-name').textContent = STATE.currentUser.name;
        document.getElementById('profile-name').textContent = STATE.currentUser.name;
        document.getElementById('profile-email').textContent = STATE.currentUser.email;
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.auth-screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

async function handleLogin(e) {
    e.preventDefault();
    showLoading(true);
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Simulate API call
    await sleep(1000);
    
    const user = {
        id: generateId(),
        name: 'Travel Enthusiast',
        email: email,
        phone: '+91 1234567890',
        createdAt: new Date().toISOString()
    };
    
    STATE.currentUser = user;
    localStorage.setItem('voyagex_user', JSON.stringify(user));
    
    showLoading(false);
    showToast('Welcome back! 🎉', 'success');
    showApp();
    await loadDashboardData();
}

async function handleRegister(e) {
    e.preventDefault();
    showLoading(true);
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    
    await sleep(1000);
    
    const user = {
        id: generateId(),
        name: name,
        email: email,
        phone: phone,
        createdAt: new Date().toISOString()
    };
    
    STATE.currentUser = user;
    localStorage.setItem('voyagex_user', JSON.stringify(user));
    
    showLoading(false);
    showToast('Account created successfully! 🎉', 'success');
    showApp();
    await loadDashboardData();
}

async function handleForgotPassword(e) {
    e.preventDefault();
    showLoading(true);
    
    await sleep(1000);
    
    showLoading(false);
    showToast('Reset link sent to your email! 📧', 'success');
    showScreen('login-screen');
}

// ==================== NAVIGATION ====================
function navigateTo(page) {
    // Update active page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`${page}-page`).classList.add('active');
    
    // Update bottom nav
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[onclick="navigateTo('${page}')"]`)?.classList.add('active');
    
    STATE.currentPage = page;
    
    // Load page-specific data
    loadPageData(page);
}

async function loadPageData(page) {
    switch(page) {
        case 'map':
            await initializeMap();
            break;
        case 'attractions':
            await loadAttractions();
            break;
        case 'itinerary':
            await loadItineraries();
            break;
        case 'rewards':
            await loadRewards();
            break;
        case 'community':
            await loadCommunityFeed();
            break;
        case 'emergency':
            await loadEmergencyServices();
            break;
        case 'journal':
            await loadJournal();
            break;
    }
}

// ==================== DASHBOARD ====================
async function loadDashboardData() {
    showLoading(true);
    
    try {
        // Load weather
        await loadWeather();
        
        // Load user stats
        loadUserStats();
        
        // Load daily tip
        loadDailyTip();
        
        // Load featured attractions
        await loadFeaturedAttractions();
        
        // Load suggested routes
        loadSuggestedRoutes();
        
        // Load nearby events
        await loadNearbyEvents();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Error loading dashboard data', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadWeather() {
    const location = STATE.userLocation || CONFIG.defaultLocation;
    
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current_weather=true&temperature_unit=celsius`
        );
        const data = await response.json();
        
        if (data.current_weather) {
            const temp = Math.round(data.current_weather.temperature);
            document.getElementById('current-temp').textContent = `${temp}°C`;
            document.getElementById('current-location').textContent = location.name;
        }
    } catch (error) {
        console.error('Weather error:', error);
        document.getElementById('current-temp').textContent = '28°C';
        document.getElementById('current-location').textContent = location.name;
    }
}

function loadUserStats() {
    // Load from localStorage or use defaults
    const stats = JSON.parse(localStorage.getItem('voyagex_stats') || '{}');
    
    document.getElementById('places-visited').textContent = stats.placesVisited || 12;
    document.getElementById('distance-traveled').textContent = `${stats.distance || 145} km`;
    document.getElementById('badges-earned').textContent = stats.badges || 8;
    document.getElementById('carbon-saved').textContent = `${stats.carbonSaved || 23} kg`;
}

function loadDailyTip() {
    const tips = [
        "Visit popular attractions early in the morning to avoid crowds and get the best lighting for photos!",
        "Download offline maps before your trip to navigate without internet connection.",
        "Try local street food - it's often the most authentic and delicious experience!",
        "Use eco-friendly transport options like walking or cycling to explore and reduce your carbon footprint.",
        "Book tickets online in advance to skip long queues at popular tourist spots.",
        "Learn a few basic phrases in the local language - locals appreciate the effort!",
        "Stay hydrated and carry a reusable water bottle to save money and reduce plastic waste.",
        "Check opening hours and weekly closures before visiting museums and attractions."
    ];
    
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    document.getElementById('daily-tip-text').textContent = randomTip;
}

async function loadFeaturedAttractions() {
    const container = document.getElementById('featured-attractions');
    
    // Sample attractions data with real-world landmarks
    const attractions = [
        {
            id: 1,
            name: 'Marina Beach',
            image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600',
            category: 'Beach',
            rating: 4.5,
            reviews: 2840,
            price: 'Free',
            description: 'One of the longest urban beaches in the world, perfect for evening walks.',
            distance: '2.3 km',
            crowd: 'High'
        },
        {
            id: 2,
            name: 'Kapaleeshwarar Temple',
            image: 'https://images.unsplash.com/photo-1609952048252-38605246e29a?w=600',
            category: 'Temple',
            rating: 4.7,
            reviews: 1920,
            price: 'Free',
            description: 'Ancient Dravidian architecture dedicated to Lord Shiva.',
            distance: '3.1 km',
            crowd: 'Moderate'
        },
        {
            id: 3,
            name: 'Government Museum',
            image: 'https://images.unsplash.com/photo-1566127444979-b3d2b3c42f9a?w=600',
            category: 'Museum',
            rating: 4.4,
            reviews: 1560,
            price: '₹50',
            description: 'Second oldest museum in India with rich archaeological collections.',
            distance: '4.5 km',
            crowd: 'Low'
        },
        {
            id: 4,
            name: 'Besant Nagar Beach',
            image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600',
            category: 'Beach',
            rating: 4.3,
            reviews: 980,
            price: 'Free',
            description: 'Popular beach with clean sands and food stalls.',
            distance: '5.2 km',
            crowd: 'Moderate'
        },
        {
            id: 5,
            name: 'Fort St. George',
            image: 'https://images.unsplash.com/photo-1574873786805-e552b6a3d0e1?w=600',
            category: 'Historical',
            rating: 4.6,
            reviews: 2100,
            price: '₹25',
            description: 'First English fortress in India, now houses museum.',
            distance: '1.8 km',
            crowd: 'Low'
        }
    ];
    
    STATE.attractions = attractions;
    
    container.innerHTML = attractions.map(attr => `
        <div class="attraction-card glass-effect" onclick="viewAttractionDetail(${attr.id})">
            <div style="position: relative;">
                <img src="${attr.image}" alt="${attr.name}" class="attraction-image">
                ${attr.crowd === 'High' ? '<span class="attraction-badge">Busy Now</span>' : ''}
            </div>
            <div class="attraction-content">
                <h3>${attr.name}</h3>
                <div class="attraction-meta">
                    <span><i class="fas fa-star" style="color: #feca57;"></i> ${attr.rating}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${attr.distance}</span>
                    <span><i class="fas fa-users"></i> ${attr.crowd}</span>
                </div>
                <p class="attraction-description">${attr.description}</p>
                <div class="attraction-footer">
                    <span class="price">${attr.price}</span>
                    <div class="attraction-actions">
                        <button class="icon-btn" onclick="event.stopPropagation(); toggleFavorite(${attr.id})">
                            <i class="far fa-heart"></i>
                        </button>
                        <button class="icon-btn" onclick="event.stopPropagation(); shareAttraction(${attr.id})">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function loadSuggestedRoutes() {
    const container = document.getElementById('suggested-routes');
    
    const routes = [
        {
            name: 'Heritage Walk',
            type: 'Walking',
            distance: '3.5 km',
            duration: '45 min',
            cost: 'Free',
            stops: 5,
            icon: 'fa-walking'
        },
        {
            name: 'Beach Circuit',
            type: 'Cycling',
            distance: '8.2 km',
            duration: '35 min',
            cost: 'Free',
            stops: 3,
            icon: 'fa-bicycle'
        },
        {
            name: 'Temple Tour',
            type: 'Metro + Walk',
            distance: '12 km',
            duration: '1h 20min',
            cost: '₹40',
            stops: 4,
            icon: 'fa-subway'
        }
    ];
    
    container.innerHTML = routes.map(route => `
        <div class="route-card glass-effect">
            <div class="route-header">
                <div class="route-icon">
                    <i class="fas ${route.icon}"></i>
                </div>
                <div class="route-info">
                    <h3>${route.name}</h3>
                    <p style="color: var(--text-secondary);">${route.type}</p>
                </div>
            </div>
            <div class="route-details">
                <div class="route-detail">
                    <span class="label">Distance</span>
                    <span class="value">${route.distance}</span>
                </div>
                <div class="route-detail">
                    <span class="label">Time</span>
                    <span class="value">${route.duration}</span>
                </div>
                <div class="route-detail">
                    <span class="label">Cost</span>
                    <span class="value">${route.cost}</span>
                </div>
            </div>
            <button class="btn btn-primary btn-glow full-width" onclick="navigateTo('routes')">
                <i class="fas fa-route"></i>
                <span>Start Route</span>
            </button>
        </div>
    `).join('');
}

async function loadNearbyEvents() {
    const container = document.getElementById('nearby-events');
    
    const events = [
        {
            day: 15,
            month: 'Feb',
            title: 'Chennai Music Festival',
            location: 'Music Academy',
            description: 'Classical Carnatic music performances',
            time: '6:00 PM'
        },
        {
            day: 18,
            month: 'Feb',
            title: 'Food Festival',
            location: 'Marina Beach',
            description: 'Street food from across Tamil Nadu',
            time: '5:00 PM'
        },
        {
            day: 22,
            month: 'Feb',
            title: 'Art Exhibition',
            location: 'Lalit Kala Akademi',
            description: 'Contemporary Indian art showcase',
            time: '10:00 AM'
        }
    ];
    
    container.innerHTML = events.map(event => `
        <div class="event-item glass-effect">
            <div class="event-date">
                <span class="event-day">${event.day}</span>
                <span class="event-month">${event.month}</span>
            </div>
            <div class="event-info">
                <h3>${event.title}</h3>
                <p>${event.description}</p>
                <span class="event-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${event.location} • ${event.time}
                </span>
            </div>
        </div>
    `).join('');
}

// ==================== MAP ====================
async function initializeMap() {
    if (STATE.map) return;
    
    const location = STATE.userLocation || CONFIG.defaultLocation;
    
    // Initialize Leaflet map
    STATE.map = L.map('map').setView([location.lat, location.lng], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(STATE.map);
    
    // Add user location marker
    L.marker([location.lat, location.lng])
        .addTo(STATE.map)
        .bindPopup('You are here')
        .openPopup();
    
    // Add attraction markers
    STATE.attractions.forEach(attr => {
        const randomLat = location.lat + (Math.random() - 0.5) * 0.05;
        const randomLng = location.lng + (Math.random() - 0.5) * 0.05;
        
        L.marker([randomLat, randomLng])
            .addTo(STATE.map)
            .bindPopup(`<strong>${attr.name}</strong><br>${attr.category}`);
    });
    
    // Load nearby transport
    loadNearbyTransport();
}

function loadNearbyTransport() {
    const container = document.getElementById('transport-list');
    
    const transport = [
        { type: 'Bus', number: '21C', destination: 'Central Station', eta: '5 min', icon: 'fa-bus' },
        { type: 'Metro', line: 'Blue Line', destination: 'Airport', eta: '8 min', icon: 'fa-subway' },
        { type: 'Bus', number: '45A', destination: 'Beach', eta: '12 min', icon: 'fa-bus' },
        { type: 'Train', number: 'EMU', destination: 'Beach', eta: '15 min', icon: 'fa-train' }
    ];
    
    container.innerHTML = transport.map(t => `
        <div class="transport-item">
            <div class="transport-icon">
                <i class="fas ${t.icon}"></i>
            </div>
            <div style="flex: 1;">
                <strong>${t.type} ${t.number}</strong>
                <p style="font-size: 13px; color: var(--text-secondary); margin-top: 3px;">
                    ${t.destination}
                </p>
            </div>
            <div style="text-align: right;">
                <span style="color: var(--success); font-weight: 600;">${t.eta}</span>
            </div>
        </div>
    `).join('');
}

function handleMapFilter(type) {
    document.querySelectorAll('.map-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.map-btn').classList.add('active');
    
    showToast(`Showing ${type} on map`, 'info');
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        showLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                STATE.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    name: 'Current Location'
                };
                
                if (STATE.map) {
                    STATE.map.setView([STATE.userLocation.lat, STATE.userLocation.lng], 15);
                }
                
                showLoading(false);
                showToast('Location updated', 'success');
            },
            (error) => {
                showLoading(false);
                showToast('Could not get location', 'error');
            }
        );
    }
}

// ==================== ATTRACTIONS ====================
async function loadAttractions() {
    const container = document.getElementById('attractions-grid');
    
    container.innerHTML = STATE.attractions.map(attr => `
        <div class="attraction-card glass-effect" onclick="viewAttractionDetail(${attr.id})">
            <div style="position: relative;">
                <img src="${attr.image}" alt="${attr.name}" class="attraction-image">
            </div>
            <div class="attraction-content">
                <h3>${attr.name}</h3>
                <div class="attraction-meta">
                    <span><i class="fas fa-star" style="color: #feca57;"></i> ${attr.rating}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${attr.distance}</span>
                </div>
                <p class="attraction-description">${attr.description}</p>
                <div class="attraction-footer">
                    <span class="price">${attr.price}</span>
                    <button class="btn btn-primary" onclick="event.stopPropagation(); viewAttractionDetail(${attr.id})">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function handleFilterChange(category) {
    document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
    event.target.classList.add('active');
    
    const filtered = category === 'all' 
        ? STATE.attractions 
        : STATE.attractions.filter(a => a.category.toLowerCase() === category);
    
    const container = document.getElementById('attractions-grid');
    container.innerHTML = filtered.map(attr => `
        <div class="attraction-card glass-effect" onclick="viewAttractionDetail(${attr.id})">
            <div style="position: relative;">
                <img src="${attr.image}" alt="${attr.name}" class="attraction-image">
            </div>
            <div class="attraction-content">
                <h3>${attr.name}</h3>
                <div class="attraction-meta">
                    <span><i class="fas fa-star" style="color: #feca57;"></i> ${attr.rating}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${attr.distance}</span>
                </div>
                <p class="attraction-description">${attr.description}</p>
                <div class="attraction-footer">
                    <span class="price">${attr.price}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function viewAttractionDetail(id) {
    const attraction = STATE.attractions.find(a => a.id === id);
    if (!attraction) return;
    
    // Update detail page
    document.getElementById('detail-hero').style.backgroundImage = `url(${attraction.image})`;
    document.getElementById('detail-title').textContent = attraction.name;
    document.getElementById('detail-rating').textContent = attraction.rating;
    document.getElementById('detail-reviews').textContent = `(${attraction.reviews} reviews)`;
    document.getElementById('detail-hours').textContent = '9:00 AM - 6:00 PM';
    document.getElementById('detail-price').textContent = attraction.price;
    document.getElementById('detail-crowd').textContent = attraction.crowd;
    document.getElementById('detail-distance').textContent = attraction.distance;
    document.getElementById('detail-description').textContent = attraction.description;
    
    // Add tags
    const tags = [attraction.category, 'Popular', 'Photo Spot'];
    document.getElementById('detail-tags').innerHTML = tags.map(tag => 
        `<span class="tag">${tag}</span>`
    ).join('');
    
    // Load reviews
    loadReviews();
    
    // Load peak chart
    loadPeakChart();
    
    // Navigate to detail page
    navigateTo('attraction-detail');
}

function loadReviews() {
    const reviews = [
        { user: 'Sarah M.', rating: 5, comment: 'Amazing place! Must visit.', time: '2 days ago' },
        { user: 'John D.', rating: 4, comment: 'Great experience, bit crowded.', time: '1 week ago' },
        { user: 'Priya K.', rating: 5, comment: 'Beautiful architecture!', time: '2 weeks ago' }
    ];
    
    document.getElementById('reviews-list').innerHTML = reviews.map(review => `
        <div style="padding: 15px 0; border-bottom: 1px solid var(--glass-border);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <strong>${review.user}</strong>
                <span style="color: #feca57;">${'★'.repeat(review.rating)}</span>
            </div>
            <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 5px;">${review.comment}</p>
            <span style="font-size: 12px; color: var(--text-muted);">${review.time}</span>
        </div>
    `).join('');
}

function loadPeakChart() {
    const hours = ['9AM', '11AM', '1PM', '3PM', '5PM'];
    const crowds = [30, 60, 85, 70, 40];
    
    const chart = hours.map((hour, i) => `
        <div style="text-align: center; margin-bottom: 10px;">
            <div style="height: 100px; display: flex; align-items: flex-end; justify-content: center;">
                <div style="width: 30px; background: var(--primary-gradient); height: ${crowds[i]}%; border-radius: 4px;"></div>
            </div>
            <span style="font-size: 12px; color: var(--text-secondary);">${hour}</span>
        </div>
    `).join('');
    
    document.getElementById('peak-chart').innerHTML = `
        <div style="display: flex; justify-content: space-between;">
            ${chart}
        </div>
    `;
}

// ==================== ROUTES ====================
function calculateRoute() {
    const start = document.getElementById('route-start').value;
    const end = document.getElementById('route-end').value;
    
    if (!start || !end) {
        showToast('Please enter both start and end locations', 'error');
        return;
    }
    
    showLoading(true);
    
    setTimeout(() => {
        const routes = [
            {
                mode: 'Metro + Walk',
                duration: '35 min',
                cost: '₹40',
                distance: '8.5 km',
                co2: '0.2 kg',
                steps: [
                    { type: 'walk', duration: '5 min', desc: 'Walk to Metro Station' },
                    { type: 'metro', duration: '25 min', desc: 'Blue Line to Central' },
                    { type: 'walk', duration: '5 min', desc: 'Walk to destination' }
                ]
            },
            {
                mode: 'Bus',
                duration: '50 min',
                cost: '₹20',
                distance: '9.2 km',
                co2: '0.5 kg',
                steps: [
                    { type: 'walk', duration: '3 min', desc: 'Walk to bus stop' },
                    { type: 'bus', duration: '45 min', desc: 'Bus 21C direct' },
                    { type: 'walk', duration: '2 min', desc: 'Walk to destination' }
                ]
            },
            {
                mode: 'Taxi',
                duration: '28 min',
                cost: '₹180',
                distance: '8.5 km',
                co2: '2.1 kg',
                steps: [
                    { type: 'taxi', duration: '28 min', desc: 'Direct ride' }
                ]
            }
        ];
        
        const container = document.getElementById('route-results');
        container.innerHTML = routes.map(route => `
            <div class="route-card glass-effect">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3>${route.mode}</h3>
                    <span class="price">${route.cost}</span>
                </div>
                <div class="route-details">
                    <div class="route-detail">
                        <span class="label">Duration</span>
                        <span class="value">${route.duration}</span>
                    </div>
                    <div class="route-detail">
                        <span class="label">Distance</span>
                        <span class="value">${route.distance}</span>
                    </div>
                    <div class="route-detail">
                        <span class="label">CO₂</span>
                        <span class="value">${route.co2}</span>
                    </div>
                </div>
                <div style="margin-top: 20px;">
                    ${route.steps.map(step => `
                        <div style="display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--glass-border);">
                            <i class="fas fa-${step.type === 'walk' ? 'walking' : step.type === 'metro' ? 'subway' : step.type === 'bus' ? 'bus' : 'taxi'}" 
                               style="color: var(--primary);"></i>
                            <div style="flex: 1;">
                                <div style="font-weight: 600;">${step.desc}</div>
                                <div style="font-size: 13px; color: var(--text-secondary);">${step.duration}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-primary btn-glow full-width" style="margin-top: 20px;">
                    <i class="fas fa-navigation"></i>
                    <span>Start Navigation</span>
                </button>
            </div>
        `).join('');
        
        showLoading(false);
    }, 1000);
}

function swapLocations() {
    const start = document.getElementById('route-start').value;
    const end = document.getElementById('route-end').value;
    document.getElementById('route-start').value = end;
    document.getElementById('route-end').value = start;
}

function useCurrentLocation(field) {
    if (STATE.userLocation) {
        document.getElementById(`route-${field}`).value = STATE.userLocation.name;
    } else {
        showToast('Getting your location...', 'info');
        getCurrentLocation();
    }
}

function handleRouteModeChange(mode) {
    document.querySelectorAll('.route-mode').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.route-mode').classList.add('active');
}

// ==================== ITINERARY ====================
async function loadItineraries() {
    const container = document.getElementById('itinerary-grid');
    
    const itineraries = [
        {
            id: 1,
            title: 'Chennai Heritage Trail',
            days: 1,
            places: 5,
            created: 'AI Generated',
            image: 'https://images.unsplash.com/photo-1609952048252-38605246e29a?w=400'
        },
        {
            id: 2,
            title: 'Beach Hopping',
            days: 1,
            places: 3,
            created: 'My Itinerary',
            image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400'
        },
        {
            id: 3,
            title: 'Foodie's Paradise',
            days: 2,
            places: 8,
            created: 'Community',
            image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400'
        }
    ];
    
    container.innerHTML = itineraries.map(itin => `
        <div class="itinerary-card">
            <img src="${itin.image}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 12px; margin-bottom: 15px;">
            <h3>${itin.title}</h3>
            <div style="display: flex; gap: 15px; margin: 15px 0; color: var(--text-secondary);">
                <span><i class="fas fa-calendar"></i> ${itin.days} Day${itin.days > 1 ? 's' : ''}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${itin.places} Places</span>
            </div>
            <span style="font-size: 13px; color: var(--primary);">${itin.created}</span>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn btn-primary full-width">View Details</button>
                <button class="icon-btn"><i class="fas fa-share-alt"></i></button>
            </div>
        </div>
    `).join('');
}

function createItinerary() {
    showToast('AI is creating your personalized itinerary...', 'info');
    setTimeout(() => {
        showToast('Itinerary created! 🎉', 'success');
        loadItineraries();
    }, 2000);
}

function addToItinerary() {
    showToast('Added to your itinerary! ✓', 'success');
}

// ==================== BOOKING ====================
function bookTicket() {
    navigateTo('booking');
    
    const details = document.getElementById('booking-details');
    details.innerHTML = `
        <div class="input-group floating-input" style="margin-bottom: 20px;">
            <input type="date" required>
            <label>Visit Date</label>
        </div>
        <div class="input-group floating-input" style="margin-bottom: 20px;">
            <input type="number" value="2" required>
            <label>Number of Tickets</label>
        </div>
        <div class="input-group floating-input">
            <input type="time" value="10:00" required>
            <label>Preferred Time</label>
        </div>
    `;
    
    const summary = document.getElementById('order-summary');
    summary.innerHTML = `
        <div style="padding: 15px 0; border-bottom: 1px solid var(--glass-border);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Adult Tickets (x2)</span>
                <span>₹40</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Service Fee</span>
                <span>₹10</span>
            </div>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 20px 0; font-size: 20px; font-weight: 700;">
            <span>Total</span>
            <span class="gradient-text">₹50</span>
        </div>
    `;
}

function confirmBooking() {
    showLoading(true);
    
    setTimeout(() => {
        showLoading(false);
        showToast('Booking confirmed! Check your email for tickets 🎫', 'success');
        
        // Add to booking history
        const historyItem = {
            id: generateId(),
            name: 'Marina Beach Visit',
            date: new Date().toISOString(),
            tickets: 2,
            amount: '₹50',
            qrCode: 'QR-' + generateId()
        };
        
        const bookings = JSON.parse(localStorage.getItem('voyagex_bookings') || '[]');
        bookings.unshift(historyItem);
        localStorage.setItem('voyagex_bookings', JSON.stringify(bookings));
        
        loadBookingHistory();
    }, 1500);
}

function loadBookingHistory() {
    const bookings = JSON.parse(localStorage.getItem('voyagex_bookings') || '[]');
    const container = document.getElementById('booking-history-list');
    
    if (bookings.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No bookings yet</p>';
        return;
    }
    
    container.innerHTML = bookings.map(booking => `
        <div class="glass-effect" style="padding: 20px; border-radius: 12px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3>${booking.name}</h3>
                    <p style="color: var(--text-secondary); margin: 8px 0;">${new Date(booking.date).toLocaleDateString()}</p>
                    <span style="color: var(--primary); font-weight: 600;">${booking.amount}</span>
                </div>
                <div style="text-align: right;">
                    <div style="width: 80px; height: 80px; background: var(--bg-tertiary); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px;">
                        ${booking.qrCode}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// ==================== REWARDS ====================
async function loadRewards() {
    // Load user points and rank
    const rewards = JSON.parse(localStorage.getItem('voyagex_rewards') || '{"points": 1250, "rank": 42, "streak": 7}');
    
    document.getElementById('total-points').textContent = rewards.points;
    document.getElementById('user-rank').textContent = `#${rewards.rank}`;
    document.getElementById('streak-days').textContent = rewards.streak;
    
    // Load badges
    const badges = [
        { id: 1, name: 'Explorer', icon: '🗺️', unlocked: true, desc: 'Visit 5 places' },
        { id: 2, name: 'Traveler', icon: '✈️', unlocked: true, desc: 'Travel 50km' },
        { id: 3, name: 'Eco Warrior', icon: '🌱', unlocked: true, desc: 'Save 20kg CO₂' },
        { id: 4, name: 'Social Star', icon: '⭐', unlocked: true, desc: 'Share 10 posts' },
        { id: 5, name: 'Early Bird', icon: '🌅', unlocked: false, desc: 'Visit at 6 AM' },
        { id: 6, name: 'Foodie', icon: '🍜', unlocked: false, desc: 'Try 15 restaurants' },
        { id: 7, name: 'Culture Buff', icon: '🎭', unlocked: false, desc: 'Visit 10 museums' },
        { id: 8, name: 'Marathon', icon: '🏃', unlocked: false, desc: 'Walk 100km' }
    ];
    
    const badgesGrid = document.getElementById('badges-grid');
    badgesGrid.innerHTML = badges.map(badge => `
        <div class="badge-item ${badge.unlocked ? '' : 'locked'}">
            <span class="badge-icon">${badge.icon}</span>
            <h4>${badge.name}</h4>
            <p style="font-size: 13px; color: var(--text-secondary); margin-top: 8px;">${badge.desc}</p>
        </div>
    `).join('');
    
    // Load leaderboard
    loadLeaderboard();
}

function loadLeaderboard() {
    const leaders = [
        { rank: 1, name: 'Alex Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex', points: 3420 },
        { rank: 2, name: 'Maria Garcia', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria', points: 2890 },
        { rank: 3, name: 'John Smith', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john', points: 2650 },
        { rank: 4, name: 'Priya Patel', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya', points: 2340 },
        { rank: 5, name: 'David Lee', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david', points: 2100 }
    ];
    
    const container = document.getElementById('leaderboard-list');
    container.innerHTML = leaders.map(leader => `
        <div class="leaderboard-item">
            <div class="leaderboard-rank">${leader.rank}</div>
            <img src="${leader.avatar}" class="leaderboard-avatar" alt="${leader.name}">
            <div class="leaderboard-info">
                <strong>${leader.name}</strong>
            </div>
            <div class="leaderboard-points">${leader.points.toLocaleString()}</div>
        </div>
    `).join('');
}

// ==================== COMMUNITY ====================
async function loadCommunityFeed() {
    const posts = [
        {
            author: 'Sarah Williams',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
            time: '2 hours ago',
            content: 'Just visited the amazing Kapaleeshwarar Temple! The architecture is breathtaking 🏛️',
            images: ['https://images.unsplash.com/photo-1609952048252-38605246e29a?w=400'],
            likes: 45,
            comments: 12
        },
        {
            author: 'Mike Johnson',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
            time: '5 hours ago',
            content: 'Best sunrise at Marina Beach! Started my day perfectly 🌅',
            images: ['https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400'],
            likes: 78,
            comments: 23
        },
        {
            author: 'Ananya Kumar',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ananya',
            time: '1 day ago',
            content: 'Tried authentic Chettinad cuisine today. Highly recommend! 🍛',
            images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400'],
            likes: 92,
            comments: 34
        }
    ];
    
    const container = document.getElementById('community-feed');
    container.innerHTML = posts.map(post => `
        <div class="post-card">
            <div class="post-header">
                <img src="${post.avatar}" class="post-avatar" alt="${post.author}">
                <div class="post-author">
                    <h4>${post.author}</h4>
                    <span class="post-time">${post.time}</span>
                </div>
            </div>
            <div class="post-content">
                <p>${post.content}</p>
            </div>
            <div class="post-images">
                ${post.images.map(img => `<img src="${img}" alt="Post image">`).join('')}
            </div>
            <div class="post-actions">
                <button class="post-action">
                    <i class="far fa-heart"></i>
                    <span>${post.likes}</span>
                </button>
                <button class="post-action">
                    <i class="far fa-comment"></i>
                    <span>${post.comments}</span>
                </button>
                <button class="post-action">
                    <i class="fas fa-share-alt"></i>
                    <span>Share</span>
                </button>
            </div>
        </div>
    `).join('');
}

function createPost() {
    showToast('Post created and shared with community! 📱', 'success');
}

// ==================== EMERGENCY ====================
async function loadEmergencyServices() {
    const hospitals = [
        { name: 'Apollo Hospital', distance: '2.1 km', phone: '044-28296000' },
        { name: 'Fortis Malar', distance: '3.4 km', phone: '044-42892222' },
        { name: 'MIOT Hospital', distance: '4.7 km', phone: '044-42002000' }
    ];
    
    const police = [
        { name: 'Anna Nagar Police', distance: '1.8 km', phone: '044-26162525' },
        { name: 'T Nagar Police', distance: '2.9 km', phone: '044-28342020' }
    ];
    
    document.getElementById('nearby-hospitals').innerHTML = hospitals.map(h => `
        <div style="padding: 12px; background: var(--bg-tertiary); border-radius: 8px; margin-bottom: 10px;">
            <strong>${h.name}</strong>
            <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 13px;">
                <span style="color: var(--text-secondary);">${h.distance}</span>
                <a href="tel:${h.phone}" style="color: var(--primary);">${h.phone}</a>
            </div>
        </div>
    `).join('');
    
    document.getElementById('nearby-police').innerHTML = police.map(p => `
        <div style="padding: 12px; background: var(--bg-tertiary); border-radius: 8px; margin-bottom: 10px;">
            <strong>${p.name}</strong>
            <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 13px;">
                <span style="color: var(--text-secondary);">${p.distance}</span>
                <a href="tel:${p.phone}" style="color: var(--primary);">${p.phone}</a>
            </div>
        </div>
    `).join('');
}

function triggerSOS() {
    if (confirm('Send emergency alert with your location to emergency contacts?')) {
        showLoading(true);
        
        setTimeout(() => {
            showLoading(false);
            showToast('Emergency alert sent! Help is on the way 🚨', 'success');
        }, 1500);
    }
}

// ==================== JOURNAL ====================
async function loadJournal() {
    const entries = [
        {
            id: 1,
            title: 'Amazing Day at Marina Beach',
            date: '2026-02-10',
            image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400',
            content: 'Watched the most beautiful sunset today...'
        },
        {
            id: 2,
            title: 'Temple Architecture Wonder',
            date: '2026-02-08',
            image: 'https://images.unsplash.com/photo-1609952048252-38605246e29a?w=400',
            content: 'The intricate carvings were mesmerizing...'
        }
    ];
    
    const container = document.getElementById('journal-grid');
    container.innerHTML = entries.map(entry => `
        <div class="journal-entry">
            <img src="${entry.image}" class="journal-image" alt="${entry.title}">
            <div class="journal-content">
                <span class="journal-date">${new Date(entry.date).toLocaleDateString()}</span>
                <h3>${entry.title}</h3>
                <p>${entry.content}</p>
            </div>
        </div>
    `).join('');
}

function createJournalEntry() {
    showToast('Journal entry created! ✍️', 'success');
}

// ==================== UTILITIES ====================
function toggleNotifications() {
    const panel = document.getElementById('notification-panel');
    panel.classList.toggle('active');
}

function toggleTheme() {
    STATE.theme = STATE.theme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('light-theme');
    
    const icon = document.getElementById('theme-icon');
    icon.className = STATE.theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    
    localStorage.setItem('theme', STATE.theme);
}

function toggleVoiceAssistant() {
    const panel = document.getElementById('voice-panel');
    panel.classList.toggle('active');
}

function startVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        showToast('Voice recognition not supported in this browser', 'error');
        return;
    }
    
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    
    recognition.onstart = () => {
        document.getElementById('voice-text').textContent = 'Listening...';
        document.getElementById('voice-btn').innerHTML = '<i class="fas fa-stop"></i><span>Stop</span>';
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('voice-text').textContent = `You said: "${transcript}"`;
        
        // Process voice command
        processVoiceCommand(transcript);
    };
    
    recognition.onerror = (event) => {
        document.getElementById('voice-text').textContent = 'Error: ' + event.error;
    };
    
    recognition.onend = () => {
        document.getElementById('voice-btn').innerHTML = '<i class="fas fa-microphone"></i><span>Start Listening</span>';
    };
    
    recognition.start();
}

function processVoiceCommand(command) {
    const lower = command.toLowerCase();
    
    if (lower.includes('restaurant') || lower.includes('food')) {
        navigateTo('attractions');
        showToast('Showing restaurants near you', 'info');
    } else if (lower.includes('route') || lower.includes('direction')) {
        navigateTo('routes');
        showToast('Opening route planner', 'info');
    } else if (lower.includes('map')) {
        navigateTo('map');
        showToast('Opening map', 'info');
    } else {
        showToast('Command not recognized. Try "Find restaurants near me"', 'info');
    }
}

function handleGlobalSearch(e) {
    const query = e.target.value.toLowerCase();
    if (query.length < 2) return;
    
    // Search through attractions
    const results = STATE.attractions.filter(a => 
        a.name.toLowerCase().includes(query) || 
        a.description.toLowerCase().includes(query)
    );
    
    if (results.length > 0) {
        console.log('Search results:', results);
        // Could show dropdown with results
    }
}

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                STATE.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    name: 'Your Location'
                };
            },
            (error) => {
                console.log('Location error:', error);
                STATE.userLocation = CONFIG.defaultLocation;
            }
        );
    }
}

function setView(view) {
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const grid = document.getElementById('attractions-grid');
    if (view === 'list') {
        grid.style.gridTemplateColumns = '1fr';
    } else {
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
    }
}

function toggleFavorite(id) {
    showToast('Added to favorites! ❤️', 'success');
}

function shareAttraction(id) {
    if (navigator.share) {
        navigator.share({
            title: 'Check out this place!',
            text: 'Found this amazing place on VoyageX',
            url: window.location.href
        });
    } else {
        showToast('Link copied to clipboard! 📋', 'success');
    }
}

function editProfile() {
    showToast('Profile editing coming soon!', 'info');
}

async function loadUserData() {
    // Load user-specific data from localStorage
    const stats = localStorage.getItem('voyagex_stats');
    const rewards = localStorage.getItem('voyagex_rewards');
    const bookings = localStorage.getItem('voyagex_bookings');
    
    if (!stats) {
        localStorage.setItem('voyagex_stats', JSON.stringify({
            placesVisited: 12,
            distance: 145,
            badges: 8,
            carbonSaved: 23
        }));
    }
    
    if (!rewards) {
        localStorage.setItem('voyagex_rewards', JSON.stringify({
            points: 1250,
            rank: 42,
            streak: 7
        }));
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-info-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
