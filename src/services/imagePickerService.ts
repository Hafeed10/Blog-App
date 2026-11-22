import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export interface ImagePickerServiceOptions {
  aspect?: [number, number];
  quality?: number;
  allowsEditing?: boolean;
}

/**
 * Converts an image picker asset into an optimal usable string format:
 * Prefer data URI (Base64) so images remain persistent across app restarts,
 * offline usage, and web page reloads without broken local blob links.
 */
function formatAssetUri(asset: ImagePicker.ImagePickerAsset): string {
  if (asset.base64) {
    const mime = asset.mimeType || 'image/jpeg';
    return `data:${mime};base64,${asset.base64}`;
  }
  return asset.uri;
}

/**
 * Opens the device photo library/gallery to choose an image.
 */
export async function pickImageFromLibrary(
  options: ImagePickerServiceOptions = {}
): Promise<string | null> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect ?? [1, 1],
      quality: options.quality ?? 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return formatAssetUri(result.assets[0]);
  } catch (error: any) {
    console.error('Error selecting image from library:', error);
    Alert.alert(
      'Image Selection Failed',
      error?.message || 'Could not access photo library. Please check your device permissions.'
    );
    return null;
  }
}

/**
 * Opens device camera to take a new picture.
 */
export async function takePhotoWithCamera(
  options: ImagePickerServiceOptions = {}
): Promise<string | null> {
  try {
    // Check & request camera permissions
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Camera Permission Needed',
        'Please enable camera permissions in your device settings to take a photo.'
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect ?? [1, 1],
      quality: options.quality ?? 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return formatAssetUri(result.assets[0]);
  } catch (error: any) {
    console.error('Error taking photo with camera:', error);
    Alert.alert(
      'Camera Error',
      error?.message || 'Unable to open camera on this device.'
    );
    return null;
  }
}
