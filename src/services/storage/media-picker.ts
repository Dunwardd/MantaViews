import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export type PreparedImage = {
  bytes: ArrayBuffer;
  contentType: 'image/jpeg';
  extension: 'jpg';
  uri: string;
};

export async function pickCompressedImage(maxWidth = 1400): Promise<PreparedImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Se necesita permiso para seleccionar una imagen.');

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    mediaTypes: ['images'],
    quality: 0.9,
  });
  if (result.canceled || !result.assets[0]) return null;

  const prepared = await manipulateAsync(result.assets[0].uri, [{ resize: { width: maxWidth } }], {
    compress: 0.72,
    format: SaveFormat.JPEG,
  });
  const response = await fetch(prepared.uri);
  if (!response.ok) throw new Error('No pudimos preparar la imagen seleccionada.');

  return {
    bytes: await response.arrayBuffer(),
    contentType: 'image/jpeg',
    extension: 'jpg',
    uri: prepared.uri,
  };
}
