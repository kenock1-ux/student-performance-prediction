import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface StudentFeatures {
  school: string;
  sex: string;
  age: number;
  address: string;
  famsize: string;
  Pstatus: string;
  Medu: number;
  Fedu: number;
  Mjob: string;
  Fjob: string;
  reason: string;
  guardian: string;
  traveltime: number;
  studytime: number;
  failures: number;
  schoolsup: string;
  famsup: string;
  paid: string;
  activities: string;
  nursery: string;
  higher: string;
  internet: string;
  romantic: string;
  famrel: number;
  freetime: number;
  goout: number;
  Dalc: number;
  Walc: number;
  health: number;
  absences: number;
  G1: number;
  G2: number;
}

export const predictScore = async (features: StudentFeatures): Promise<number | null> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/predict`, features);
    if (response.data && response.data.predicted_G3 !== undefined) {
      return response.data.predicted_G3;
    }
    return null;
  } catch (error) {
    console.error("Error predicting score:", error);
    throw error;
  }
};

export type Role = 'student' | 'parent' | 'teacher';

export interface User {
  name: string;
  role: Role;
}

export interface LoginCredentials {
  username: string;
  password?: string;
  role: Role;
}

export const login = async (credentials: LoginCredentials): Promise<{user: User, token: string}> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, credentials);
    return response.data;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const getAdvice = async (predicted_G3: number, role: Role): Promise<string> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/advice`, { predicted_G3, role });
    return response.data.advice;
  } catch (error) {
    console.error("Error getting advice:", error);
    throw error;
  }
};

