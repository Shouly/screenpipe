import { useRouter } from "next/navigation";
import { useSettings } from "./use-settings";

export function useAuth() {
  const { settings } = useSettings();
  const router = useRouter();

  /**
   * 检查用户是否已登录，如果未登录则重定向到登录页面
   * @param user 用户对象，如果为空则使用 settings 中的用户
   * @param showRedirect 是否显示重定向到登录页面，默认为 true
   * @returns 用户是否已登录
   */
  const checkLogin = (user: any | null = null, showRedirect: boolean = true): boolean => {
    const userToCheck = user || settings.user;
    
    // 检查用户是否存在以及是否有认证令牌
    if (!userToCheck || !settings.authToken) {
      if (showRedirect) {
        // 重定向到登录页面
        router.push("/login");
      }
      return false;
    }
    return true;
  };

  return {
    checkLogin,
    isLoggedIn: !!settings.authToken && !!settings.user
  };
} 