import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, Title } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

function LoginScreen() {
    const { login, message } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const handleLogin = async () => {
        try {
            await login(username, password);
            setError(null); 
        } catch (error) {
            setError('Invalid credentials, please try again.');
        }
    };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Log In</Title>
      <TextInput
        label="Username"
        value={username}
        onChangeText={setUsername}
        mode="outlined"
        style={styles.input}
        outlineColor="grey"
        activeOutlineColor="#6A1B9A"
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        style={styles.input}
        outlineColor="grey"
        activeOutlineColor="#6A1B9A"
        secureTextEntry
      />
      <Button
        mode="contained"
        onPress={handleLogin}
        style={styles.button}
        buttonColor='#5335DA'
        contentStyle={styles.buttonContent}
        color="#6A1B9A"
      >
         <Text style={styles.buttonText}> Log in </Text>
      </Button>
      <Button
        mode="text"
        onPress={() => navigation.navigate('Register')}
        labelStyle={styles.linkText}
      >
        <Text>Don't have an account? </Text> Register
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  button: {
    marginTop: 16,
    borderRadius: 25,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  linkText: {
    color: '#6A1B9A',
  },
   buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
