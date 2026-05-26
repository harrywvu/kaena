declare module "@env" {
  export const GOOGLE_PLACES_API_KEY: string;
  export const HUGGINGFACE_API_KEY: string;
}

declare module "@react-native-async-storage/async-storage" {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
  };

  export default AsyncStorage;
}
