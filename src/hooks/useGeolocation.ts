import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: true,
    error: null,
    permissionDenied: false,
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Geolocation is not supported by your browser",
      }));
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
          permissionDenied: false,
        });
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location";
        let permissionDenied = false;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied";
            permissionDenied = true;
            toast.info("Location access denied. Defaulting to global view.", {
              duration: 4000,
            });
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            toast.warning("Unable to determine your location");
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            toast.warning("Location request timed out");
            break;
        }

        setState({
          latitude: null,
          longitude: null,
          accuracy: null,
          loading: false,
          error: errorMessage,
          permissionDenied,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
          permissionDenied: false,
        });
      },
      (error) => {
        console.error("Geolocation watch error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    setWatchId(id);
    return id;
  }, []);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  // Initial location request
  useEffect(() => {
    getCurrentPosition();
    const id = startWatching();
    
    return () => {
      if (id !== undefined) {
        navigator.geolocation.clearWatch(id);
      }
    };
  }, []);

  return {
    ...state,
    refresh: getCurrentPosition,
    startWatching,
    stopWatching,
  };
}
