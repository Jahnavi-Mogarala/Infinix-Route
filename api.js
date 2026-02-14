async function getPlaces(lat,lon){

let url=`https://nominatim.openstreetmap.org/search?format=json&q=tourist attractions&limit=10&lat=${lat}&lon=${lon}`

let res=await fetch(url)

let data=await res.json()

return data

}
