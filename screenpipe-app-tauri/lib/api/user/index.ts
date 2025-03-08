/**
 * 用户API接口
 */
export class UserApi {
  private baseUrl: string;
  
  constructor(baseUrl: string = 'http://localhost:8000/api/v1') {
    this.baseUrl = baseUrl;
  }
  
  /**
   * 登录或注册用户
   */
  async loginOrRegister(token: string, email?: string, name?: string, deviceInfo?: any) {
    try {
      const response = await fetch(`${this.baseUrl}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          name,
          device_info: deviceInfo,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '登录失败');
      }
      
      return await response.json();
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取当前用户信息
   */
  async getCurrentUser(token: string) {
    try {
      const response = await fetch(`${this.baseUrl}/user/me?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '获取用户信息失败');
      }
      
      return await response.json();
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取用户设备列表
   */
  async getUserDevices(token: string) {
    try {
      const response = await fetch(`${this.baseUrl}/user/devices?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '获取设备列表失败');
      }
      
      return await response.json();
    } catch (error) {
      console.error('获取设备列表失败:', error);
      throw error;
    }
  }
  
  /**
   * 添加新设备
   */
  async addDevice(token: string, deviceData: any) {
    try {
      const response = await fetch(`${this.baseUrl}/user/devices?token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deviceData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '添加设备失败');
      }
      
      return await response.json();
    } catch (error) {
      console.error('添加设备失败:', error);
      throw error;
    }
  }
  
  /**
   * 更新设备信息
   */
  async updateDevice(token: string, deviceId: string, deviceData: any) {
    try {
      const response = await fetch(`${this.baseUrl}/user/devices/${deviceId}?token=${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deviceData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '更新设备失败');
      }
      
      return await response.json();
    } catch (error) {
      console.error('更新设备失败:', error);
      throw error;
    }
  }
  
  /**
   * 删除设备
   */
  async deleteDevice(token: string, deviceId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/user/devices/${deviceId}?token=${token}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '删除设备失败');
      }
      
      return true;
    } catch (error) {
      console.error('删除设备失败:', error);
      throw error;
    }
  }
  
  /**
   * 设置当前设备
   */
  async setCurrentDevice(token: string, deviceId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/user/devices/${deviceId}/set-current?token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '设置当前设备失败');
      }
      
      return await response.json();
    } catch (error) {
      console.error('设置当前设备失败:', error);
      throw error;
    }
  }
} 