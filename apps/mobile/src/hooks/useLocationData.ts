import { useState, useEffect } from "react";
import * as SunCalc from "suncalc";
import Geolocation from "@react-native-community/geolocation";
import { LocationInfo } from "../types/charts";
import { loggingService } from "../services/loggingService";

export const useLocationData = () => {
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({
    sunrise: undefined,
    sunset: undefined,
    latitude: undefined,
    longitude: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocationAndSunTimes = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current position
      const position = await new Promise<any>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          resolve,
          reject,
          { 
            enableHighAccuracy: true, 
            timeout: 15000, 
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const { latitude, longitude } = position.coords;
      const now = new Date();
      
      // Calculate sun times
      const sunTimes = SunCalc.getTimes(now, latitude, longitude);

      setLocationInfo({
        sunrise: sunTimes.sunrise,
        sunset: sunTimes.sunset,
        latitude,
        longitude,
      });
    } catch (err) {
      loggingService.error("LocationData", "Error fetching location", { error: err });
      setError(err instanceof Error ? err.message : "Location error");
      
      // Fallback to default location (NYC) for demo purposes
      const now = new Date();
      const sunTimes = SunCalc.getTimes(now, 40.7128, -74.0060); // NYC coordinates
      
      setLocationInfo({
        sunrise: sunTimes.sunrise,
        sunset: sunTimes.sunset,
        latitude: 40.7128,
        longitude: -74.0060,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationAndSunTimes();
  }, []);

  return {
    locationInfo,
    loading,
    error,
    refetch: fetchLocationAndSunTimes,
  };
};