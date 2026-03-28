import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, Image, View, Text, StyleSheet } from 'react-native';

interface ImageCaptureProps {
  onImageTaken?: (uri: string) => void; // optional callback for parent
  buttonText?: string;
  imageStyle?: object;
  buttonStyle?: object;
  buttonTextStyle?: object;
}

export default function ImageCapture({
  onImageTaken,
  buttonText = "Take Photo",
  imageStyle,
  buttonStyle,
  buttonTextStyle,
}: ImageCaptureProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      if (onImageTaken) {
        onImageTaken(uri); // pass URI to parent component if needed
      }
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={takePhoto} style={[styles.button, buttonStyle]}>
        <Text style={[styles.buttonText, buttonTextStyle]}>{buttonText}</Text>
      </Pressable>

      {photoUri && <Image source={{ uri: photoUri }} style={[styles.imagePreview, imageStyle]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  button: { backgroundColor: '#1e90ff', padding: 10, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  imagePreview: { width: 200, height: 300, marginTop: 20 },
});