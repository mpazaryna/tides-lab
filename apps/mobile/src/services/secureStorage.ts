// BLUE

import * as Keychain from "react-native-keychain";

interface SecureStorageOptions {
  service?: string;
}

class SecureStorageService {
  private defaultService = "com.tidesmobile.keychain";

  async setItem(
    key: string,
    value: string,
    options?: SecureStorageOptions
  ): Promise<void> {
    try {
      await Keychain.setInternetCredentials(
        options?.service || this.defaultService,
        key,
        value
      );
    } catch (error) {
      console.error("SecureStorage setItem error:", error);
      throw new Error(`Failed to store ${key} securely`);
    }
  }

  async getItem(
    key: string,
    options?: SecureStorageOptions
  ): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(
        options?.service || this.defaultService
      );

      if (credentials && credentials.username === key) {
        return credentials.password;
      }
      return null;
    } catch (error) {
      console.error("SecureStorage getItem error:", error);
      return null;
    }
  }

  async removeItem(key: string, options?: SecureStorageOptions): Promise<void> {
    try {
      await Keychain.resetInternetCredentials({
        server: options?.service || this.defaultService
      });
    } catch (error) {
      console.error("SecureStorage removeItem error:", error);
      throw new Error(`Failed to remove ${key} from secure storage`);
    }
  }

  async clear(): Promise<void> {
    try {
      await Keychain.resetInternetCredentials({
        server: this.defaultService
      });
    } catch (error) {
      console.error("SecureStorage clear error:", error);
      throw new Error("Failed to clear secure storage");
    }
  }
}

export const SecureStorage = new SecureStorageService();
