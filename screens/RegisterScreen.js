import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, Image, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Title, RadioButton } from 'react-native-paper';
import * as ImagePicker from "expo-image-picker";
import api from "../axiosInstance";

const RegisterScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); // Controls step navigation

  // Step 1 Fields
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2 Fields
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [birthdate, setBirthdate] = useState('');

  const handleRegister = async () => {
    try {
      await api.post('/auth/register', {
        firstName,
        lastName,
        username,
        email,
        password,
        gender,
        weight,
        height,
        birthdate,
        profilePicture: null,
      }, { headers: { 'Content-Type': 'application/json' }});
      Alert.alert('Registration successful', 'You can now log in.');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration failed', error.response?.data || 'Please try again.');
    }
  };

   const [image, setImage] = useState(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
 
  const isStep1Valid = firstName && lastName && username && email && password;
  
  
  const isStep2Valid = gender && weight && height && birthdate;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {step === 1 ? (
        <View>
          <Title style={styles.title}>Register</Title>

          <TextInput label="First name" value={firstName} onChangeText={setFirstName} mode="outlined" style={styles.input} outlineColor="grey" activeOutlineColor="#6A1B9A" />
          <TextInput label="Last name" value={lastName} onChangeText={setLastName} mode="outlined" style={styles.input} outlineColor="grey" activeOutlineColor="#6A1B9A" />
          <TextInput label="Username" value={username} onChangeText={setUsername} mode="outlined" style={styles.input} outlineColor="grey" activeOutlineColor="#6A1B9A" autoCapitalize="none" />
          <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" style={styles.input} outlineColor="grey" activeOutlineColor="#6A1B9A" keyboardType="email-address" autoCapitalize="none" />
          <TextInput label="Password" value={password} onChangeText={setPassword} mode="outlined" style={styles.input} outlineColor="grey" activeOutlineColor="#6A1B9A" secureTextEntry />

          <Button mode="contained" onPress={() => setStep(2)} style={styles.button} contentStyle={styles.buttonContent} buttonColor="#5335DA" disabled={!isStep1Valid}>
            <Text style={styles.buttonText}>Next</Text>
          </Button>

          <Button mode="text" onPress={() => navigation.navigate('Login')}>
            <Text> Already have an account? </Text> Log in 
          </Button>
        </View>
      ) : (
        <View>
          <Title style={styles.title}>Register</Title>

          <Text style={styles.label}>Gender</Text>
          <RadioButton.Group onValueChange={setGender} value={gender}>
            <View style={styles.radioRow}>
              <RadioButton value="male" />
              <Text>Male</Text>
            </View>
            <View style={styles.radioRow}>
              <RadioButton value="female" />
              <Text>Female</Text>
            </View>
          </RadioButton.Group>

          <TextInput label="Weight (kg)" value={weight} onChangeText={setWeight} mode="outlined" style={styles.input} outlineColor="grey" activeOutlineColor="#6A1B9A" keyboardType="numeric" />
          <TextInput label="Height (cm)" value={height} onChangeText={setHeight} mode="outlined" style={styles.input} outlineColor="grey" activeOutlineColor="#6A1B9A" keyboardType="numeric" />
          <TextInput label="Birthdate (YYYY-MM-DD)" value={birthdate} onChangeText={setBirthdate} mode="outlined" style={styles.input} outlineColor="grey" activeOutlineColor="#6A1B9A" />
         
            <TouchableOpacity onPress={pickImage}>
        <View style={styles.imageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.profileImage} />
          ) : (
            <Text style={styles.imagePlaceholder}>Select Image</Text>
          )}
        </View>
      </TouchableOpacity>

          <Button mode="contained" onPress={() => setStep(1)} style={styles.buttonBack} contentStyle={styles.buttonContent} buttonColor="#999">
            <Text style={styles.buttonText}>Back</Text>
          </Button>

          <Button mode="contained" onPress={handleRegister} style={styles.button} contentStyle={styles.buttonContent} buttonColor="#5335DA" disabled={!isStep2Valid}>
            <Text style={styles.buttonText}>Create account</Text>
          </Button>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  button: {
    marginTop: 16,
    borderRadius: 25,
  },
  buttonBack: {
    marginTop: 8,
    borderRadius: 25,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
    imageContainer: { alignItems: "center", marginBottom: 15 },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  imagePlaceholder: { fontSize: 16, color: "#888" },
});

export default RegisterScreen;
