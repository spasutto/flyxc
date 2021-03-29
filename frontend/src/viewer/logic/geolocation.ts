import { showGeolocationDisabledAlert } from '../components/ui/geolocation-alert';
import { setGeolocation, setRequestingLocation } from '../redux/location-slice';
import { store } from '../redux/store';
import { hasTrackOrRoute } from './history';
import * as msg from './messages';

// Requests the current location to update the map center.
//
// An error is always displayed when the request is initiated by the user and the browser has no permission to access
// the location.
// No error is displayed is the request is on startup (not user initiated) and there is a track or a route to center on.
export function requestCurrentPosition(userInitiated: boolean): void {
  if ('geolocation' in navigator) {
    store.dispatch(setRequestingLocation(true));
    navigator.geolocation.getCurrentPosition(
      (p: GeolocationPosition) => {
        store.dispatch(setRequestingLocation(false));
        const { latitude: lat, longitude: lon } = p.coords;
        msg.geoLocation.emit({ lat, lon }, userInitiated);
        store.dispatch(setGeolocation({ lat, lon }));
      },
      (e: GeolocationPositionError) => {
        store.dispatch(setRequestingLocation(false));
        const permissionError = e.code == GeolocationPositionError.PERMISSION_DENIED;
        // Display an error when the position has been requested by the user or when there is not track.
        if (permissionError && (userInitiated || !hasTrackOrRoute())) {
          showGeolocationDisabledAlert();
        }
      },
      {
        // Only enable high accuracy for user requested positions.
        enableHighAccuracy: userInitiated,
        timeout: 3 * 1000,
        maximumAge: 30 * 1000,
      },
    );
  }
}
