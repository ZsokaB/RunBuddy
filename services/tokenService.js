import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';

const checkToken = async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
            // Token is valid
        } else {
            // Token is expired
            AsyncStorage.removeItem('token');
        }
    }
};