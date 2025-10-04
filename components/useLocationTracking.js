import { useState, useEffect } from "react";
import * as Location from "expo-location";

const calculateDistance = (coord1, coord2) => {
  const toRad = (value) => (value * Math.PI) / 180;

  const lat1 = toRad(coord1.latitude);
  const lon1 = toRad(coord1.longitude);
  const lat2 = toRad(coord2.latitude);
  const lon2 = toRad(coord2.longitude);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const R = 6371e3;
  const distance = R * c;

  return distance;
};

const useLocationTracking = (isTracking) => {
  const [locationData, setLocationData] = useState([]);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    let watchLocation = null;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      watchLocation = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          setLocationData((prevLocations) => {
            const newLocations = [...prevLocations, location.coords];
            if (newLocations.length > 1) {
              const newDistance = calculateDistance(
                newLocations[newLocations.length - 2],
                newLocations[newLocations.length - 1]
              );
              setDistance((prevDistance) => prevDistance + newDistance);
            }
            return newLocations;
          });
        }
      );
    };

    if (isTracking) {
      startTracking();
    } else if (watchLocation) {
      watchLocation.remove();
    }

    return () => {
      if (watchLocation) {
        watchLocation.remove();
      }
    };
  }, [isTracking]);

  return { distance };
};

export default useLocationTracking;
