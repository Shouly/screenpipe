/**
 * 用户API接口
 */
export class UserApi {
  private baseUrl: string;
  
  constructor(baseUrl: string = 'http://localhost:8000/api/v1') {
    this.baseUrl = baseUrl;
  }
  
  /**
   * 邮箱登录 - 发送登录链接
   */
  async emailLogin(email: string, deviceInfo?: any) {
    try {
      const response = await fetch(`${this.baseUrl}/user/login/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          device_info: deviceInfo
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '发送登录链接失败');
      }
      
      return await response.json();
    } catch (error) {
      console.error('发送登录链接失败:', error);
      throw error;
    }
  }
  
  /**
   * 验证邮箱登录链接
   */
  async verifyEmailLogin(email: string, code: string) {
    try {
      const response = await fetch(`${this.baseUrl}/user/login/verify?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '验证登录链接失败');
      }
      
      return await response.json();
    } catch (error) {
      console.error('验证登录链接失败:', error);
      throw error;
    }
  }
  
  /**
   * OAuth登录
   */
  async oauthLogin(provider: string, token: string, deviceInfo?: any) {
    try {
      const response = await fetch(`${this.baseUrl}/user/login/oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          token,
          device_info: deviceInfo,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'OAuth登录失败');
      }
      
      return await response.json();
    } catch (error) {
      console.error('OAuth登录失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取当前用户信息
   */
  async getCurrentUser(token: string) {
    try {
      const response = await fetch(`${this.baseUrl}/user/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
   * 更新当前用户信息
   */
  async updateCurrentUser(token: string, userData: any) {
    try {
      const response = await fetch(`${this.baseUrl}/user/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '更新用户信息失败');
      }
      
      return await response.json();
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  }
} 