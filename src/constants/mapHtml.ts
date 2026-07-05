export const MAP_VIEW_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    body, html, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #f8fafc;
    }
    #center-marker {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -100%);
      z-index: 1000;
      pointer-events: none;
      transition: all 0.2s ease-out;
      display: none;
    }
    .custom-leaflet-marker {
      background: none !important;
      border: none !important;
    }
    .leaflet-popup-content-wrapper {
      background: #00a19c !important;
      color: #ffffff !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      font-weight: 700;
      border-radius: 20px !important;
      box-shadow: 0 4px 15px rgba(0, 161, 156, 0.25) !important;
      border: none !important;
      padding: 0px !important;
    }
    .leaflet-popup-content {
      margin: 6px 14px !important;
      text-align: center;
    }
    .leaflet-popup-tip {
      background: #00a19c !important;
      border: none !important;
      box-shadow: none !important;
    }
    /* Address pin pulse */
    .address-marker-pulse {
      position: absolute;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: rgba(0, 161, 156, 0.35);
      z-index: 1;
      animation: addressPulse 2s infinite ease-out;
    }
    @keyframes addressPulse {
      0% {
        transform: scale(1);
        opacity: 0.9;
      }
      100% {
        transform: scale(3.5);
        opacity: 0;
      }
    }
    /* Modern Zoom Controls */
    .leaflet-bottom {
      bottom: 58px !important;
    }
    .leaflet-bar {
      border: 1px solid rgba(0, 161, 156, 0.15) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
      border-radius: 12px !important;
      overflow: hidden;
    }
    .leaflet-bar a {
      background-color: #ffffff !important;
      color: #00a19c !important;
      border-bottom: 1px solid #f1f5f9 !important;
      width: 36px !important;
      height: 36px !important;
      line-height: 36px !important;
      font-size: 18px !important;
      transition: background-color 0.2s ease;
    }
    .leaflet-bar a:hover, .leaflet-bar a:active {
      background-color: #f1f5f9 !important;
    }
    /* Locate Button */
    #locate-btn {
      position: absolute;
      bottom: 58px;
      left: 20px;
      width: 44px;
      height: 44px;
      border-radius: 22px;
      background: #ffffff;
      border: 1px solid rgba(0, 161, 156, 0.15);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
      outline: none;
      transition: transform 0.2s ease, background-color 0.2s ease;
    }
    #locate-btn:active {
      transform: scale(0.92);
      background-color: #f1f5f9;
    }
    /* User pulsing location marker */
    .user-pulse-marker {
      position: relative;
    }
    .user-pulse-marker .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #007aff;
      border: 2px solid #ffffff;
      box-shadow: 0 0 6px rgba(0, 122, 255, 0.4);
    }
    .user-pulse-marker .pulse {
      position: absolute;
      top: -5px;
      left: -5px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(0, 122, 255, 0.2);
      animation: mapPulse 2s infinite ease-out;
    }
    @keyframes mapPulse {
      0% {
        transform: scale(0.8);
        opacity: 0.8;
      }
      100% {
        transform: scale(2.5);
        opacity: 0;
      }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="center-marker">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="#00a19c"/>
      <circle cx="12" cy="9" r="3" fill="#ffffff"/>
    </svg>
  </div>
  <div id="search-container" class="__RTL_CLASS__">
    <input type="text" id="search-input" placeholder="__SEARCH_PLACEHOLDER__" onkeypress="handleSearchKeyPress(event)" />
    <button id="search-btn" onclick="searchLocation()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 21L16.65 16.65" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
  <button id="locate-btn" onclick="locateUser()">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" stroke="#00a19c" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="#00a19c"/>
      <path d="M12 2V4M12 20V22M2 12H4M20 12H22" stroke="#00a19c" stroke-width="2" stroke-linecap="round"/>
    </svg>
  </button>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([29.3759, 47.9774], 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    var currentMarker = null;
    var userLocationMarker = null;
    var showPin = false;

    function showPulsingUserLocation(lat, lng) {
      if (userLocationMarker) {
        map.removeLayer(userLocationMarker);
      }
      var pulseIcon = L.divIcon({
        html: '<div class="user-pulse-marker"><div class="dot"></div><div class="pulse"></div></div>',
        className: 'leaflet-user-pulse',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      userLocationMarker = L.marker([lat, lng], { icon: pulseIcon }).addTo(map);
    }

    function locateUser() {
      if (navigator.geolocation) {
        document.getElementById('locate-btn').style.transform = 'scale(0.92)';
        
        var getOptions = {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 10000
        };
        
        function success(pos) {
          document.getElementById('locate-btn').style.transform = 'none';
          var lat = pos.coords.latitude;
          var lng = pos.coords.longitude;
          map.setView([lat, lng], 16);
          showPulsingUserLocation(lat, lng);
        }
        
        function error(err) {
          document.getElementById('locate-btn').style.transform = 'none';
          console.warn('High accuracy geolocation failed, trying low accuracy...', err);
          navigator.geolocation.getCurrentPosition(
            success,
            function(err2) {
              console.warn('Geolocation failed completely:', err2);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'GEOLOCATION_FAILED',
                code: err2.code,
                message: err2.message
              }));
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 10000
            }
          );
        }
        
        navigator.geolocation.getCurrentPosition(success, error, getOptions);
      }
    }

    async function searchLocation() {
      var query = document.getElementById('search-input').value;
      if (!query || query.trim() === '') return;
      
      try {
        var response = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(query));
        var data = await response.json();
        if (data && data.length > 0) {
          var lat = parseFloat(data[0].lat);
          var lng = parseFloat(data[0].lon);
          map.setView([lat, lng], 16);
          if (!showPin) {
            showPulsingUserLocation(lat, lng);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    function handleSearchKeyPress(e) {
      if (e.key === 'Enter') {
        searchLocation();
      }
    }

    function handleMessage(event) {
      try {
        var data = event.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch(e) {
            return;
          }
        }
        if (!data) return;

        if (data.type === 'PAN_TO') {
          var lat = data.lat;
          var lng = data.lng;
          map.setView([lat, lng], 15);
          
          if (currentMarker) {
            map.removeLayer(currentMarker);
          }
          var customIcon = L.divIcon({
            html: '<div style="position: relative; width: 40px; height: 40px; justify-content: center; align-items: center; display: flex;"><div class="address-marker-pulse"></div><svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="z-index: 2;"><path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="#00a19c"/><circle cx="12" cy="9" r="3" fill="#ffffff"/></svg></div>',
            className: 'custom-leaflet-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -28]
          });
          currentMarker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
          if (data.label) {
            currentMarker.bindPopup('<div style="font-size: 13px; font-weight: 700; color: #ffffff;">' + data.label + '</div>', {
              closeButton: false,
              offset: [0, -5]
            }).openPopup();
          }
        } else if (data.type === 'SHOW_PIN') {
          showPin = data.show;
          document.getElementById('center-marker').style.display = showPin ? 'block' : 'none';
          if (showPin && currentMarker) {
            map.removeLayer(currentMarker);
            currentMarker = null;
          }
          if (showPin) {
            locateUser();
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage);

    map.on('movestart', function() {
      if (showPin) {
        document.getElementById('center-marker').style.transform = 'translate(-50%, -120%) scale(1.1)';
      }
    });

    map.on('moveend', function() {
      if (showPin) {
        document.getElementById('center-marker').style.transform = 'translate(-50%, -100%) scale(1.0)';
        var center = map.getCenter();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'LOCATION_SELECTED',
          lat: center.lat,
          lng: center.lng
        }));
      }
    });

    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
  </script>
</body>
</html>
`;
