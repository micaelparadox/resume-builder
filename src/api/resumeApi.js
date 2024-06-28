import axios from 'axios';

const API_URL = 'http://localhost:3001';

export const generatePDF = async (resumeData) => {
  try {
    const response = await axios.post(`${API_URL}/generate-pdf`, resumeData, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error ao gerar PDF:', error);
    throw error;
  }
};
