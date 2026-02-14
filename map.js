var map = L.map('map').setView([28.6139,77.2090],13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
attribution:'© OpenStreetMap'
}).addTo(map);

navigator.geolocation.getCurrentPosition(pos=>{

var lat=pos.coords.latitude;
var lon=pos.coords.longitude;

L.marker([lat,lon])
.addTo(map)
.bindPopup("You are here")
.openPopup();

map.setView([lat,lon],14)

})
