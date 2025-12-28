import * as SecureStore from 'expo-secure-store';
// const BASE_URL =
//   __DEV__
//     ? (Platform.OS === 'android'
//       ? 'http://10.0.2.2:8000'   // khi test với backend local
//       : 'https://lofydemo-596188287284.asia-southeast1.run.app')
//     : 'http://192.168.1.116:8000'
//   ;
const BASE_URL = process.env.EXPO_PUBLIC_API_URL

const getHeaders = async (isFormData: boolean = false) => {
  const headers: HeadersInit = {
    'Accept': 'application/json',
  };
  if (!isFormData) {
    (headers as any)['Content-Type'] = 'application/json';
  }

  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Hàm timeout
const fetchWithTimeout = async (resource: string, options: RequestInit & { timeout?: number } = {}) => {
  const { timeout = 10000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Hàm xử lý phản hồi chung cho cả GET và POST
const handleResponse = async (response: Response) => {
  // 1. Đọc dữ liệu thô dưới dạng Text trước (để tránh lỗi JSON Parse nếu server trả về HTML/Text lỗi)
  const textData = await response.text();

  let data;
  try {
    // 2. Cố gắng parse JSON
    data = JSON.parse(textData);
  } catch (error) {
    // 3. Nếu parse thất bại -> Server trả về lỗi dạng text (ví dụ: "Internal Server Error")
    console.error(`🔥 API Parse Error (Status: ${response.status}). Raw response:`, textData);
    throw {
      status: response.status,
      message: textData || `Lỗi máy chủ (${response.status}). Vui lòng kiểm tra Terminal Backend.`
    };
  }

  // 4. Nếu parse thành công nhưng status code là lỗi (4xx, 5xx)
  if (!response.ok) {
    console.error('❌ API Error Response:', data);
    throw { status: response.status, message: data.detail || 'Có lỗi xảy ra từ phía server' };
  }

  return data;
};

const api = {
  post: async (endpoint: string, body: any, options: { timeout?: number, isFormData?: boolean }) => {
    try {
      const autoIsFormData =
        typeof FormData !== 'undefined' && body instanceof FormData;
      const isFormData = options.isFormData ?? autoIsFormData;

      const headers = await getHeaders(isFormData);
      const url = `${BASE_URL}${endpoint}`;

      if (isFormData) {
        console.log(`POST FormData Request: ${url}`);
      } else {
        console.log(`POST JSON Request: ${url} | Body:`, JSON.stringify(body));
      }

      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers,
        body: isFormData ? body : JSON.stringify(body),
        timeout: options.timeout,
      });

      return await handleResponse(response);

    } catch (e: any) {
      if (e.name === 'AbortError') throw { message: 'Kết nối quá hạn (Timeout). Kiểm tra server.' };
      console.error('Network/Logic Error:', e);
      throw e;
    }
  },

  get: async (endpoint: string) => {
    try {
      const headers = await getHeaders();
      const url = `${BASE_URL}${endpoint}`;
      console.log(`GET Request: ${url}`);

      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers,
      });

      return await handleResponse(response);

    } catch (e: any) {
      if (e.name === 'AbortError') throw { message: 'Kết nối quá hạn (Timeout).' };
      console.error('Network/Logic Error:', e);
      throw e;
    }
  },


  delete: async (endpoint: string, body: any) => {
    try {
      const headers = await getHeaders();
      const url = `${BASE_URL}${endpoint}`;


      const response = await fetchWithTimeout(url, {
        method: 'DELETE',
        headers,
        body: JSON.stringify(body),
      });

      return await handleResponse(response);

    } catch (e: any) {
      if (e.name === 'AbortError') throw { message: 'Kết nối quá hạn (Timeout). Kiểm tra server.' };
      console.error('Network/Logic Error:', e);
      throw e; // Ném lỗi tiếp để UI xử lý
    }
  },
  patch: async (endpoint: string, body: any, options: { timeout?: number, isFormData?: boolean }) => {
    try {
      const autoIsFormData =
        typeof FormData !== 'undefined' && body instanceof FormData;
      const isFormData = options.isFormData ?? autoIsFormData;

      const headers = await getHeaders(isFormData);
      const url = `${BASE_URL}${endpoint}`;

      if (isFormData) {
        console.log(`PATCH FormData Request: ${url}`);
      } else {
        console.log(`PATCH JSON Request: ${url} | Body:`, JSON.stringify(body));
      }

      const response = await fetchWithTimeout(url, {
        method: 'PATCH',
        headers,
        body: isFormData ? body : JSON.stringify(body),
        timeout: options.timeout,
      });

      return await handleResponse(response);

    } catch (e: any) {
      if (e.name === 'AbortError') throw { message: 'Kết nối quá hạn (Timeout). Kiểm tra server.' };
      console.error('Network/Logic Error:', e);
      throw e; // Ném lỗi tiếp để UI xử lý
    }
  },
};

export default api;