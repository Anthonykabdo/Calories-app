import React, {useState} from 'react';
import {Button, Image, View, Text} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function App(){
  const [photo, setPhoto] = useState(null);
  const [result, setResult] = useState(null);

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return alert('Camera permission needed');
    const r = await ImagePicker.launchCameraAsync({quality: 0.6});
    if (!r.cancelled) {
      setPhoto(r);
      upload(r);
    }
  };

  const upload = async (r) => {
    const form = new FormData();
    form.append('image', {
      uri: r.uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    });
    try {
      const res = await fetch('http://YOUR_PC_IP:5000/analyze', {
        method: 'POST',
        body: form,
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      setResult(data);
    } catch (e) { alert('Upload failed: '+e.message); }
  };

  return (
    <View style={{padding:20}}>
      <Button title="Take Photo" onPress={takePhoto}/>
      {photo && <Image source={{uri: photo.uri}} style={{width:200, height:200}} />}
      {result && <Text>{JSON.stringify(result, null, 2)}</Text>}
    </View>
  );
}
