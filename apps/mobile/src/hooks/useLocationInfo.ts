import { useState, useEffect, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import * as SunCalc from 'suncalc';

export interface LocationInfo {
  latitude?: number;
  longitude?: number;
  city?: string;
  region?: string;
  sunrise: Date;
  sunset: Date;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  timeUntilSunrise?: string;
  timeUntilSunset?: string;
}

export interface UseLocationInfoReturn {
  locationInfo: LocationInfo | null;
  loading: boolean;
  error: string | null;
  refreshLocation: () => void;
}

const formatTimeUntil = (targetTime: Date): string => {
  const now = new Date();
  const diff = targetTime.getTime() - now.getTime();
  
  if (diff <= 0) return '';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const getTimeOfDay = (sunrise: Date, sunset: Date): 'morning' | 'afternoon' | 'evening' | 'night' => {
  const now = new Date();
  const hour = now.getHours();
  
  const sunriseHour = sunrise.getHours();
  const sunsetHour = sunset.getHours();
  
  if (hour >= sunriseHour && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 17) {
    return 'afternoon';
  } else if (hour >= 17 && hour < sunsetHour + 1) {
    return 'evening';
  } else {
    return 'night';
  }
};

const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Tides needs access to your location to show local sunrise and sunset times.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  }
  return true; // iOS permissions are handled in Info.plist
};

const reverseGeocode = async (latitude: number, longitude: number): Promise<{ city: string; region: string }> => {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    const data = await response.json();
    return {
      city: data.city || data.locality || 'Current Location',
      region: data.principalSubdivision || data.countryCode || '',
    };
  } catch (err) {
    console.warn('Reverse geocoding failed:', err);
    return { city: 'Current Location', region: '' };
  }
};

export const useLocationInfo = (): UseLocationInfoReturn => {
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateAstronomicalData = (latitude: number, longitude: number): Partial<LocationInfo> => {
    const now = new Date();
    const times = SunCalc.getTimes(now, latitude, longitude);
    
    const sunrise = times.sunrise;
    const sunset = times.sunset;
    const timeOfDay = getTimeOfDay(sunrise, sunset);
    
    let timeUntilSunrise: string | undefined;
    let timeUntilSunset: string | undefined;
    
    if (timeOfDay === 'night' || timeOfDay === 'evening') {
      // Calculate time until next sunrise
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowTimes = SunCalc.getTimes(tomorrow, latitude, longitude);
      timeUntilSunrise = formatTimeUntil(tomorrowTimes.sunrise);
    } else {
      // Calculate time until sunset
      timeUntilSunset = formatTimeUntil(sunset);
    }
    
    return {
      sunrise,
      sunset,
      timeOfDay,
      timeUntilSunrise,
      timeUntilSunset,
    };
  };

  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        // Fallback to default location (New York) for demo
        const defaultLat = 40.7128;
        const defaultLon = -74.0060;
        const astronomicalData = calculateAstronomicalData(defaultLat, defaultLon);
        
        setLocationInfo({
          city: 'New York',
          region: 'NY',
          ...astronomicalData,
        } as LocationInfo);
        setLoading(false);
        return;
      }

      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const astronomicalData = calculateAstronomicalData(latitude, longitude);
          const { city, region } = await reverseGeocode(latitude, longitude);
          
          setLocationInfo({
            latitude,
            longitude,
            city,
            region,
            ...astronomicalData,
          } as LocationInfo);
          setLoading(false);
        },
        (geoError) => {
          console.warn('Geolocation error:', geoError);
          // Fallback to default location (New York)
          const defaultLat = 40.7128;
          const defaultLon = -74.0060;
          const astronomicalData = calculateAstronomicalData(defaultLat, defaultLon);
          
          setLocationInfo({
            city: 'New York',
            region: 'NY',
            ...astronomicalData,
          } as LocationInfo);
          setError('Unable to get precise location');
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 1000 * 60 * 5, // 5 minutes
        }
      );
    } catch (err) {
      console.warn('Location setup error:', err);
      setError('Location services unavailable');
      setLoading(false);
    }
  }, []);

  const refreshLocation = () => {
    getCurrentLocation();
  };

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  return {
    locationInfo,
    loading,
    error,
    refreshLocation,
  };
};