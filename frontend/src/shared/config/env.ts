export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  googleMapsApiKey:
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ??
    'AIzaSyC7NnpG4zrj9pxTt6iQ0UceDE-f_5kEbAg',
} as const;
