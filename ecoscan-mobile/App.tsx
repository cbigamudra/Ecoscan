import React, { useState, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';

const BACKEND_URL = 'http://172.20.10.2:8000/scan';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const cameraRef = useRef<any>(null);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={{ color: 'white' }}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false
      });

      const formData = new FormData();
      const uri = Platform.OS === 'ios' ? photo.uri.replace('file://', '') : photo.uri;

      // @ts-ignore
      formData.append('file', {
        uri: uri,
        name: 'label.jpg',
        type: 'image/jpeg',
      });

      const response = await axios.post(BACKEND_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 20000, 
      });

      setResult(response.data);
      
    } catch (error: any) {
      console.log(error);
      Alert.alert("Error", "Check if Mac Backend is running on 172.20.10.2:8000");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef}>
        
        {result && (
          <View style={styles.resultOverlay}>
            <ScrollView>
              <Text style={styles.resultTitle}>{result.is_suspicious ? "🚩 Warning" : "✅ Clear"}</Text>
              <Text style={styles.scoreText}>Score: {result.score}/100</Text>
              <Text style={styles.section}>Found: {result.detected_buzzwords.join(', ') || 'None'}</Text>
              
              <View style={styles.debugBox}>
                <Text style={styles.debugTitle}>OCR Read (Debug):</Text>
                <Text style={styles.debugText}>{result.raw_text}</Text>
              </View>

              <TouchableOpacity onPress={() => setResult(null)} style={styles.closeBtn}>
                <Text style={{color: 'white'}}>Scan Again</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity style={styles.snap} onPress={takePicture}>
            {loading ? <ActivityIndicator color="green" /> : <View style={styles.innerSnap} />}
          </TouchableOpacity>
          <Text style={styles.hint}>Hold steady and align text</Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  controls: { position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' },
  snap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white' },
  innerSnap: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white' },
  hint: { color: 'white', marginTop: 10, fontWeight: 'bold' },
  resultOverlay: { position: 'absolute', top: '20%', left: '10%', right: '10%', backgroundColor: 'white', padding: 20, borderRadius: 15, maxHeight: '60%' },
  resultTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  scoreText: { fontSize: 20, textAlign: 'center', marginVertical: 10, color: 'green' },
  section: { fontWeight: 'bold', marginBottom: 10 },
  debugBox: { backgroundColor: '#f0f0f0', padding: 10, borderRadius: 5, marginTop: 10 },
  debugTitle: { fontSize: 10, color: '#666', fontWeight: 'bold' },
  debugText: { fontSize: 10, color: '#444' },
  closeBtn: { marginTop: 20, backgroundColor: 'black', padding: 10, borderRadius: 5, alignItems: 'center' },
  button: { alignSelf: 'center', marginTop: 100, padding: 20, backgroundColor: 'green' }
});