import * as Keychain from "react-native-keychain";

class SecureStorage {
  private service = "com.tidesmobile.keychain";

  async setItem(key: string, value: string) {
    try {
      await Keychain.setInternetCredentials(this.service, key, value);
    } catch (error) {
      throw new Error(`Failed to store ${key} securely`);
    }
  }

  async getItem(key: string) {
    try {
      const credentials = await Keychain.getInternetCredentials(this.service);
      return credentials && credentials.username === key ? credentials.password : null;
    } catch {
      return null;
    }
  }

  async removeItem(key: string) {
    try {
      await Keychain.resetInternetCredentials({ server: this.service });
    } catch (error) {
      throw new Error(`Failed to remove ${key} from secure storage`);
    }
  }
}

export const secureStorage = new SecureStorage();