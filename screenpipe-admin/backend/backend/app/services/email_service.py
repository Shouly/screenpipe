import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pydantic import EmailStr

from ..core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    """邮件服务类，处理邮件发送相关的业务逻辑"""
    
    @staticmethod
    async def send_login_email(email: EmailStr, login_url: str) -> bool:
        """发送登录链接邮件"""
        try:
            # 如果是开发环境，只打印邮件内容而不实际发送
            if settings.DEBUG:
                logger.info(f"[开发模式] 发送登录链接到 {email}: {login_url}")
                return True
            
            # 创建邮件
            message = MIMEMultipart("alternative")
            message["Subject"] = "ScreenPipe 登录链接"
            message["From"] = settings.EMAIL_SENDER
            message["To"] = email
            
            # 创建HTML内容
            html = f"""
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ text-align: center; margin-bottom: 20px; }}
                    .logo {{ font-size: 24px; font-weight: bold; color: #e25822; }}
                    .content {{ background-color: #f9f9f9; padding: 20px; border-radius: 5px; }}
                    .button {{ display: inline-block; background-color: #e25822; color: white; padding: 10px 20px; 
                              text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ margin-top: 20px; font-size: 12px; color: #999; text-align: center; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">ScreenPipe</div>
                    </div>
                    <div class="content">
                        <p>您好，</p>
                        <p>请点击下面的按钮登录到ScreenPipe：</p>
                        <p style="text-align: center;">
                            <a href="{login_url}" class="button">登录到ScreenPipe</a>
                        </p>
                        <p>或者复制以下链接到浏览器地址栏：</p>
                        <p style="word-break: break-all;">{login_url}</p>
                        <p>此链接将在1小时后过期。</p>
                        <p>如果您没有请求此邮件，请忽略它。</p>
                    </div>
                    <div class="footer">
                        <p>此邮件由系统自动发送，请勿回复。</p>
                        <p>&copy; {settings.PROJECT_NAME}</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # 添加HTML内容
            message.attach(MIMEText(html, "html"))
            
            # 发送邮件
            with smtplib.SMTP_SSL(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
                server.login(settings.EMAIL_USERNAME, settings.EMAIL_PASSWORD)
                server.sendmail(settings.EMAIL_SENDER, email, message.as_string())
            
            logger.info(f"成功发送登录链接到 {email}")
            return True
        except Exception as e:
            logger.error(f"发送登录邮件失败: {str(e)}")
            return False 